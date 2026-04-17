import type { ClassSection, DaySlot, Day } from './course';

export interface ScheduledSection {
    section: ClassSection;
    groupId?: string;   // set if this section came from a CourseGroup pick
}

export interface GeneratedSchedule {
    id: string;
    sections: ScheduledSection[];
    isSaved: boolean;
    createdAt: number;   // Date.now()
}

// Utility type for the per-day view in the schedule grid
export type DaySchedule = Record<Day, Array<{
    section: ClassSection;
    slot: DaySlot;
}>>;