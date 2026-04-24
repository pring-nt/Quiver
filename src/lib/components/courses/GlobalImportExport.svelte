<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { toast } from 'svelte-sonner';

    import { Database, Download, Upload, Copy, FileBraces } from 'lucide-svelte';

    import { coursesStore, groupsStore, selectedSectionsStore, globalDataSchema } from '$lib/stores/courses';

    let open = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let pastedJson = $state('');

    // Derived count of ALL selected sections across the entire store
    let selectedCount = $derived(
        Object.values($selectedSectionsStore).filter(Boolean).length
    );

    const templateData = {
        "groups": [
            {
                "id": "group-placeholder",
                "name": "Electives",
                "sectionIds": [],
                "pickCount": 1
            }
        ],
        "courses": [
            {
                "id": "course-placeholder",
                "courseCode": "CS101",
                "groupId": "group-placeholder",
                "sections": [
                    {
                        "id": "section-placeholder",
                        "code": "CS101",
                        "section": "TN12",
                        "professor": "John Doe",
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
        return {
            groups: $groupsStore,
            courses: $coursesStore
        };
    }

    function getSelectedData() {
        // Extract only the globally selected IDs
        const selectedIds = Object.keys($selectedSectionsStore).filter(id => $selectedSectionsStore[id]);

        // Filter out sections that aren't selected. Filter out courses that end up empty.
        const filteredCourses = $coursesStore.map(c => ({
            ...c,
            sections: c.sections.filter(s => selectedIds.includes(s.id))
        })).filter(c => c.sections.length > 0);

        // Find which groups are actually used by these filtered courses
        const usedGroupIds = new Set(filteredCourses.map(c => c.groupId).filter(Boolean));
        const filteredGroups = $groupsStore.filter(g => usedGroupIds.has(g.id));

        return { groups: filteredGroups, courses: filteredCourses };
    }

    function processImportData(text: string) {
        if (!text.trim()) {
            toast.error("Please provide JSON data to import.");
            return;
        }

        try {
            const json = JSON.parse(text);
            const parsed = globalDataSchema.safeParse(json);

            if (!parsed.success) {
                const issue = parsed.error.issues[0];
                toast.error(`Validation failed at ${issue.path.join('.') || 'root'}: ${issue.message}`);
                return;
            }

            const data = parsed.data;

            // ID Remapping: Essential to prevent collisions while preserving grouping logic
            const groupIdMap = new Map<string, string>();
            const newGroups = data.groups.map(g => {
                const newId = crypto.randomUUID();
                groupIdMap.set(g.id, newId);
                return { ...g, id: newId };
            });

            const newCourses = data.courses.map(c => {
                const newId = crypto.randomUUID();
                const newSections = c.sections.map(s => ({
                    ...s,
                    id: crypto.randomUUID(),
                    code: c.courseCode // Force code sync
                }));

                return {
                    ...c,
                    id: newId,
                    // If the old course had a group, map it to the newly generated group ID
                    groupId: c.groupId && groupIdMap.has(c.groupId) ? groupIdMap.get(c.groupId) : undefined,
                    sections: newSections
                };
            });

            // Append safely to stores
            $groupsStore = [...$groupsStore, ...newGroups];
            $coursesStore = [...$coursesStore, ...newCourses];

            pastedJson = '';
            open = false;
            toast.success(`Imported ${newCourses.length} course(s) and ${newGroups.length} group(s) successfully.`);
        } catch (e) {
            toast.error("Invalid JSON format. Please ensure it matches the global curriculum structure.");
        } finally {
            if (fileInput) fileInput.value = '';
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
        <div class="flex flex-col gap-6 pb-2">

            <!-- Export Card -->
            <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                <div class="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Download size={18} class="text-primary" />
                    <h4 class="font-bold text-sm tracking-tight">Export Curriculum</h4>
                </div>
                <p class="text-sm text-muted-foreground mb-1">
                    Export all your courses, sections, and schedule groupings simultaneously.
                </p>

                <div class="flex flex-col gap-2">
                    <div class="grid grid-cols-[1fr_auto] gap-2">
                        <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getAllData(), `quiver_curriculum_all.json`)} disabled={$coursesStore.length === 0}>
                            <Download size={14} /> Download All Courses
                        </Button>
                        <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getAllData(), "Curriculum copied to clipboard!")} disabled={$coursesStore.length === 0} title="Copy JSON to clipboard">
                            <Copy size={14} />
                        </Button>
                    </div>

                    <div class="grid grid-cols-[1fr_auto] gap-2">
                        <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getSelectedData(), `quiver_curriculum_selected.json`)} disabled={selectedCount === 0}>
                            <Download size={14} /> Download Selected Only ({selectedCount})
                        </Button>
                        <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getSelectedData(), "Selected curriculum copied to clipboard!")} disabled={selectedCount === 0} title="Copy selected to clipboard">
                            <Copy size={14} />
                        </Button>
                    </div>
                </div>
            </div>

            <!-- Import Card -->
            <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                <div class="flex items-center gap-2 border-b border-border/50 pb-2">
                    <Upload size={18} class="text-primary" />
                    <h4 class="font-bold text-sm tracking-tight">Import Curriculum</h4>
                </div>

                <!-- File Upload -->
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
                    <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or Paste Directly</span>
                    <div class="h-px bg-border/50 flex-grow"></div>
                </div>

                <!-- Direct Paste Area -->
                <div class="flex flex-col gap-2">
                    <Textarea
                            bind:value={pastedJson}
                            placeholder="Paste global JSON payload here..."
                            class="min-h-[90px] font-mono text-xs resize-none shadow-sm"
                    />
                    <Button size="sm" onclick={() => processImportData(pastedJson)} class="w-full font-bold shadow-sm h-8" disabled={!pastedJson.trim()}>
                        Import from Text
                    </Button>
                </div>

                <!-- Template Utilities -->
                <div class="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border/50">
                    <Button variant="outline" size="sm" class="w-full gap-2 border-dashed font-semibold text-muted-foreground text-xs h-8" onclick={() => downloadJson(templateData, 'template_global.json')}>
                        <Download size={12} /> Download Template
                    </Button>
                    <Button variant="outline" size="sm" class="w-full gap-2 border-dashed font-semibold text-muted-foreground text-xs h-8" onclick={() => copyToClipboard(templateData, "Global Template copied to clipboard!")}>
                        <Copy size={12} /> Copy Template
                    </Button>
                </div>
            </div>
        </div>
    {/snippet}
</BaseDialog>