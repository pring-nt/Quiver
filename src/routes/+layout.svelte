<script lang="ts">
    import { Toaster } from '$lib/components/ui/sonner';
    import { persisted } from 'svelte-persisted-store';
    import './layout.css';
    import { Header } from '$lib/components/layout/header';

    const darkMode = persisted('DARK_PREFERENCE', false);
    let { children } = $props();
</script>

<!--
    Responsive Wrapper:
    - Mobile: min-h-dvh (minimum height) and overflow-y-auto to allow scrolling.
    - Desktop (lg): Fixed h-dvh and overflow-hidden to keep the app-like feel.
-->
<div class="
    flex flex-col bg-background text-foreground antialiased
    selection:bg-primary/30 selection:text-primary-foreground
    min-h-dvh overflow-y-auto
    lg:h-dvh lg:overflow-hidden
">

    <Header />

    <main class="flex-1 w-full lg:overflow-hidden">
        {@render children()}
    </main>

</div>

<Toaster position="bottom-right" theme={$darkMode ? 'dark' : 'light'} />