<script lang="ts">
    import {BaseDialog, SocialLink} from '$lib/components/layout/dialogs'
    import { Button } from '$lib/components/ui/button';
    import { AtSign, Code, MessageSquare, GitFork } from 'lucide-svelte';

    const socialLinks = [
        {
            label: "GitHub",
            href: "https://github.com/pring-nt/Quiver",
            icon: Code
        },
        {
            label: "Instagram",
            href: "https://www.instagram.com/nate_pring/",
            icon: MessageSquare
        },
        {
            label: "Site Inspiration: Schedaddle",
            href: "https://github.com/CyberEzpertz/Schedaddle",
            icon: GitFork
        },
    ];
</script>

<BaseDialog
        title="Developer Socials"
        description="Have suggestions, found a bug, or just want to see the code? Connect below!"
        icon={AtSign}
>
    <!-- The Trigger Button -->
    {#snippet trigger()}
        <Button
                variant="outline"
                size="icon"
                title="Developer Socials"
                aria-label="Developer Socials"
                class="hover:!bg-accent/80 hover:!text-accent-foreground transition-colors"
        >
            <AtSign size={20} />
        </Button>
    {/snippet}

    <div class="flex flex-col gap-3 pb-4 pt-2">
        {#each socialLinks as link}
            <SocialLink
                    label={link.label}
                    href={link.href}
                    icon={link.icon}
            />
        {/each}
    </div>
</BaseDialog>