<script lang="ts">
    import { CourseAdd, CourseList, CourseGroupingView } from '$lib/components/courses';

    // We will import ClassSchedule here next!
    // import { ClassSchedule } from '$lib/components/courses';
</script>

<svelte:head>
    <title>Courses | Quiver</title>
</svelte:head>

<!--
    Responsive Layout Strategy:
    - On Desktop (lg): Pin height to viewport and hide main scrollbar to allow internal component scrolling.
    - On Mobile/Tablet (<lg): Allow the height to be auto and the main body to scroll so stacked components are reachable.
-->
<div class="flex gap-6 flex-col lg:flex-row w-full lg:h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden bg-background p-6">

    <!-- Left Column: Sidebar -->
    <!-- h-full is now conditional so it doesn't force a viewport-height sidebar on mobile -->
    <div class="flex flex-col gap-4 w-full lg:w-[350px] shrink-0 lg:h-full">
        <div class="shrink-0">
            <CourseAdd />
        </div>

        <!-- On mobile, we want this to show its items; on desktop, it uses its internal ScrollArea -->
        <div class="flex-grow min-h-0 lg:overflow-hidden">
            <CourseList />
        </div>
    </div>

    <!-- Right Column: Main Content -->
    <!-- We remove overflow-hidden on mobile to let it expand naturally if needed -->
    <div class="flex flex-col flex-grow w-full bg-card/30 rounded-xl border border-border/50 shadow-sm min-h-[400px] lg:h-full lg:overflow-hidden">
        <CourseGroupingView />
    </div>

</div>