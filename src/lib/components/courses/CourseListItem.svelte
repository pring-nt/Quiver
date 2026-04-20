<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { GripVertical, X } from 'lucide-svelte';
    import type { Course } from '$lib/stores/courses';

    let {
        course,
        isActive,
        onSelect,
        onDelete
    }: {
        course: Course;
        isActive: boolean;
        onSelect: () => void;
        onDelete: () => void;
    } = $props();
</script>

<div class="flex items-center gap-2 group w-full">
    <!-- Drag Handle -->
    <div
            class="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary transition-colors p-1"
            title="Reorder"
    >
        <GripVertical size={16} />
    </div>

    <!-- Main Course Container -->
    <div
            class="flex-grow flex items-center gap-3 py-2 px-3 rounded-md border transition-all cursor-pointer {isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30'}"
            onclick={onSelect}
            onkeydown={(e) => e.key === 'Enter' && onSelect()}
            role="button"
            tabindex="0"
    >
        <!-- Course Identifier -->
        <div class="flex-grow font-bold tracking-tight text-sm text-card-foreground leading-tight">
            {course.courseCode}
            {#if course.groupId}
                <span class="ml-2 text-[9px] uppercase font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full">
                    Grouped
                </span>
            {/if}
        </div>
    </div>

    <!-- Delete Button -->
    <Button
            variant="outline"
            size="icon"
            title="Remove Course"
            class="size-9 shrink-0 border-border bg-card text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/50 transition-all"
            onclick={(e) => { e.stopPropagation(); onDelete(); }}
    >
        <X size={16} />
    </Button>
</div>