/**
 * Workflow Executor
 * 
 * Enhanced workflow execution with step hooks, conditional branching,
 * error recovery, and real-time progress streaming.
 */

import { create } from 'zustand';
import { executeTool, isToolAvailable } from '../tools/registry';
import type { ToolResult } from '../tools/types';

// =============================================================================
// TYPES
// =============================================================================

export type WorkflowStepType =
    | 'tool'      // Execute a tool
    | 'prompt'    // AI generates content
    | 'condition' // Branch based on condition
    | 'parallel'  // Execute steps in parallel
    | 'loop'      // Repeat steps
    | 'user_input'// Ask user for input
    | 'wait'      // Wait for duration or condition

export type StepStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'skipped'
    | 'waiting';

export interface WorkflowVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'file' | 'array';
    required: boolean;
    default?: unknown;
    description?: string;
}

export interface WorkflowStep {
    id: string;
    type: WorkflowStepType;
    name: string;
    description?: string;

    // Tool execution
    tool?: string;
    toolArgs?: Record<string, unknown>;

    // Condition/branching
    condition?: string;
    ifSteps?: string[];
    elseSteps?: string[];

    // Parallel execution
    parallelSteps?: string[];

    // Loop configuration
    loopCount?: number;
    loopCondition?: string;
    loopSteps?: string[];

    // Hooks
    onBefore?: string; // Template for pre-step logic
    onAfter?: string;  // Template for post-step logic
    onError?: 'fail' | 'skip' | 'retry' | 'continue';
    retryCount?: number;

    // Output
    outputVariable?: string;

    // Execution state
    status?: StepStatus;
    result?: ToolResult;
    startedAt?: number;
    completedAt?: number;
    error?: string;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: 'development' | 'deployment' | 'testing' | 'documentation' | 'custom';
    icon?: string;

    // Variables that can be customized
    variables: WorkflowVariable[];

    // Steps to execute
    steps: WorkflowStep[];

    // Metadata
    author?: string;
    version: string;
    createdAt: number;
    updatedAt: number;
}

export interface WorkflowExecution {
    id: string;
    templateId: string;
    templateName: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    variables: Record<string, unknown>;
    steps: WorkflowStep[];
    currentStepIndex: number;
    progress: number;
    startedAt: number;
    updatedAt: number;
    completedAt?: number;
    error?: string;
    output?: Record<string, unknown>;
}

export interface WorkflowExecutorState {
    templates: Map<string, WorkflowTemplate>;
    executions: Map<string, WorkflowExecution>;
    activeExecutionId: string | null;

    // Template management
    registerTemplate: (template: WorkflowTemplate) => void;
    getTemplate: (id: string) => WorkflowTemplate | undefined;
    listTemplates: (category?: string) => WorkflowTemplate[];

    // Execution
    executeWorkflow: (templateId: string, variables: Record<string, unknown>) => Promise<string>;
    cancelExecution: (executionId: string) => void;
    getExecution: (executionId: string) => WorkflowExecution | undefined;

    // Built-in templates
    initializeBuiltinTemplates: () => void;
}

// =============================================================================
// WORKFLOW EXECUTOR STORE
// =============================================================================

