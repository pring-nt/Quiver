<script lang="ts">
    import {CourseAdd, CourseList} from '$lib/components/courses';
</script>

<svelte:head>
    <title>Courses | Quiver</title>
</svelte:head>

<!-- Main Outer Container -->
<div class="flex gap-4 flex-col lg:flex-row grow px-6 py-8 lg:px-16 w-full self-stretch min-h-0 overflow-auto bg-background">

    <!-- Left Column: Add Course & Course List -->
    <div class="flex flex-col gap-4 w-full lg:w-[350px] shrink-0">
        <CourseAdd />
        <CourseList />
    </div>

    <!-- Right Column: The Big Boy Component (Class Schedule Display) -->
    <!-- flex-grow allows it to take up all remaining horizontal space on desktop -->
    <div class="flex flex-col gap-4 flex-grow w-full">

        <!-- Placeholder for the Big Boy Component -->
        <div class="rounded-lg border border-dashed border-border bg-card/50 text-card-foreground p-4 flex-grow flex items-center justify-center min-h-[500px]">
            <span class="text-muted-foreground font-medium text-sm">Class Schedule Display Component</span>
        </div>

    </div>

</div>