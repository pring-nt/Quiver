<script lang="ts">
    import { CourseAdd, CourseList, CourseGroupingView, ClassSectionView } from '$lib/components/courses';

    // This state connects the CourseList sidebar to the main view area.
    // 'grouping' = Grouping View
    // <id> = Class Section View for a specific course
    // null = Class Section View fallback (Nothing selected)
    let activeCourseId = $state<string | 'grouping' | null>(null);
</script>

<svelte:head>
    <title>Courses | Quiver</title>
</svelte:head>

<!--
    Responsive Layout Strategy:
    - Mobile: Height is 'auto' with a minimum height, allowing the page to grow as long as the stacked components.
    - Desktop (lg): Height is '100%' of the available main container, locking the page and using internal scrolling.
-->
<div class="
    flex flex-col lg:flex-row
    gap-6 w-full p-4 sm:p-6
    bg-background
    /* Mobile styles */
    h-auto min-h-[calc(100vh-80px)] overflow-y-visible
    /* Desktop styles */
    lg:h-full lg:min-h-0 lg:overflow-hidden
">

    <!-- Left Column: Fixed Width Sidebar -->
    <div class="flex flex-col gap-4 w-full lg:w-[350px] shrink-0 lg:h-full">
        <div class="shrink-0">
            <CourseAdd />
        </div>

        <div class="flex-grow lg:overflow-hidden">
            <!--
                Bind the active state so the sidebar can control the right panel.
                This acts like our "tabs" controller!
            -->
            <CourseList bind:activeCourseId />
        </div>
    </div>

    <!-- Right Column: The Fluid Container -->
    <div class="
        flex flex-col flex-grow w-full
        bg-card/30 rounded-xl border border-border/50 shadow-sm
        /* Ensure it doesn't vanish on mobile and fills space on desktop */
        min-h-[500px] lg:min-h-0 lg:h-full lg:overflow-hidden relative
    ">
        {#if activeCourseId === 'grouping'}
            <CourseGroupingView />
        {:else}
            <ClassSectionView {activeCourseId} />
        {/if}
    </div>

</div>