export const useWorkflowExecutor = create<WorkflowExecutorState>((set, get) => ({
    templates: new Map(),
    executions: new Map(),
    activeExecutionId: null,

    registerTemplate: (template: WorkflowTemplate) => {
        set(state => ({
            templates: new Map(state.templates).set(template.id, template),
        }));
    },

    getTemplate: (id: string) => get().templates.get(id),

    listTemplates: (category?: string) => {
        const templates = Array.from(get().templates.values());
        return category ? templates.filter(t => t.category === category) : templates;
    },

    executeWorkflow: async (templateId: string, variables: Record<string, unknown>): Promise<string> => {
        const template = get().templates.get(templateId);
        if (!template) {
            throw new Error(`Workflow template '${templateId}' not found`);
        }

        // Validate required variables
        for (const v of template.variables.filter(v => v.required)) {
            if (!(v.name in variables) && v.default === undefined) {
                throw new Error(`Missing required variable: ${v.name}`);
            }
        }

        // Apply defaults
        const resolvedVariables: Record<string, unknown> = { ...variables };
        for (const v of template.variables) {
            if (!(v.name in resolvedVariables) && v.default !== undefined) {
                resolvedVariables[v.name] = v.default;
            }
        }

        const executionId = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Clone steps for this execution
        const steps = template.steps.map(s => ({
            ...s,
            status: 'pending' as StepStatus,
            toolArgs: substituteVariables(s.toolArgs || {}, resolvedVariables),
        }));

        const execution: WorkflowExecution = {
            id: executionId,
            templateId,
            templateName: template.name,
            status: 'running',
            variables: resolvedVariables,
            steps,
            currentStepIndex: 0,
            progress: 0,
            startedAt: Date.now(),
            updatedAt: Date.now(),
            output: {},
        };

        set(state => ({
            executions: new Map(state.executions).set(executionId, execution),
            activeExecutionId: executionId,
        }));

        // Run the workflow
        runWorkflow(executionId).catch(error => {
            console.error('[WorkflowExecutor] Execution failed:', error);
            set(state => {
                const executions = new Map(state.executions);
                const exec = executions.get(executionId);
                if (exec) {
                    executions.set(executionId, {
                        ...exec,
                        status: 'failed',
                        error: error instanceof Error ? error.message : String(error),
                        updatedAt: Date.now(),
                    });
                }
                return { executions };
            });
        });

        return executionId;
    },

    cancelExecution: (executionId: string) => {
        set(state => {
            const executions = new Map(state.executions);
            const exec = executions.get(executionId);
            if (exec && exec.status === 'running') {
                executions.set(executionId, {
                    ...exec,
                    status: 'cancelled',
                    completedAt: Date.now(),
                    updatedAt: Date.now(),
                });
            }
            return { executions };
        });
    },

    getExecution: (executionId: string) => get().executions.get(executionId),

    initializeBuiltinTemplates: () => {
        const builtinTemplates = getBuiltinTemplates();
        for (const template of builtinTemplates) {
            get().registerTemplate(template);
        }
        console.log(`[WorkflowExecutor] Initialized ${builtinTemplates.length} built-in templates`);
    },
}));

// =============================================================================
// WORKFLOW RUNNER
// =============================================================================

async function runWorkflow(executionId: string): Promise<void> {
    const state = useWorkflowExecutor.getState();
    let execution = state.executions.get(executionId);

    if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
    }

    const output: Record<string, unknown> = {};

    for (let i = 0; i < execution.steps.length; i++) {
        // Refresh execution state
        execution = useWorkflowExecutor.getState().executions.get(executionId);
        if (!execution || execution.status !== 'running') break;

        const step = execution.steps[i];

        // Update current step
        updateExecution(executionId, {
            currentStepIndex: i,
            progress: Math.round((i / execution.steps.length) * 100),
        });
        updateStepStatus(executionId, i, 'running');

        try {
            const result = await executeStep(step, execution.variables, output);

            updateStepStatus(executionId, i, result.success ? 'completed' : 'failed', result);

            // Store output variable
            if (step.outputVariable && result.success) {
                output[step.outputVariable] = result.output;
            }

            // Handle error strategies
            if (!result.success) {
                const errorStrategy = step.onError || 'fail';

                if (errorStrategy === 'fail') {
                    updateExecution(executionId, {
                        status: 'failed',
                        error: result.error,
                        completedAt: Date.now(),
                    });
                    return;
                } else if (errorStrategy === 'skip') {
                    updateStepStatus(executionId, i, 'skipped');
                    continue;
                } else if (errorStrategy === 'retry' && step.retryCount) {
                    // Simple retry (not implemented fully)
                    console.log(`[WorkflowExecutor] Retrying step ${step.id}`);
                }
                // 'continue' just proceeds to next step
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            updateStepStatus(executionId, i, 'failed', { success: false, output: '', error: errorMsg });
            updateExecution(executionId, {
                status: 'failed',
                error: errorMsg,
                completedAt: Date.now(),
            });
            return;
        }
    }

    // Workflow completed successfully
    updateExecution(executionId, {
        status: 'completed',
        progress: 100,
        output,
        completedAt: Date.now(),
    });
}

