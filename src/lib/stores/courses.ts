import { persisted } from 'svelte-persisted-store';
import { z } from 'zod';
// 1. Import your existing types from your types file
import type { ClassSection, CourseGroup } from '$lib/types';

export type { CourseGroup };

export interface Course {
    id: string;
    courseCode: string;
    sections: ClassSection[];
    groupId?: string;
}

// Validation for adding new courses
export const courseInputSchema = z
    .string()
    .min(1, { message: "Course code cannot be empty." })
    .max(20, { message: "Course code is too long." })
    .transform((val) => val.trim().toUpperCase());

// Validation for adding/renaming groups
export const groupNameSchema = z
    .string()
    .min(1, { message: "Group name cannot be empty." })
    .max(20, { message: "Group name cannot exceed 20 characters." })
    .transform((val) => val.trim());

// Global Stores
export const coursesStore = persisted<Course[]>('QUIVER_COURSES_LIST', []);
export const groupsStore = persisted<CourseGroup[]>('QUIVER_GROUPS_LIST', []);