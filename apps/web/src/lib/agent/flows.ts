/**
 * Cascade Flows
 * 
 * Inspired by Windsurf's Cascade agent "Flows" feature
 * 
 * Pre-defined agentic behaviors for common tasks:
 * - Refactor Flow: Systematic code refactoring
 * - Debug Flow: Interactive debugging
 * - Review Flow: Code review with suggestions
 * - Test Flow: Generate and run tests
 * - Document Flow: Generate documentation
 */

import { UnifiedAgentHarness, createAgentFromPreset, agentEvents } from './harness';

export interface Flow {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    steps: FlowStep[];
    defaultParams: Record<string, unknown>;
}

export interface FlowStep {
    id: string;
    name: string;
    description: string;
    action: 'analyze' | 'plan' | 'execute' | 'validate' | 'review' | 'commit';
    toolsUsed: string[];
    requiredParams: string[];
    autoApprove: boolean;
}

export interface FlowExecution {
    id: string;
    flowId: string;
    status: 'running' | 'paused' | 'completed' | 'failed';
    currentStep: number;
    params: Record<string, unknown>;
    results: FlowStepResult[];
    startedAt: number;
    completedAt?: number;
}

export interface FlowStepResult {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    output: string;
    artifacts: string[];
    duration: number;
}

// ============================================================================
// BUILT-IN FLOWS (Inspired by Windsurf Cascade)
// ============================================================================

export const BUILT_IN_FLOWS: Flow[] = [
    {
        id: 'refactor',
        name: 'Refactor Flow',
        description: 'Systematically refactor code while maintaining functionality',
        icon: '🔄',
        color: '#8b5cf6',
        defaultParams: { scope: 'file', preserveTests: true },
        steps: [
            {
                id: 'analyze',
                name: 'Analyze Code Structure',
                description: 'Analyze the code to understand dependencies and patterns',
                action: 'analyze',
                toolsUsed: ['read_file', 'search_code'],
                requiredParams: ['targetPath'],
                autoApprove: true,
            },
            {
                id: 'plan',
                name: 'Create Refactoring Plan',
                description: 'Generate a detailed refactoring plan with specific changes',
                action: 'plan',
                toolsUsed: ['think'],
                requiredParams: [],
                autoApprove: true,
            },
            {
                id: 'execute',
                name: 'Apply Refactoring',
                description: 'Apply the planned refactoring changes',
                action: 'execute',
                toolsUsed: ['write_file'],
                requiredParams: [],
                autoApprove: false,
            },
            {
                id: 'validate',
                name: 'Validate Changes',
                description: 'Run linters and tests to ensure functionality is preserved',
                action: 'validate',
                toolsUsed: ['execute_command'],
                requiredParams: [],
                autoApprove: true,
            },
            {
                id: 'commit',
                name: 'Commit Changes',
                description: 'Commit the refactored code with a descriptive message',
                action: 'commit',
                toolsUsed: ['execute_command'],
                requiredParams: [],
                autoApprove: false,
            },
        ],
    },
    {
        id: 'debug',
        name: 'Debug Flow',
        description: 'Interactive debugging session to identify and fix issues',
        icon: '🐛',
        color: '#ef4444',
        defaultParams: { verbose: true },
        steps: [
            {
                id: 'reproduce',
                name: 'Reproduce Issue',
                description: 'Understand and reproduce the reported issue',
                action: 'analyze',
                toolsUsed: ['read_file', 'execute_command'],
                requiredParams: ['issueDescription'],
                autoApprove: true,
            },
            {
                id: 'investigate',
                name: 'Investigate Root Cause',
                description: 'Trace through the code to find the root cause',
                action: 'analyze',
                toolsUsed: ['search_code', 'read_file'],
                requiredParams: [],
                autoApprove: true,
            },
            {
                id: 'hypothesis',
                name: 'Form Hypothesis',
                description: 'Develop a hypothesis for the bug cause',
                action: 'plan',
                toolsUsed: ['think'],
                requiredParams: [],
                autoApprove: true,
            },
            {
                id: 'fix',
                name: 'Apply Fix',
                description: 'Implement the proposed fix',
                action: 'execute',
                toolsUsed: ['write_file'],
                requiredParams: [],
                autoApprove: false,
            },
            {
                id: 'verify',
                name: 'Verify Fix',
                description: 'Verify the fix resolves the issue without regressions',
                action: 'validate',
                toolsUsed: ['execute_command'],
                requiredParams: [],
                autoApprove: true,
            },
        ],
    },
    {
        id: 'review',
        name: 'Review Flow',
        description: 'Comprehensive code review with actionable feedback',
        icon: '🔍',
        color: '#f59e0b',
        defaultParams: { strict: true },
        steps: [
            {
                id: 'read',
                name: 'Read Changes',
                description: 'Read and understand the code changes',
                action: 'analyze',
                toolsUsed: ['read_file', 'search_code'],
                requiredParams: ['targetPath'],
                autoApprove: true,
            },
            {
                id: 'analyze',
                name: 'Analyze Quality',
                description: 'Analyze code quality, patterns, and potential issues',
                action: 'analyze',
                toolsUsed: ['think'],
                requiredParams: [],
                autoApprove: true,
            },
            {
                id: 'review',
                name: 'Generate Review',
                description: 'Generate detailed review comments and suggestions',
                action: 'review',
                toolsUsed: ['think'],
                requiredParams: [],
                autoApprove: true,
            },
        ],
    },
    {
        id: 'test',
        name: 'Test Flow',
        description: 'Generate comprehensive tests for code',
        icon: '🧪',
        color: '#10b981',
        defaultParams: { coverage: 80 },
        steps: [
            {
                id: 'analyze',
                name: 'Analyze Code',
                description: 'Analyze the code to understand what needs testing',
                action: 'analyze',
                toolsUsed: ['read_file'],
                requiredParams: ['targetPath'],
                autoApprove: true,
            },
            {
                id: 'plan',
                name: 'Plan Test Cases',
                description: 'Identify test cases and edge cases to cover',
                action: 'plan',
                toolsUsed: ['think'],
                requiredParams: [],
                autoApprove: true,
            },
            {
                id: 'generate',
                name: 'Generate Tests',
                description: 'Write the test code',
                action: 'execute',
                toolsUsed: ['write_file'],
                requiredParams: [],
                autoApprove: false,
            },
            {
                id: 'run',
                name: 'Run Tests',
                description: 'Execute the generated tests',
                action: 'validate',
                toolsUsed: ['execute_command'],
                requiredParams: [],
                autoApprove: true,
            },
        ],
    },
    {
        id: 'document',
        name: 'Document Flow',
        description: 'Generate documentation for code and APIs',
        icon: '📝',
        color: '#3b82f6',
        defaultParams: { format: 'markdown' },
        steps: [
            {
                id: 'analyze',
                name: 'Analyze Code',
                description: 'Analyze code structure, functions, and types',
                action: 'analyze',
                toolsUsed: ['read_file', 'search_code'],
                requiredParams: ['targetPath'],
                autoApprove: true,
            },
            {
                id: 'generate',
                name: 'Generate Documentation',
                description: 'Generate comprehensive documentation',
                action: 'execute',
                toolsUsed: ['write_file'],
                requiredParams: [],
                autoApprove: false,
            },
        ],
    },
];