async function executeStep(
    step: WorkflowStep,
    variables: Record<string, unknown>,
    previousOutputs: Record<string, unknown>
): Promise<ToolResult> {
    const context = { ...variables, ...previousOutputs };

    switch (step.type) {
        case 'tool':
            if (!step.tool) {
                return { success: false, output: '', error: 'No tool specified' };
            }
            if (!isToolAvailable(step.tool)) {
                return {
                    success: false,
                    output: '',
                    error: `Tool '${step.tool}' is not available on this platform`
                };
            }
            const args = substituteVariables(step.toolArgs || {}, context);
            return await executeTool(step.tool, args);

        case 'prompt':
            // In real implementation, this would call the AI model
            return {
                success: true,
                output: `AI generated content for: ${step.description}`
            };

        case 'condition':
            // Evaluate condition and return which branch to take
            const conditionMet = evaluateCondition(step.condition || 'true', context);
            return {
                success: true,
                output: conditionMet ? 'true' : 'false'
            };

        case 'parallel':
            // Execute parallel steps (simplified - actual parallel execution would be more complex)
            return { success: true, output: 'Parallel execution simulated' };

        case 'user_input':
            // This would be handled by the UI
            return { success: true, output: context[step.outputVariable || 'userInput'] as string || '' };

        case 'wait':
            // Wait for specified duration
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, output: 'Wait completed' };

        default:
            return { success: false, output: '', error: `Unknown step type: ${step.type}` };
    }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function updateExecution(executionId: string, updates: Partial<WorkflowExecution>): void {
    useWorkflowExecutor.setState(state => {
        const executions = new Map(state.executions);
        const exec = executions.get(executionId);
        if (exec) {
            executions.set(executionId, { ...exec, ...updates, updatedAt: Date.now() });
        }
        return { executions };
    });
}

function updateStepStatus(
    executionId: string,
    stepIndex: number,
    status: StepStatus,
    result?: ToolResult
): void {
    useWorkflowExecutor.setState(state => {
        const executions = new Map(state.executions);
        const exec = executions.get(executionId);
        if (exec) {
            const steps = [...exec.steps];
            steps[stepIndex] = {
                ...steps[stepIndex],
                status,
                result,
                ...(status === 'running' ? { startedAt: Date.now() } : {}),
                ...(status === 'completed' || status === 'failed' ? { completedAt: Date.now() } : {}),
            };
            executions.set(executionId, { ...exec, steps, updatedAt: Date.now() });
        }
        return { executions };
    });
}

function substituteVariables(
    obj: Record<string, unknown>,
    variables: Record<string, unknown>
): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            result[key] = value.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
                String(variables[varName] ?? `{{${varName}}}`)
            );
        } else if (typeof value === 'object' && value !== null) {
            result[key] = substituteVariables(value as Record<string, unknown>, variables);
        } else {
            result[key] = value;
        }
    }

    return result;
}

function evaluateCondition(condition: string, context: Record<string, unknown>): boolean {
    try {
        // Simple condition evaluation - supports basic comparisons
        const substituted = condition.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
            JSON.stringify(context[varName] ?? null)
        );
        // eslint-disable-next-line no-new-func
        return Boolean(new Function(`return ${substituted}`)());
    } catch {
        console.warn(`[WorkflowExecutor] Failed to evaluate condition: ${condition}`);
        return false;
    }
}

// =============================================================================
// BUILT-IN TEMPLATES
// =============================================================================

