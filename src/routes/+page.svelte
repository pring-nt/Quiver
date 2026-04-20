<script lang="ts">
    import { CourseAdd, CourseList, CourseGroupingView } from '$lib/components/courses';

    // We will import ClassSchedule here next!
    // import { ClassSchedule } from '$lib/components/courses';
</script>

<svelte:head>
    <title>Courses | Quiver</title>
</svelte:head>

<!--
    Layout Strategy:
    - h-[calc(100vh-64px)]: Assumes header is roughly 64px. This pins the height to the viewport.
    - overflow-hidden: Prevents the whole body from scrolling.
-->
<div class="flex gap-6 flex-col lg:flex-row w-full h-[calc(100vh-64px)] overflow-hidden bg-background p-6">

    <!-- Left Column: Fixed Width Sidebar -->
    <div class="flex flex-col gap-4 w-full lg:w-[350px] shrink-0 h-full">
        <div class="shrink-0">
            <CourseAdd />
        </div>

        <div class="flex-grow overflow-hidden">
            <CourseList />
        </div>
    </div>

    <!-- Right Column: The Fluid Container for Course Grouping and Schedules -->
    <div class="flex flex-col flex-grow w-full bg-card/30 rounded-xl border border-border/50 shadow-sm overflow-hidden">
        <CourseGroupingView />
    </div>

</div>