<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { toast } from 'svelte-sonner';

    import { FileBraces, Download, Upload, Copy, Link } from 'lucide-svelte';

    import { coursesStore, selectedSectionsStore, classSectionSchema } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { ClassSection } from '$lib/types';
    import { decodeData, generateShareUrl } from '$lib/utils/share';
    import { ClassSectionConflictResolution } from '$lib/components/courses/class-sections';

    let { course }: { course: Course } = $props();

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
                    // Peek at the payload to ensure it's actually class section data
                    const decoded = decodeData(param);
                    if (decoded && (Array.isArray(decoded) || 'section' in decoded)) {
                        urlImportParam = param;
                    }
                } catch (e) {
                    // Ignore invalid params or global data
                }
            }
        }
    });

    // Conflict Resolution State
    let importQueue = $state<{
        newSections: ClassSection[];
        conflicts: { incoming: ClassSection; existing: ClassSection; action: 'replace' | 'duplicate' | 'skip' }[];
    } | null>(null);

    // Derived count of selected sections for this specific course
    let selectedCount = $derived(
        course.sections?.filter(s => $selectedSectionsStore[s.id]).length || 0
    );

    const templateData = [
        {
            "section": "S67",
            "professor": "Frieren Batumbakal",
            "modality": "F2F",
            "remarks": "Optional remarks for the class section",
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
    ];

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
        return (course.sections || []).map(({ id, code, ...rest }) => rest);
    }

    function getSelectedData() {
        const selectedIds = Object.keys($selectedSectionsStore).filter(id => $selectedSectionsStore[id]);
        const selectedSections = (course.sections || []).filter(s => selectedIds.includes(s.id));
        return selectedSections.map(({ id, code, ...rest }) => rest);
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

            // Smart routing: Prevent Global Data from being imported here
            if (data && !Array.isArray(data) && ('courses' in data || 'groups' in data)) {
                toast.error("This looks like Global Curriculum data. Please import it from the main Course List menu.");
                return;
            }

            const items = Array.isArray(data) ? data : [data];
            const parsedItems: ClassSection[] = [];

            for (const item of items) {
                const payload = {
                    ...item,
                    id: crypto.randomUUID(),
                    code: course.courseCode,
                    slots: (item.slots || []).map((s: any) => ({ ...s }))
                };

                const parsed = classSectionSchema.safeParse(payload);
                if (!parsed.success) {
                    toast.error(`Validation failed for section "${item.section || 'Unknown'}": ${parsed.error.issues[0].message}`);
                    if (fileInput) fileInput.value = '';
                    return;
                }

                parsedItems.push(parsed.data as ClassSection);
            }

            const conflicts: { incoming: ClassSection; existing: ClassSection; action: 'replace' | 'duplicate' | 'skip' }[] = [];
            const newSections: ClassSection[] = [];

            // Detect Conflicts by checking if the section name already exists in the current course
            parsedItems.forEach(incoming => {
                const existing = course.sections?.find(s => s.section.toLowerCase() === incoming.section.toLowerCase());
                if (existing) {
                    // Default action is to replace the old section with the incoming one
                    conflicts.push({ incoming, existing, action: 'replace' });
                } else {
                    newSections.push(incoming);
                }
            });

            if (conflicts.length > 0) {
                importQueue = { newSections, conflicts };
            } else {
                executeImport(newSections, []);
            }

        } catch (e) {
            toast.error("Invalid format. Please ensure it's valid JSON or a valid share link.");
        } finally {
            if (fileInput) fileInput.value = '';
        }
    }

    function executeImport(sectionsToImport: ClassSection[], resolvedConflicts: { incoming: ClassSection; existing: ClassSection; action: 'replace' | 'duplicate' | 'skip' }[]) {
        let finalSections = [...(course.sections || [])];

        // 1. Add new sections
        finalSections = [...finalSections, ...sectionsToImport];

        // 2. Process user decisions on conflicts
        resolvedConflicts.forEach(conflict => {
            if (conflict.action === 'skip') return;

            if (conflict.action === 'replace') {
                finalSections = finalSections.filter(s => s.id !== conflict.existing.id);
                finalSections.push(conflict.incoming);
            }

            if (conflict.action === 'duplicate') {
                const baseName = conflict.incoming.section;
                let newName = `${baseName} (Imported)`;
                let counter = 1;

                // Smart loop to guarantee a unique name even if duplicated multiple times
                while (finalSections.some(s => s.section.toLowerCase() === newName.toLowerCase())) {
                    counter++;
                    newName = `${baseName} (Imported ${counter})`;
                }

                finalSections.push({
                    ...conflict.incoming,
                    section: newName
                });
            }
        });

        // 3. Save to Store
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: finalSections } : c
        ));

        pastedJson = '';
        importQueue = null;
        open = false;

        const totalImported = sectionsToImport.length + resolvedConflicts.filter(c => c.action !== 'skip').length;
        toast.success(`Imported/Updated ${totalImported} section(s) successfully.`);
    }

    function confirmImport() {
        if (!importQueue) return;
        executeImport(importQueue.newSections, importQueue.conflicts);
    }

    // Helper wrapper to safely trigger url imports without non-null assertion inline
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

