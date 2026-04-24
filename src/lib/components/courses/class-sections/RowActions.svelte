<script lang="ts">
    import { buttonVariants } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { Ellipsis, Copy, Trash2, Pencil } from 'lucide-svelte';

    import { SectionEditDialog } from '$lib/components/courses/class-sections';
    import { coursesStore, selectedSectionsStore } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { ClassSection } from '$lib/types';

    let { course, section }: { course: Course, section: ClassSection } = $props();

    let showEditDialog = $state(false);

    function duplicateSection() {
        const newSection: ClassSection = {
            ...section,
            id: crypto.randomUUID(),
            section: `${section.section} (Copy)`,
            slots: section.slots.map(s => ({ ...s, id: crypto.randomUUID() })) // Deep clone slots
        };

        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: [...c.sections, newSection] } : c
        ));
    }

    function deleteSection() {
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: c.sections.filter(s => s.id !== section.id) } : c
        ));

        if ($selectedSectionsStore[section.id]) {
            selectedSectionsStore.update(sel => {
                const next = { ...sel };
                delete next[section.id];
                return next;
            });
        }
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger class="{buttonVariants({variant:'ghost', size:'icon'})} size-8 text-muted-foreground hover:bg-accent hover:text-foreground">
        <Ellipsis class="size-4" />
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="end" class="w-40">
        <DropdownMenu.Item onclick={() => showEditDialog = true} class="cursor-pointer gap-2 font-medium transition-colors">
            <Pencil class="size-4 text-muted-foreground" />
            Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={duplicateSection} class="cursor-pointer gap-2 font-medium transition-colors">
            <Copy class="size-4 text-muted-foreground" />
            Duplicate
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={deleteSection} class="text-destructive focus:!bg-destructive focus:!text-destructive-foreground gap-2 cursor-pointer transition-colors font-medium">
            <Trash2 class="size-4" />
            Delete
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>

<SectionEditDialog bind:open={showEditDialog} {course} sectionData={section} />