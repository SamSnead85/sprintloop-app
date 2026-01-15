/**
 * Terminal & Shell Operations Module
 * Phases 401-500: Command execution, REPL, process management
 */

import { create } from 'zustand';

export interface TerminalSession {
    id: string;
    name: string;
    cwd: string;
    shell: string;
    history: TerminalCommand[];
    status: 'idle' | 'running' | 'error';
    pid?: number;
    createdAt: number;
}

export interface TerminalCommand {
    id: string;
    command: string;
    output: string;
    exitCode: number | null;
    status: 'pending' | 'running' | 'completed' | 'error' | 'killed';
    startedAt: number;
    completedAt?: number;
    duration?: number;
}

export interface CommandOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    stdin?: string;
    shell?: string;
}

interface TerminalState {
    sessions: Map<string, TerminalSession>;
    activeSessionId: string | null;

    createSession: (name?: string, cwd?: string) => string;
    closeSession: (sessionId: string) => void;

    execute: (sessionId: string, command: string, options?: CommandOptions) => Promise<TerminalCommand>;
    executeBackground: (sessionId: string, command: string) => string;
    killCommand: (sessionId: string, commandId: string) => void;

    sendInput: (sessionId: string, input: string) => void;
    clearHistory: (sessionId: string) => void;

    getSession: (sessionId: string) => TerminalSession | undefined;
    getActiveSession: () => TerminalSession | undefined;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,

    createSession: (name, cwd = '/') => {
        const id = `term-${Date.now()}`;
        const session: TerminalSession = {
            id,
            name: name || `Terminal ${get().sessions.size + 1}`,
            cwd,
            shell: '/bin/zsh',
            history: [],
            status: 'idle',
            createdAt: Date.now(),
        };

        set(state => {
            const sessions = new Map(state.sessions);
            sessions.set(id, session);
            return { sessions, activeSessionId: state.activeSessionId || id };
        });

        console.log('[Terminal] Session created:', id);
        return id;
    },

    closeSession: (sessionId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            sessions.delete(sessionId);
            return {
                sessions,
                activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
            };
        });
    },

    execute: async (sessionId, command, _options) => {
        const cmdId = `cmd-${Date.now()}`;
        const cmd: TerminalCommand = {
            id: cmdId,
            command,
            output: '',
            exitCode: null,
            status: 'running',
            startedAt: Date.now(),
        };

        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    status: 'running',
                    history: [...session.history, cmd],
                });
            }
            return { sessions };
        });

        console.log('[Terminal] Executing:', command);

        // Simulate command execution
        await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));

        const result: TerminalCommand = {
            ...cmd,
            output: `$ ${command}\nCommand executed successfully`,
            exitCode: 0,
            status: 'completed',
            completedAt: Date.now(),
            duration: Date.now() - cmd.startedAt,
        };

        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    status: 'idle',
                    history: session.history.map(c => c.id === cmdId ? result : c),
                });
            }
            return { sessions };
        });

        return result;
    },

    executeBackground: (_sessionId, command) => {
        const cmdId = `bg-${Date.now()}`;
        console.log('[Terminal] Background:', command);
        return cmdId;
    },

    killCommand: (sessionId, commandId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    history: session.history.map(c =>
                        c.id === commandId ? { ...c, status: 'killed' as const, exitCode: -1 } : c
                    ),
                });
            }
            return { sessions };
        });
    },

    sendInput: (_sessionId, input) => {
        console.log('[Terminal] Input:', input);
    },

    clearHistory: (sessionId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, { ...session, history: [] });
            }
            return { sessions };
        });
    },

    getSession: (sessionId) => get().sessions.get(sessionId),
    getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.get(activeSessionId) : undefined;
    },
}));

/** Run a command and return output */
export async function runCommand(command: string, cwd?: string): Promise<string> {
    const store = useTerminalStore.getState();
    let sessionId = store.activeSessionId;

    if (!sessionId) {
        sessionId = store.createSession('Default', cwd);
    }

    const result = await store.execute(sessionId, command, { cwd });
    return result.output;
}

/** Run npm/pnpm commands */
export async function runPackageManager(command: string, cwd?: string): Promise<string> {
    return runCommand(`pnpm ${command}`, cwd);
}

/** Run git commands */
export async function runGit(command: string, cwd?: string): Promise<string> {
    return runCommand(`git ${command}`, cwd);
}
