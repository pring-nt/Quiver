<script lang="ts">
    import { coursesStore, groupsStore, groupNameSchema } from '$lib/stores/courses';
    import type { Course, CourseGroup } from '$lib/stores/courses';
    import GroupContainer from './GroupContainer.svelte';
    import GroupingInfoDialog from './GroupingInfoDialog.svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as Dialog from '$lib/components/ui/dialog';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { Plus, CircleAlert } from 'lucide-svelte';

    let isDragging = $state(false);
    let localUngrouped = $state<Course[]>([]);
    let localGroups = $state<Record<string, Course[]>>({});

    $effect(() => {
        if (isDragging) return;

        localUngrouped = $coursesStore.filter(c => !c.groupId);
        let groupsMap: Record<string, Course[]> = {};
        $groupsStore.forEach(g => {
            groupsMap[g.id] = $coursesStore.filter(c => c.groupId === g.id);
        });
        localGroups = groupsMap;
    });

    function syncToStore() {
        let allCourses: Course[] = [...localUngrouped.map(c => ({...c, groupId: undefined}))];
        for (const [gId, items] of Object.entries(localGroups)) {
            allCourses.push(...items.map(c => ({...c, groupId: gId})));
        }
        $coursesStore = allCourses;
    }

    function handleConsider(groupId: string | null, e: any) {
        isDragging = true;
        if (groupId === null) localUngrouped = e.detail.items;
        else localGroups[groupId] = e.detail.items;
    }

    function handleFinalize(groupId: string | null, e: any) {
        if (groupId === null) {
            localUngrouped = e.detail.items;
        } else {
            localGroups[groupId] = e.detail.items;

            // Constrain pick count automatically if we removed items by dragging out
            const group = $groupsStore.find(g => g.id === groupId);
            if (group) {
                const maxAllowed = Math.max(1, localGroups[groupId].length);
                if (group.pickCount > maxAllowed) {
                    $groupsStore = $groupsStore.map(g => g.id === groupId ? { ...g, pickCount: maxAllowed } : g);
                }
            }
        }

        syncToStore();
        isDragging = false;
    }

    function handleRemoveFromUngrouped(courseId: string) {
        $coursesStore = $coursesStore.filter(c => c.id !== courseId);
    }

    function handleRemoveFromGroup(courseId: string) {
        const course = $coursesStore.find(c => c.id === courseId);
        if (!course || !course.groupId) return;

        const groupId = course.groupId;
        $coursesStore = $coursesStore.map(c => c.id === courseId ? { ...c, groupId: undefined } : c);

        // Items length is now 1 less. Constrain pick count automatically to prevent invalid state
        const groupItemsCount = $coursesStore.filter(c => c.groupId === groupId).length;
        const group = $groupsStore.find(g => g.id === groupId);
        if (group && group.pickCount > Math.max(1, groupItemsCount)) {
            $groupsStore = $groupsStore.map(g => g.id === groupId ? { ...g, pickCount: Math.max(1, groupItemsCount) } : g);
        }
    }

    function deleteGroup(groupId: string) {
        $coursesStore = $coursesStore.map(c => c.groupId === groupId ? { ...c, groupId: undefined } : c);
        $groupsStore = $groupsStore.filter(g => g.id !== groupId);
    }

    function updateGroupPickCount(groupId: string, newCount: number) {
        $groupsStore = $groupsStore.map(g => g.id === groupId ? { ...g, pickCount: newCount } : g);
    }

    // --- Dialog Validation & State ---
    let dialogMode = $state<'add' | 'rename'>('add');
    let activeGroupId = $state<string | null>(null);
    let groupDialogName = $state("");
    let groupDialogError = $state<string | null>(null);
    let showGroupDialog = $state(false);

    function openAddGroup() {
        dialogMode = 'add';
        groupDialogName = '';
        groupDialogError = null;
        showGroupDialog = true;
    }

    function openRenameGroup(group: CourseGroup) {
        dialogMode = 'rename';
        activeGroupId = group.id;
        groupDialogName = group.name;
        groupDialogError = null;
        showGroupDialog = true;
    }

    function saveGroup() {
        groupDialogError = null;

        // 1. Validate length and format using Zod
        const parsed = groupNameSchema.safeParse(groupDialogName);
        if (!parsed.success) {
            groupDialogError = parsed.error.issues[0].message;
            return;
        }

        const validName = parsed.data;

        // 2. Uniqueness Validation
        const isDuplicate = $groupsStore.some(g => g.name.toLowerCase() === validName.toLowerCase() && g.id !== activeGroupId);
        if (isDuplicate) {
            groupDialogError = `A group named "${validName}" already exists.`;
            return;
        }

        // 3. Save successfully
        if (dialogMode === 'add') {
            // We now include the required sectionIds array to satisfy your CourseGroup type!
            $groupsStore = [...$groupsStore, {
                id: crypto.randomUUID(),
                name: validName,
                pickCount: 1,
                sectionIds: []
            }];
        } else if (dialogMode === 'rename' && activeGroupId) {
            $groupsStore = $groupsStore.map(g => g.id === activeGroupId ? { ...g, name: validName } : g);
        }
        showGroupDialog = false;
    }
