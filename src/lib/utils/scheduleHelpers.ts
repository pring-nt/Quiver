import type { DaySlot } from '$lib/types';

export function formatTime12hr(time: string) {
    if (!time) return '';
    const [h, m] = time.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
}

export function getSchedules(slots: DaySlot[]) {
    if (!slots || slots.length === 0) return [];
    const times = new Set<string>();
    slots.forEach(s => times.add(`${formatTime12hr(s.startTime)} - ${formatTime12hr(s.endTime)}`));
    return Array.from(times);
}

export function getDays(slots: DaySlot[]) {
    if (!slots || slots.length === 0) return '-';
    return Array.from(new Set(slots.map(s => s.day))).join('/');
}

export function getRooms(slots: DaySlot[]) {
    if (!slots || slots.length === 0) return '-';
    const rooms = slots.map(s => s.room).filter(Boolean);
    return rooms.length > 0 ? Array.from(new Set(rooms)).join(', ') : '-';
}