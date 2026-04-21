<script lang="ts">
    import { onMount } from 'svelte';
    import { Input } from '$lib/components/ui/input';
    import { Button } from '$lib/components/ui/button';
    import { Plus, CircleAlert } from 'lucide-svelte';

    import { coursesStore, courseInputSchema } from '$lib/stores/courses';

    let inputValue = $state('');
    let errorMessage = $state<string | null>(null);
    let placeholderText = $state('e.g. CCAPDEV'); // Default for SSR

    const easterEggPlaceholders = [
        "e.g. PRINGNT",
        "e.g. CCPROG1",
        "e.g. STSTSOC",
        "e.g. CCDSALG",
        "e.g. STASEAN",
        "e.g. LCENWRD (lol)",
        "e.g. CSSWENG",
        "e.g. STARCH",
        "e.g. GEADPRG",
        "e.g. GE-MATH",
        "e.g. ULTDISC",
        "e.g. ZOLTRAAK101",
        "e.g. CSFLICK",
        "e.g. CRYING201",
        "e.g. BAWLING101",
        "e.g. MIMIC101",
        "e.g. MANASPRSN",
        "e.g. AURA100 (...go drop yourself)",
        "e.g. MYSHOT101",
        "e.g. NONSTOP",
        "e.g. WAITFRIT",
        "e.g. HELPLSS",
        "e.g. STSFIED",
        "e.g. TGSWIIWAGAA",
        "e.g. YEARNING101",
        "e.g. DIDDY67",
    ];

    onMount(() => {
        // Pick a random placeholder when the component loads on the client
        const randomIndex = Math.floor(Math.random() * easterEggPlaceholders.length);
        placeholderText = easterEggPlaceholders[randomIndex];
    });

    function handleSubmit(e: Event) {
        e.preventDefault();
        errorMessage = null;

        // 1. Zod Validation
        const parsed = courseInputSchema.safeParse(inputValue);
        if (!parsed.success) {
            errorMessage = parsed.error.issues[0].message;
            return;
        }

        const newCourseCode = parsed.data;

        // 2. Uniqueness Check
        const isDuplicate = $coursesStore.some(course => course.courseCode === newCourseCode);

        if (isDuplicate) {
            errorMessage = `${newCourseCode} is already in your list.`;
            return;
        }

        // 3. Add to Persisted Store
        $coursesStore = [
            ...$coursesStore,
            {
                id: crypto.randomUUID(),
                courseCode: newCourseCode,
                sections: []
            }
        ];

        // 4. Reset on success
        inputValue = '';

        // Reroll the placeholder after they successfully add a course
        const randomIndex = Math.floor(Math.random() * easterEggPlaceholders.length);
        placeholderText = easterEggPlaceholders[randomIndex];
    }
</script>
<div class="pb-4 shrink-0">
<h2 class="text-2xl font-bold tracking-tight">Add Courses</h2>
<form onsubmit={handleSubmit} class="flex flex-col gap-2 w-full max-w-sm">
    <div class="flex gap-2">
        <Input
                type="text"
                placeholder={placeholderText}
                bind:value={inputValue}
                class={errorMessage ? 'border-destructive focus-visible:ring-destructive transition-all' : 'transition-all'}
                aria-invalid={!!errorMessage}
        />
        <Button type="submit" aria-label="Add Course">
            <Plus size={20} class="mr-2 hidden sm:block" />
            Add
        </Button>
    </div>

    {#if errorMessage}
        <div class="flex items-center gap-1.5 text-sm text-destructive font-medium animate-in slide-in-from-top-1">
            <CircleAlert size={14} />
            <span>{errorMessage}</span>
        </div>
    {/if}
</form>
</div>