<script lang="ts">
    let {
        number,
        title,
        description,
    }: {
        number: number | string;
        title: string;
        description?: string;
    } = $props();
</script>

<div class="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col gap-2">
    <div class="inline-flex gap-2 items-center">
        <div class="rounded-sm border-border border size-6 text-accent-foreground flex items-center justify-center font-bold flex-shrink-0 bg-accent">
            {number}
        </div>
        <div class="font-semibold text-card-foreground">{title}</div>
    </div>
    {#if description}
        <div class="text-pretty text-sm">
            {description}
        </div>
    {/if}
</div>