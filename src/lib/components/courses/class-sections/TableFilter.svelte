<script lang="ts" generics="T">
    import { buttonVariants } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { ScrollArea } from '$lib/components/ui/scroll-area';

    let {
        label,
        icon: Icon,
        options,
        activeValues = $bindable([]),
        getLabel = (opt: T) => String(opt)
    }: {
        label: string;
        icon: any; // Svelte 4/5 Icon Compatibility
        options: T[];
        activeValues: T[];
        getLabel?: (opt: T) => string;
    } = $props();

    function toggleFilter(value: T) {
        if (activeValues.includes(value)) {
            activeValues = activeValues.filter(v => v !== value);
        } else {
            activeValues = [...activeValues, value];
        }
    }
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger class="{buttonVariants({variant: 'outline', size: 'sm'})} h-8 text-muted-foreground bg-background hover:bg-accent hover:text-accent-foreground px-3">
        <Icon class="mr-2 size-4" /> {label}
        {#if activeValues.length > 0}
            <span class="ml-2 rounded-sm bg-secondary px-1.5 py-0.5 font-bold text-secondary-foreground text-[10px]">
                {activeValues.length}
            </span>
        {/if}
    </DropdownMenu.Trigger>
    <DropdownMenu.Content align="start" class="w-[200px] p-0">
        <ScrollArea class="max-h-[300px] p-1">
            {#each options as opt}
                <DropdownMenu.CheckboxItem checked={activeValues.includes(opt)} onCheckedChange={() => toggleFilter(opt)}>
                    {getLabel(opt)}
                </DropdownMenu.CheckboxItem>
            {/each}
        </ScrollArea>
    </DropdownMenu.Content>
</DropdownMenu.Root>