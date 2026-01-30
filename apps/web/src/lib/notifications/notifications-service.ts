/**
 * Notifications Service
 * 
 * Toast notifications and notification center.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Notification {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message?: string;
    source?: string;
    timestamp: number;
    duration?: number;
    actions?: NotificationAction[];
    progress?: number;
    read: boolean;
    dismissed: boolean;
}

export interface NotificationAction {
    id: string;
    label: string;
    primary?: boolean;
    callback?: () => void;
}

export interface NotificationsState {
    notifications: Notification[];
    toasts: Notification[];
    isCenterOpen: boolean;
    unreadCount: number;
    maxToasts: number;

    // Create
    show: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>) => string;
    info: (title: string, message?: string) => string;
    success: (title: string, message?: string) => string;
    warning: (title: string, message?: string) => string;
    error: (title: string, message?: string) => string;
    progress: (title: string, progress: number, message?: string) => string;

    // Update
    update: (id: string, updates: Partial<Notification>) => void;
    dismiss: (id: string) => void;
    dismissAll: () => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;

    // Center
    openCenter: () => void;
    closeCenter: () => void;
    toggleCenter: () => void;

    // Clear
    clearHistory: () => void;
    removeNotification: (id: string) => void;
}

// =============================================================================
// NOTIFICATIONS STORE
// =============================================================================

let notificationIdCounter = 0;

export const useNotificationsService = create<NotificationsState>((set, get) => ({
    notifications: [],
    toasts: [],
    isCenterOpen: false,
    unreadCount: 0,
    maxToasts: 3,

    show: (notification) => {
        const id = `notif_${++notificationIdCounter}`;
        const fullNotification: Notification = {
            ...notification,
            id,
            timestamp: Date.now(),
            read: false,
            dismissed: false,
        };

        set(state => {
            const newToasts = [fullNotification, ...state.toasts].slice(0, state.maxToasts);

            return {
                notifications: [fullNotification, ...state.notifications],
                toasts: newToasts,
                unreadCount: state.unreadCount + 1,
            };
        });

        // Auto-dismiss after duration
        const duration = notification.duration ?? (notification.type === 'error' ? 8000 : 5000);
        if (duration > 0) {
            setTimeout(() => {
                get().dismiss(id);
            }, duration);
        }

        return id;
    },

    info: (title, message) => {
        return get().show({ type: 'info', title, message });
    },

    success: (title, message) => {
        return get().show({ type: 'success', title, message });
    },

    warning: (title, message) => {
        return get().show({ type: 'warning', title, message });
    },

    error: (title, message) => {
        return get().show({ type: 'error', title, message });
    },

    progress: (title, progress, message) => {
        return get().show({
            type: 'info',
            title,
            message,
            progress,
            duration: 0, // Don't auto-dismiss
        });
    },

    update: (id, updates) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, ...updates } : n
            ),
            toasts: state.toasts.map(n =>
                n.id === id ? { ...n, ...updates } : n
            ),
        }));
    },

    dismiss: (id) => {
        set(state => ({
            notifications: state.notifications.map(n =>
                n.id === id ? { ...n, dismissed: true } : n
            ),
            toasts: state.toasts.filter(n => n.id !== id),
        }));
    },

    dismissAll: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, dismissed: true })),
            toasts: [],
        }));
    },

    markAsRead: (id) => {
        set(state => {
            const notification = state.notifications.find(n => n.id === id);
            const wasUnread = notification && !notification.read;

            return {
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                ),
                unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
            };
        });
    },

    markAllAsRead: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    openCenter: () => {
        set({ isCenterOpen: true });
    },

    closeCenter: () => {
        set({ isCenterOpen: false });
    },

    toggleCenter: () => {
        set(state => ({ isCenterOpen: !state.isCenterOpen }));
    },

    clearHistory: () => {
        set({
            notifications: [],
            toasts: [],
            unreadCount: 0,
        });
    },

    removeNotification: (id) => {
        set(state => ({
            notifications: state.notifications.filter(n => n.id !== id),
            toasts: state.toasts.filter(n => n.id !== id),
        }));
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

export function getNotificationIcon(type: Notification['type']): string {
    switch (type) {
        case 'info': return 'ℹ️';
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
    }
}

export function formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

    return new Date(timestamp).toLocaleDateString();
}
