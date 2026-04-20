<script lang="ts">
    import './layout.css';
    import { Header } from '$lib/components/layout/header';
    let { children } = $props();
</script>

<!--
    The wrapper is forced to 100dvh (dynamic viewport height) to account for mobile address bars.
    We remove max-w-7xl and mx-auto to allow full-width expansion.
-->
<div class="h-dvh flex flex-col bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground overflow-hidden">

    <Header />

    <main class="flex-1 w-full overflow-hidden">
        {@render children()}
    </main>

</div>