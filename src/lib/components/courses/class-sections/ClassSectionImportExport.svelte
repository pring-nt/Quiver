<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { toast } from 'svelte-sonner';

    import { FileBraces, Download, Upload, Copy, CircleAlert, CircleCheck } from 'lucide-svelte';

    import { coursesStore, selectedSectionsStore, classSectionSchema } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { ClassSection } from '$lib/types';

    let { course }: { course: Course } = $props();

    let open = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let pastedJson = $state('');

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
            toast.error("Please provide JSON data to import.");
            return;
        }

        try {
            const json = JSON.parse(text);
            const items = Array.isArray(json) ? json : [json];

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

                // Assert as ClassSection since we know the ID is present from the payload above
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
            toast.error("Invalid JSON format. Please ensure it matches the template.");
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
        <div class="flex flex-col gap-6 pb-6">

            <!-- Conflict Resolution UI -->
            {#if importQueue}
                <div class="flex flex-col gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5 shadow-sm animate-in fade-in zoom-in-95">
                    <div class="flex items-start gap-3 shrink-0">
                        <CircleAlert size={20} class="text-destructive mt-0.5 shrink-0" />
                        <div class="flex flex-col gap-1">
                            <h4 class="font-bold text-sm tracking-tight text-destructive">Import Conflicts Detected</h4>
                            <p class="text-xs text-muted-foreground">
                                {importQueue.conflicts.length} section(s) from your import already exist in {course.courseCode}. How would you like to handle them?
                            </p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 rounded-md border border-border/50 bg-background/50 p-2 min-h-0">
                        {#each importQueue.conflicts as conflict}
                            <div class="flex flex-col p-2.5 rounded-md bg-card border border-border/50 shadow-sm gap-2 shrink-0">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                                    <span class="font-bold text-sm truncate text-center sm:text-left w-full sm:w-auto">{conflict.incoming.section}</span>

                                    <div class="flex bg-muted p-1 rounded-md shrink-0 w-full sm:w-auto">
                                        <button
                                                type="button"
                                                class="flex-1 sm:flex-none px-2 py-1 text-[11px] font-semibold rounded transition-colors {conflict.action === 'replace' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
                                                onclick={() => conflict.action = 'replace'}>
                                            Replace
                                        </button>
                                        <button
                                                type="button"
                                                class="flex-1 sm:flex-none px-2 py-1 text-[11px] font-semibold rounded transition-colors {conflict.action === 'duplicate' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
                                                onclick={() => conflict.action = 'duplicate'}>
                                            Duplicate
                                        </button>
                                        <button
                                                type="button"
                                                class="flex-1 sm:flex-none px-2 py-1 text-[11px] font-semibold rounded transition-colors {conflict.action === 'skip' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}"
                                                onclick={() => conflict.action = 'skip'}>
                                            Skip
                                        </button>
                                    </div>
                                </div>

                                <!-- Dynamic Description Box -->
                                <div class="text-[11px] text-muted-foreground bg-accent/20 border border-border/30 p-1.5 px-2 rounded-sm text-center sm:text-left leading-tight">
                                    {#if conflict.action === 'replace'}
                                        <span class="font-semibold text-foreground">Replace:</span> Overwrites your existing section with this new one.
                                    {:else if conflict.action === 'duplicate'}
                                        <span class="font-semibold text-foreground">Duplicate:</span> Keeps your old section, adds this one as a unique copy.
                                    {:else if conflict.action === 'skip'}
                                        <span class="font-semibold text-foreground">Skip:</span> Ignores this incoming section completely.
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
                        <div class="grid grid-cols-[1fr_auto] gap-2">
                            <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getAllData(), `${course.courseCode}_all_sections.json`)} disabled={!course.sections?.length}>
                                <Download size={14} /> Download All ({course.sections?.length || 0})
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getAllData(), "All sections copied to clipboard!")} disabled={!course.sections?.length} title="Copy JSON to clipboard">
                                <Copy size={14} />
                            </Button>
                        </div>

                        <div class="grid grid-cols-[1fr_auto] gap-2">
                            <Button variant="secondary" size="sm" class="w-full gap-2 font-semibold shadow-sm" onclick={() => downloadJson(getSelectedData(), `${course.courseCode}_selected_sections.json`)} disabled={selectedCount === 0}>
                                <Download size={14} /> Download Selected ({selectedCount})
                            </Button>
                            <Button variant="outline" size="icon" class="h-8 w-8 shadow-sm text-muted-foreground hover:text-foreground" onclick={() => copyToClipboard(getSelectedData(), "Selected sections copied to clipboard!")} disabled={selectedCount === 0} title="Copy selected to clipboard">
                                <Copy size={14} />
                            </Button>
                        </div>
                    </div>
                </div>

                <!-- Import Card -->
                <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm">
                    <div class="flex items-center gap-2 border-b border-border/50 pb-2">
                        <Upload size={18} class="text-primary" />
                        <h4 class="font-bold text-sm tracking-tight">Import JSON</h4>
                    </div>

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
                        <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Or Paste Directly</span>
                        <div class="h-px bg-border/50 flex-grow"></div>
                    </div>

                    <!-- Direct Paste Area -->
                    <div class="flex flex-col gap-2">
                        <Textarea
                                bind:value={pastedJson}
                                placeholder="Paste JSON array here..."
                                class="min-h-[90px] font-mono text-xs resize-none shadow-sm"
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