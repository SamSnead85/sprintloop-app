/**
 * Turbo Mode
 * 
 * Phase 113: Fully autonomous execution without approval
 * Agent executes terminal commands independently with safety guardrails
 * Source: Windsurf Turbo Mode, Codex CLI Full Auto
 */

import { create } from 'zustand';

export interface TurboModeConfig {
    enabled: boolean;
    maxActionsPerSession: number;
    maxCostPerSession: number;
    allowedCommands: CommandPolicy[];
    blockedPatterns: string[];
    sandboxMode: 'none' | 'soft' | 'strict';
    autoRollbackOnError: boolean;
    requireConfirmationFor: ConfirmationRule[];
}

export interface CommandPolicy {
    pattern: string;
    allowed: boolean;
    requiresConfirmation: boolean;
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

export interface ConfirmationRule {
    type: 'file_delete' | 'git_push' | 'npm_publish' | 'database_write' | 'external_api' | 'system_command';
    threshold?: number;
    message: string;
}

export interface TurboSession {
    id: string;
    startedAt: number;
    actionCount: number;
    totalCost: number;
    actions: TurboAction[];
    status: 'active' | 'paused' | 'completed' | 'errored' | 'limit_reached';
    pauseReason?: string;
}

export interface TurboAction {
    id: string;
    type: 'file_read' | 'file_write' | 'file_delete' | 'terminal' | 'api_call';
    description: string;
    command?: string;
    status: 'pending' | 'approved' | 'executed' | 'failed' | 'skipped';
    result?: string;
    error?: string;
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    duration?: number;
    cost?: number;
}

interface TurboModeState {
    config: TurboModeConfig;
    currentSession: TurboSession | null;
    history: TurboSession[];

    // Mode control
    enableTurboMode: (config?: Partial<TurboModeConfig>) => void;
    disableTurboMode: () => void;
    pauseTurboMode: (reason: string) => void;
    resumeTurboMode: () => void;

    // Session management
    startSession: () => string;
    endSession: () => void;

    // Action handling
    proposeAction: (action: Omit<TurboAction, 'id' | 'status' | 'timestamp'>) => Promise<boolean>;
    executeAction: (actionId: string) => Promise<TurboAction>;

    // Safety checks
    checkSafety: (action: TurboAction) => SafetyCheckResult;
    isWithinLimits: () => boolean;

