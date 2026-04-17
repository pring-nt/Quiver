export type Day = 'M' | 'T' | 'W' | 'Th' | 'F' | 'S' | 'Su';

export type Modality =
    | 'F2F'
    | 'Online'
    | 'Hybrid'
    | 'PIP'           // Predominantly In Person
    | 'Tentative'
    | (string & {});  // allows custom strings while keeping autocomplete

export interface DaySlot {
    day: Day;
    startTime: string;  // "08:00" — 24hr format
    endTime: string;    // "09:30"
    isOnline: boolean;
    room?: string;
}

export interface ClassSection {
    id: string;         // nanoid() at creation time
    code: string;       // "CS101"
    section: string;    // "A" or "TN12"
    professor: string;
    modality: Modality;
    remarks?: string;
    slots: DaySlot[];
    color?: string;     // optional user-assigned color for display
}