</script>

<Dialog.Root bind:open={showGroupDialog}>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>{dialogMode === 'add' ? 'Create New Group' : 'Rename Group'}</Dialog.Title>
            <Dialog.Description>
                {dialogMode === 'add' ? 'Give your new course group a unique name (Max 20 chars).' : 'Update the name for this group.'}
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <Input
                    id="name"
                    placeholder="e.g. GEs..."
                    bind:value={groupDialogName}
                    class={groupDialogError ? 'border-destructive focus-visible:ring-destructive' : ''}
                    onkeydown={(e) => e.key === 'Enter' && saveGroup()}
            />
            {#if groupDialogError}
                <div class="flex items-center gap-1.5 text-sm text-destructive font-medium animate-in slide-in-from-top-1">
                    <CircleAlert size={14} />
                    <span>{groupDialogError}</span>
                </div>
            {/if}
        </div>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => showGroupDialog = false}>Cancel</Button>
            <Button onclick={saveGroup}>{dialogMode === 'add' ? 'Create' : 'Save Changes'}</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<div class="flex flex-col h-full overflow-hidden">
    <div class="p-6 pb-4 border-b border-border/50 shrink-0">
        <div class="flex items-center gap-2">
            <h2 class="text-2xl font-bold tracking-tight">Group Courses</h2>
            <GroupingInfoDialog />
        </div>
        <p class="text-muted-foreground text-sm">
            Drag and drop courses to group them together.
        </p>
    </div>

    <div class="flex-grow overflow-hidden">
        <ScrollArea class="h-full">
            <div class="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 auto-rows-max p-6 pb-8">
                <GroupContainer
                        title="Ungrouped"
                        isUngrouped={true}
                        items={localUngrouped}
                        onConsider={(e) => handleConsider(null, e)}
                        onFinalize={(e) => handleFinalize(null, e)}
                        onRemoveItem={handleRemoveFromUngrouped}
                />

                {#each $groupsStore as group (group.id)}
                    <GroupContainer
                            title={group.name}
                            items={localGroups[group.id] || []}
                            group={group}
                            onConsider={(e) => handleConsider(group.id, e)}
                            onFinalize={(e) => handleFinalize(group.id, e)}
                            onRemoveItem={handleRemoveFromGroup}
                            onRenameGroup={() => openRenameGroup(group)}
                            onDeleteGroup={() => deleteGroup(group.id)}
                            onUpdatePickCount={updateGroupPickCount}
                    />
                {/each}

                <div
                        role="button"
                        tabindex="0"
                        class="rounded-lg border-2 border-dashed border-border bg-card/30 text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-all duration-300 flex min-h-[300px] w-full flex-col items-center justify-center gap-3 p-4 group cursor-pointer"
                        onclick={openAddGroup}
                        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && openAddGroup()}
                >
                    <div class="p-3 bg-muted rounded-full group-hover:bg-primary/20 transition-colors">
                        <Plus size={32} class="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <span class="font-medium text-lg">Create New Group</span>
                </div>
            </div>
        </ScrollArea>
    </div>
</div>