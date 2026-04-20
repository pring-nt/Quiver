<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import GroupCourseItem from './GroupCourseItem.svelte';

    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { buttonVariants } from '$lib/components/ui/button';
    import { EllipsisVertical, Pencil, Trash2, SquareMousePointer, ListFilter } from 'lucide-svelte';

    import type { Course, CourseGroup } from '$lib/stores/courses';

    let {
        title,
        items,
        group,
        isUngrouped = false,
        onConsider,
        onFinalize,
        onRemoveItem,
        onRenameGroup,
        onDeleteGroup,
        onUpdatePickCount
    }: {
        title: string;
        items: Course[];
        group?: CourseGroup;
        isUngrouped?: boolean;
        onConsider: (e: any) => void;
        onFinalize: (e: any) => void;
        onRemoveItem: (courseId: string) => void;
        onRenameGroup?: () => void;
        onDeleteGroup?: () => void;
        onUpdatePickCount?: (groupId: string, count: number) => void;
    } = $props();

    let isHovered = $state(false);
    let showPickEditor = $state(false); // Controls the visibility of the +/- input

    function handleConsider(e: any) {
        if (e.detail.info.trigger === 'draggedEntered') isHovered = true;
        else if (e.detail.info.trigger === 'draggedLeft') isHovered = false;
        onConsider(e);
    }

    function handleFinalize(e: any) {
        isHovered = false;
        onFinalize(e);
    }
</script>

<div class="rounded-lg border bg-card text-card-foreground shadow-sm flex min-h-[300px] w-full flex-col gap-4 p-4 transition-all hover:shadow-md {isHovered ? 'ring-2 ring-primary ring-offset-2 ring-offset-background border-primary' : ''}">

    <!-- Header with elements aligned to the center horizontally -->
    <div class="flex w-full items-center justify-between shrink-0 mb-1">
        <h3 class="truncate font-semibold text-xl pr-2" title={title}>{title}</h3>

        <!-- Right Action Area: Pick Amount + 3-Dot Menu -->
        <div class="flex items-center gap-2">

            {#if !isUngrouped && group && onUpdatePickCount}
                {#if showPickEditor}
                    <!-- We use (group.pickCount ?? 1) to gracefully fallback if old localStorage data lacks the property -->
                    <div class="flex items-center bg-accent/30 rounded border border-border/50 overflow-hidden shadow-sm h-8 animate-in fade-in slide-in-from-right-2">
                        <button
                                class="px-2 py-1 hover:bg-accent hover:text-accent-foreground disabled:opacity-30 transition-colors"
                                onclick={() => onUpdatePickCount(group.id, Math.max(1, (group.pickCount ?? 1) - 1))}
                                disabled={(group.pickCount ?? 1) <= 1}
                        >-</button>

                        <span class="w-6 text-center text-xs font-bold text-foreground bg-background py-1 border-x border-border/50">
                            {group.pickCount ?? 1}
                        </span>

                        <button
                                class="px-2 py-1 hover:bg-accent hover:text-accent-foreground disabled:opacity-30 transition-colors"
                                onclick={() => onUpdatePickCount(group.id, Math.min(Math.max(1, items.length), (group.pickCount ?? 1) + 1))}
                                disabled={(group.pickCount ?? 1) >= Math.max(1, items.length)}
                        >+</button>
                    </div>
                {:else}
                    <!-- Compact Display Badge with Fallback -->
                    <div class="text-xs font-medium text-muted-foreground bg-accent/20 px-2 h-8 flex items-center rounded-md border border-border/50" title="Pick Amount">
                        Pick: {group.pickCount ?? 1} / {Math.max(1, items.length)}
                    </div>
                {/if}
            {/if}

            <!-- 3-Dot Dropdown Menu -->
            {#if !isUngrouped && onRenameGroup && onDeleteGroup}
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger
                            class="{buttonVariants({variant:'ghost', size:'icon'})} size-8 -mr-2 text-muted-foreground hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
                    >
                        <EllipsisVertical size={18} />
                        <span class="sr-only">Group Options</span>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" class="w-48">
                        <DropdownMenu.Item onclick={() => showPickEditor = !showPickEditor} class="cursor-pointer gap-2">
                            <ListFilter size={14}/>
                            {showPickEditor ? 'Hide Pick Amount' : 'Set Pick Amount'}
                        </DropdownMenu.Item>
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
    </div>

    <!-- Drag and Drop List Area -->
    <div
            class="flex grow flex-col gap-2 min-h-[150px] outline-none relative"
            use:dndzone={{ items, flipDurationMs: 200, dropTargetStyle: {} }}
            onconsider={handleConsider}
            onfinalize={handleFinalize}
    >
        {#if items.length === 0}
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