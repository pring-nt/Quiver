<script lang="ts">
    import { SquareArrowOutUpRight } from 'lucide-svelte';

    let {
        href,
        label,
        icon: IconComponent
    }: {
        href: string;
        label: string;
        icon?: any;
    } = $props();
</script>

<a
        target="_blank"
        rel="noopener noreferrer"
        class="group flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm transition-all duration-300 hover:border-primary hover:bg-accent/10 hover:shadow-md"
        {href}
>
    <div class="flex items-center gap-3">
        {#if IconComponent}
            <!-- Icon gets a themed background container that fills in on hover -->
            <div class="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                <IconComponent class="size-4" aria-hidden="true" />
            </div>
        {/if}
        <!-- Text highlights to the primary theme color on hover -->
        <span class="font-medium text-sm transition-colors duration-300 group-hover:text-primary">{label}</span>
    </div>

    <!-- External link arrow gets a slight "fly away" animation on hover -->
    <SquareArrowOutUpRight
            class="size-4 text-muted-foreground transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden="true"
    />
</a>