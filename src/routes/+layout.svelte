<script lang="ts">
    import './layout.css';
    import { Header } from '$lib/components/layout/header';
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