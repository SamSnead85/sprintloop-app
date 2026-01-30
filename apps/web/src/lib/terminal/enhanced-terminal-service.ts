/**
 * Enhanced Terminal Service
 * 
 * Advanced terminal features including multiple terminals, profiles, and shell integration.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'node' | 'python';

export interface TerminalProfile {
    id: string;
    name: string;
    shell: ShellType;
    icon: string;
    color: string;
    args?: string[];
    env?: Record<string, string>;
    cwd?: string;
    isDefault?: boolean;
}

export interface TerminalInstance {
    id: string;
    profileId: string;
    title: string;
    cwd: string;
    pid?: number;
    isActive: boolean;
    history: string[];
    output: string[];
    exitCode?: number;
    isRunning: boolean;
    createdAt: Date;
}

export interface TerminalHistoryEntry {
    command: string;
    timestamp: Date;
    cwd: string;
    exitCode?: number;
}

export interface EnhancedTerminalState {
    terminals: TerminalInstance[];
    profiles: TerminalProfile[];
    activeTerminalId: string | null;
    splitLayout: 'none' | 'horizontal' | 'vertical';
    commandHistory: TerminalHistoryEntry[];
    isPanelMaximized: boolean;

    // Terminal lifecycle
    createTerminal: (profileId?: string, cwd?: string) => string;
    closeTerminal: (terminalId: string) => void;
    closeAllTerminals: () => void;
    setActiveTerminal: (terminalId: string) => void;
    renameTerminal: (terminalId: string, name: string) => void;

    // Terminal operations
    sendInput: (terminalId: string, input: string) => void;
    executeCommand: (terminalId: string, command: string) => void;
    clearTerminal: (terminalId: string) => void;
    killProcess: (terminalId: string) => void;

    // Profile management
    addProfile: (profile: Omit<TerminalProfile, 'id'>) => string;
    updateProfile: (profileId: string, updates: Partial<TerminalProfile>) => void;
    deleteProfile: (profileId: string) => void;
    setDefaultProfile: (profileId: string) => void;

    // Layout
    setSplitLayout: (layout: 'none' | 'horizontal' | 'vertical') => void;
    toggleMaximize: () => void;

    // History
    addToHistory: (entry: Omit<TerminalHistoryEntry, 'timestamp'>) => void;
    getHistoryForCwd: (cwd: string) => TerminalHistoryEntry[];
    clearHistory: () => void;

    // Getters
    getTerminal: (terminalId: string) => TerminalInstance | undefined;
    getProfile: (profileId: string) => TerminalProfile | undefined;
    getDefaultProfile: () => TerminalProfile;
}

// =============================================================================
// DEFAULT PROFILES
// =============================================================================

const DEFAULT_PROFILES: TerminalProfile[] = [
    {
        id: 'zsh',
        name: 'zsh',
        shell: 'zsh',
        icon: '🐚',
        color: '#22c55e',
        isDefault: true,
    },
    {
        id: 'bash',
        name: 'bash',
        shell: 'bash',
        icon: '💻',
        color: '#3b82f6',
    },
    {
        id: 'node',
        name: 'Node.js',
        shell: 'node',
        icon: '💚',
        color: '#16a34a',
        args: ['--experimental-repl-await'],
    },
    {
        id: 'python',
        name: 'Python',
        shell: 'python',
        icon: '🐍',
        color: '#fbbf24',
        args: ['-i'],
    },
];

// =============================================================================
// TERMINAL STORE
// =============================================================================

export const useEnhancedTerminalService = create<EnhancedTerminalState>()(
    persist(
        (set, get) => ({
            terminals: [],
            profiles: DEFAULT_PROFILES,
            activeTerminalId: null,
            splitLayout: 'none',
            commandHistory: [],
            isPanelMaximized: false,

            createTerminal: (profileId, cwd) => {
                const profile = profileId
                    ? get().getProfile(profileId)
                    : get().getDefaultProfile();

                const terminal: TerminalInstance = {
                    id: `term_${Date.now()}`,
                    profileId: profile?.id || 'zsh',
                    title: profile?.name || 'Terminal',
                    cwd: cwd || '/Users/dev/project',
                    isActive: true,
                    history: [],
                    output: [],
                    isRunning: true,
                    createdAt: new Date(),
                };

                set(state => ({
                    terminals: [
                        ...state.terminals.map(t => ({ ...t, isActive: false })),
                        terminal,
                    ],
                    activeTerminalId: terminal.id,
                }));

                // Add welcome message
                get().sendInput(terminal.id, `Welcome to SprintLoop Terminal (${profile?.name})\n$ `);

                return terminal.id;
            },

            closeTerminal: (terminalId) => {
                set(state => {
                    const remaining = state.terminals.filter(t => t.id !== terminalId);
                    const wasActive = state.activeTerminalId === terminalId;

                    return {
                        terminals: remaining,
                        activeTerminalId: wasActive
                            ? remaining[remaining.length - 1]?.id || null
                            : state.activeTerminalId,
                    };
                });
            },

            closeAllTerminals: () => {
                set({ terminals: [], activeTerminalId: null });
            },

            setActiveTerminal: (terminalId) => {
                set(state => ({
                    terminals: state.terminals.map(t => ({
                        ...t,
                        isActive: t.id === terminalId,
                    })),
                    activeTerminalId: terminalId,
                }));
            },

            renameTerminal: (terminalId, name) => {
                set(state => ({
                    terminals: state.terminals.map(t =>
                        t.id === terminalId ? { ...t, title: name } : t
                    ),
                }));
            },

            sendInput: (terminalId, input) => {
                set(state => ({
                    terminals: state.terminals.map(t => {
                        if (t.id !== terminalId) return t;
                        return {
                            ...t,
                            output: [...t.output, input],
                        };
                    }),
                }));
            },

            executeCommand: (terminalId, command) => {
                const terminal = get().getTerminal(terminalId);
                if (!terminal) return;

                // Add to output
                get().sendInput(terminalId, command);

                // Simulate command execution
                const output = simulateCommand(command, terminal.cwd);
                get().sendInput(terminalId, output);
                get().sendInput(terminalId, `$ `);

                // Add to history
                get().addToHistory({
                    command,
                    cwd: terminal.cwd,
                    exitCode: 0,
                });

                // Update terminal history
                set(state => ({
                    terminals: state.terminals.map(t => {
                        if (t.id !== terminalId) return t;
                        return {
                            ...t,
                            history: [...t.history, command].slice(-100),
                        };
                    }),
                }));
            },

            clearTerminal: (terminalId) => {
                set(state => ({
                    terminals: state.terminals.map(t =>
                        t.id === terminalId ? { ...t, output: ['$ '] } : t
                    ),
                }));
            },

            killProcess: (terminalId) => {
                set(state => ({
                    terminals: state.terminals.map(t =>
                        t.id === terminalId
                            ? { ...t, isRunning: false, exitCode: -1 }
                            : t
                    ),
                }));
            },

            addProfile: (profile) => {
                const id = `profile_${Date.now()}`;
                set(state => ({
                    profiles: [...state.profiles, { ...profile, id }],
                }));
                return id;
            },

            updateProfile: (profileId, updates) => {
                set(state => ({
                    profiles: state.profiles.map(p =>
                        p.id === profileId ? { ...p, ...updates } : p
                    ),
                }));
            },

            deleteProfile: (profileId) => {
                set(state => ({
                    profiles: state.profiles.filter(p => p.id !== profileId),
                }));
            },

            setDefaultProfile: (profileId) => {
                set(state => ({
                    profiles: state.profiles.map(p => ({
                        ...p,
                        isDefault: p.id === profileId,
                    })),
                }));
            },

            setSplitLayout: (layout) => {
                set({ splitLayout: layout });
            },

            toggleMaximize: () => {
                set(state => ({ isPanelMaximized: !state.isPanelMaximized }));
            },

            addToHistory: (entry) => {
                set(state => ({
                    commandHistory: [
                        { ...entry, timestamp: new Date() },
                        ...state.commandHistory,
                    ].slice(0, 500),
                }));
            },

            getHistoryForCwd: (cwd) => {
                return get().commandHistory.filter(h => h.cwd === cwd);
            },

            clearHistory: () => {
                set({ commandHistory: [] });
            },

            getTerminal: (terminalId) => {
                return get().terminals.find(t => t.id === terminalId);
            },

            getProfile: (profileId) => {
                return get().profiles.find(p => p.id === profileId);
            },

            getDefaultProfile: () => {
                return get().profiles.find(p => p.isDefault) || get().profiles[0];
            },
        }),
        {
            name: 'sprintloop-terminal',
            partialize: (state) => ({
                profiles: state.profiles,
                commandHistory: state.commandHistory.slice(0, 100),
            }),
        }
    )
);

// =============================================================================
// SIMULATION
// =============================================================================

function simulateCommand(command: string, cwd: string): string {
    const cmd = command.trim().split(' ')[0];

    const responses: Record<string, string> = {
        ls: 'node_modules/\npackage.json\nsrc/\ntsconfig.json\nvite.config.ts',
        pwd: cwd,
        whoami: 'developer',
        date: new Date().toString(),
        clear: '',
        echo: command.replace('echo ', ''),
        node: 'Welcome to Node.js\n>',
        npm: 'npm (version 10.2.0)',
        git: 'git version 2.43.0',
    };

    return responses[cmd] || `${cmd}: command executed`;
}

// =============================================================================
// UTILITIES
// =============================================================================

export function getShellIcon(shell: ShellType): string {
    const icons: Record<ShellType, string> = {
        bash: '💻',
        zsh: '🐚',
        fish: '🐟',
        powershell: '⚡',
        cmd: '📦',
        node: '💚',
        python: '🐍',
    };
    return icons[shell];
}

export function getShellColor(shell: ShellType): string {
    const colors: Record<ShellType, string> = {
        bash: '#3b82f6',
        zsh: '#22c55e',
        fish: '#f97316',
        powershell: '#0078d4',
        cmd: '#6b7280',
        node: '#16a34a',
        python: '#fbbf24',
    };
    return colors[shell];
}
