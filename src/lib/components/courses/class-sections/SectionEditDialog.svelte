<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import * as Select from '$lib/components/ui/select';

    import { Plus, Trash2, Pencil, CircleAlert } from 'lucide-svelte';

    import { coursesStore, classSectionSchema } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { Modality, Day, ClassSection } from '$lib/types';

    let { course, sectionData, open = $bindable(false) }: { course: Course, sectionData: ClassSection, open: boolean } = $props();

    let errorMessage = $state<string | null>(null);

    // Form State (initialized empty, populated by $effect when dialog opens)
    let section = $state('');
    let professor = $state('');
    let modality = $state<Modality>('F2F');
    let remarks = $state('');
    let slots = $state<{id: string, day: Day, startTime: string, endTime: string, room: string, isOnline: boolean}[]>([]);

    // Reset state whenever the dialog opens to ensure it reflects the latest data
    $effect(() => {
        if (open) {
            section = sectionData.section;
            professor = sectionData.professor;
            modality = sectionData.modality;
            remarks = sectionData.remarks || '';
            slots = sectionData.slots.map(s => ({
                day: s.day,
                isOnline: s.isOnline,
                room: s.room || '',
                id: crypto.randomUUID(),
                startTime: s.startTime.replace(':', ''),
                endTime: s.endTime.replace(':', '')
            }));
            errorMessage = null;
        }
    });

    function addSlot() {
        // Grab the last slot to copy its values
        const prev = slots.length > 0 ? slots[slots.length - 1] : null;

        // Smart day pairing (M -> W, T -> Th, etc.)
        let nextDay: Day = 'M';
        if (prev) {
            if (prev.day === 'M') nextDay = 'W';
            else if (prev.day === 'T') nextDay = 'Th';
            else if (prev.day === 'W') nextDay = 'F';
            else if (prev.day === 'Th') nextDay = 'S';
            else nextDay = prev.day;
        }

        slots = [...slots, {
            id: crypto.randomUUID(),
            day: nextDay,
            startTime: prev ? prev.startTime : '0800',
            endTime: prev ? prev.endTime : '0930',
            room: prev ? prev.room : '',
            isOnline: prev ? prev.isOnline : false
        }];
    }

    function removeSlot(id: string) {
        slots = slots.filter(s => s.id !== id);
    }

    function validateTimes() {
        for (const slot of slots) {
            const start = slot.startTime;
            const end = slot.endTime;

            if (start.length !== 4 || end.length !== 4 || !/^\d{4}$/.test(start) || !/^\d{4}$/.test(end)) {
                return `Times must be exactly 4 digits (e.g., 0800 or 1430) for ${slot.day}.`;
            }

            const startH = parseInt(start.slice(0, 2), 10);
            const startM = parseInt(start.slice(2, 4), 10);
            const endH = parseInt(end.slice(0, 2), 10);
            const endM = parseInt(end.slice(2, 4), 10);

            if (startH > 23 || startM > 59) return `Invalid start time (${start}) on ${slot.day}.`;
            if (endH > 23 || endM > 59) return `Invalid end time (${end}) on ${slot.day}.`;

            if (parseInt(start, 10) >= parseInt(end, 10)) {
                return `End time (${end}) must be after start time (${start}) on ${slot.day}.`;
            }
        }
        return null;
    }

    function onSubmit(e: Event) {
        e.preventDefault();
        errorMessage = null;

        const timeError = validateTimes();
        if (timeError) {
            errorMessage = timeError;
            return;
        }

        const payload = {
            id: sectionData.id, // Maintain the original ID to overwrite
            code: course.courseCode,
            section: section.trim().toUpperCase(),
            professor: professor.trim(),
            modality,
            remarks: remarks.trim(),
            slots: slots.map(({id, ...rest}) => rest) // Just strip the UI id
        };

        const parsed = classSectionSchema.safeParse(payload);
        if (!parsed.success) {
            errorMessage = parsed.error.issues[0].message;
            return;
        }

        const updatedSection = parsed.data;

        // Update the existing section in the store instead of adding a new one
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? {
                ...c,
                sections: c.sections.map(s => s.id === sectionData.id ? updatedSection : s)
            } : c
        ));

        open = false;
    }
</script>

