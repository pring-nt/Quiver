<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { toast } from 'svelte-sonner';

    import { Database, Download, Upload, Copy, FileBraces, CircleAlert, CircleCheck, Link } from 'lucide-svelte';

    import { coursesStore, groupsStore, selectedSectionsStore, globalDataSchema } from '$lib/stores/courses';
    import type { Course, CourseGroup } from '$lib/stores/courses';
    import { decodeData, generateShareUrl} from '$lib/utils/share';

    let open = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let pastedJson = $state('');

    // URL detection state
    let urlImportParam = $state<string | null>(null);

    // Check for an 'import' param in the URL when the component mounts
    $effect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const param = params.get('import');
            if (param) {
                try {
                    // Peek at the payload to ensure it's actually global curriculum data
                    // Global data is an object containing 'courses' or 'groups'
                    const decoded = decodeData(param);
                    if (decoded && typeof decoded === 'object' && !Array.isArray(decoded) && ('courses' in decoded || 'groups' in decoded)) {
                        urlImportParam = param;
                    }
                } catch (e) {
                    // Ignore invalid params or section data
                }
            }
        }
    });

    // Conflict Resolution State
    let importQueue = $state<{
        groups: CourseGroup[];
        newCourses: Course[];
        conflicts: { incoming: Course; existing: Course; action: 'merge' | 'replace' | 'skip' }[];
    } | null>(null);

    let selectedCount = $derived(
        Object.values($selectedSectionsStore).filter(Boolean).length
    );

    const templateData = {
        "groups": [
            {
                "name": "Electives",
                "sectionIds": [],
                "pickCount": 1
            }
        ],
        "courses": [
            {
                "courseCode": "MAGIC101",
                "sections": [
                    {
                        "code": "MAGIC101",
                        "section": "S18",
                        "professor": "Fern Tsundere",
                        "modality": "F2F",
                        "remarks": "Optional remarks",
                        "slots": [
                            {
                                "day": "M",
                                "startTime": "08:00",
                                "endTime": "09:30",
                                "room": "G204",
                                "isOnline": false
                            }
                        ]
                    }
                ]
            }
        ]
    };

    async function copyToClipboard(data: any, msg: string) {
        try {
            await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
            toast.success(msg);
        } catch {
            toast.error("Failed to copy to clipboard. Check browser permissions.");
        }
    }

    async function copyShareLink(data: any, msg: string) {
        try {
            const link = generateShareUrl(data);

            await navigator.clipboard.writeText(link);
            if (link.length > 2000) {
                toast.success(msg, {
                    description: "Link is very long — it may be truncated in some chat apps. Use 'Copy JSON' if sharing fails.",
                    duration: 8000
                });
            } else {
                toast.success(msg);
            }
        } catch {
            toast.error("Failed to generate or copy share link.");
        }
    }

    function downloadJson(data: any, filename: string) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getAllData() {
        return { groups: $groupsStore, courses: $coursesStore };
    }

    function getSelectedData() {
        const selectedIds = Object.keys($selectedSectionsStore).filter(id => $selectedSectionsStore[id]);
        const filteredCourses = $coursesStore.map(c => ({
            ...c,
            sections: c.sections.filter(s => selectedIds.includes(s.id))
        })).filter(c => c.sections.length > 0);

        const usedGroupIds = new Set(filteredCourses.map(c => c.groupId).filter(Boolean));
        const filteredGroups = $groupsStore.filter(g => usedGroupIds.has(g.id));

        return { groups: filteredGroups, courses: filteredCourses };
    }

    function processImportData(text: string) {
        if (!text.trim()) {
            toast.error("Please provide data to import.");
            return;
        }

        try {
            let data;
            const trimmed = text.trim();

            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                data = JSON.parse(trimmed);
            } else {
                data = decodeData(trimmed);
            }

            // Smart routing: Prevent Class Section data from being imported here
            if (Array.isArray(data) || (data && 'section' in data && !('courses' in data))) {
                toast.error("This looks like Class Section data. Please import it inside a specific course.");
                return;
            }

            const parsed = globalDataSchema.safeParse(data);

            if (!parsed.success) {
                const issue = parsed.error.issues[0];
                toast.error(`Validation failed at ${issue.path.join('.') || 'root'}: ${issue.message}`);
                return;
            }

            const validData = parsed.data;

            const groupIdMap = new Map<string, string>();
            const newGroups: CourseGroup[] = (validData.groups || []).map(g => {
                const newId = crypto.randomUUID();
                if (g.id) groupIdMap.set(g.id, newId);
                return { ...g, id: newId } as CourseGroup;
            });

            const mappedCourses: Course[] = (validData.courses || []).map(c => {
                const newId = crypto.randomUUID();
                const newSections = c.sections.map(s => ({
                    ...s,
                    id: crypto.randomUUID(),
                    code: c.courseCode
                }));

                return {
                    ...c,
                    id: newId,
                    groupId: c.groupId && groupIdMap.has(c.groupId) ? groupIdMap.get(c.groupId) : undefined,
                    sections: newSections
                } as Course;
            });

            const conflicts: { incoming: Course; existing: Course; action: 'merge' | 'replace' | 'skip' }[] = [];
            const newCourses: Course[] = [];

            mappedCourses.forEach(incoming => {
                const existing = $coursesStore.find(c => c.courseCode.toLowerCase() === incoming.courseCode.toLowerCase());
                if (existing) {
                    conflicts.push({ incoming, existing, action: 'merge' });
                } else {
                    newCourses.push(incoming);
                }
            });

            if (conflicts.length > 0) {
                importQueue = { groups: newGroups, newCourses, conflicts };
            } else {
                executeImport(newGroups, newCourses, []);
            }

        } catch (e) {
            toast.error("Invalid format. Please ensure it's valid JSON or a valid share link.");
        } finally {
            if (fileInput) fileInput.value = '';
        }
    }

    function executeImport(groupsToImport: CourseGroup[], coursesToImport: Course[], resolvedConflicts: { incoming: Course; existing: Course; action: 'merge' | 'replace' | 'skip' }[]) {
        let finalCourses = [...$coursesStore];

        finalCourses = [...finalCourses, ...coursesToImport];

        resolvedConflicts.forEach(conflict => {
            if (conflict.action === 'skip') return;

            if (conflict.action === 'replace') {
                finalCourses = finalCourses.filter(c => c.id !== conflict.existing.id);
                finalCourses.push(conflict.incoming);
            }

            if (conflict.action === 'merge') {
                const targetIndex = finalCourses.findIndex(c => c.id === conflict.existing.id);
                if (targetIndex !== -1) {
                    const existingSectionNames = finalCourses[targetIndex].sections.map(s => s.section);
                    const uniqueNewSections = conflict.incoming.sections.filter(
                        s => !existingSectionNames.includes(s.section)
                    );
                    finalCourses[targetIndex].sections = [...finalCourses[targetIndex].sections, ...uniqueNewSections];
                }
            }
        });

        $groupsStore = [...$groupsStore, ...groupsToImport];
        $coursesStore = finalCourses;

        pastedJson = '';
        importQueue = null;
        open = false;

        const totalImported = coursesToImport.length + resolvedConflicts.filter(c => c.action !== 'skip').length;
        toast.success(`Imported/Updated ${totalImported} course(s) successfully.`);
    }

    function confirmImport() {
        if (!importQueue) return;
        executeImport(importQueue.groups, importQueue.newCourses, importQueue.conflicts);
    }

    function handleUrlImport() {
        if (urlImportParam) {
            processImportData(urlImportParam);
        }
    }

    async function handleFileImport(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        processImportData(text);
    }
