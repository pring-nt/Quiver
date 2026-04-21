<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Textarea } from '$lib/components/ui/textarea';
    import { toast } from 'svelte-sonner';

    import { FileBraces, Download, Upload, Copy } from 'lucide-svelte';

    import { coursesStore, selectedSectionsStore, classSectionSchema } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { ClassSection } from '$lib/types';

    let { course }: { course: Course } = $props();

    let open = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);
    let pastedJson = $state('');

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

    // Core helper to trigger a file download in the browser
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
        return course.sections.map(({ id, code, ...rest }) => rest);
    }

    function getSelectedData() {
        const selectedIds = Object.keys($selectedSectionsStore).filter(id => $selectedSectionsStore[id]);
        const selectedSections = course.sections.filter(s => selectedIds.includes(s.id));
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

            const newSections: ClassSection[] = [];

            for (const item of items) {
                // Reconstruct the payload with fresh UUIDs to prevent collisions
                const payload = {
                    ...item,
                    id: crypto.randomUUID(),
                    code: course.courseCode,
                    slots: (item.slots || []).map((s: any) => ({ ...s }))
                };

                // Enforce strict typing via existing Zod schema
                const parsed = classSectionSchema.safeParse(payload);
                if (!parsed.success) {
                    toast.error(`Validation failed for section "${item.section || 'Unknown'}": ${parsed.error.issues[0].message}`);
                    if (fileInput) fileInput.value = '';
                    return;
                }
                newSections.push(parsed.data);
            }

            // Append newly validated sections to the course
            coursesStore.update(all => all.map(c =>
                c.id === course.id ? { ...c, sections: [...(c.sections || []), ...newSections] } : c
            ));

            pastedJson = '';
            open = false;
            toast.success(`Imported ${newSections.length} section(s) successfully.`);
        } catch (e) {
            toast.error("Invalid JSON format. Please ensure it matches the template.");
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

<BaseDialog bind:open={open} title="Data Manager" description="Import or Export class sections for {course.courseCode}." icon={FileBraces}>

    {#snippet trigger(props)}
        <Button {...props} variant="outline" class="gap-2 shrink-0 shadow-sm font-semibold">
            <FileBraces size={18} />
            Course Data
        </Button>
    {/snippet}

    {#snippet children()}
        <div class="flex flex-col gap-6 pb-2">

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
        </div>
    {/snippet}
</BaseDialog>