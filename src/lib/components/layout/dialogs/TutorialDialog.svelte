<script lang="ts">
    import {BaseDialog, DialogCard} from "$lib/components/layout/dialogs/index";
    import { Button } from '$lib/components/ui/button';
    import { BookOpen } from 'lucide-svelte';
    const steps = [
        {
            title: "Choose your favorite theme",
            description: "Choose between Himmel, Frieren, Fern, and Stark to change the site appearance. " +
                "Each with their own respective dark modes"
        },
        {
            title: "Pfft idk",
            description: "I haven't done the rest of the website yet lol"
        }
    ];
</script>

<BaseDialog
        title="Tutorial"
        description={"How to use the website?"}
        icon={BookOpen}
>
    <!-- The Trigger Button -->
    {#snippet trigger()}
        <Button
                variant="outline"
                size="icon"
                title="Tutorial"
                aria-label="Tutorial"
                class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
        >
            <BookOpen size={20} />
        </Button>
    {/snippet}

    <!-- The Content -->
    <div class="gap-4 flex flex-col pb-4">
        {#each steps as item, i}
            <DialogCard
                    number={i + 1}
                    title={item.title}
                    description={item.description}
            />
        {/each}
    </div>
</BaseDialog>