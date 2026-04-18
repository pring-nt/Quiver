<script lang="ts">
    import {BaseDialog, DialogCard} from "$lib/components/layout/dialogs/index";
    import { Button } from '$lib/components/ui/button';
    import { Megaphone } from 'lucide-svelte';
    const announcements = [
        {
            title: "Custom Sousou no Frieren Themes!",
            description: "Choose between Himmel, Frieren, Fern, and Stark to change the site appearance. " +
                         "Each with their own respective dark modes"
        },
        {
            title: "The Announcements Dialog Itself",
            description: "You wouldn't see this if I didn't implement this yet LOL"
        }
    ];
</script>

<BaseDialog
        title="Let there be light"
        description={"I'm starting trying out svelte by developing this schedule builder webapp inspired from Schedaddle!"}
        icon={Megaphone}
>
    <!-- The Trigger Button -->
    {#snippet trigger()}
        <Button
                variant="outline"
                size="icon"
                title="Announcements"
                aria-label="Announcements"
                class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
        >
            <Megaphone size={20} />
        </Button>
    {/snippet}

    <!-- The Content -->
    <div class="gap-4 flex flex-col pb-4">
        {#each announcements as item, i}
            <DialogCard
                    number={i + 1}
                    title={item.title}
                    description={item.description}
            />
        {/each}
    </div>
</BaseDialog>