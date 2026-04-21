<script lang="ts">
    import { BaseDialog } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import * as Select from '$lib/components/ui/select';

    // Compressed icon imports
    import { Plus, Trash2, BookPlus, CircleAlert } from 'lucide-svelte';

    import { coursesStore, classSectionSchema } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { DaySlot, Modality, Day, ClassSection } from '$lib/types';

    let { course }: { course: Course } = $props();

    let open = $state(false);
    let errorMessage = $state<string | null>(null);

    // Form State
    let section = $state('');
    let professor = $state('');
    let modality = $state<Modality>('F2F');
    let remarks = $state('');

    // Slots initialized with HHMM format
    let slots = $state<{id: string, day: Day, startTime: string, endTime: string, room: string, isOnline: boolean}[]>([
        { id: crypto.randomUUID(), day: 'M', startTime: '0800', endTime: '0930', room: '', isOnline: false }
    ]);

    function addSlot() {
        slots = [...slots, { id: crypto.randomUUID(), day: 'M', startTime: '0800', endTime: '0930', room: '', isOnline: false }];
    }

    function removeSlot(id: string) {
        slots = slots.filter(s => s.id !== id);
    }

    // Custom Time Validation for HHMM
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

        // Run manual time validation
        const timeError = validateTimes();
        if (timeError) {
            errorMessage = timeError;
            return;
        }

        // Format HHMM -> HH:MM before passing to Zod and Store
        const transformedSlots = slots.map(({id, ...rest}) => ({
            ...rest,
            startTime: `${rest.startTime.slice(0, 2)}:${rest.startTime.slice(2, 4)}`,
            endTime: `${rest.endTime.slice(0, 2)}:${rest.endTime.slice(2, 4)}`
        }));

        const payload = {
            id: crypto.randomUUID(),
            code: course.courseCode,
            section: section.trim().toUpperCase(),
            professor: professor.trim(),
            modality,
            remarks: remarks.trim(),
            slots: transformedSlots
        };

        // Zod Validation
        const parsed = classSectionSchema.safeParse(payload);
        if (!parsed.success) {
            errorMessage = parsed.error.issues[0].message;
            return;
        }

        const newSection = parsed.data;

        // Push to Store
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: [...(c.sections || []), newSection] } : c
        ));

        // Reset Form & Close
        section = '';
        professor = '';
        modality = 'F2F';
        remarks = '';
        slots = [{ id: crypto.randomUUID(), day: 'M', startTime: '0800', endTime: '0930', room: '', isOnline: false }];
        open = false;
    }
</script>

<BaseDialog bind:open={open} title="Add Section: {course.courseCode}" description="Configure the schedule slots and details for this section." icon={BookPlus}>

    {#snippet trigger(props)}
        <Button {...props} class="gap-2 shrink-0 shadow-sm font-semibold">
            <Plus size={18} />
            Add Section
        </Button>
    {/snippet}

    {#snippet children()}
        <form onsubmit={onSubmit} class="flex flex-col gap-5 pb-4 px-1">
            <!-- Basic Details -->
            <div class="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
                <div class="flex flex-col gap-1.5">
                    <label for="section" class="text-xs font-bold text-muted-foreground uppercase">Section Code</label>
                    <Input id="section" bind:value={section} placeholder="e.g. TN12" required class="font-medium bg-background shadow-sm" />
                </div>
                <div class="flex flex-col gap-1.5">
                    <label for="modality" class="text-xs font-bold text-muted-foreground uppercase">Modality</label>
                    <Select.Root type="single" bind:value={modality}>
                        <Select.Trigger id="modality" class="h-9 w-full shadow-sm font-medium bg-background">
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
                    <label for="professor" class="text-xs font-bold text-muted-foreground uppercase">Professor</label>
                    <Input id="professor" bind:value={professor} placeholder="e.g. Shirley Chu" required class="font-medium bg-background shadow-sm" />
                </div>
            </div>

            <!-- Dynamic Slots Array -->
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
                                    <label for={`day-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">Day</label>
                                    <Select.Root type="single" bind:value={slot.day}>
                                        <Select.Trigger id={`day-${slot.id}`} class="h-8 w-full shadow-sm font-medium text-xs bg-background">
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
                                    <label for={`start-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">Start <span class="font-normal opacity-50">(HHMM)</span></label>
                                    <Input id={`start-${slot.id}`} type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength={4} placeholder="0800" bind:value={slot.startTime} class="h-8 text-xs px-2 font-medium shadow-sm" required />
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <label for={`end-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">End <span class="font-normal opacity-50">(HHMM)</span></label>
                                    <Input id={`end-${slot.id}`} type="text" inputmode="numeric" pattern="[0-9]{4}" maxlength={4} placeholder="0930" bind:value={slot.endTime} class="h-8 text-xs px-2 font-medium shadow-sm" required />
                                </div>
                            </div>

                            <div class="grid grid-cols-[1fr_auto] gap-3 items-end">
                                <div class="flex flex-col gap-1.5">
                                    <label for={`room-${slot.id}`} class="text-[10px] font-bold text-muted-foreground uppercase">Room</label>
                                    <Input id={`room-${slot.id}`} bind:value={slot.room} placeholder="e.g. G204" class="h-8 text-xs px-2 font-medium shadow-sm" />
                                </div>
                                <div class="flex items-center gap-2 h-8 px-3 border border-border/50 rounded-md bg-muted/30">
                                    <Checkbox id={`online-${slot.id}`} bind:checked={slot.isOnline} />
                                    <label for={`online-${slot.id}`} class="text-xs font-bold cursor-pointer text-muted-foreground hover:text-foreground transition-colors">Online</label>
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

            <!-- Optional Remarks -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                <label for="remarks" class="text-xs font-bold text-muted-foreground uppercase">Remarks <span class="text-muted-foreground/50 font-normal">(Optional)</span></label>
                <Input id="remarks" bind:value={remarks} placeholder="e.g. For BSA students only, strict prereq..." class="bg-card shadow-sm" />
            </div>

            {#if errorMessage}
                <div class="flex items-center gap-1.5 text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20 animate-in slide-in-from-top-1">
                    <CircleAlert size={16} />
                    <span>{errorMessage}</span>
                </div>
            {/if}

            <Button type="submit" class="w-full font-bold text-sm h-10 shadow-sm mt-1">Save Class Section</Button>
        </form>
    {/snippet}
</BaseDialog>