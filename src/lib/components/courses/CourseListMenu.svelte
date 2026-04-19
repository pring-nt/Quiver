<script lang="ts">
    import { coursesStore } from '$lib/stores/courses';

    import { buttonVariants } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';

    import { EllipsisVertical, Trash2, CalendarOff, Layers } from 'lucide-svelte';

    let { onMassDelete }: { onMassDelete: () => void } = $props();

    let showDeleteAlert = $state(false);

    function clearAllSchedules() {
        alert("This will clear all selected class sections once the Big Boy component is hooked up!");
    }

    function deleteAllCourses() {
        $coursesStore = [];
        showDeleteAlert = false;
        onMassDelete(); // Notify parent to clear any active selections
    }
</script>

<!-- Mass Delete Confirmation Dialog-->
<AlertDialog.Root bind:open={showDeleteAlert}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
            <AlertDialog.Description>
                This will permanently delete all your added courses and clear any selected schedules associated with them.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action
                    onclick={deleteAllCourses}
                    class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete All
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>

<!-- Header Row -->
<div class="flex items-center justify-between p-4 border-b border-border bg-card">
    <h2 class="font-semibold text-lg flex items-center gap-2 text-card-foreground">
        <Layers size={20} class="text-primary" />
        Course List
    </h2>

    <!-- Three-Dot Global Actions Menu -->
    <DropdownMenu.Root>
        <DropdownMenu.Trigger class="{buttonVariants({ variant: 'outline', size: 'icon' })} h-8 w-8 hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
            <EllipsisVertical size={18} />
            <span class="sr-only">Course Options</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" class="w-56">
            <DropdownMenu.Item onclick={clearAllSchedules} class="gap-2 cursor-pointer">
                <CalendarOff size={16} />
                Clear Selected Schedules
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item
                    onclick={() => showDeleteAlert = true}
                    class="gap-2 cursor-pointer text-destructive focus:!bg-destructive focus:!text-destructive-foreground transition-colors"
            >
                <Trash2 size={16} />
                Mass Delete Courses
            </DropdownMenu.Item>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
</div>