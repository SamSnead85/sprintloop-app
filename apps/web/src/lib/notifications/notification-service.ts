/**
 * Notification Service
 * 
 * Manages toast notifications and persistent notifications for the IDE.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationSource = 'system' | 'git' | 'extension' | 'task' | 'ai' | 'debug';

export interface Notification {
    id: string;
    type: NotificationType;
    source: NotificationSource;
    title: string;
    message?: string;
    timestamp: Date;
    read: boolean;
    persistent?: boolean;
    actions?: NotificationAction[];
    progress?: number;
    detail?: string;
}

export interface NotificationAction {
    label: string;
    primary?: boolean;
    callback: () => void;
}

export interface Toast {
    id: string;
    type: NotificationType;
    message: string;
    duration: number;
    closable: boolean;
    progress?: number;
}

export interface NotificationState {
    notifications: Notification[];
    toasts: Toast[];
    isNotificationPanelOpen: boolean;
    unreadCount: number;
    doNotDisturb: boolean;

    // Notifications
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
    removeNotification: (id: string) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;

    // Toasts
    showToast: (type: NotificationType, message: string, options?: Partial<Toast>) => string;
    dismissToast: (id: string) => void;
    clearAllToasts: () => void;

    // Quick methods
    info: (message: string, title?: string) => string;
    success: (message: string, title?: string) => string;
    warning: (message: string, title?: string) => string;
    error: (message: string, title?: string) => string;

    // Panel
    toggleNotificationPanel: () => void;
    setDoNotDisturb: (value: boolean) => void;

    // Getters
    getBySource: (source: NotificationSource) => Notification[];
    getUnread: () => Notification[];
}

// =============================================================================
// NOTIFICATION STORE
// =============================================================================

export const useNotificationService = create<NotificationState>((set, get) => ({
    notifications: [],
    toasts: [],
    isNotificationPanelOpen: false,
    unreadCount: 0,
    doNotDisturb: false,

    addNotification: (notification) => {
        const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const newNotification: Notification = {
            ...notification,
            id,
            timestamp: new Date(),
            read: false,
        };

        set(state => ({
            notifications: [newNotification, ...state.notifications].slice(0, 100),
            unreadCount: state.unreadCount + 1,
        }));

        // Auto-show toast for non-persistent notifications
        if (!notification.persistent && !get().doNotDisturb) {
            get().showToast(notification.type, notification.title);
        }

        return id;
    },

    removeNotification: (id) => {
        set(state => {
            const notification = state.notifications.find(n => n.id === id);
            return {
                notifications: state.notifications.filter(n => n.id !== id),
                unreadCount: notification && !notification.read
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount,
            };
        });
    },

    markAsRead: (id) => {
        set(state => {
            const notification = state.notifications.find(n => n.id === id);
            if (!notification || notification.read) return state;

            return {
                notifications: state.notifications.map(n =>
                    n.id === id ? { ...n, read: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
            };
        });
    },

    markAllAsRead: () => {
        set(state => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
    },

    showToast: (type, message, options = {}) => {
        const id = `toast_${Date.now()}`;
        const toast: Toast = {
            id,
            type,
            message,
            duration: options.duration ?? 4000,
            closable: options.closable ?? true,
            progress: options.progress,
        };

        set(state => ({
            toasts: [...state.toasts, toast],
        }));

        // Auto-dismiss
        if (toast.duration > 0) {
            setTimeout(() => {
                get().dismissToast(id);
            }, toast.duration);
        }

        return id;
    },

    dismissToast: (id) => {
        set(state => ({
            toasts: state.toasts.filter(t => t.id !== id),
        }));
    },

    clearAllToasts: () => {
        set({ toasts: [] });
    },

    info: (message, title) => {
        return get().addNotification({ type: 'info', source: 'system', title: title || message, message: title ? message : undefined });
    },

    success: (message, title) => {
        return get().addNotification({ type: 'success', source: 'system', title: title || message, message: title ? message : undefined });
    },

    warning: (message, title) => {
        return get().addNotification({ type: 'warning', source: 'system', title: title || message, message: title ? message : undefined });
    },

    error: (message, title) => {
        return get().addNotification({ type: 'error', source: 'system', title: title || message, message: title ? message : undefined, persistent: true });
    },

    toggleNotificationPanel: () => {
        set(state => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen }));
    },

    setDoNotDisturb: (value) => {
        set({ doNotDisturb: value });
    },

    getBySource: (source) => {
        return get().notifications.filter(n => n.source === source);
    },

    getUnread: () => {
        return get().notifications.filter(n => !n.read);
    },
}));

// =============================================================================
// UTILITIES
// =============================================================================

export function getNotificationIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
        info: 'ℹ️',
        success: '✅',
        warning: '⚠️',
        error: '❌',
    };
    return icons[type];
}

export function getSourceIcon(source: NotificationSource): string {
    const icons: Record<NotificationSource, string> = {
        system: '🖥️',
        git: '🔀',
        extension: '🧩',
        task: '📋',
        ai: '🤖',
        debug: '🐛',
    };
    return icons[source];
}

export function formatTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
