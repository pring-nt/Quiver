<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-svelte';

    let { column, label }: { column: any, label: string } = $props();
</script>

<div class="flex items-center space-x-2 min-w-12">
    <Button variant="ghost" size="sm" class="-ml-3 h-8 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground data-[state=open]:bg-accent px-3 hover:bg-accent" onclick={column.getToggleSortingHandler()}>
        <span>{label}</span>
        {#if column.getIsSorted() === 'asc'}
            <ArrowUp class="ml-1.5 size-3.5 text-primary" />
        {:else if column.getIsSorted() === 'desc'}
            <ArrowDown class="ml-1.5 size-3.5 text-primary" />
        {:else}
            <ArrowUpDown class="ml-1.5 size-3.5 opacity-40" />
        {/if}
    </Button>
</div>