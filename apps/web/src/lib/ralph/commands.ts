/**
 * Ralph Wiggum Command Registry
 * 
 * Integrates Ralph loops with the SprintLoop command palette.
 */

import { RalphLoop, parseRalphArgs, type RalphLoopConfig, type LoopSummary } from './ralph-loop';

// Global active loop reference
let activeRalphLoop: RalphLoop | null = null;

export interface RalphCommand {
    name: string;
    description: string;
    execute: (args: string) => Promise<void>;
}

/**
 * Start a new Ralph loop
 * Usage: /ralph-loop --max-iterations 50 --completion-promise "All tests pass"
 */
export async function startRalphLoop(prompt: string, argsString: string = ''): Promise<LoopSummary> {
    if (activeRalphLoop?.getStatus().status === 'running') {
        throw new Error('A Ralph loop is already running. Use /cancel-ralph to stop it first.');
    }

    const config = parseRalphArgs(argsString);
    activeRalphLoop = new RalphLoop({
        ...config,
        onIteration: (iteration, result) => {
            console.log(`[Ralph] Iteration ${iteration}: ${result.success ? '✓' : '✗'} (${result.duration}ms)`);
            if (result.filesModified.length > 0) {
                console.log(`  Modified: ${result.filesModified.join(', ')}`);
            }
        },
        onComplete: (summary) => {
            console.log(`[Ralph] Complete: ${summary.completionReason} after ${summary.totalIterations} iterations`);
        },
        onCancel: () => {
            console.log('[Ralph] Loop cancelled');
        },
    });

    return activeRalphLoop.start(prompt);
}

/**
 * Cancel the active Ralph loop
 * Usage: /cancel-ralph
 */
export function cancelRalphLoop(): void {
    if (activeRalphLoop) {
        activeRalphLoop.cancel();
        activeRalphLoop = null;
    } else {
        console.log('[Ralph] No active loop to cancel');
    }
}

/**
 * Get status of the active Ralph loop
 * Usage: /ralph-status
 */
export function getRalphStatus(): ReturnType<RalphLoop['getStatus']> | null {
    return activeRalphLoop?.getStatus() ?? null;
}

/**
 * Register Ralph commands with the command palette
 */
export function registerRalphCommands(): RalphCommand[] {
    return [
        {
            name: '/ralph-loop',
            description: 'Start an iterative AI development loop',
            execute: async (args: string) => {
                const prompt = args.replace(/--\S+\s+"[^"]*"/g, '').replace(/--\S+\s+\S+/g, '').trim();
                await startRalphLoop(prompt || 'Continue working on the task', args);
            },
        },
        {
            name: '/cancel-ralph',
            description: 'Cancel the active Ralph loop',
            execute: async () => {
                cancelRalphLoop();
            },
        },
        {
            name: '/ralph-status',
            description: 'Check status of the active Ralph loop',
            execute: async () => {
                const status = getRalphStatus();
                if (status) {
                    console.log(`Status: ${status.status}, Iteration: ${status.iteration}`);
                } else {
                    console.log('No active Ralph loop');
                }
            },
        },
    ];
}

// Export types
export type { RalphLoopConfig, LoopSummary };
