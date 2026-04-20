<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import { coursesStore } from '$lib/stores/courses';
    import { CourseListMenu, CourseListItem } from '$lib/components/courses';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { Button } from '$lib/components/ui/button';
    import { BookX, Link } from 'lucide-svelte';

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


<div class="flex flex-col h-full bg-card/50 border border-border rounded-xl overflow-hidden shadow-sm">
    <CourseListMenu onMassDelete={() => activeCourseId = null} />

    <!-- Group Courses Action Row -->
    <div class="px-4 pt-4">
        <Button
                variant="default"
                class="w-full gap-2 shadow-sm font-medium"
                onclick={() => alert("Grouping feature UI is active in the main view!")}
        >
            <Link size={16} />
            Group Courses
        </Button>
    </div>

    <!-- Scrollable Content Area -->
    <div class="flex-grow overflow-hidden mt-2">
        <ScrollArea class="h-full px-4 pb-4">
            <!-- Drag and Drop Zone -->
            <section
                    use:dndzone={{ items: $coursesStore, flipDurationMs, type: 'course-sidebar' }}
                    onconsider={handleDndConsider}
                    onfinalize={handleDndFinalize}
                    class="min-h-[50px] flex flex-col gap-2 outline-none py-2"
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
                <div class="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 animate-in fade-in zoom-in-95 duration-500">
                    <BookX size={32} class="opacity-50" />
                    <p class="text-sm font-medium">No courses added yet.</p>
                </div>
            {/if}
        </ScrollArea>
    </div>
</div>