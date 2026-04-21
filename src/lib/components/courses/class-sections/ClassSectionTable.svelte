<script lang="ts">
    import {
        createTable,
        getCoreRowModel,
        getSortedRowModel,
        getFilteredRowModel,
        type SortingState
    } from '@tanstack/table-core';

    // UI Components
    import * as Table from '$lib/components/ui/table';
    import { Checkbox } from '$lib/components/ui/checkbox';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

    // Icons
    import ArrowUpDown from 'lucide-svelte/icons/arrow-up-down';
    import ArrowUp from 'lucide-svelte/icons/arrow-up';
    import ArrowDown from 'lucide-svelte/icons/arrow-down';
    import Trash2 from 'lucide-svelte/icons/trash-2';
    import CalendarX2 from 'lucide-svelte/icons/calendar-x-2';
    import Ellipsis from 'lucide-svelte/icons/ellipsis';
    import Search from 'lucide-svelte/icons/search';
    import Copy from 'lucide-svelte/icons/copy';
    import X from 'lucide-svelte/icons/x';

    // Filter Icons
    import TableOfContents from 'lucide-svelte/icons/table-of-contents';
    import User from 'lucide-svelte/icons/user';
    import Clock from 'lucide-svelte/icons/clock';
    import Calendar from 'lucide-svelte/icons/calendar';
    import Monitor from 'lucide-svelte/icons/monitor';

    import { coursesStore } from '$lib/stores/courses';
    import type { Course } from '$lib/stores/courses';
    import type { DaySlot, ClassSection } from '$lib/types';

    let { course }: { course: Course } = $props();

    // Table State
    let sorting = $state<SortingState>([]);
    let rowSelection = $state<Record<string, boolean>>({});
    let globalFilter = $state('');

    // Faceted Filter States
    let activeSections = $state<string[]>([]);
    let activeProfessors = $state<string[]>([]);
    let activeDays = $state<string[]>([]);
    let activeSchedules = $state<string[]>([]);
    let activeModalities = $state<string[]>([]);

    // Dynamically extract unique values for the dropdowns (from the raw course data)
    let uniqueSections = $derived([...new Set(course.sections?.map(s => s.section) || [])].sort());
    let uniqueProfessors = $derived([...new Set(course.sections?.map(s => s.professor).filter(Boolean) || [])].sort());
    let uniqueDays = ['M', 'T', 'W', 'Th', 'F', 'S', 'Su'];
    let uniqueSchedules = $derived([...new Set(course.sections?.flatMap(s => getSchedules(s.slots)) || [])].sort());
    let uniqueModalities = $derived([...new Set(course.sections?.map(s => s.modality).filter(Boolean) || [])].sort());

    // Native Svelte 5 Filtering Logic
    let filteredSections = $derived((course.sections || []).filter(sec => {
        if (activeSections.length > 0 && !activeSections.includes(sec.section)) return false;
        if (activeProfessors.length > 0 && !activeProfessors.includes(sec.professor)) return false;
        if (activeModalities.length > 0 && !activeModalities.includes(sec.modality)) return false;
        if (activeDays.length > 0) {
            const secDays = sec.slots.map(s => s.day);
            if (!activeDays.some(d => secDays.includes(d))) return false;
        }
        if (activeSchedules.length > 0) {
            const secScheds = getSchedules(sec.slots);
            if (!activeSchedules.some(s => secScheds.includes(s))) return false;
        }
        return true;
    }));

    function toggleFilter(list: string[], value: string) {
        return list.includes(value) ? list.filter(v => v !== value) : [...list, value];
    }

    function clearFilters() {
        activeSections = [];
        activeProfessors = [];
        activeDays = [];
        activeSchedules = [];
        activeModalities = [];
        globalFilter = '';
    }

    // Column Definitions
    const columns = [
        { id: 'select', enableSorting: false },
        { accessorKey: 'section', enableSorting: true },
        { accessorKey: 'professor', enableSorting: true },
        { id: 'schedule', enableSorting: false, accessorFn: (row: any) => getSchedules(row.slots).join(', ') },
        { id: 'room', enableSorting: false, accessorFn: (row: any) => getRooms(row.slots) },
        { id: 'days', enableSorting: false, accessorFn: (row: any) => getDays(row.slots) },
        { accessorKey: 'remarks', enableSorting: false },
        { id: 'actions', enableSorting: false }
    ];

    let tableOptions = $derived({
        data: filteredSections,
        columns,
        state: { sorting, rowSelection, globalFilter },
        onSortingChange: (updater: any) => { sorting = typeof updater === 'function' ? updater(sorting) : updater; },
        onRowSelectionChange: (updater: any) => { rowSelection = typeof updater === 'function' ? updater(rowSelection) : updater; },
        onGlobalFilterChange: (updater: any) => { globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater; },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getRowId: (row: any) => row.id,
        enableRowSelection: true,
        onStateChange: () => {},
        renderFallbackValue: null
    });

    let table = $derived(createTable(tableOptions));

    // --- Formatting Helpers ---
    function formatTime12hr(time: string) {
        if (!time) return '';
        const [h, m] = time.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${m} ${ampm}`;
    }

    function getSchedules(slots: DaySlot[]) {
        if (!slots || slots.length === 0) return [];
        const times = new Set<string>();
        slots.forEach(s => times.add(`${formatTime12hr(s.startTime)} - ${formatTime12hr(s.endTime)}`));
        return Array.from(times);
    }

    function getDays(slots: DaySlot[]) {
        if (!slots || slots.length === 0) return '-';
        return Array.from(new Set(slots.map(s => s.day))).join('/');
    }

    function getRooms(slots: DaySlot[]) {
        if (!slots || slots.length === 0) return '-';
        const rooms = slots.map(s => s.room).filter(Boolean);
        return rooms.length > 0 ? Array.from(new Set(rooms)).join(', ') : '-';
    }

    // --- Actions ---
    function duplicateSection(section: ClassSection) {
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

    function deleteSection(sectionId: string) {
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: c.sections.filter(s => s.id !== sectionId) } : c
        ));
        if (rowSelection[sectionId]) {
            const newSelection = { ...rowSelection };
            delete newSelection[sectionId];
            rowSelection = newSelection;
        }
    }

    function massDeleteSelected() {
        const idsToDelete = Object.keys(rowSelection);
        coursesStore.update(all => all.map(c =>
            c.id === course.id ? { ...c, sections: c.sections.filter(s => !idsToDelete.includes(s.id)) } : c
        ));
        rowSelection = {};
    }
</script>

<div class="rounded-xl border border-border/50 bg-card/60 shadow-sm flex flex-col h-full overflow-hidden relative backdrop-blur-sm">

    <!-- Action & Filter Bar -->
    <div class="p-3 border-b border-border/50 bg-background/30 flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
        <div class="relative w-full sm:max-w-[250px] shrink-0">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
                    placeholder="Search sections..."
                    bind:value={globalFilter}
                    class="pl-9 h-8 bg-background shadow-sm transition-colors focus-visible:bg-background text-sm"
            />
        </div>

        <!-- Filter Elements matching the requested HTML structure -->
        <div class="flex flex-1 flex-wrap items-center gap-2">
            <!-- Section Filter -->
            <DropdownMenu.Root>
                <DropdownMenu.Trigger class="{buttonVariants({variant: 'outline', size: 'sm'})} h-8 text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground px-3">
                    <TableOfContents class="mr-2 size-4" /> Section
                    {#if activeSections.length > 0}
                        <span class="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 font-bold text-secondary-foreground text-[10px]">
                            {activeSections.length}
                        </span>
                    {/if}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="w-[200px] max-h-[300px] overflow-y-auto">
                    {#each uniqueSections as opt}
                        <DropdownMenu.CheckboxItem checked={activeSections.includes(opt)} onCheckedChange={() => activeSections = toggleFilter(activeSections, opt)}>
                            {opt}
                        </DropdownMenu.CheckboxItem>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            <!-- Professor Filter -->
            <DropdownMenu.Root>
                <DropdownMenu.Trigger class="{buttonVariants({variant: 'outline', size: 'sm'})} h-8 text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground px-3">
                    <User class="mr-2 size-4" /> Professor
                    {#if activeProfessors.length > 0}
                        <span class="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 font-bold text-secondary-foreground text-[10px]">
                            {activeProfessors.length}
                        </span>
                    {/if}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="w-[220px] max-h-[300px] overflow-y-auto">
                    {#each uniqueProfessors as opt}
                        <DropdownMenu.CheckboxItem checked={activeProfessors.includes(opt)} onCheckedChange={() => activeProfessors = toggleFilter(activeProfessors, opt)}>
                            {opt}
                        </DropdownMenu.CheckboxItem>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            <!-- Schedules Filter -->
            <DropdownMenu.Root>
                <DropdownMenu.Trigger class="{buttonVariants({variant: 'outline', size: 'sm'})} h-8 text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground px-3">
                    <Clock class="mr-2 size-4" /> Schedules
                    {#if activeSchedules.length > 0}
                        <span class="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 font-bold text-secondary-foreground text-[10px]">
                            {activeSchedules.length}
                        </span>
                    {/if}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="w-[200px] max-h-[300px] overflow-y-auto">
                    {#each uniqueSchedules as opt}
                        <DropdownMenu.CheckboxItem checked={activeSchedules.includes(opt)} onCheckedChange={() => activeSchedules = toggleFilter(activeSchedules, opt)}>
                            {opt}
                        </DropdownMenu.CheckboxItem>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            <!-- Days Filter -->
            <DropdownMenu.Root>
                <DropdownMenu.Trigger class="{buttonVariants({variant: 'outline', size: 'sm'})} h-8 text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground px-3">
                    <Calendar class="mr-2 size-4" /> Days
                    {#if activeDays.length > 0}
                        <span class="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 font-bold text-secondary-foreground text-[10px]">
                            {activeDays.length}
                        </span>
                    {/if}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="w-[150px]">
                    {#each uniqueDays as opt}
                        <DropdownMenu.CheckboxItem checked={activeDays.includes(opt)} onCheckedChange={() => activeDays = toggleFilter(activeDays, opt)}>
                            {opt === 'Th' ? 'Thursday' : opt === 'Su' ? 'Sunday' : opt === 'M' ? 'Monday' : opt === 'T' ? 'Tuesday' : opt === 'W' ? 'Wednesday' : opt === 'F' ? 'Friday' : 'Saturday'}
                        </DropdownMenu.CheckboxItem>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            <!-- Modality Filter (NEW) -->
            <DropdownMenu.Root>
                <DropdownMenu.Trigger class="{buttonVariants({variant: 'outline', size: 'sm'})} h-8 text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground px-3">
                    <Monitor class="mr-2 size-4" /> Modality
                    {#if activeModalities.length > 0}
                        <span class="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 font-bold text-secondary-foreground text-[10px]">
                            {activeModalities.length}
                        </span>
                    {/if}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="w-[180px] max-h-[300px] overflow-y-auto">
                    {#each uniqueModalities as opt}
                        <DropdownMenu.CheckboxItem checked={activeModalities.includes(opt)} onCheckedChange={() => activeModalities = toggleFilter(activeModalities, opt)}>
                            {opt}
                        </DropdownMenu.CheckboxItem>
                    {/each}
                </DropdownMenu.Content>
            </DropdownMenu.Root>

            <!-- Reset Button -->
            {#if activeSections.length > 0 || activeProfessors.length > 0 || activeDays.length > 0 || activeSchedules.length > 0 || activeModalities.length > 0}
                <Button variant="ghost" size="sm" class="h-8 px-2 lg:px-3 font-semibold" onclick={clearFilters}>
                    Reset
                    <X class="ml-2 size-4" />
                </Button>
            {/if}
        </div>
    </div>

    <!-- Table Content -->
    <div class="overflow-auto flex-grow">
        <Table.Root class="w-full caption-bottom text-sm">
            <Table.Header class="sticky top-0 bg-muted/80 backdrop-blur-md z-10 border-b border-border/50">
                <Table.Row class="hover:bg-transparent">
                    <Table.Head class="h-11 px-4 text-left align-middle w-12">
                        <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />
                    </Table.Head>

                    <Table.Head class="h-11 px-4 text-left align-middle w-24">
                        <div class="flex items-center space-x-2 min-w-12">
                            <Button variant="ghost" size="sm" class="-ml-3 h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground data-[state=open]:bg-accent px-3 hover:bg-accent" onclick={table.getColumn('section')?.getToggleSortingHandler()}>
                                <span>Section</span>
                                {#if table.getColumn('section')?.getIsSorted() === 'asc'} <ArrowUp class="ml-1.5 size-3.5 text-primary" />
                                {:else if table.getColumn('section')?.getIsSorted() === 'desc'} <ArrowDown class="ml-1.5 size-3.5 text-primary" />
                                {:else} <ArrowUpDown class="ml-1.5 size-3.5 opacity-40" /> {/if}
                            </Button>
                        </div>
                    </Table.Head>

                    <Table.Head class="h-11 px-4 text-left align-middle w-[250px] whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" class="-ml-3 h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground data-[state=open]:bg-accent px-3 hover:bg-accent" onclick={table.getColumn('professor')?.getToggleSortingHandler()}>
                                <span>Professor</span>
                                {#if table.getColumn('professor')?.getIsSorted() === 'asc'} <ArrowUp class="ml-1.5 size-3.5 text-primary" />
                                {:else if table.getColumn('professor')?.getIsSorted() === 'desc'} <ArrowDown class="ml-1.5 size-3.5 text-primary" />
                                {:else} <ArrowUpDown class="ml-1.5 size-3.5 opacity-40" /> {/if}
                            </Button>
                        </div>
                    </Table.Head>

                    <Table.Head class="h-11 px-4 text-left align-middle text-xs font-bold uppercase tracking-wider text-muted-foreground">Schedules</Table.Head>
                    <Table.Head class="h-11 px-4 text-left align-middle text-xs font-bold uppercase tracking-wider text-muted-foreground w-[120px]">Room</Table.Head>
                    <Table.Head class="h-11 px-4 text-left align-middle text-xs font-bold uppercase tracking-wider text-muted-foreground w-20">Days</Table.Head>
                    <Table.Head class="h-11 px-4 text-left align-middle text-xs font-bold uppercase tracking-wider text-muted-foreground">Remarks</Table.Head>
                    <Table.Head class="h-11 px-4 w-12 text-center align-middle"></Table.Head>
                </Table.Row>
            </Table.Header>

            <Table.Body class="[&_tr:last-child]:border-0">
                {#each table.getRowModel().rows as row (row.id)}
                    <Table.Row data-state={row.getIsSelected() ? "selected" : false} class="border-b border-border/50 bg-background transition-colors hover:bg-muted/40 data-[state=selected]:bg-primary/5 data-[state=selected]:border-primary/20">
                        <Table.Cell class="p-3 px-4 align-middle">
                            <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
                        </Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle font-bold text-foreground">{row.original.section}</Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle">
                            <span class="font-semibold text-muted-foreground">{row.original.professor || 'Staff'}</span>
                        </Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle">
                            <div class="flex flex-col gap-1">
                                {#each getSchedules(row.original.slots) as sched}
                                    <span class="border border-border/60 text-xs whitespace-nowrap shrink-0 flex w-[150px] select-none items-center justify-center gap-2 rounded-md bg-accent/20 p-1.5 px-3 font-semibold text-foreground transition-colors">
                                        {sched}
                                    </span>
                                {/each}
                                {#if getSchedules(row.original.slots).length === 0}
                                    <span class="text-muted-foreground/60 italic text-xs font-medium">TBA</span>
                                {/if}
                            </div>
                        </Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle text-sm font-medium">{getRooms(row.original.slots)}</Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle font-bold text-muted-foreground">{getDays(row.original.slots)}</Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle text-sm text-muted-foreground max-w-[200px] truncate" title={row.original.remarks}>{row.original.remarks || '-'}</Table.Cell>
                        <Table.Cell class="p-3 px-4 align-middle text-right">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger class="{buttonVariants({variant:'ghost', size:'icon'})} size-8 text-muted-foreground hover:bg-accent hover:text-foreground">
                                    <Ellipsis class="size-4" />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="end" class="w-40">
                                    <DropdownMenu.Item onclick={() => duplicateSection(row.original)} class="cursor-pointer gap-2 font-medium transition-colors">
                                        <Copy class="size-4 text-muted-foreground" />
                                        Duplicate
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Separator />
                                    <DropdownMenu.Item onclick={() => deleteSection(row.original.id)} class="text-destructive focus:!bg-destructive focus:!text-destructive-foreground gap-2 cursor-pointer transition-colors font-medium">
                                        <Trash2 class="size-4" />
                                        Delete
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </Table.Cell>
                    </Table.Row>
                {/each}

                {#if table.getRowModel().rows.length === 0}
                    <Table.Row class="hover:bg-transparent">
                        <Table.Cell colspan={8} class="h-[350px] text-center">
                            <div class="flex flex-col items-center justify-center text-muted-foreground gap-4">
                                <div class="p-5 bg-muted/40 rounded-full border border-border/50">
                                    {#if globalFilter || activeSections.length || activeProfessors.length || activeDays.length || activeSchedules.length || activeModalities.length}
                                        <Search size={36} class="opacity-40" />
                                    {:else}
                                        <CalendarX2 size={36} class="opacity-40" />
                                    {/if}
                                </div>
                                <div class="flex flex-col gap-1.5">
                                    <p class="text-lg font-bold text-foreground">
                                        {globalFilter || activeSections.length || activeProfessors.length || activeDays.length || activeSchedules.length || activeModalities.length ? "No matches found" : "No sections configured"}
                                    </p>
                                    <p class="text-sm font-medium max-w-sm mx-auto">
                                        {globalFilter || activeSections.length || activeProfessors.length || activeDays.length || activeSchedules.length || activeModalities.length
                                            ? `We couldn't find any sections matching your current filters.`
                                            : `Click "Add Section" above to start populating this course's available schedules.`}
                                    </p>
                                </div>
                            </div>
                        </Table.Cell>
                    </Table.Row>
                {/if}
            </Table.Body>
        </Table.Root>
    </div>

    <!-- Footer / Selection Status -->
    {#if Object.keys(rowSelection).length > 0}
        <div class="bg-card/95 backdrop-blur-sm border-t border-border/80 p-3 flex justify-between items-center text-sm absolute bottom-0 left-0 right-0 animate-in slide-in-from-bottom-2 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-20">
            <span class="text-muted-foreground font-medium ml-2">
                <strong class="text-foreground">{Object.keys(rowSelection).length}</strong> section(s) selected
            </span>
            <Button variant="outline" size="sm" onclick={massDeleteSelected} class="h-8 gap-2 bg-background hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors mr-2 font-bold">
                <Trash2 size={14} />
                Delete Selected
            </Button>
        </div>
    {/if}
</div>