    // Config
    updateConfig: (config: Partial<TurboModeConfig>) => void;
}

export interface SafetyCheckResult {
    safe: boolean;
    requiresConfirmation: boolean;
    riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    warnings: string[];
    blockedReason?: string;
}

const DEFAULT_CONFIG: TurboModeConfig = {
    enabled: false,
    maxActionsPerSession: 100,
    maxCostPerSession: 1.00, // $1.00 max per session
    allowedCommands: [
        { pattern: 'npm install', allowed: true, requiresConfirmation: false, riskLevel: 'safe' },
        { pattern: 'npm run *', allowed: true, requiresConfirmation: false, riskLevel: 'safe' },
        { pattern: 'npm test', allowed: true, requiresConfirmation: false, riskLevel: 'safe' },
        { pattern: 'git status', allowed: true, requiresConfirmation: false, riskLevel: 'safe' },
        { pattern: 'git diff', allowed: true, requiresConfirmation: false, riskLevel: 'safe' },
        { pattern: 'git add *', allowed: true, requiresConfirmation: false, riskLevel: 'low' },
        { pattern: 'git commit *', allowed: true, requiresConfirmation: true, riskLevel: 'medium' },
        { pattern: 'git push *', allowed: true, requiresConfirmation: true, riskLevel: 'high' },
        { pattern: 'rm *', allowed: false, requiresConfirmation: true, riskLevel: 'critical' },
        { pattern: 'sudo *', allowed: false, requiresConfirmation: true, riskLevel: 'critical' },
    ],
    blockedPatterns: [
        'rm -rf /',
        'sudo rm',
        ':(){:|:&};:',
        'chmod -R 777',
        'curl * | bash',
        'wget * | bash',
    ],
    sandboxMode: 'soft',
    autoRollbackOnError: true,
    requireConfirmationFor: [
        { type: 'file_delete', message: 'Deleting files requires confirmation' },
        { type: 'git_push', message: 'Pushing to remote requires confirmation' },
        { type: 'npm_publish', message: 'Publishing packages requires confirmation' },
        { type: 'database_write', message: 'Database writes require confirmation' },
    ],
};

export const useTurboModeStore = create<TurboModeState>((set, get) => ({
    config: DEFAULT_CONFIG,
    currentSession: null,
    history: [],

    enableTurboMode: (configOverrides) => {
        set(state => ({
            config: { ...state.config, ...configOverrides, enabled: true },
        }));
        console.log('[TurboMode] Enabled with config:', get().config);
    },

    disableTurboMode: () => {
        set(state => ({
            config: { ...state.config, enabled: false },
        }));
        console.log('[TurboMode] Disabled');
    },

    pauseTurboMode: (reason) => {
        set(state => ({
            currentSession: state.currentSession
                ? { ...state.currentSession, status: 'paused', pauseReason: reason }
                : null,
        }));
    },

    resumeTurboMode: () => {
        set(state => ({
            currentSession: state.currentSession
                ? { ...state.currentSession, status: 'active', pauseReason: undefined }
                : null,
        }));
    },

    startSession: () => {
        const id = `turbo-${Date.now()}`;
        const session: TurboSession = {
            id,
            startedAt: Date.now(),
            actionCount: 0,
            totalCost: 0,
            actions: [],
            status: 'active',
        };

        set({ currentSession: session });
        console.log('[TurboMode] Session started:', id);
        return id;
    },

    endSession: () => {
        const session = get().currentSession;
        if (session) {
            set(state => ({
                currentSession: null,
                history: [...state.history, { ...session, status: 'completed' }],
            }));
        }
    },

    proposeAction: async (action) => {
        const { config, currentSession } = get();

        if (!config.enabled || !currentSession || currentSession.status !== 'active') {
            return false;
        }

        const turboAction: TurboAction = {
            ...action,
            id: `action-${Date.now()}`,
            status: 'pending',
            timestamp: Date.now(),
        };

        // Safety check
        const safety = get().checkSafety(turboAction);

        if (!safety.safe) {
            console.log('[TurboMode] Action blocked:', safety.blockedReason);
            turboAction.status = 'skipped';
            turboAction.error = safety.blockedReason;

            set(state => ({
                currentSession: state.currentSession
                    ? {
                        ...state.currentSession,
                        actions: [...state.currentSession.actions, turboAction],
                    }
                    : null,
            }));

            return false;
        }

        if (safety.requiresConfirmation) {
            // In turbo mode strict, pause for confirmation
            get().pauseTurboMode('Action requires confirmation');
            return false;
        }

        // Check limits
        if (!get().isWithinLimits()) {
            set(state => ({
                currentSession: state.currentSession
                    ? { ...state.currentSession, status: 'limit_reached' }
                    : null,
            }));
            return false;
        }

        // Approve action
        turboAction.status = 'approved';
        set(state => ({
            currentSession: state.currentSession
                ? {
                    ...state.currentSession,
                    actions: [...state.currentSession.actions, turboAction],
                }
                : null,
        }));

        return true;
    },

    executeAction: async (actionId) => {
        const session = get().currentSession;
        const action = session?.actions.find(a => a.id === actionId);

        if (!action || action.status !== 'approved') {
            throw new Error('Action not approved');
        }

        const startTime = Date.now();

        try {
            // Execute the action (simulated)
            console.log('[TurboMode] Executing:', action.description);
            await new Promise(resolve => setTimeout(resolve, 500));

            set(state => ({
                currentSession: state.currentSession
                    ? {
                        ...state.currentSession,
                        actionCount: state.currentSession.actionCount + 1,
                        actions: state.currentSession.actions.map(a =>
                            a.id === actionId
                                ? {
                                    ...a,
                                    status: 'executed' as const,
                                    result: 'Completed successfully',
                                    duration: Date.now() - startTime,
                                }
                                : a
                        ),
                    }
                    : null,
            }));

            return { ...action, status: 'executed' as const };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            set(state => ({
                currentSession: state.currentSession
                    ? {
                        ...state.currentSession,
                        actions: state.currentSession.actions.map(a =>
                            a.id === actionId
                                ? {
                                    ...a,
                                    status: 'failed' as const,
                                    error: errorMessage,
                                    duration: Date.now() - startTime,
                                }
                                : a
                        ),
                        status: state.config.autoRollbackOnError ? 'errored' : state.currentSession.status,
                    }
                    : null,
            }));

            throw error;
        }
    },

    checkSafety: (action) => {
        const { config } = get();
        const result: SafetyCheckResult = {
            safe: true,
            requiresConfirmation: false,
            riskLevel: action.riskLevel,
            warnings: [],
        };

        // Check blocked patterns
        if (action.command) {
            for (const pattern of config.blockedPatterns) {
                if (action.command.includes(pattern)) {
                    result.safe = false;
                    result.blockedReason = `Blocked dangerous pattern: ${pattern}`;
                    return result;
                }
            }

            // Check command policies
            for (const policy of config.allowedCommands) {
                const regex = new RegExp('^' + policy.pattern.replace(/\*/g, '.*') + '$');
                if (regex.test(action.command)) {
                    if (!policy.allowed) {
                        result.safe = false;
                        result.blockedReason = `Command not allowed: ${action.command}`;
                        return result;
                    }
                    result.requiresConfirmation = policy.requiresConfirmation;
                    result.riskLevel = policy.riskLevel;
                    break;
                }
            }
        }

        // Check confirmation rules
        for (const rule of config.requireConfirmationFor) {
            if (
                (rule.type === 'file_delete' && action.type === 'file_delete') ||
                (rule.type === 'git_push' && action.command?.includes('git push'))
            ) {
                result.requiresConfirmation = true;
                result.warnings.push(rule.message);
            }
        }

        return result;
    },

    isWithinLimits: () => {
        const { config, currentSession } = get();
        if (!currentSession) return false;

        return (
            currentSession.actionCount < config.maxActionsPerSession &&
            currentSession.totalCost < config.maxCostPerSession
        );
    },

    updateConfig: (configUpdates) => {
        set(state => ({
            config: { ...state.config, ...configUpdates },
        }));
    },
}));

/**
 * Execute a command in turbo mode
 */
export async function turboExecute(
    command: string,
    description: string
): Promise<boolean> {
    const store = useTurboModeStore.getState();

    const approved = await store.proposeAction({
        type: 'terminal',
        description,
        command,
        riskLevel: 'low',
    });

    if (!approved) {
        return false;
    }

    const session = store.currentSession;
    const actionId = session?.actions[session.actions.length - 1]?.id;

    if (actionId) {
        await store.executeAction(actionId);
        return true;
    }

    return false;
}
