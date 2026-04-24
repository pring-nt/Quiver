import { persisted } from 'svelte-persisted-store';
import { z } from 'zod';
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

// Validation for class sections & time slots
export const daySlotSchema = z.object({
    day: z.enum(['M', 'T', 'W', 'Th', 'F', 'S', 'Su']),
    startTime: z.string()
        .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Start time must be in HH:MM or HHMM format")
        .transform(val => val.length === 4 && !val.includes(':') ? `${val.slice(0,2)}:${val.slice(2,4)}` : val),
    endTime: z.string()
        .regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "End time must be in HH:MM or HHMM format")
        .transform(val => val.length === 4 && !val.includes(':') ? `${val.slice(0,2)}:${val.slice(2,4)}` : val),
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

// Validation for course groups
export const courseGroupSchema = z.object({
    id: z.string(),
    name: z.string(),
    sectionIds: z.array(z.string()).optional().default([]),
    pickCount: z.number().optional().default(1)
});

// Validation for full course (with sections)
export const courseSchema = z.object({
    id: z.string(),
    courseCode: z.string(),
    sections: z.array(classSectionSchema).optional().default([]),
    groupId: z.string().optional()
});

// Validation for full global data structure
export const globalDataSchema = z.object({
    groups: z.array(courseGroupSchema).optional().default([]),
    courses: z.array(courseSchema).optional().default([])
});

// Global Stores
export const coursesStore = persisted<Course[]>('QUIVER_COURSES_LIST', []);
export const groupsStore = persisted<CourseGroup[]>('QUIVER_GROUPS_LIST', []);
export const selectedSectionsStore = persisted<Record<string, boolean>>('QUIVER_SELECTED_SECTIONS', {});