import type { Day } from './course';

export interface UnavailableBlock {
    day: Day;
    startTime: string;  // "12:00"
    endTime: string;    // "13:00"
    label?: string;     // e.g. "Lunch break"
}

export interface FilterConfig {
    earliestStart: string | null;     // "07:00" — null means no limit
    latestEnd: string | null;         // "20:00"
    maxConsecutive: number | null;    // max back-to-back classes
    maxPerDay: number | null;         // max classes in a single day
    allowedDays: Day[];               // empty = all days allowed
    unavailableBlocks: UnavailableBlock[];
    noClassOnline: boolean;           // filter out purely online schedules
}

export const defaultFilters = (): FilterConfig => ({
    earliestStart: null,
    latestEnd: null,
    maxConsecutive: null,
    maxPerDay: null,
    allowedDays: [],
    unavailableBlocks: [],
    noClassOnline: false,
});