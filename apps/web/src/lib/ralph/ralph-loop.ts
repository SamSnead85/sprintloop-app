/**
 * SprintLoop Ralph Wiggum Integration
 * 
 * Implements iterative AI development loops inspired by the Claude Code Ralph Wiggum plugin.
 * Named after the Simpsons character for its persistent iteration despite setbacks.
 * 
 * Core Philosophy:
 * - Continuous forward progress through repeated iterations
 * - Git-based memory for persistent context across iterations
 * - Fresh context per iteration to avoid bloat
 * - Explicit completion criteria for termination
 */

export interface RalphLoopConfig {
    /** Maximum iterations before automatic termination (safety net) */
    maxIterations: number;
    /** Condition that determines when the loop is complete */
    completionPromise: string;
    /** Working directory for the loop */
    workingDirectory: string;
    /** Enable Git tracking for memory persistence */
    gitEnabled: boolean;
    /** Callback on each iteration */
    onIteration?: (iteration: number, result: IterationResult) => void;
    /** Callback when loop completes */
    onComplete?: (summary: LoopSummary) => void;
    /** Callback when loop is cancelled */
    onCancel?: () => void;
}

export interface IterationResult {
    iteration: number;
    success: boolean;
    output: string;
    filesModified: string[];
    completionCheck: boolean;
    duration: number;
}

export interface LoopSummary {
    totalIterations: number;
    totalDuration: number;
    filesModified: string[];
    completionReason: 'success' | 'max_iterations' | 'cancelled' | 'error';
    finalOutput: string;
}

export type RalphLoopStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled' | 'error';

export class RalphLoop {
    private config: RalphLoopConfig;
    private status: RalphLoopStatus = 'idle';
    private currentIteration = 0;
    private results: IterationResult[] = [];
    private startTime = 0;
    private abortController: AbortController | null = null;

    constructor(config: Partial<RalphLoopConfig> = {}) {
        this.config = {
            maxIterations: 50,
            completionPromise: 'All tests pass',
            workingDirectory: '.',
            gitEnabled: true,
            ...config,
        };
    }

    /** Start the Ralph loop */
    async start(prompt: string): Promise<LoopSummary> {
        if (this.status === 'running') {
            throw new Error('Ralph loop already running');
        }

        this.status = 'running';
        this.currentIteration = 0;
        this.results = [];
        this.startTime = Date.now();
        this.abortController = new AbortController();

        try {
            while (this.currentIteration < this.config.maxIterations && this.status === 'running') {
                this.currentIteration++;

                const result = await this.runIteration(prompt, this.currentIteration);
                this.results.push(result);

                this.config.onIteration?.(this.currentIteration, result);

                // Check completion
                if (result.completionCheck) {
                    this.status = 'completed';
                    break;
                }

                // Git commit after each iteration for memory persistence
                if (this.config.gitEnabled && result.filesModified.length > 0) {
                    await this.gitCommit(this.currentIteration, result);
                }
            }

            const summary = this.buildSummary();
            this.config.onComplete?.(summary);
            return summary;

        } catch (error) {
            this.status = 'error';
            throw error;
        }
    }

    /** Cancel the running loop */
    cancel(): void {
        if (this.status === 'running') {
            this.status = 'cancelled';
            this.abortController?.abort();
            this.config.onCancel?.();
        }
    }

    /** Get current status */
    getStatus(): { status: RalphLoopStatus; iteration: number; results: IterationResult[] } {
        return {
            status: this.status,
            iteration: this.currentIteration,
            results: [...this.results],
        };
    }

    /** Run a single iteration */
    private async runIteration(prompt: string, iteration: number): Promise<IterationResult> {
        const iterationStart = Date.now();

        // Build context from previous iterations (Git-based memory)
        const context = await this.buildContext(iteration);

        // Execute the AI task with fresh context
        const result = await this.executeTask(prompt, context);

        // Check if completion criteria is met
        const completionCheck = await this.checkCompletion(result.output);

        return {
            iteration,
            success: true,
            output: result.output,
            filesModified: result.filesModified,
            completionCheck,
            duration: Date.now() - iterationStart,
        };
    }

    /** Build context from Git history */
    private async buildContext(iteration: number): Promise<string> {
        if (!this.config.gitEnabled || iteration === 1) {
            return '';
        }

        // In a real implementation, this would read from Git history
        const previousResults = this.results.slice(-3); // Last 3 iterations

        return previousResults.map(r =>
            `[Iteration ${r.iteration}]: ${r.filesModified.length} files modified`
        ).join('\n');
    }

    /** Execute the AI task (placeholder for actual AI integration) */
    private async executeTask(prompt: string, context: string): Promise<{ output: string; filesModified: string[] }> {
        // This would integrate with the SprintLoop AI provider
        // For now, return a placeholder
        console.log(`[Ralph Loop] Executing with prompt: ${prompt.slice(0, 50)}...`);
        console.log(`[Ralph Loop] Context: ${context || 'Fresh start'}`);

        return {
            output: `Iteration complete. Working on: ${this.config.completionPromise}`,
            filesModified: [],
        };
    }

    /** Check if completion criteria is met */
    private async checkCompletion(output: string): Promise<boolean> {
        // Simple check: look for completion promise in output
        // In a real implementation, this would run tests or other verification
        return output.toLowerCase().includes(this.config.completionPromise.toLowerCase());
    }

    /** Commit changes to Git for memory persistence */
    private async gitCommit(iteration: number, result: IterationResult): Promise<void> {
        console.log(`[Ralph Loop] Git commit for iteration ${iteration}: ${result.filesModified.length} files`);
        // In a real implementation, this would run:
        // git add .
        // git commit -m "Ralph iteration ${iteration}: ${result.output.slice(0, 50)}"
    }

    /** Build final summary */
    private buildSummary(): LoopSummary {
        const allFiles = new Set<string>();
        this.results.forEach(r => r.filesModified.forEach(f => allFiles.add(f)));

        let completionReason: LoopSummary['completionReason'];
        if (this.status === 'completed') {
            completionReason = 'success';
        } else if (this.status === 'cancelled') {
            completionReason = 'cancelled';
        } else if (this.currentIteration >= this.config.maxIterations) {
            completionReason = 'max_iterations';
        } else {
            completionReason = 'error';
        }

        return {
            totalIterations: this.currentIteration,
            totalDuration: Date.now() - this.startTime,
            filesModified: Array.from(allFiles),
            completionReason,
            finalOutput: this.results[this.results.length - 1]?.output || '',
        };
    }
}

/** Parse Ralph loop arguments from command */
export function parseRalphArgs(argsString: string): Partial<RalphLoopConfig> {
    const args: Partial<RalphLoopConfig> = {};

    const maxIterMatch = argsString.match(/--max-iterations\s+(\d+)/);
    if (maxIterMatch) {
        args.maxIterations = parseInt(maxIterMatch[1], 10);
    }

    const completionMatch = argsString.match(/--completion-promise\s+"([^"]+)"/);
    if (completionMatch) {
        args.completionPromise = completionMatch[1];
    }

    const cwdMatch = argsString.match(/--cwd\s+"([^"]+)"/);
    if (cwdMatch) {
        args.workingDirectory = cwdMatch[1];
    }

    const noGitMatch = argsString.match(/--no-git/);
    if (noGitMatch) {
        args.gitEnabled = false;
    }

    return args;
}
