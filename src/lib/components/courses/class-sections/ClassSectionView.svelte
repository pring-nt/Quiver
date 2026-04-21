<script lang="ts">
    import { coursesStore } from '$lib/stores/courses';
    import { ClassSectionTable, SectionAddDialog }  from '$lib/components/courses/class-sections';

    let { activeCourseId }: { activeCourseId: string } = $props();

    // reacts to course list clicks or store updates
    let course = $derived($coursesStore.find(c => c.id === activeCourseId));
</script>

{#if course}
    <div class="flex flex-col h-full overflow-hidden animate-in fade-in zoom-in-[0.98] duration-300">
        <div class="p-6 pb-5 border-b border-border/50 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex flex-col gap-1.5">
                <h2 class="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
                    {course.courseCode}
                    <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground border border-border/50 uppercase tracking-wide">
                        {course.sections?.length || 0} Section{course.sections?.length === 1 ? '' : 's'}
                    </span>
                </h2>
                <p class="text-muted-foreground text-sm font-medium">
                    Manage available schedules and sections for this course. Select rows to delete multiple at once.
                </p>
            </div>

            <SectionAddDialog {course} />
        </div>

        <!-- Table Container (Flush padding to let the table card breathe) -->
        <div class="flex-grow overflow-hidden p-6 pt-6 flex flex-col min-h-0">
            <ClassSectionTable {course} />
        </div>
    </div>
{:else}
    <!-- Fallback if a course ID is invalid -->
    <div class="flex h-full items-center justify-center text-muted-foreground font-medium animate-in fade-in">
        Select a course from the sidebar to view its sections.
    </div>
{/if}