<script lang="ts">
    import {BaseDialog, DialogCard} from "$lib/components/layout/dialogs/index";
    import { Button } from '$lib/components/ui/button';
    import { BookOpen } from 'lucide-svelte';
    const steps = [
        {
            title: "Choose your favorite theme",
            description: "Click the appearance icon in the header to choose between Himmel, Frieren, Fern, and Stark. Each has its own distinct light and dark mode!"
        },
        {
            title: "Add your Courses",
            description: "Start by adding the course codes (e.g., STHCIUX) you plan to take using the sidebar on the left."
        },
        {
            title: "Configure Class Sections",
            description: "Click on any course in the sidebar to open its details. Here, you can add all the available class sections, including professors, time slots, and modalities. Check the boxes next to the sections you actually want to consider."
        },
        {
            title: "Group Alternative Courses",
            description: "Need to choose 1 elective out of 3 options? Click 'Group Courses' to link alternative subjects together so the generator treats them as a single block."
        },
        {
            title: "Share and Backup Data",
            description: "Don't want to type everything manually? Use the Data Manager icons to export your courses to a shareable link or file, or import a curriculum shared by a friend!"
        },
        {
            title: "Generate Schedules (Coming Soon!)",
            description: "Once your courses are set up and sections are selected, you'll head over to the Schedules tab to automatically generate all possible non-conflicting timetables."
        }
    ];
</script>

<BaseDialog
        title="Tutorial"
        description={"How to use the website?"}
        icon={BookOpen}
>
    <!-- The Trigger Button -->
    {#snippet trigger(props)}
        <Button
                {...props}
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