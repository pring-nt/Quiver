<script lang="ts">
    import { page } from '$app/state';
    import { onMount } from 'svelte';
    import { persisted } from 'svelte-persisted-store';

    import { Button, buttonVariants } from '$lib/components/ui/button';

    import BowArrow from 'lucide-svelte/icons/bow-arrow';
    import LayoutList from 'lucide-svelte/icons/layout-list';
    import CalendarRange from 'lucide-svelte/icons/calendar-range';
    import Heart from 'lucide-svelte/icons/heart';
    import Menu from 'lucide-svelte/icons/menu';
    import Megaphone from 'lucide-svelte/icons/megaphone';
    import AtSign from 'lucide-svelte/icons/at-sign';
    import SunMoon from 'lucide-svelte/icons/sun-moon';
    import BookOpen from 'lucide-svelte/icons/book-open';

    const darkMode = persisted('DARK_PREFERENCE', false);

    const isActive = (path: string) =>
        path === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(path);

    const navLinks = [
        { href: '/', label: 'Courses', icon: LayoutList },
        { href: '/schedules', label: 'Schedules', icon: CalendarRange },
        { href: '/saved', label: 'Saved', icon: Heart }
    ];

    function toggleTheme() {
        darkMode.update(n => !n);
    }

    // Reactive effect to update the DOM whenever the store changes
    $effect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', $darkMode);
        }
    });

    onMount(() => {
        // If the user has never visited, default to their system preference
        if (localStorage.getItem('DARK_PREFERENCE') === null) {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            darkMode.set(systemPrefersDark);
        }
    });
</script>

<header class="py-4 flex items-center justify-between gap-2 w-full border-b border-border px-8 xl:px-16 bg-background">
    <!-- Brand -->
    <a href="/" class="flex gap-2 font-extrabold text-lg items-center tracking-tight transition-opacity hover:opacity-80">
        <div class="p-2 bg-primary rounded-lg flex justify-center items-center h-10 w-10 text-primary-foreground">
            <BowArrow size={24} />
        </div>
        Quiver
    </a>

    <!-- Navigation Links -->
    <nav class="hidden xl:flex gap-2 absolute left-1/2 -translate-x-1/2">
        {#each navLinks as { href, label, icon: Icon }}
            <a {href} class="{buttonVariants({ variant: isActive(href) ? 'default' : 'ghost' })} gap-2 hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
                <Icon size={20} />
                {label}
            </a>
        {/each}
    </nav>

    <!-- Mobile Menu Toggle -->
    <div class="xl:hidden">
        <Button variant="outline" size="icon" aria-label="Menu" class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
            <Menu size={20} />
        </Button>
    </div>

    <!-- Utility Buttons -->
    <div class="hidden xl:flex flex-row gap-2">
        <Button variant="outline" size="icon" title="Announcements" aria-label="Announcements" class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
            <Megaphone size={20} />
        </Button>

        <Button variant="outline" size="icon" title="Developer Socials" aria-label="Developer Socials" class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
            <AtSign size={20} />
        </Button>

        <Button
                variant="outline"
                size="icon"
                title="Toggle Theme"
                aria-label="Toggle Theme"
                class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
                onclick={toggleTheme}
        >
            <SunMoon size={20} />
        </Button>

        <Button variant="outline" size="icon" title="Site Tutorial" aria-label="Site Tutorial" class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
            <BookOpen size={20} />
        </Button>
    </div>
</header>