import { persisted } from 'svelte-persisted-store';
import { z } from 'zod';
// 1. Import your existing types from your types file
import type { ClassSection, CourseGroup } from '$lib/types';

// 2. Re-export CourseGroup so our components don't need their imports updated
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

// Validation for class sections & time slots
export const daySlotSchema = z.object({
    day: z.enum(['M', 'T', 'W', 'Th', 'F', 'S', 'Su']),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Start time must be in HH:MM format"),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "End time must be in HH:MM format"),
    room: z.string().optional(),
    isOnline: z.boolean()
}).refine(data => {
    const start = parseInt(data.startTime.replace(':', ''), 10);
    const end = parseInt(data.endTime.replace(':', ''), 10);
    return start < end;
}, {
    message: "Start time must be before end time",
    path: ["endTime"]
});

export const classSectionSchema = z.object({
    id: z.string(),
    code: z.string(),
    section: z.string().min(1, "Section code is required"),
    professor: z.string().min(1, "Professor name is required"),
    modality: z.string(),
    remarks: z.string().optional(),
    slots: z.array(daySlotSchema).min(1, "At least one schedule slot is required")
});

// Global Stores
export const coursesStore = persisted<Course[]>('QUIVER_COURSES_LIST', []);
export const groupsStore = persisted<CourseGroup[]>('QUIVER_GROUPS_LIST', []);
export const selectedSectionsStore = persisted<Record<string, boolean>>('QUIVER_SELECTED_SECTIONS', {});