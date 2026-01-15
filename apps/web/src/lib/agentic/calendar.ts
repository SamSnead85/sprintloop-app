/**
 * Calendar Integration Module
 * Phases 301-400: Calendar management and smart scheduling
 */

import { create } from 'zustand';

export interface CalendarAccount {
    id: string;
    name: string;
    email: string;
    provider: 'google' | 'outlook' | 'caldav';
    status: 'connected' | 'disconnected';
    calendars: Calendar[];
}

export interface Calendar {
    id: string;
    name: string;
    color: string;
    isDefault: boolean;
    isReadOnly: boolean;
}

export interface CalendarEvent {
    id: string;
    calendarId: string;
    title: string;
    description?: string;
    location?: string;
    start: number;
    end: number;
    allDay: boolean;
    recurring?: RecurrenceRule;
    attendees: Attendee[];
    reminders: Reminder[];
    conferenceLink?: string;
    status: 'confirmed' | 'tentative' | 'cancelled';
}

export interface RecurrenceRule {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    until?: number;
    count?: number;
    byDay?: ('MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU')[];
}

export interface Attendee {
    email: string;
    name?: string;
    response: 'accepted' | 'declined' | 'tentative' | 'pending';
    optional: boolean;
}

export interface Reminder {
    method: 'popup' | 'email';
    minutes: number;
}

export interface TimeSlot {
    start: number;
    end: number;
    available: boolean;
}

interface CalendarState {
    accounts: CalendarAccount[];
    events: Map<string, CalendarEvent>;

    addAccount: (account: Omit<CalendarAccount, 'id' | 'calendars'>) => string;
    syncAccount: (accountId: string) => Promise<void>;

    createEvent: (event: Omit<CalendarEvent, 'id'>) => string;
    updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
    deleteEvent: (eventId: string) => void;

    getEvents: (start: number, end: number) => CalendarEvent[];
    getEventsByDate: (date: Date) => CalendarEvent[];

    findAvailableSlots: (duration: number, range: { start: number; end: number }) => TimeSlot[];
    scheduleEvent: (title: string, duration: number, attendees: string[]) => Promise<CalendarEvent>;

    addReminder: (eventId: string, reminder: Reminder) => void;
    checkConflicts: (start: number, end: number) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
    accounts: [],
    events: new Map(),

    addAccount: (accountData) => {
        const id = `cal-${Date.now()}`;
        const account: CalendarAccount = {
            ...accountData,
            id,
            calendars: [{ id: 'default', name: 'Calendar', color: '#1a73e8', isDefault: true, isReadOnly: false }],
        };
        set(state => ({ accounts: [...state.accounts, account] }));
        return id;
    },

    syncAccount: async (accountId) => {
        console.log('[Calendar] Syncing:', accountId);
        await new Promise(r => setTimeout(r, 1000));
    },

    createEvent: (eventData) => {
        const id = `event-${Date.now()}`;
        const event: CalendarEvent = { ...eventData, id };
        set(state => {
            const events = new Map(state.events);
            events.set(id, event);
            return { events };
        });
        console.log('[Calendar] Created event:', event.title);
        return id;
    },

    updateEvent: (eventId, updates) => {
        set(state => {
            const events = new Map(state.events);
            const event = events.get(eventId);
            if (event) events.set(eventId, { ...event, ...updates });
            return { events };
        });
    },

    deleteEvent: (eventId) => {
        set(state => {
            const events = new Map(state.events);
            events.delete(eventId);
            return { events };
        });
    },

    getEvents: (start, end) => {
        const events = Array.from(get().events.values());
        return events.filter(e => e.start >= start && e.start <= end);
    },

    getEventsByDate: (date) => {
        const dayStart = new Date(date).setHours(0, 0, 0, 0);
        const dayEnd = new Date(date).setHours(23, 59, 59, 999);
        return get().getEvents(dayStart, dayEnd);
    },

    findAvailableSlots: (duration, range) => {
        const events = get().getEvents(range.start, range.end);
        const slots: TimeSlot[] = [];
        const durationMs = duration * 60 * 1000;

        let current = range.start;
        while (current + durationMs <= range.end) {
            const slotEnd = current + durationMs;
            const hasConflict = events.some(e =>
                (current >= e.start && current < e.end) ||
                (slotEnd > e.start && slotEnd <= e.end)
            );

            slots.push({ start: current, end: slotEnd, available: !hasConflict });
            current += 30 * 60 * 1000; // 30 min increments
        }

        return slots;
    },

    scheduleEvent: async (title, duration, attendees) => {
        console.log('[Calendar] Scheduling:', { title, duration, attendees });

        const now = Date.now();
        const range = { start: now, end: now + 7 * 24 * 60 * 60 * 1000 };
        const slots = get().findAvailableSlots(duration, range);
        const freeSlot = slots.find(s => s.available);

        if (!freeSlot) throw new Error('No available slots');

        const eventId = get().createEvent({
            calendarId: 'default',
            title,
            start: freeSlot.start,
            end: freeSlot.end,
            allDay: false,
            attendees: attendees.map(email => ({
                email,
                response: 'pending' as const,
                optional: false,
            })),
            reminders: [{ method: 'popup', minutes: 15 }],
            status: 'confirmed',
        });

        return get().events.get(eventId)!;
    },

    addReminder: (eventId, reminder) => {
        set(state => {
            const events = new Map(state.events);
            const event = events.get(eventId);
            if (event) {
                events.set(eventId, { ...event, reminders: [...event.reminders, reminder] });
            }
            return { events };
        });
    },

    checkConflicts: (start, end) => {
        const events = Array.from(get().events.values());
        return events.filter(e =>
            (start >= e.start && start < e.end) ||
            (end > e.start && end <= e.end) ||
            (start <= e.start && end >= e.end)
        );
    },
}));

/** Schedule a meeting with attendees */
export async function scheduleMeeting(
    title: string,
    duration: number,
    attendees: string[],
    _options?: { description?: string; location?: string }
): Promise<CalendarEvent> {
    const store = useCalendarStore.getState();
    return store.scheduleEvent(title, duration, attendees);
}

/** Get today's agenda */
export function getTodaysAgenda(): CalendarEvent[] {
    const store = useCalendarStore.getState();
    return store.getEventsByDate(new Date());
}

/** Block focus time */
export function blockFocusTime(hours: number): string {
    const store = useCalendarStore.getState();
    const now = Date.now();
    return store.createEvent({
        calendarId: 'default',
        title: '🎯 Focus Time',
        start: now,
        end: now + hours * 60 * 60 * 1000,
        allDay: false,
        attendees: [],
        reminders: [],
        status: 'confirmed',
    });
}
