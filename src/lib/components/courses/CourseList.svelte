<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import { coursesStore } from '$lib/stores/courses';

    import { Button } from '$lib/components/ui/button';
    import { BookX, Link } from 'lucide-svelte';


    import {CourseListMenu, CourseListItem} from '$lib/components/courses'

    const flipDurationMs = 200;

    // State to track which course the user clicked on to view in the Big Boy Component
    let activeCourseId = $state<string | null>(null);

    // Drag and Drop Handlers
    function handleDndConsider(e: any) {
        $coursesStore = e.detail.items;
    }

    function handleDndFinalize(e: any) {
        $coursesStore = e.detail.items;
    }

    // Actions
    function deleteCourse(id: string) {
        $coursesStore = $coursesStore.filter(c => c.id !== id);
        if (activeCourseId === id) activeCourseId = null;
    }
</script>

<div class="flex flex-col flex-grow bg-card/50 border border-border rounded-lg overflow-hidden shadow-sm h-full max-h-[500px] lg:max-h-full">

    <!-- Extracted Header & Dialogs -->
    <CourseListMenu onMassDelete={() => activeCourseId = null} />

    <!-- Group Courses Action Row -->
    <div class="px-4 pt-4">
        <Button
                variant="default"
                class="w-full gap-2 shadow-sm font-medium"
                onclick={() => alert("Grouping feature UI coming soon!")}
        >
            <Link size={16} />
            Group Courses
        </Button>
    </div>

    <!-- Scrollable Course List -->
    <div class="flex-grow overflow-y-auto p-4">

        <!-- Drag and Drop Zone -->
        <section
                use:dndzone={{ items: $coursesStore, flipDurationMs }}
                onconsider={handleDndConsider}
                onfinalize={handleDndFinalize}
                class="min-h-[50px] flex flex-col gap-2 outline-none"
        >
            {#each $coursesStore as course (course.id)}
                <div class="outline-none">
                    <CourseListItem
                            {course}
                            isActive={activeCourseId === course.id}
                            onSelect={() => activeCourseId = course.id}
                            onDelete={() => deleteCourse(course.id)}
                    />
                </div>
            {/each}
        </section>

        <!-- Empty State -->
        {#if $coursesStore.length === 0}
            <div class="flex flex-col items-center justify-center h-40 text-muted-foreground gap-2 animate-in fade-in zoom-in-95 duration-500">
                <BookX size={32} class="opacity-50" />
                <p class="text-sm font-medium">No courses added yet.</p>
            </div>
        {/if}
    </div>
</div>