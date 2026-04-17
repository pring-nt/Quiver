<script lang="ts">
    import { page } from '$app/state';

    // Import Shadcn Button and the variant utility
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

    // Exact match for the root ('/') to prevent highlighting on every page, prefix match for others
    const isActive = (path: string) =>
        path === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(path);

    const navLinks = [
        { href: '/', label: 'Courses', icon: LayoutList },
        { href: '/schedules', label: 'Schedules', icon: CalendarRange },
        { href: '/saved', label: 'Saved', icon: Heart }
    ];

    const utilities = [
        { title: 'Announcements', icon: Megaphone },
        { title: 'Developer Socials', icon: AtSign },
        { title: 'Toggle Theme', icon: SunMoon },
        { title: 'Site Tutorial', icon: BookOpen }
    ];
</script>

<header class="py-4 flex items-center justify-between gap-2 w-full border-b border-border px-8 xl:px-16 bg-background">

    <!-- Brand: Now links to root -->
    <a href="/" class="flex gap-2 font-extrabold text-lg items-center tracking-tight transition-opacity hover:opacity-80">
        <div class="p-2 bg-primary rounded-lg flex justify-center items-center h-10 w-10 text-primary-foreground">
            <BowArrow size={24} />
        </div>
        Quiver
    </a>

    <!-- Navigation Links-->
    <nav class="hidden xl:flex gap-2 absolute left-1/2 -translate-x-1/2">
        {#each navLinks as { href, label, icon: Icon }}
            <a {href} class="{buttonVariants({ variant: isActive(href) ? 'default' : 'ghost' })} gap-2">
                <Icon size={20} />
                {label}
            </a>
        {/each}
    </nav>

    <!-- Mobile Menu Toggle -->
    <div class="xl:hidden">
        <Button variant="outline" size="icon" aria-label="Menu">
            <Menu size={20} />
        </Button>
    </div>

    <!-- Utility Buttons-->
    <div class="hidden xl:flex flex-row gap-2">
        {#each utilities as { title, icon: Icon }}
            <Button variant="outline" size="icon" {title} aria-label={title}>
                <Icon size={20} />
            </Button>
        {/each}
    </div>
</header>