// ============================================================================
// FLOW EXECUTOR
// ============================================================================

export class FlowExecutor {
    private agent: UnifiedAgentHarness;
    private currentExecution: FlowExecution | null = null;

    constructor() {
        this.agent = createAgentFromPreset('developer');
    }

    /**
     * Execute a flow
     */
    async executeFlow(
        flowId: string,
        params: Record<string, unknown>,
        projectPath: string
    ): Promise<FlowExecution> {
        const flow = BUILT_IN_FLOWS.find(f => f.id === flowId);
        if (!flow) {
            throw new Error(`Flow "${flowId}" not found`);
        }

        // Initialize execution
        const execution: FlowExecution = {
            id: `exec-${Date.now()}`,
            flowId,
            status: 'running',
            currentStep: 0,
            params: { ...flow.defaultParams, ...params },
            results: [],
            startedAt: Date.now(),
        };

        this.currentExecution = execution;

        // Start agent session
        this.agent.startSession(projectPath);

        console.log(`[FlowExecutor] Starting ${flow.name}`);

        // Execute steps
        for (let i = 0; i < flow.steps.length; i++) {
            execution.currentStep = i;
            const step = flow.steps[i];

            agentEvents.emit({
                type: 'agent:action_executing',
                agentId: 'flow-executor',
                timestamp: Date.now(),
                data: { flowId, stepId: step.id, stepName: step.name },
            });

            const stepResult = await this.executeStep(step, execution.params);
            execution.results.push(stepResult);

            if (stepResult.status === 'failed') {
                execution.status = 'failed';
                break;
            }

            agentEvents.emit({
                type: 'agent:step_completed',
                agentId: 'flow-executor',
                timestamp: Date.now(),
                data: { flowId, stepId: step.id, result: stepResult },
            });
        }

        if (execution.status !== 'failed') {
            execution.status = 'completed';
        }
        execution.completedAt = Date.now();

        console.log(`[FlowExecutor] ${flow.name} ${execution.status}`);

        return execution;
    }

    /**
     * Execute a single step
     */
    private async executeStep(
        step: FlowStep,
        params: Record<string, unknown>
    ): Promise<FlowStepResult> {
        const startTime = Date.now();

        try {
            // Build prompt for this step
            const prompt = this.buildStepPrompt(step, params);

            // Execute via agent
            const response = await this.agent.processMessage(prompt);

            return {
                stepId: step.id,
                status: 'completed',
                output: response.content,
                artifacts: [],
                duration: Date.now() - startTime,
            };
        } catch (error) {
            return {
                stepId: step.id,
                status: 'failed',
                output: error instanceof Error ? error.message : 'Unknown error',
                artifacts: [],
                duration: Date.now() - startTime,
            };
        }
    }

    /**
     * Build a prompt for a step
     */
    private buildStepPrompt(step: FlowStep, params: Record<string, unknown>): string {
        let prompt = `## ${step.name}\n\n${step.description}\n\n`;

        if (step.requiredParams.length > 0) {
            prompt += `### Parameters\n`;
            for (const param of step.requiredParams) {
                prompt += `- ${param}: ${params[param] || 'not provided'}\n`;
            }
            prompt += '\n';
        }

        prompt += `### Available Tools\nYou can use: ${step.toolsUsed.join(', ')}\n\n`;
        prompt += `Please complete this step and provide detailed output.`;

        return prompt;
    }

    /**
     * Get current execution
     */
    getCurrentExecution(): FlowExecution | null {
        return this.currentExecution;
    }

    /**
     * Pause current execution
     */
    pause(): void {
        if (this.currentExecution) {
            this.currentExecution.status = 'paused';
        }
    }
}

/**
 * Get all available flows
 */
export function getAvailableFlows(): Flow[] {
    return BUILT_IN_FLOWS;
}

/**
 * Get flow by ID
 */
export function getFlow(id: string): Flow | undefined {
    return BUILT_IN_FLOWS.find(f => f.id === id);
}
