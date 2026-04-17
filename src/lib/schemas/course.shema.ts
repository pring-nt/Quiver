import { z } from 'zod';

const DayEnum = z.enum(['M', 'T', 'W', 'Th', 'F', 'S', 'Su']);

export const DaySlotSchema = z.object({
    day: DayEnum,
    startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Use HH:MM format'),
    isOnline: z.boolean(),
    room: z.string().optional(),
});

export const ClassSectionSchema = z.object({
    id: z.string(),
    code: z.string().min(1),
    section: z.string().min(1),
    professor: z.string().min(1),
    modality: z.string().min(1),
    remarks: z.string().optional(),
    slots: z.array(DaySlotSchema).min(1),
    color: z.string().optional(),
});

// For bulk JSON import — an array of sections (id is optional, generated if missing)
export const ImportPayloadSchema = z.array(
    ClassSectionSchema.extend({ id: z.string().optional() })
);

export type ImportPayload = z.infer<typeof ImportPayloadSchema>;