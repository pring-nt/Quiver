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
        // Strip any existing "(Copy...)" suffixes to find the true base name
        // This prevents ugly chaining like "TN12 (Copy) (Copy)"
        const baseName = section.section.replace(/\s*\(Copy.*\)$/i, '');
        let newName = `${baseName} (Copy)`;
        let counter = 1;

        const currentSections = course.sections || [];

        // Smart loop to guarantee a unique name even if duplicated multiple times
        while (currentSections.some(s => s.section.toLowerCase() === newName.toLowerCase())) {
            counter++;
            newName = `${baseName} (Copy ${counter})`;
        }

        const duplicated: ClassSection = {
            ...section,
            id: crypto.randomUUID(), // Crucial: Give the duplicate a fresh ID
            section: newName,
            slots: section.slots.map(s => ({ ...s })) // Deep copy the slots array
        };

        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: [...c.sections, duplicated] } : c
        ));
    }

    function deleteSection() {
        // 1. Remove the section from the course
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: c.sections.filter(s => s.id !== section.id) } : c
        ));

        // 2. Clean up the ghost ID from the selection memory!
        selectedSectionsStore.update(sel => {
            const next = { ...sel };
            delete next[section.id];
            return next;
        });
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger class="{buttonVariants({ variant: 'ghost', size: 'icon' })} size-8 text-muted-foreground hover:text-foreground">
        <Ellipsis size={16} />
        <span class="sr-only">Row Actions</span>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content align="end">
        <DropdownMenu.Item onclick={() => showEditDialog = true} class="gap-2 cursor-pointer">
            <Pencil size={14} /> Edit
        </DropdownMenu.Item>
        <DropdownMenu.Item onclick={duplicateSection} class="gap-2 cursor-pointer">
            <Copy size={14} /> Duplicate
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item onclick={deleteSection} class="gap-2 cursor-pointer text-destructive focus:!bg-destructive focus:!text-destructive-foreground transition-colors">
            <Trash2 size={14} /> Delete
        </DropdownMenu.Item>
    </DropdownMenu.Content>
</DropdownMenu.Root>

<SectionEditDialog bind:open={showEditDialog} {course} sectionData={section} />