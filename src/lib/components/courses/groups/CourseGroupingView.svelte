<script lang="ts">
    import { coursesStore, groupsStore } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import GroupContainer from './GroupContainer.svelte';
    import GroupingInfoDialog from './GroupingInfoDialog.svelte';

    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as Dialog from '$lib/components/ui/dialog';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { Plus } from 'lucide-svelte';

    // --- DnD State Syncing ---
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
        if (groupId === null) localUngrouped = e.detail.items;
        else localGroups[groupId] = e.detail.items;

        syncToStore();
        isDragging = false;
    }

    function handleRemoveFromUngrouped(courseId: string) {
        $coursesStore = $coursesStore.filter(c => c.id !== courseId);
    }

    function handleRemoveFromGroup(courseId: string) {
        $coursesStore = $coursesStore.map(c => c.id === courseId ? { ...c, groupId: undefined } : c);
    }

    function deleteGroup(groupId: string) {
        $coursesStore = $coursesStore.map(c => c.groupId === groupId ? { ...c, groupId: undefined } : c);
        $groupsStore = $groupsStore.filter(g => g.id !== groupId);
    }

    let dialogMode = $state<'add' | 'rename'>('add');
    let activeGroupId = $state<string | null>(null);
    let groupDialogName = $state("");
    let showGroupDialog = $state(false);

    function openAddGroup() {
        dialogMode = 'add';
        groupDialogName = '';
        showGroupDialog = true;
    }

    function openRenameGroup(group: {id: string, name: string}) {
        dialogMode = 'rename';
        activeGroupId = group.id;
        groupDialogName = group.name;
        showGroupDialog = true;
    }

    function saveGroup() {
        if (!groupDialogName.trim()) return;
        if (dialogMode === 'add') {
            $groupsStore = [...$groupsStore, { id: crypto.randomUUID(), name: groupDialogName.trim() }];
        } else if (dialogMode === 'rename' && activeGroupId) {
            $groupsStore = $groupsStore.map(g => g.id === activeGroupId ? { ...g, name: groupDialogName.trim() } : g);
        }
        showGroupDialog = false;
    }
</script>

<Dialog.Root bind:open={showGroupDialog}>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>{dialogMode === 'add' ? 'Create New Group' : 'Rename Group'}</Dialog.Title>
            <Dialog.Description>
                {dialogMode === 'add' ? 'Give your new course group a name. (e.g. GEs, Clankers, Electives)' : 'Update the name for this group.'}
            </Dialog.Description>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <Input
                    id="name"
                    placeholder="e.g. GEs..."
                    bind:value={groupDialogName}
                    onkeydown={(e) => e.key === 'Enter' && saveGroup()}
            />
        </div>
        <Dialog.Footer>
            <Button variant="outline" onclick={() => showGroupDialog = false}>Cancel</Button>
            <Button onclick={saveGroup}>{dialogMode === 'add' ? 'Create' : 'Save Changes'}</Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<div class="flex flex-col h-full overflow-hidden">
    <!-- Fixed Header inside the view -->
    <div class="p-6 pb-4 border-b border-border/50 shrink-0">
        <div class="flex items-center gap-2">
            <h2 class="text-2xl font-bold tracking-tight">Group Courses</h2>
            <GroupingInfoDialog />
        </div>
        <p class="text-muted-foreground text-sm">
            Drag and drop courses to group them together.
        </p>
    </div>

    <!-- Scrollable Grid Content -->
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
                            onConsider={(e) => handleConsider(group.id, e)}
                            onFinalize={(e) => handleFinalize(group.id, e)}
                            onRemoveItem={handleRemoveFromGroup}
                            onRenameGroup={() => openRenameGroup(group)}
                            onDeleteGroup={() => deleteGroup(group.id)}
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