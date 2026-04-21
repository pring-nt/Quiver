<script lang="ts">
    import { BaseDialog, DialogCard } from '$lib/components/layout/dialogs';
    import { Button } from '$lib/components/ui/button';
    import { Info } from 'lucide-svelte';

    const steps = [
        {
            title: "Create a Group",
            description: "Click the 'Create New Group' box to make a named container. Names must be unique and up to 20 characters long!"
        },
        {
            title: "Drag & Drop",
            description: "Drag courses from the 'Ungrouped' list and drop them into your new group."
        },
        {
            title: "Choose Pick Amount",
            description: "By default, the generator treats all courses in a group as a single block. You can adjust the counter from the group's options menu (the 3 dots) to pick exactly X courses out of the group! (e.g. Add 4 electives, set it to pick 2)."
        },
        {
            title: "Generate Schedule",
            description: "The generator handles the rest, ensuring your selected pick amount is successfully factored into the final schedules."
        }
    ];
</script>

<BaseDialog
        title="How Grouping Works"
        description="Understanding the schedule grouping system"
        icon={Info}
>
    <!-- Trigger Button -->
    {#snippet trigger(props)}
        <Button
                {...props}
                variant="outline"
                size="icon"
                title="Info"
                aria-label="Info"
                class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
        >
            <Info size={20} />
        </Button>
    {/snippet}

    <!-- Content -->
    {#snippet children()}
        <div class="flex flex-col">
            <div class="p-4 mb-4 rounded-lg bg-accent/20 border border-accent/30 text-accent-foreground font-medium text-sm">
                Grouping allows you to link multiple courses together so the generator treats them as a single scheduling block!
            </div>

            <div class="gap-3 flex flex-col pb-4">
                {#each steps as item, i}
                    <DialogCard
                            number={i + 1}
                            title={item.title}
                            description={item.description}
                    />
                {/each}
            </div>
        </div>
    {/snippet}
</BaseDialog>