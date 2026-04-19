<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { GripVertical, Trash2 } from 'lucide-svelte';
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

<div
        class="group flex items-center gap-3 p-3 rounded-md border transition-all cursor-pointer {isActive ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/30'}"
        onclick={onSelect}
        onkeydown={(e) => e.key === 'Enter' && onSelect()}
        role="button"
        tabindex="0"
>
    <!-- Drag Handle -->
    <div class="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
        <GripVertical size={18} />
    </div>

    <!-- Course Identifier -->
    <div class="flex-grow font-bold tracking-tight text-sm text-card-foreground">
        {course.courseCode}
        {#if course.groupId}
            <span class="ml-2 text-[10px] uppercase font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                Grouped
            </span>
        {/if}
    </div>

    <!-- Item Actions (Hidden until hover) -->
    <div class="flex opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <Button
                variant="ghost"
                size="icon"
                title="Delete Course"
                class="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onclick={(e) => { e.stopPropagation(); onDelete(); }}
        >
            <Trash2 size={16} />
        </Button>
    </div>
</div>