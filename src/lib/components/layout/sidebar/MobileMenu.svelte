<script lang="ts">
    import { buttonVariants } from '$lib/components/ui/button';
    import * as Sheet from '$lib/components/ui/sheet';
    import { ThemeDropdown } from '$lib/components/layout/header';
    import { AnnouncementsDialog, SocialsDialog, TutorialDialog } from '$lib/components/layout/dialogs';
    import { BowArrow, Menu } from 'lucide-svelte';

    let {
        navLinks,
        isActive
    }: {
        navLinks: Array<{ href: string; label: string; icon: any }>;
        isActive: (path: string) => boolean;
    } = $props();

    let isMobileMenuOpen = $state(false);
</script>

<div class="xl:hidden">
    <Sheet.Root bind:open={isMobileMenuOpen}>
        <Sheet.Trigger class="{buttonVariants({ variant: 'outline', size: 'icon' })} hover:!bg-accent/80 hover:!text-accent-foreground transition-colors">
            <Menu size={20} />
        </Sheet.Trigger>

        <Sheet.Content side="left" class="w-[75vw] sm:max-w-sm flex flex-col h-full bg-background p-6">
            <Sheet.Header class="text-left">
                <Sheet.Title>
                    <a href="/" class="flex gap-2 font-extrabold text-lg items-center tracking-tight" onclick={() => isMobileMenuOpen = false}>
                        <div class="p-2 bg-primary rounded-lg flex justify-center items-center h-10 w-10 text-primary-foreground">
                            <BowArrow size={24} />
                        </div>
                        Quiver
                    </a>
                </Sheet.Title>
            </Sheet.Header>

            <!-- Mobile Navigation Links -->
            <div class="mt-4 flex flex-col gap-2">
                {#each navLinks as { href, label, icon: Icon }}
                    <a
                            {href}
                            onclick={() => isMobileMenuOpen = false}
                            class="{buttonVariants({ variant: isActive(href) ? 'default' : 'ghost' })} h-10 px-4 py-2 flex gap-2 items-center font-medium justify-start w-full
                                                                                                       hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
                    >
                        <Icon size={20} />
                        {label}
                    </a>
                {/each}
            </div>

            <!-- Mobile Utility Buttons -->
            <div class="mt-auto">
                <div class="flex flex-row gap-3 justify-start flex-wrap">
                    <AnnouncementsDialog />
                    <SocialsDialog />
                    <ThemeDropdown align="start"/>
                    <TutorialDialog />
                </div>
            </div>
        </Sheet.Content>
    </Sheet.Root>
</div>