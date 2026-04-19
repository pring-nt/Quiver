import { persisted } from 'svelte-persisted-store';
import { z } from 'zod';
import type { ClassSection } from '$lib/types';

// Create a UI-specific wrapper type for a Course
export interface Course {
    id: string;               // Unique ID for this list entry (useful for drag-and-drop)
    courseCode: string;       // e.g., "STASEAN"
    sections: ClassSection[]; // Array of sections belonging to this course
    groupId?: string;         // For your grouping feature
}

// Zod schema for validating the course code input
export const courseInputSchema = z
    .string()
    .min(1, { message: "Course code cannot be empty." })
    .max(20, { message: "Course code is too long." })
    .transform((val) => val.trim().toUpperCase());

// We'll store an array of our custom Course wrapper.
export const coursesStore = persisted<Course[]>('QUIVER_COURSES_LIST', []);