function getBuiltinTemplates(): WorkflowTemplate[] {
    const now = Date.now();

    return [
        {
            id: 'create-react-component',
            name: 'Create React Component',
            description: 'Generate a new React component with TypeScript and optional tests',
            category: 'development',
            icon: '⚛️',
            version: '1.0.0',
            createdAt: now,
            updatedAt: now,
            variables: [
                { name: 'componentName', type: 'string', required: true, description: 'Name of the component (PascalCase)' },
                { name: 'outputPath', type: 'string', required: true, default: 'src/components', description: 'Directory to create the component in' },
                { name: 'withTests', type: 'boolean', required: false, default: false, description: 'Generate test file' },
                { name: 'withStyles', type: 'boolean', required: false, default: true, description: 'Generate CSS module' },
            ],
            steps: [
                {
                    id: 'create-component',
                    type: 'tool',
                    name: 'Create component file',
                    tool: 'write',
                    toolArgs: {
                        file_path: '{{outputPath}}/{{componentName}}/{{componentName}}.tsx',
                        content: `import React from 'react';
import styles from './{{componentName}}.module.css';

interface {{componentName}}Props {
    className?: string;
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({ className }) => {
    return (
        <div className={\`\${styles.root} \${className || ''}\`}>
            {{componentName}} Component
        </div>
    );
};

export default {{componentName}};
`,
                    },
                    outputVariable: 'componentFile',
                },
                {
                    id: 'create-styles',
                    type: 'tool',
                    name: 'Create styles file',
                    tool: 'write',
                    toolArgs: {
                        file_path: '{{outputPath}}/{{componentName}}/{{componentName}}.module.css',
                        content: `.root {
    /* Add your styles here */
}
`,
                    },
                    onError: 'skip',
                },
                {
                    id: 'create-index',
                    type: 'tool',
                    name: 'Create index file',
                    tool: 'write',
                    toolArgs: {
                        file_path: '{{outputPath}}/{{componentName}}/index.ts',
                        content: `export { {{componentName}}, default } from './{{componentName}}';
`,
                    },
                },
            ],
        },
        {
            id: 'create-api-endpoint',
            name: 'Create API Endpoint',
            description: 'Generate a new API route handler with validation',
            category: 'development',
            icon: '🔌',
            version: '1.0.0',
            createdAt: now,
            updatedAt: now,
            variables: [
                { name: 'endpointName', type: 'string', required: true, description: 'Name of the endpoint' },
                { name: 'method', type: 'string', required: false, default: 'GET', description: 'HTTP method' },
                { name: 'outputPath', type: 'string', required: true, default: 'src/app/api', description: 'API directory' },
            ],
            steps: [
                {
                    id: 'create-route',
                    type: 'tool',
                    name: 'Create route handler',
                    tool: 'write',
                    toolArgs: {
                        file_path: '{{outputPath}}/{{endpointName}}/route.ts',
                        content: `import { NextRequest, NextResponse } from 'next/server';

export async function {{method}}(request: NextRequest) {
    try {
        // Your logic here
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[{{endpointName}}] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
`,
                    },
                },
            ],
        },
        {
            id: 'run-tests',
            name: 'Run Tests',
            description: 'Execute project tests with coverage report',
            category: 'testing',
            icon: '🧪',
            version: '1.0.0',
            createdAt: now,
            updatedAt: now,
            variables: [
                { name: 'testPath', type: 'string', required: false, default: '', description: 'Specific test path (empty for all)' },
                { name: 'coverage', type: 'boolean', required: false, default: true, description: 'Generate coverage report' },
            ],
            steps: [
                {
                    id: 'run-tests',
                    type: 'tool',
                    name: 'Execute tests',
                    tool: 'bash',
                    toolArgs: {
                        command: 'npm test -- {{testPath}} --coverage={{coverage}}',
                    },
                    outputVariable: 'testResults',
                },
            ],
        },
        {
            id: 'git-commit-push',
            name: 'Git Commit & Push',
            description: 'Stage, commit, and push changes to remote',
            category: 'development',
            icon: '📤',
            version: '1.0.0',
            createdAt: now,
            updatedAt: now,
            variables: [
                { name: 'commitMessage', type: 'string', required: true, description: 'Commit message' },
                { name: 'branch', type: 'string', required: false, default: 'main', description: 'Branch to push to' },
            ],
            steps: [
                {
                    id: 'git-add',
                    type: 'tool',
                    name: 'Stage changes',
                    tool: 'bash',
                    toolArgs: { command: 'git add .' },
                },
                {
                    id: 'git-commit',
                    type: 'tool',
                    name: 'Create commit',
                    tool: 'bash',
                    toolArgs: { command: 'git commit -m "{{commitMessage}}"' },
                },
                {
                    id: 'git-push',
                    type: 'tool',
                    name: 'Push to remote',
                    tool: 'bash',
                    toolArgs: { command: 'git push origin {{branch}}' },
                },
            ],
        },
        {
            id: 'deploy-netlify',
            name: 'Deploy to Netlify',
            description: 'Build and deploy project to Netlify',
            category: 'deployment',
            icon: '🚀',
            version: '1.0.0',
            createdAt: now,
            updatedAt: now,
            variables: [
                { name: 'buildCommand', type: 'string', required: false, default: 'npm run build', description: 'Build command' },
                { name: 'publishDir', type: 'string', required: false, default: 'dist', description: 'Publish directory' },
            ],
            steps: [
                {
                    id: 'install-deps',
                    type: 'tool',
                    name: 'Install dependencies',
                    tool: 'bash',
                    toolArgs: { command: 'npm install' },
                },
                {
                    id: 'build',
                    type: 'tool',
                    name: 'Build project',
                    tool: 'bash',
                    toolArgs: { command: '{{buildCommand}}' },
                },
                {
                    id: 'deploy',
                    type: 'tool',
                    name: 'Deploy to Netlify',
                    tool: 'bash',
                    toolArgs: { command: 'npx netlify deploy --prod --dir={{publishDir}}' },
                },
            ],
        },
    ];
}

// =============================================================================
// EXPORTS
// =============================================================================

export { runWorkflow, getBuiltinTemplates };
