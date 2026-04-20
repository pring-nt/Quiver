<script lang="ts">
    import { X } from 'lucide-svelte';
    import type { Course } from '$lib/stores/courses';

    let {
        course,
        onRemove
    }: {
        course: Course;
        onRemove: () => void;
    } = $props();
</script>

<div
        role="button"
        tabindex="0"
        class="inline-flex items-center w-full whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-grab justify-between transition-colors shadow-sm"
>
    <span class="truncate">{course.courseCode}</span>

    <!-- e.stopPropagation() here so clicking delete doesn't accidentally trigger a drag event -->
    <button
            type="button"
            class="group flex size-6 cursor-pointer select-none items-center justify-center rounded-lg opacity-40 transition-colors hover:bg-destructive hover:text-destructive-foreground hover:opacity-100 -mr-1"
            onclick={(e) => { e.stopPropagation(); onRemove(); }}
            title="Remove"
            aria-label="Remove {course.courseCode}"
    >
        <X size={16} strokeWidth={3} aria-hidden="true" />
    </button>
</div>