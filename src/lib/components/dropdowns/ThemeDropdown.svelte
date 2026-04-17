<script lang="ts">
    import { onMount } from 'svelte';
    import { persisted } from 'svelte-persisted-store';

    import { buttonVariants } from '$lib/components/ui/button';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

    import WandSparkles from 'lucide-svelte/icons/wand-sparkles';
    import Sword from 'lucide-svelte/icons/sword';
    import Axe from 'lucide-svelte/icons/axe';
    import Sparkles from 'lucide-svelte/icons/sparkles';
    import Check from 'lucide-svelte/icons/check';
    import SunMoon from 'lucide-svelte/icons/sun-moon';

    // Both appearance stores are now managed here
    const styleTheme = persisted('STYLE_PREFERENCE', 'himmel');
    const darkMode = persisted('DARK_PREFERENCE', false);

    const themes = [
        { id: 'himmel', name: 'Himmel (Lake)', icon: Sword },
        { id: 'frieren', name: 'Frieren (Ivory)', icon: WandSparkles },
        { id: 'fern', name: 'Fern (Violet)', icon: Sparkles },
        { id: 'stark', name: 'Stark (Crimson)', icon: Axe }
    ];

    let currentTheme = $derived(themes.find(t => t.id === $styleTheme) || themes[0]);
    let CurrentIcon = $derived(currentTheme.icon);

    $effect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', $styleTheme);
            document.documentElement.classList.toggle('dark', $darkMode);
        }
    });

    onMount(() => {
        if (localStorage.getItem('DARK_PREFERENCE') === null) {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            darkMode.set(systemPrefersDark);
        }
    });
</script>

<DropdownMenu.Root>
    <DropdownMenu.Trigger
            class="{buttonVariants({ variant: 'outline', size: 'icon' })} hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
            title="Appearance: {currentTheme.name}"
    >
        <CurrentIcon size={20} />
        <span class="sr-only">Toggle appearance settings</span>
    </DropdownMenu.Trigger>

    <DropdownMenu.Content align="end" class="w-48">
        <DropdownMenu.Label>Appearance</DropdownMenu.Label>
        <DropdownMenu.Separator />

        <!-- Dark Mode Toggle -->
        <DropdownMenu.CheckboxItem
                checked={$darkMode}
                onCheckedChange={(v) => $darkMode = !!v}
                class="gap-2 cursor-pointer"
        >
            <SunMoon size={16} class="mr-2" />
            <span>Dark Mode</span>
        </DropdownMenu.CheckboxItem>

        <DropdownMenu.Separator />
        <DropdownMenu.Label>Character Style</DropdownMenu.Label>

        <!-- Theme Selection -->
        <DropdownMenu.Group>
            {#each themes as { id, name, icon: Icon }}
                <DropdownMenu.Item
                        onclick={() => $styleTheme = id}
                        class="gap-2 cursor-pointer flex items-center"
                >
                    <Icon size={16} class="mr-2" />
                    <span class="flex-1">{name}</span>

                    {#if $styleTheme === id}
                        <Check size={16} class="text-primary" />
                    {/if}
                </DropdownMenu.Item>
            {/each}
        </DropdownMenu.Group>
    </DropdownMenu.Content>
</DropdownMenu.Root>