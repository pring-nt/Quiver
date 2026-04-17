<script lang="ts">
    import './layout.css';
    import Header from '$lib/components/layout/Header.svelte';
    let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground">

    <Header />

    <main class="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 xl:px-16 xl:py-8">
        {@render children()}
    </main>

</div>