<BaseDialog bind:open={open} title="Data Manager" description="Import or Export class sections for {course.courseCode}." icon={FileBraces}>

    {#snippet trigger(props)}
        <Button {...props} variant="outline" class="gap-2 shrink-0 shadow-sm font-semibold">
            <FileBraces size={18} />
            Course Data
        </Button>
    {/snippet}

    {#snippet children()}
        <div class="flex flex-col gap-6 pb-6 min-w-0">

            <!-- Conflict Resolution UI -->
            {#if importQueue}
                <ClassSectionConflictResolution
                        conflicts={importQueue.conflicts}
                        onCancel={() => importQueue = null}
                        onConfirm={confirmImport}
                />
            {:else}
                <!-- Export Card -->
                <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                    <div class="flex items-center gap-2 border-b border-border/50 pb-2">
                        <Download size={18} class="text-primary" />
                        <h4 class="font-bold text-sm tracking-tight">Export Sections</h4>
                    </div>
                    <p class="text-sm text-muted-foreground mb-1">
                        Export your configured class sections to share with classmates.
                    </p>

                    <div class="flex flex-col gap-2">
                        <div class="grid grid-cols-[1fr_auto_auto] gap-2">
                            <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getAllData(), `${course.courseCode}_all_sections.json`)} disabled={!course.sections?.length}>
                                <Download size={14} /> Download All
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getAllData(), "All sections copied to clipboard!")} disabled={!course.sections?.length} title="Copy JSON">
                                <Copy size={14} />
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyShareLink(getAllData(), "Shareable Sections Link copied!")} disabled={!course.sections?.length} title="Copy Share Link">
                                <Link size={14} />
                            </Button>
                        </div>

                        <div class="grid grid-cols-[1fr_auto_auto] gap-2">
                            <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getSelectedData(), `${course.courseCode}_selected_sections.json`)} disabled={selectedCount === 0}>
                                <Download size={14} /> Download Selected ({selectedCount})
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getSelectedData(), "Selected sections copied to clipboard!")} disabled={selectedCount === 0} title="Copy Selected JSON">
                                <Copy size={14} />
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyShareLink(getSelectedData(), "Shareable Selected Sections Link copied!")} disabled={selectedCount === 0} title="Copy Selected Share Link">
                                <Link size={14} />
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Import Card -->
                <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                    <div class="flex items-center gap-2 border-b border-border/50 pb-2 mb-1">
                        <Upload size={18} class="text-primary" />
                        <h4 class="font-bold text-sm tracking-tight">Import JSON</h4>
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

                    <!-- File Upload -->
                    <div class="flex flex-col gap-2">
                        <input
                                type="file"
                                accept=".json,application/json"
                                class="hidden"
                                id="json-upload"
                                bind:this={fileInput}
                                onchange={handleFileImport}
                        />
                        <label
                                for="json-upload"
                                class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary/50 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 hover:border-primary shadow-sm"
                        >
                            <FileBraces size={16} />
                            Select JSON File
                        </label>
                    </div>

                    <div class="flex items-center gap-3 my-1">
                        <div class="h-px bg-border/50 flex-grow"></div>
                        <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or Paste Data</span>
                        <div class="h-px bg-border/50 flex-grow"></div>
                    </div>

                    <!-- Direct Paste Area -->
                    <div class="flex flex-col gap-2 min-w-0">
                        <Textarea
                                bind:value={pastedJson}
                                placeholder="Paste JSON array or Share Link here..."
                                class="min-h-[90px] font-mono text-xs resize-none shadow-sm break-all"
                        />
                        <Button size="sm" onclick={() => processImportData(pastedJson)} class="w-full font-bold shadow-sm h-8" disabled={!pastedJson.trim()}>
                            Import from Text
                        </Button>
                    </div>

                    <!-- Template Utilities -->
                    <div class="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border/50">
                        <Button variant="outline" size="sm" class="w-full gap-2 border-dashed font-semibold text-muted-foreground text-xs h-8" onclick={() => downloadJson(templateData, 'template_sections.json')}>
                            <Download size={12} /> Download Template
                        </Button>
                        <Button variant="outline" size="sm" class="w-full gap-2 border-dashed font-semibold text-muted-foreground text-xs h-8" onclick={() => copyToClipboard(templateData, "Template copied to clipboard!")}>
                            <Copy size={12} /> Copy Template
                        </Button>
                    </div>
                </div>
            {/if}
        </div>
    {/snippet}
</BaseDialog>