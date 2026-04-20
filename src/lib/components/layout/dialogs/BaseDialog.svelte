<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog';
    import { ScrollArea } from '$lib/components/ui/scroll-area';
    import type { Snippet } from 'svelte';

    let {
        title,
        description,
        icon: IconComponent,
        trigger,
        children
    }: {
        title: string;
        description?: string;
        icon?: any;
        trigger: Snippet<[any]>;
        children: Snippet;
    } = $props();
</script>

<Dialog.Root>
    <Dialog.Trigger>
        {#snippet child({ props })}
            {@render trigger(props)}
        {/snippet}
    </Dialog.Trigger>

    <Dialog.Content class="sm:max-w-lg">
        <Dialog.Header>
            <Dialog.Title class="inline-flex items-center font-bold">
                {#if IconComponent}
                    <IconComponent class="mr-2 size-4" aria-hidden="true" />
                {/if}
                {title}
            </Dialog.Title>
            {#if description}
                <Dialog.Description class="whitespace-pre-line text-sm text-muted-foreground">
                    {description}
                </Dialog.Description>
            {/if}
        </Dialog.Header>

        <ScrollArea class="max-h-[500px] w-full pr-4">
            {@render children()}
        </ScrollArea>
    </Dialog.Content>
</Dialog.Root>