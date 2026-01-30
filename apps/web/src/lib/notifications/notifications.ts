/**
 * Notifications System
 * 
 * Toast notifications and notification center.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'progress';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message?: string;
    progress?: number; // 0-100 for progress type
    duration?: number; // ms, 0 for persistent
    actions?: NotificationAction[];
    createdAt: number;
    read: boolean;
}

export interface NotificationAction {
    label: string;
    action: () => void;
    primary?: boolean;
}

export interface NotificationsState {
    notifications: Notification[];
    toasts: Notification[];
    unreadCount: number;

    // Actions
    notify: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => string;
    info: (title: string, message?: string) => string;
    success: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    progress: (title: string, progress: number, message?: string) => string;

    updateProgress: (id: string, progress: number) => void;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearHistory: () => void;
}

// =============================================================================
// NOTIFICATIONS STORE
// =============================================================================

export const useNotifications = create<NotificationsState>((set, get) => ({
    notifications: [],
    toasts: [],
    unreadCount: 0,

    notify: (notification) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newNotification: Notification = {
            ...notification,
            id,
            createdAt: Date.now(),
            read: false,
            duration: notification.duration ?? (notification.type === 'error' ? 0 : 5000),
        };

        set(state => ({
            notifications: [newNotification, ...state.notifications].slice(0, 100),
            toasts: [...state.toasts, newNotification],
            unreadCount: state.unreadCount + 1,
        }));

        // Auto-dismiss after duration
        if (newNotification.duration && newNotification.duration > 0) {
            setTimeout(() => {
                get().dismiss(id);
            }, newNotification.duration);
        }

        return id;
    },

    info: (title, message) => {
        return get().notify({ type: 'info', title, message });
    },

    success: (title, message) => {
        return get().notify({ type: 'success', title, message });
    },

    warning: (title, message) => {
        return get().notify({ type: 'warning', title, message });
    },

    error: (title, message) => {
        return get().notify({ type: 'error', title, message, duration: 0 });
    },

    progress: (title, progress, message) => {
        return get().notify({ type: 'progress', title, message, progress, duration: 0 });
    },

    updateProgress: (id, progress) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, progress } : n
            ),
            toasts: state.toasts.map(n =>
                n.id === id ? { ...n, progress } : n
            ),
        }));
    },

    dismiss: (id) => {
        set(state => ({
            toasts: state.toasts.filter(t => t.id !== id),
        }));
    },

    dismissAll: () => {
        set({ toasts: [] });
    },

    markAsRead: (id) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllAsRead: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    clearHistory: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}));