<BaseDialog bind:open={open} title="Edit Section: {sectionData.section}" description="Update the schedule slots and details for this section." icon={Pencil}>

    {#snippet trigger(props)}
        <div class="hidden" {...props}></div>
    {/snippet}

    {#snippet children()}
        <form onsubmit={onSubmit} class="flex flex-col gap-5 pb-4 px-1">
            <div class="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div class="flex flex-col gap-1.5">
                    <label for="edit-section" class="text-xs font-bold text-muted-foreground uppercase">Section Code</label>
                    <Input id="edit-section" bind:value={section} placeholder="e.g. S18" required class="font-medium bg-background shadow-sm" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="edit-modality" class="text-xs font-bold text-muted-foreground uppercase">Modality</label>
                    <Select.Root type="single" bind:value={modality}>
                        <Select.Trigger id="edit-modality" class="h-9 w-full shadow-sm font-medium bg-background">
                            {modality === 'F2F' ? 'Face to Face' : modality}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value="F2F">Face to Face</Select.Item>
                            <Select.Item value="Online">Online</Select.Item>
                            <Select.Item value="Hybrid">Hybrid</Select.Item>
                            <Select.Item value="PIP">PIP</Select.Item>
                            <Select.Item value="Tentative">Tentative</Select.Item>
                        </Select.Content>
                    </Select.Root>
                </div>
                <div class="flex flex-col gap-1.5 col-span-2">
                    <label for="edit-professor" class="text-xs font-bold text-muted-foreground uppercase">Professor</label>
                    <Input id="edit-professor" bind:value={professor} placeholder="e.g. Alexander Hamilton" required class="font-medium bg-background shadow-sm" />
                </div>
            </div>

            <div class="flex flex-col gap-3">
                <div class="flex items-center gap-2 border-b border-border/50 pb-2">
                    <h4 class="font-bold text-sm tracking-tight">Time & Day Slots</h4>
                </div>

                <div class="flex flex-col gap-3">
                    {#each slots as slot (slot.id)}
                        <div class="flex flex-col gap-3 p-4 border border-border/60 rounded-lg bg-card shadow-sm relative group transition-all hover:border-primary/40">
                            {#if slots.length > 1}
                                <button type="button" class="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" onclick={() => removeSlot(slot.id)}>
                                    <Trash2 size={16} />
                                </button>
                            {/if}

                            <div class="grid grid-cols-[1fr_1fr_1fr] gap-3 pr-8">
                                <div class="flex flex-col gap-1.5">
                                    <label for={`edit-day-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">Day</label>
                                    <Select.Root type="single" bind:value={slot.day}>
                                        <Select.Trigger id={`edit-day-${slot.id}`} class="h-8 w-full shadow-sm font-medium text-xs bg-background">
                                            {slot.day}
                                        </Select.Trigger>
                                        <Select.Content>
                                            {#each ['M','T','W','Th','F','S','Su'] as d}
                                                <Select.Item value={d}>{d}</Select.Item>
                                            {/each}
                                        </Select.Content>
                                    </Select.Root>
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label for={`edit-start-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">Start <span class="font-normal opacity-50">(HHMM)</span></label>
                                    <Input id={`edit-start-${slot.id}`} type="text" inputmode="numeric" maxlength={4} placeholder="0800" bind:value={slot.startTime} class="h-8 text-xs px-2 font-medium shadow-sm" required />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label for={`edit-end-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">End <span class="font-normal opacity-50">(HHMM)</span></label>
                                    <Input id={`edit-end-${slot.id}`} type="text" inputmode="numeric" maxlength={4} placeholder="0930" bind:value={slot.endTime} class="h-8 text-xs px-2 font-medium shadow-sm" required />
                                </div>
                            </div>

                            <div class="grid grid-cols-[1fr_auto] gap-3 items-end">
                                <div class="flex flex-col gap-1.5">
                                    <label for={`edit-room-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">Room</label>
                                    <Input id={`edit-room-${slot.id}`} bind:value={slot.room} placeholder="e.g. G204" class="h-8 text-xs px-2 font-medium shadow-sm" />
                                </div>
                                <div class="flex items-center gap-2 h-8 px-3 border border-border/50 rounded-md bg-muted/30">
                                    <Checkbox id={`edit-online-${slot.id}`} bind:checked={slot.isOnline} />
                                    <label for={`edit-online-${slot.id}`} class="text-xs font-bold cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Online</label>
                                </div>
                            </div>
                        </div>
                    {/each}
                </div>

                <Button type="button" variant="outline" size="sm" class="w-full border-dashed bg-card hover:bg-accent/50 text-muted-foreground hover:text-foreground font-semibold" onclick={addSlot}>
                    <Plus size={16} class="mr-2" />
                    Add Another Time Slot
                </Button>
            </div>

            <div class="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                <label for="edit-remarks" class="text-xs font-bold text-muted-foreground uppercase">Remarks <span class="text-muted-foreground/50 font-normal">(Optional)</span></label>
                <Input id="edit-remarks" bind:value={remarks} placeholder="e.g. For BSA students only, strict prereq..." class="bg-card shadow-sm" />
            </div>

            {#if errorMessage}
                <div class="flex items-center gap-1.5 text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in slide-in-from-top-1">
                    <CircleAlert size={16} />
                    <span>{errorMessage}</span>
                </div>
            {/if}

            <Button type="submit" class="w-full font-bold text-sm h-10 shadow-sm mt-1">Save Changes</Button>
        </form>
    {/snippet}
</BaseDialog>