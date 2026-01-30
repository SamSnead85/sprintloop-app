/**
 * Terminal Service
 * 
 * Multi-terminal management with shell integration and output handling.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Terminal {
    id: string;
    name: string;
    shellType: ShellType;
    cwd: string;
    env: Record<string, string>;
    rows: number;
    cols: number;
    output: TerminalLine[];
    isActive: boolean;
    exitCode: number | null;
    pid?: number;
}

export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd' | 'sh';

export interface TerminalLine {
    id: number;
    type: 'input' | 'output' | 'error' | 'system';
    content: string;
    timestamp: number;
}

export interface TerminalProfile {
    name: string;
    shell: string;
    args?: string[];
    env?: Record<string, string>;
    icon?: string;
}

export interface TerminalServiceState {
    terminals: Map<string, Terminal>;
    activeTerminalId: string | null;
    profiles: TerminalProfile[];
    defaultProfile: string;
    history: string[];
    historyIndex: number;

    // Terminal Management
    createTerminal: (options?: Partial<Terminal>) => string;
    closeTerminal: (id: string) => void;
    setActiveTerminal: (id: string) => void;
    renameTerminal: (id: string, name: string) => void;
    clearTerminal: (id: string) => void;

    // I/O
    writeToTerminal: (id: string, data: string) => void;
    sendInput: (id: string, input: string) => Promise<void>;

    // History
    addToHistory: (command: string) => void;
    getPreviousCommand: () => string | null;
    getNextCommand: () => string | null;
    searchHistory: (query: string) => string[];

    // Profiles
    addProfile: (profile: TerminalProfile) => void;
    removeProfile: (name: string) => void;
    setDefaultProfile: (name: string) => void;

    // Utilities
    getTerminal: (id: string) => Terminal | undefined;
    getAllTerminals: () => Terminal[];
    killProcess: (id: string) => Promise<void>;
}

// =============================================================================
// TERMINAL STORE
// =============================================================================

let terminalIdCounter = 0;
let lineIdCounter = 0;

export const useTerminalService = create<TerminalServiceState>((set, get) => ({
    terminals: new Map(),
    activeTerminalId: null,
    profiles: getDefaultProfiles(),
    defaultProfile: 'bash',
    history: [],
    historyIndex: -1,

    createTerminal: (options = {}) => {
        const id = `terminal_${++terminalIdCounter}`;
        const profile = get().profiles.find(p => p.name === get().defaultProfile);

        const terminal: Terminal = {
            id,
            name: options.name || `Terminal ${terminalIdCounter}`,
            shellType: detectShellType(profile?.shell || '/bin/bash'),
            cwd: options.cwd || process.cwd?.() || '/home/user',
            env: { ...process.env as Record<string, string>, ...options.env },
            rows: options.rows || 24,
            cols: options.cols || 80,
            output: [{
                id: ++lineIdCounter,
                type: 'system',
                content: `Terminal started - ${profile?.shell || 'bash'}`,
                timestamp: Date.now(),
            }],
            isActive: true,
            exitCode: null,
            ...options,
        };

        set(state => {
            const terminals = new Map(state.terminals);
            // Deactivate others
            for (const [tid, t] of terminals) {
                terminals.set(tid, { ...t, isActive: false });
            }
            terminals.set(id, terminal);
            return { terminals, activeTerminalId: id };
        });

        return id;
    },

    closeTerminal: (id) => {
        set(state => {
            const terminals = new Map(state.terminals);
            terminals.delete(id);

            let newActiveId = state.activeTerminalId;
            if (state.activeTerminalId === id) {
                const remaining = Array.from(terminals.keys());
                newActiveId = remaining[remaining.length - 1] || null;
                if (newActiveId) {
                    const t = terminals.get(newActiveId)!;
                    terminals.set(newActiveId, { ...t, isActive: true });
                }
            }

            return { terminals, activeTerminalId: newActiveId };
        });
    },

    setActiveTerminal: (id) => {
        set(state => {
            const terminals = new Map(state.terminals);
            for (const [tid, t] of terminals) {
                terminals.set(tid, { ...t, isActive: tid === id });
            }
            return { terminals, activeTerminalId: id };
        });
    },

    renameTerminal: (id, name) => {
        set(state => {
            const terminals = new Map(state.terminals);
            const terminal = terminals.get(id);
            if (terminal) {
                terminals.set(id, { ...terminal, name });
            }
            return { terminals };
        });
    },

    clearTerminal: (id) => {
        set(state => {
            const terminals = new Map(state.terminals);
            const terminal = terminals.get(id);
            if (terminal) {
                terminals.set(id, {
                    ...terminal,
                    output: [{
                        id: ++lineIdCounter,
                        type: 'system',
                        content: 'Terminal cleared',
                        timestamp: Date.now(),
                    }],
                });
            }
            return { terminals };
        });
    },

    writeToTerminal: (id, data) => {
        set(state => {
            const terminals = new Map(state.terminals);
            const terminal = terminals.get(id);
            if (terminal) {
                terminals.set(id, {
                    ...terminal,
                    output: [...terminal.output, {
                        id: ++lineIdCounter,
                        type: 'output',
                        content: data,
                        timestamp: Date.now(),
                    }],
                });
            }
            return { terminals };
        });
    },

    sendInput: async (id, input) => {
        const terminal = get().terminals.get(id);
        if (!terminal) return;

        // Add command to history
        if (input.trim()) {
            get().addToHistory(input.trim());
        }

        // Add input line
        set(state => {
            const terminals = new Map(state.terminals);
            const t = terminals.get(id)!;
            terminals.set(id, {
                ...t,
                output: [...t.output, {
                    id: ++lineIdCounter,
                    type: 'input',
                    content: `$ ${input}`,
                    timestamp: Date.now(),
                }],
            });
            return { terminals };
        });

        // Simulate command execution
        await simulateCommand(id, input, get);
    },

    addToHistory: (command) => {
        set(state => {
            const history = [...state.history];
            // Don't add duplicates of last command
            if (history[history.length - 1] !== command) {
                history.push(command);
                // Keep last 1000 commands
                if (history.length > 1000) {
                    history.shift();
                }
            }
            return { history, historyIndex: history.length };
        });
    },

    getPreviousCommand: () => {
        const { history, historyIndex } = get();
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            set({ historyIndex: newIndex });
            return history[newIndex];
        }
        return null;
    },

    getNextCommand: () => {
        const { history, historyIndex } = get();
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            set({ historyIndex: newIndex });
            return history[newIndex];
        }
        set({ historyIndex: history.length });
        return null;
    },

    searchHistory: (query) => {
        return get().history.filter(cmd =>
            cmd.toLowerCase().includes(query.toLowerCase())
        ).slice(-20);
    },

    addProfile: (profile) => {
        set(state => ({
            profiles: [...state.profiles, profile],
        }));
    },

    removeProfile: (name) => {
        set(state => ({
            profiles: state.profiles.filter(p => p.name !== name),
        }));
    },

    setDefaultProfile: (name) => {
        set({ defaultProfile: name });
    },

    getTerminal: (id) => get().terminals.get(id),

    getAllTerminals: () => Array.from(get().terminals.values()),

    killProcess: async (id) => {
        set(state => {
            const terminals = new Map(state.terminals);
            const terminal = terminals.get(id);
            if (terminal) {
                terminals.set(id, {
                    ...terminal,
                    output: [...terminal.output, {
                        id: ++lineIdCounter,
                        type: 'system',
                        content: '^C',
                        timestamp: Date.now(),
                    }],
                });
            }
            return { terminals };
        });
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

function getDefaultProfiles(): TerminalProfile[] {
    return [
        { name: 'bash', shell: '/bin/bash', icon: '🐚' },
        { name: 'zsh', shell: '/bin/zsh', icon: '⚡' },
        { name: 'fish', shell: '/usr/bin/fish', icon: '🐟' },
        { name: 'sh', shell: '/bin/sh', icon: '📜' },
    ];
}

function detectShellType(shellPath: string): ShellType {
    if (shellPath.includes('zsh')) return 'zsh';
    if (shellPath.includes('fish')) return 'fish';
    if (shellPath.includes('powershell') || shellPath.includes('pwsh')) return 'powershell';
    if (shellPath.includes('cmd')) return 'cmd';
    if (shellPath.includes('bash')) return 'bash';
    return 'sh';
}

async function simulateCommand(
    id: string,
    input: string,
    get: () => TerminalServiceState
): Promise<void> {
    const cmd = input.trim().split(' ')[0];
    const args = input.trim().split(' ').slice(1);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate common commands
    switch (cmd) {
        case 'ls':
            get().writeToTerminal(id, 'node_modules/\nsrc/\npackage.json\ntsconfig.json\nREADME.md');
            break;
        case 'pwd':
            get().writeToTerminal(id, '/home/user/project');
            break;
        case 'echo':
            get().writeToTerminal(id, args.join(' ').replace(/["']/g, ''));
            break;
        case 'clear':
            get().clearTerminal(id);
            break;
        case 'date':
            get().writeToTerminal(id, new Date().toString());
            break;
        case 'whoami':
            get().writeToTerminal(id, 'developer');
            break;
        case 'node':
        case 'npm':
        case 'yarn':
        case 'pnpm':
            get().writeToTerminal(id, `Running ${cmd} ${args.join(' ')}...`);
            await new Promise(resolve => setTimeout(resolve, 300));
            get().writeToTerminal(id, '✓ Done');
            break;
        case 'git':
            handleGitCommand(id, args, get);
            break;
        case 'help':
            get().writeToTerminal(id, `Available commands: ls, pwd, echo, clear, date, whoami, git, npm, node, help`);
            break;
        default:
            if (cmd) {
                get().writeToTerminal(id, `command not found: ${cmd}`);
            }
    }
}

function handleGitCommand(id: string, args: string[], get: () => TerminalServiceState): void {
    const subcommand = args[0];

    switch (subcommand) {
        case 'status':
            get().writeToTerminal(id, `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   src/index.ts

no changes added to commit`);
            break;
        case 'log':
            get().writeToTerminal(id, `commit abc1234 (HEAD -> main)
Author: Developer <dev@example.com>
Date:   Today

    feat: latest changes

commit def5678
Author: Developer <dev@example.com>
Date:   Yesterday

    fix: bug fix`);
            break;
        case 'branch':
            get().writeToTerminal(id, `* main
  feature/new-feature
  develop`);
            break;
        default:
            get().writeToTerminal(id, `git: '${subcommand}' is not a git command`);
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { detectShellType };