</script>

<BaseDialog bind:open={open} title="Global Data Manager" description="Backup your entire curriculum, or import a shared one." icon={Database}>

    {#snippet trigger(props)}
        <Button {...props} variant="outline" size="icon" class="h-8 w-8 hover:!bg-accent/80 hover:!text-accent-foreground transition-colors shrink-0" title="Global Data Manager">
            <Database size={16} />
        </Button>
    {/snippet}

    {#snippet children()}
        <div class="flex flex-col gap-6 pb-6 min-w-0">
            <!-- Conflict Resolution UI -->
            {#if importQueue}
                <div class="flex flex-col gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5 shadow-sm animate-in fade-in zoom-in-95 min-w-0">
                    <div class="flex items-start gap-3 shrink-0">
                        <CircleAlert size={20} class="text-destructive mt-0.5 shrink-0" />
                        <div class="flex flex-col gap-1 min-w-0">
                            <h4 class="font-bold text-sm tracking-tight text-destructive">Import Conflicts Detected</h4>
                            <p class="text-xs text-muted-foreground">
                                {importQueue.conflicts.length} course(s) from your import already exist in your curriculum. How would you like to handle them?
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 rounded-md border border-border/50 bg-background/50 p-2 min-h-0">
                        {#each importQueue.conflicts as conflict}
                            <div class="flex flex-col p-2.5 rounded-md bg-card border border-border/50 shadow-sm gap-2 shrink-0 min-w-0">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
                                    <span class="font-bold text-sm truncate text-center sm:text-left flex-1 min-w-0" title={conflict.incoming.courseCode}>{conflict.incoming.courseCode}</span>

                                    <div class="flex bg-muted p-1 rounded-md shrink-0 w-full sm:w-auto">
                                        <button
                                                class="flex-1 sm:flex-none px-2 py-1 text-[11px] font-semibold rounded transition-colors {conflict.action === 'merge' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
                                                onclick={() => conflict.action = 'merge'}>
                                            Merge
                                        </button>
                                        <button
                                                class="flex-1 sm:flex-none px-2 py-1 text-[11px] font-semibold rounded transition-colors {conflict.action === 'replace' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
                                                onclick={() => conflict.action = 'replace'}>
                                            Replace
                                        </button>
                                        <button
                                                class="flex-1 sm:flex-none px-2 py-1 text-[11px] font-semibold rounded transition-colors {conflict.action === 'skip' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
                                                onclick={() => conflict.action = 'skip'}>
                                            Skip
                                        </button>
                                    </div>
                                </div>

                                <!-- Description Box -->
                                <div class="text-[11px] text-muted-foreground bg-accent/20 border border-border/30 p-1.5 px-2 rounded-sm text-center sm:text-left leading-tight">
                                    {#if conflict.action === 'merge'}
                                        <span class="font-semibold text-foreground">Merge:</span> Keeps your existing sections and adds any new ones.
                                    {:else if conflict.action === 'replace'}
                                        <span class="font-semibold text-foreground">Replace:</span> Overwrites the entire existing course and its sections.
                                    {:else if conflict.action === 'skip'}
                                        <span class="font-semibold text-foreground">Skip:</span> Ignores this incoming course completely.
                                    {/if}
                                </div>
                            </div>
                        {/each}
                    </div>

                    <div class="flex flex-col-reverse sm:flex-row gap-2 mt-2 pt-3 shrink-0 border-t border-destructive/10">
                        <Button variant="outline" class="w-full sm:flex-1 h-9 text-xs font-semibold bg-background" onclick={() => importQueue = null}>
                            Cancel Import
                        </Button>
                        <Button class="w-full sm:flex-1 h-9 text-xs font-semibold gap-2" onclick={confirmImport}>
                            <CircleCheck size={14} /> Confirm Import
                        </Button>
                    </div>
                </div>
            {:else}
                <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                    <div class="flex items-center gap-2 border-b border-border/50 pb-2">
                        <Download size={18} class="text-primary" />
                        <h4 class="font-bold text-sm tracking-tight">Export Curriculum</h4>
                    </div>
                    <p class="text-sm text-muted-foreground mb-1">
                        Export your courses, sections, and schedule groupings.
                    </p>

                    <div class="flex flex-col gap-2">
                        <div class="grid grid-cols-[1fr_auto_auto] gap-2">
                            <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getAllData(), `quiver_curriculum_all.json`)} disabled={$coursesStore.length === 0}>
                                <Download size={14} /> Download All
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getAllData(), "Curriculum JSON copied!")} disabled={$coursesStore.length === 0} title="Copy JSON">
                                <Copy size={14} />
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyShareLink(getAllData(), "Shareable Curriculum Link copied!")} disabled={$coursesStore.length === 0} title="Copy Share Link">
                                <Link size={14} />
                            </Button>
                        </div>

                        <div class="grid grid-cols-[1fr_auto_auto] gap-2">
                            <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getSelectedData(), `quiver_curriculum_selected.json`)} disabled={selectedCount === 0}>
                                <Download size={14} /> Download Selected Only ({selectedCount})
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getSelectedData(), "Selected JSON copied!")} disabled={selectedCount === 0} title="Copy Selected JSON">
                                <Copy size={14} />
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyShareLink(getSelectedData(), "Shareable Selected Link copied!")} disabled={selectedCount === 0} title="Copy Selected Share Link">
                                <Link size={14} />
                            </Button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                    <div class="flex items-center gap-2 border-b border-border/50 pb-2 mb-1">
                        <Upload size={18} class="text-primary" />
                        <h4 class="font-bold text-sm tracking-tight">Import Curriculum</h4>
                    </div>

                    <!-- URL Shared Data Banner -->
                    {#if urlImportParam}
                        <div class="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/30 shadow-sm animate-in fade-in zoom-in-95">
                            <div class="flex flex-col gap-0.5">
                                <span class="text-sm font-bold text-primary flex items-center gap-1.5"><Link size={14}/> Shared Data Detected</span>
                                <span class="text-[11px] text-muted-foreground">A share link is present in your URL.</span>
                            </div>
                            <Button size="sm" class="h-8 font-bold gap-1.5" onclick={handleUrlImport}>
                                <Download size={14} /> Import Now
                            </Button>
                        </div>
                    {/if}

                    <div class="flex flex-col gap-2">
                        <input
                                type="file"
                                accept=".json,application/json"
                                class="hidden"
                                id="global-json-upload"
                                bind:this={fileInput}
                                onchange={handleFileImport}
                        />
                        <label
                                for="global-json-upload"
                                class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:border-primary shadow-sm"
                        >
                            <FileBraces size={16} />
                            Select Global JSON File
                        </label>
                    </div>

                    <div class="flex items-center gap-3 my-1">
                        <div class="h-px bg-border/50 flex-grow"></div>
                        <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or Paste Data</span>
                        <div class="h-px bg-border/50 flex-grow"></div>
                    </div>

                    <div class="flex flex-col gap-2 min-w-0">
                        <Textarea
                                bind:value={pastedJson}
                                placeholder="Paste global JSON payload or Share Link here..."
                                class="min-h-[90px] font-mono text-xs resize-none shadow-sm break-all"
                        />
                        <Button size="sm" onclick={() => processImportData(pastedJson)} class="w-full font-bold shadow-sm h-8" disabled={!pastedJson.trim()}>
                            Import from Text
                        </Button>
                    </div>

                    <div class="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border/50">
                        <Button variant="outline" size="sm" class="w-full gap-2 border-dashed font-semibold text-muted-foreground text-xs h-8" onclick={() => downloadJson(templateData, 'template_global.json')}>
                            <Download size={12} /> Download Template
                        </Button>
                        <Button variant="outline" size="sm" class="w-full gap-2 border-dashed font-semibold text-muted-foreground text-xs h-8" onclick={() => copyToClipboard(templateData, "Global Template copied to clipboard!")}>
                            <Copy size={12} /> Copy Template
                        </Button>
                    </div>
                </div>
            {/if}
        </div>
    {/snippet}
</BaseDialog>