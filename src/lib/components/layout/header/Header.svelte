<script lang="ts">
    import { page } from '$app/state';
    import { Button, buttonVariants } from '$lib/components/ui/button';
    import {ThemeDropdown} from '$lib/components/layout/header';

    import {BowArrow, LayoutList, CalendarRange, Heart, Menu} from 'lucide-svelte'
    import {AnnouncementsDialog, SocialsDialog, TutorialDialog} from "$lib/components/layout/dialogs";

    const isActive = (path: string) =>
        path === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(path);

    const navLinks = [
        { href: '/', label: 'Courses', icon: LayoutList },
        { href: '/schedules', label: 'Schedules', icon: CalendarRange },
        { href: '/saved', label: 'Saved', icon: Heart }
    ];
</script>

<header class="py-4 flex items-center justify-between gap-2 w-full border-b border-border px-8 xl:px-16 bg-background">
    <!-- Brand -->
    <a href="/static" class="flex gap-2 font-extrabold text-lg items-center tracking-tight transition-opacity hover:opacity-80">
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
        <AnnouncementsDialog />
        <SocialsDialog />
        <ThemeDropdown />
        <TutorialDialog />
    </div>
</header>