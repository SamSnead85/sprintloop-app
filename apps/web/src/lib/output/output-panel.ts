/**
 * Output Panel
 * 
 * Displays build logs, task output, and extension messages.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type OutputChannel = {
    id: string;
    name: string;
    lines: OutputLine[];
    visible: boolean;
};

export type OutputLine = {
    timestamp: number;
    text: string;
    type: 'info' | 'warning' | 'error' | 'success';
};

export interface OutputState {
    channels: Map<string, OutputChannel>;
    activeChannelId: string | null;

    // Actions
    createChannel: (id: string, name: string) => void;
    deleteChannel: (id: string) => void;
    appendLine: (channelId: string, text: string, type?: OutputLine['type']) => void;
    appendLines: (channelId: string, lines: string[], type?: OutputLine['type']) => void;
    clear: (channelId: string) => void;
    clearAll: () => void;
    setActiveChannel: (channelId: string) => void;
    show: (channelId: string) => void;
    hide: (channelId: string) => void;
    getChannel: (channelId: string) => OutputChannel | undefined;
}

// =============================================================================
// OUTPUT STORE
// =============================================================================

export const useOutput = create<OutputState>((set, get) => ({
    channels: new Map([
        ['output', { id: 'output', name: 'Output', lines: [], visible: true }],
        ['debug', { id: 'debug', name: 'Debug Console', lines: [], visible: true }],
        ['terminal', { id: 'terminal', name: 'Terminal', lines: [], visible: true }],
    ]),
    activeChannelId: 'output',

    createChannel: (id, name) => {
        set(state => {
            const channels = new Map(state.channels);
            channels.set(id, { id, name, lines: [], visible: true });
            return { channels };
        });
    },

    deleteChannel: (id) => {
        set(state => {
            const channels = new Map(state.channels);
            channels.delete(id);
            return {
                channels,
                activeChannelId: state.activeChannelId === id ? 'output' : state.activeChannelId,
            };
        });
    },

    appendLine: (channelId, text, type = 'info') => {
        const line: OutputLine = { timestamp: Date.now(), text, type };
        set(state => {
            const channels = new Map(state.channels);
            const channel = channels.get(channelId);
            if (channel) {
                channels.set(channelId, {
                    ...channel,
                    lines: [...channel.lines, line].slice(-1000), // Keep last 1000 lines
                });
            }
            return { channels };
        });
    },

    appendLines: (channelId, lines, type = 'info') => {
        const newLines = lines.map(text => ({
            timestamp: Date.now(),
            text,
            type,
        }));
        set(state => {
            const channels = new Map(state.channels);
            const channel = channels.get(channelId);
            if (channel) {
                channels.set(channelId, {
                    ...channel,
                    lines: [...channel.lines, ...newLines].slice(-1000),
                });
            }
            return { channels };
        });
    },

    clear: (channelId) => {
        set(state => {
            const channels = new Map(state.channels);
            const channel = channels.get(channelId);
            if (channel) {
                channels.set(channelId, { ...channel, lines: [] });
            }
            return { channels };
        });
    },

    clearAll: () => {
        set(state => {
            const channels = new Map(state.channels);
            for (const [id, channel] of channels) {
                channels.set(id, { ...channel, lines: [] });
            }
            return { channels };
        });
    },

    setActiveChannel: (channelId) => {
        set({ activeChannelId: channelId });
    },

    show: (channelId) => {
        set(state => {
            const channels = new Map(state.channels);
            const channel = channels.get(channelId);
            if (channel) {
                channels.set(channelId, { ...channel, visible: true });
            }
            return { channels, activeChannelId: channelId };
        });
    },

    hide: (channelId) => {
        set(state => {
            const channels = new Map(state.channels);
            const channel = channels.get(channelId);
            if (channel) {
                channels.set(channelId, { ...channel, visible: false });
            }
            return { channels };
        });
    },

    getChannel: (channelId) => {
        return get().channels.get(channelId);
    },
}));

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function log(text: string, channelId = 'output'): void {
    useOutput.getState().appendLine(channelId, text, 'info');
}

export function logError(text: string, channelId = 'output'): void {
    useOutput.getState().appendLine(channelId, text, 'error');
}

export function logWarning(text: string, channelId = 'output'): void {
    useOutput.getState().appendLine(channelId, text, 'warning');
}

export function logSuccess(text: string, channelId = 'output'): void {
    useOutput.getState().appendLine(channelId, text, 'success');
}
