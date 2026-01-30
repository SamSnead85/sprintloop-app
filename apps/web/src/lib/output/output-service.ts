/**
 * Output Channels Service
 * 
 * Manages output channels for different processes and extensions.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type OutputLevel = 'info' | 'warning' | 'error' | 'debug' | 'trace';

export interface OutputLine {
    id: string;
    timestamp: Date;
    level: OutputLevel;
    message: string;
    source?: string;
}

export interface OutputChannel {
    id: string;
    name: string;
    icon?: string;
    lines: OutputLine[];
    isActive: boolean;
    preserveFocus: boolean;
    revealOnOutput: boolean;
    maxLines: number;
}

export interface OutputState {
    channels: OutputChannel[];
    activeChannelId: string | null;
    isPanelVisible: boolean;
    globalFilter: string;
    showTimestamps: boolean;
    autoscroll: boolean;

    // Channel operations
    createChannel: (name: string, options?: Partial<OutputChannel>) => string;
    deleteChannel: (channelId: string) => void;
    clearChannel: (channelId: string) => void;
    setActiveChannel: (channelId: string) => void;

    // Output operations
    appendLine: (channelId: string, message: string, level?: OutputLevel) => void;
    appendOutput: (channelId: string, text: string) => void;

    // Panel operations
    showPanel: (preserveFocus?: boolean) => void;
    hidePanel: () => void;
    togglePanel: () => void;

    // Settings
    setFilter: (filter: string) => void;
    toggleTimestamps: () => void;
    toggleAutoscroll: () => void;

    // Getters
    getChannel: (channelId: string) => OutputChannel | undefined;
    getFilteredLines: (channelId: string) => OutputLine[];
}

// =============================================================================
// BUILT-IN CHANNELS
// =============================================================================

const createDefaultChannels = (): OutputChannel[] => [
    {
        id: 'log',
        name: 'Log (Extension Host)',
        icon: '📋',
        lines: [],
        isActive: true,
        preserveFocus: true,
        revealOnOutput: false,
        maxLines: 1000,
    },
    {
        id: 'tasks',
        name: 'Tasks',
        icon: '⚙️',
        lines: [],
        isActive: false,
        preserveFocus: true,
        revealOnOutput: true,
        maxLines: 500,
    },
    {
        id: 'git',
        name: 'Git',
        icon: '🔀',
        lines: [],
        isActive: false,
        preserveFocus: true,
        revealOnOutput: false,
        maxLines: 500,
    },
    {
        id: 'typescript',
        name: 'TypeScript',
        icon: '📘',
        lines: [],
        isActive: false,
        preserveFocus: true,
        revealOnOutput: true,
        maxLines: 500,
    },
    {
        id: 'eslint',
        name: 'ESLint',
        icon: '🔍',
        lines: [],
        isActive: false,
        preserveFocus: true,
        revealOnOutput: false,
        maxLines: 500,
    },
    {
        id: 'ai',
        name: 'AI Assistant',
        icon: '🤖',
        lines: [],
        isActive: false,
        preserveFocus: false,
        revealOnOutput: true,
        maxLines: 1000,
    },
];

// =============================================================================
// OUTPUT STORE
// =============================================================================

export const useOutputService = create<OutputState>((set, get) => ({
    channels: createDefaultChannels(),
    activeChannelId: 'log',
    isPanelVisible: false,
    globalFilter: '',
    showTimestamps: true,
    autoscroll: true,

    createChannel: (name, options = {}) => {
        const id = `channel_${Date.now()}`;
        const channel: OutputChannel = {
            id,
            name,
            lines: [],
            isActive: false,
            preserveFocus: true,
            revealOnOutput: false,
            maxLines: 1000,
            ...options,
        };

        set(state => ({
            channels: [...state.channels, channel],
        }));

        return id;
    },

    deleteChannel: (channelId) => {
        set(state => ({
            channels: state.channels.filter(c => c.id !== channelId),
            activeChannelId: state.activeChannelId === channelId
                ? state.channels[0]?.id || null
                : state.activeChannelId,
        }));
    },

    clearChannel: (channelId) => {
        set(state => ({
            channels: state.channels.map(c =>
                c.id === channelId ? { ...c, lines: [] } : c
            ),
        }));
    },

    setActiveChannel: (channelId) => {
        set(state => ({
            channels: state.channels.map(c => ({
                ...c,
                isActive: c.id === channelId,
            })),
            activeChannelId: channelId,
        }));
    },

    appendLine: (channelId, message, level = 'info') => {
        const line: OutputLine = {
            id: `line_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            timestamp: new Date(),
            level,
            message,
        };

        set(state => ({
            channels: state.channels.map(c => {
                if (c.id !== channelId) return c;

                const newLines = [...c.lines, line];
                // Trim to max lines
                if (newLines.length > c.maxLines) {
                    newLines.splice(0, newLines.length - c.maxLines);
                }

                return { ...c, lines: newLines };
            }),
        }));

        // Handle reveal on output
        const channel = get().channels.find(c => c.id === channelId);
        if (channel?.revealOnOutput && !get().isPanelVisible) {
            get().showPanel(channel.preserveFocus);
        }
    },

    appendOutput: (channelId, text) => {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.trim()) {
                get().appendLine(channelId, line);
            }
        }
    },

    showPanel: (_preserveFocus = true) => {
        set({ isPanelVisible: true });
    },

    hidePanel: () => {
        set({ isPanelVisible: false });
    },

    togglePanel: () => {
        set(state => ({ isPanelVisible: !state.isPanelVisible }));
    },

    setFilter: (filter) => {
        set({ globalFilter: filter });
    },

    toggleTimestamps: () => {
        set(state => ({ showTimestamps: !state.showTimestamps }));
    },

    toggleAutoscroll: () => {
        set(state => ({ autoscroll: !state.autoscroll }));
    },

    getChannel: (channelId) => {
        return get().channels.find(c => c.id === channelId);
    },

    getFilteredLines: (channelId) => {
        const channel = get().getChannel(channelId);
        if (!channel) return [];

        const filter = get().globalFilter.toLowerCase();
        if (!filter) return channel.lines;

        return channel.lines.filter(line =>
            line.message.toLowerCase().includes(filter)
        );
    },
}));

// =============================================================================
// UTILITIES
// =============================================================================

export function formatTimestamp(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
    });
}

export function getLevelColor(level: OutputLevel): string {
    const colors: Record<OutputLevel, string> = {
        info: '#3b82f6',
        warning: '#f59e0b',
        error: '#ef4444',
        debug: '#8b5cf6',
        trace: '#6b7280',
    };
    return colors[level];
}
