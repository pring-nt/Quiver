<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import { CircleAlert, CircleCheck } from 'lucide-svelte';
    import type { ClassSection } from '$lib/types';

    let {
        conflicts,
        onCancel,
        onConfirm
    }: {
        conflicts: { incoming: ClassSection; existing: ClassSection; action: 'replace' | 'duplicate' | 'skip' }[];
        onCancel: () => void;
        onConfirm: () => void;
    } = $props();
</script>

<div class="flex flex-col gap-4 p-4 border border-destructive/50 rounded-lg bg-destructive/5 shadow-sm animate-in fade-in zoom-in-95 min-w-0">
    <!-- Header -->
    <div class="flex items-start gap-3 shrink-0">
        <CircleAlert size={20} class="text-destructive mt-0.5 shrink-0" />
        <div class="flex flex-col gap-1 min-w-0">
            <h4 class="font-bold text-sm tracking-tight text-destructive">Import Conflicts Detected</h4>
            <p class="text-xs text-muted-foreground">
                {conflicts.length} section(s) from your import already exist in this course. How would you like to handle them?
            </p>
        </div>
    </div>

    <!-- Scrollable Conflicts List -->
    <ScrollArea class="max-h-[250px] w-full rounded-md border border-border/50 bg-background/50 shadow-inner">
        <div class="flex flex-col gap-2 p-2">
            {#each conflicts as conflict}
                <div class="flex flex-col p-2.5 rounded-md bg-card border border-border/50 shadow-sm gap-2 shrink-0 min-w-0">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
                        <span class="font-bold text-sm truncate text-center sm:text-left flex-1 min-w-0" title={conflict.incoming.section}>
                            {conflict.incoming.section}
                        </span>

                        <div class="flex bg-muted p-1 rounded-md shrink-0 w-full sm:w-auto gap-0.5">
                            <Button
                                    variant="ghost"
                                    size="sm"
                                    class="flex-1 sm:flex-none h-6 px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-colors {conflict.action === 'replace' ? 'bg-background shadow-sm text-foreground hover:bg-background' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}"
                                    onclick={() => conflict.action = 'replace'}>
                                Replace
                            </Button>
                            <Button
                                    variant="ghost"
                                    size="sm"
                                    class="flex-1 sm:flex-none h-6 px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-colors {conflict.action === 'duplicate' ? 'bg-background shadow-sm text-foreground hover:bg-background' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}"
                                    onclick={() => conflict.action = 'duplicate'}>
                                Duplicate
                            </Button>
                            <Button
                                    variant="ghost"
                                    size="sm"
                                    class="flex-1 sm:flex-none h-6 px-2.5 py-1 text-[11px] font-semibold rounded-sm transition-colors {conflict.action === 'skip' ? 'bg-background shadow-sm text-foreground hover:bg-background' : 'text-muted-foreground hover:text-foreground hover:bg-transparent'}"
                                    onclick={() => conflict.action = 'skip'}>
                                Skip
                            </Button>
                        </div>
                    </div>

                    <!-- Dynamic Description Box -->
                    <div class="text-[11px] text-muted-foreground bg-accent/20 border border-border/30 p-1.5 px-2 rounded-sm text-center sm:text-left leading-tight">
                        {#if conflict.action === 'replace'}
                            <span class="font-semibold text-foreground">Replace:</span> Overwrites your existing section with this new one.
                        {:else if conflict.action === 'duplicate'}
                            <span class="font-semibold text-foreground">Duplicate:</span> Keeps your old section, adds this one as a unique copy.
                        {:else if conflict.action === 'skip'}
                            <span class="font-semibold text-foreground">Skip:</span> Ignores this incoming section completely.
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </ScrollArea>

    <!-- Actions -->
    <div class="flex flex-col-reverse sm:flex-row gap-2 mt-2 pt-3 shrink-0 border-t border-destructive/10">
        <Button variant="outline" class="w-full sm:flex-1 h-9 text-xs font-semibold bg-background" onclick={onCancel}>
            Cancel Import
        </Button>
        <Button class="w-full sm:flex-1 h-9 text-xs font-semibold gap-2" onclick={onConfirm}>
            <CircleCheck size={14} /> Confirm Import
        </Button>
    </div>
</div>