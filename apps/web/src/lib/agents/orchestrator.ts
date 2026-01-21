/**
 * Agent Orchestrator
 * Coordinates multiple agents to complete complex tasks
 */

import { type AgentRole, type AgentResponse } from './base-agent';
import { PlannerAgent } from './planner-agent';
import { CoderAgent } from './coder-agent';
import { ReviewerAgent } from './reviewer-agent';

export interface OrchestrationResult {
    success: boolean;
    plan: string;
    steps: Array<{
        agent: AgentRole;
        input: string;
        output: string;
        toolCalls: number;
    }>;
    filesModified: string[];
    totalDuration: number;
}

export interface OrchestrationProgress {
    currentAgent: AgentRole;
    step: number;
    totalSteps: number;
    message: string;
}

type ProgressCallback = (progress: OrchestrationProgress) => void;

/**
 * Orchestrates multiple agents to complete a user request
 */
export class AgentOrchestrator {
    private planner: PlannerAgent;
    private coder: CoderAgent;
    private reviewer: ReviewerAgent;
    private onProgress?: ProgressCallback;

    constructor(onProgress?: ProgressCallback) {
        this.planner = new PlannerAgent();
        this.coder = new CoderAgent();
        this.reviewer = new ReviewerAgent();
        this.onProgress = onProgress;
    }

    /**
     * Execute a user request using multi-agent collaboration
     */
    async execute(request: string, projectContext?: string): Promise<OrchestrationResult> {
        const startTime = Date.now();
        const steps: OrchestrationResult['steps'] = [];
        const allFilesModified: string[] = [];

        try {
            // Step 1: Planning
            this.reportProgress('planner', 1, 3, 'Creating execution plan...');
            const { plan, tasks } = await this.planner.createPlan(request, projectContext);

            steps.push({
                agent: 'planner',
                input: request,
                output: plan,
                toolCalls: 0,
            });

            // Step 2: Coding
            this.reportProgress('coder', 2, 3, 'Implementing changes...');

            for (const task of tasks) {
                if (task.assignee === 'coder') {
                    const result = await this.coder.implement(task.task, projectContext);

                    steps.push({
                        agent: 'coder',
                        input: task.task,
                        output: result.output,
                        toolCalls: result.filesModified.length,
                    });

                    allFilesModified.push(...result.filesModified);
                }
            }

            // Step 3: Review
            this.reportProgress('reviewer', 3, 3, 'Reviewing changes...');

            if (allFilesModified.length > 0) {
                const review = await this.reviewer.review(allFilesModified, projectContext);

                steps.push({
                    agent: 'reviewer',
                    input: `Review: ${allFilesModified.join(', ')}`,
                    output: review.approved
                        ? `✅ Approved. ${review.suggestions.length} suggestions.`
                        : `⚠️ Needs changes: ${review.issues.join(', ')}`,
                    toolCalls: 0,
                });
            }

            return {
                success: true,
                plan,
                steps,
                filesModified: [...new Set(allFilesModified)],
                totalDuration: Date.now() - startTime,
            };

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            return {
                success: false,
                plan: `Error: ${errorMessage}`,
                steps,
                filesModified: allFilesModified,
                totalDuration: Date.now() - startTime,
            };
        }
    }

    /**
     * Execute a single agent task (for manual control)
     */
    async executeAgent(
        role: AgentRole,
        input: string,
        context?: string
    ): Promise<AgentResponse> {
        switch (role) {
            case 'planner':
                return this.planner.process(input, context);
            case 'coder':
                return this.coder.process(input, context);
            case 'reviewer':
                return this.reviewer.process(input, context);
            default:
                throw new Error(`Unknown agent role: ${role}`);
        }
    }

    /**
     * Report progress to callback
     */
    private reportProgress(
        agent: AgentRole,
        step: number,
        total: number,
        message: string
    ): void {
        this.onProgress?.({
            currentAgent: agent,
            step,
            totalSteps: total,
            message,
        });
    }

    /**
     * Clear all agent histories
     */
    clearAll(): void {
        this.planner.clearHistory();
        this.coder.clearHistory();
        this.reviewer.clearHistory();
    }
}

// Singleton instance for easy access
let orchestratorInstance: AgentOrchestrator | null = null;

export function getOrchestrator(onProgress?: ProgressCallback): AgentOrchestrator {
    if (!orchestratorInstance || onProgress) {
        orchestratorInstance = new AgentOrchestrator(onProgress);
    }
    return orchestratorInstance;
}
