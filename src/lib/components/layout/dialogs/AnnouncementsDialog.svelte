<script lang="ts">
    import {BaseDialog, DialogCard} from "$lib/components/layout/dialogs/index";
    import { Button } from '$lib/components/ui/button';
    import { Megaphone } from 'lucide-svelte';

    const announcements = [
        {
            title: "Courses Page is Fully Functional!",
            description: "The Courses page is now completely functional! You can fully customize your courses and the class sections within them, and easily share or backup your progress using the new import and export data functionality."
        },
        {
            title: "Custom Frieren: Beyond Journey's End Themes!",
            description: "Choose between Himmel, Frieren, Fern, and Stark to change the site appearance. " +
                "Each with their own respective dark modes"
        },
    ];
</script>

<BaseDialog
        title="Let there be light"
        description={"I'm starting trying out svelte by developing this schedule builder webapp inspired from Schedaddle!"}
        icon={Megaphone}
>
    <!-- The Trigger Button -->
    {#snippet trigger(props)}
        <Button
                {...props}
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