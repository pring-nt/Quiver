<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import GroupCourseItem from './GroupCourseItem.svelte';

    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { buttonVariants } from '$lib/components/ui/button';
    import { EllipsisVertical, Pencil, Trash2, SquareMousePointer } from 'lucide-svelte';

    import type { Course } from '$lib/stores/courses';

    let {
        title,
        items,
        isUngrouped = false,
        onConsider,
        onFinalize,
        onRemoveItem,
        onRenameGroup,
        onDeleteGroup
    }: {
        title: string;
        items: Course[];
        isUngrouped?: boolean;
        onConsider: (e: any) => void;
        onFinalize: (e: any) => void;
        onRemoveItem: (courseId: string) => void;
        onRenameGroup?: () => void;
        onDeleteGroup?: () => void;
    } = $props();

    // Local state to track if an item is currently being dragged *over* this specific container
    let isHovered = $state(false);

    // Wrapper functions to intercept the dnd events and update our local hover state
    function handleConsider(e: any) {
        if (e.detail.info.trigger === 'draggedEntered') {
            isHovered = true;
        } else if (e.detail.info.trigger === 'draggedLeft') {
            isHovered = false;
        }

        onConsider(e);
    }

    function handleFinalize(e: any) {
        isHovered = false;
        onFinalize(e);
    }
</script>

<div class="rounded-lg border bg-card text-card-foreground shadow-sm flex min-h-[300px] w-full flex-col gap-4 p-4 transition-all hover:shadow-md {isHovered ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' : ''}">
    <!-- Header -->
    <div class="flex w-full items-center justify-between h-8 shrink-0">
        <h3 class="truncate font-semibold text-xl">{title}</h3>

        <!-- Only render the 3-dot menu if it's a true Group -->
        {#if !isUngrouped && onRenameGroup && onDeleteGroup}
            <DropdownMenu.Root>
                <DropdownMenu.Trigger
                        class="{buttonVariants({variant:'ghost', size:'icon'})} size-8 -mr-2 text-muted-foreground hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
                >
                    <EllipsisVertical size={18} />
                    <span class="sr-only">Group Options</span>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="w-48">
                    <DropdownMenu.Item onclick={onRenameGroup} class="cursor-pointer gap-2">
                        <Pencil size={14}/>
                        Rename Group
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Item onclick={onDeleteGroup} class="cursor-pointer gap-2 text-destructive focus:!bg-destructive focus:!text-destructive-foreground transition-colors">
                        <Trash2 size={14}/>
                        Delete Group
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        {/if}
    </div>

    <!-- Drag and Drop List Area -->
    <div
            class="flex grow flex-col gap-2 min-h-[150px] outline-none relative"
            use:dndzone={{ items, flipDurationMs: 200, dropTargetStyle: {} }}
            onconsider={handleConsider}
            onfinalize={handleFinalize}
    >
        {#if items.length === 0}
            <!-- Empty State Placeholder taking up the entire space -->
            <div class="absolute inset-0 pointer-events-none">
                <div class="w-full h-full flex flex-col gap-2 items-center justify-center text-sm font-medium text-muted-foreground/50 border-2 border-dashed border-border/50 rounded-lg">
                    <SquareMousePointer size={28} class="opacity-50" />
                    <span>Drag & Drop Courses here</span>
                </div>
            </div>
        {/if}

        {#each items as item (item.id)}
            <div class="outline-none focus:outline-none z-10">
                <GroupCourseItem
                        course={item}
                        onRemove={() => onRemoveItem(item.id)}
                />
            </div>
        {/each}
    </div>
</div>