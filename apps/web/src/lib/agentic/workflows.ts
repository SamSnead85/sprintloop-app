/**
 * Automation Workflows Module
 * Phases 2401-2500: Zapier-like automation, triggers, actions
 */

import { create } from 'zustand';

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    enabled: boolean;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    lastRun?: number;
    runCount: number;
    createdAt: number;
    updatedAt: number;
}

export interface WorkflowTrigger {
    type: TriggerType;
    config: Record<string, unknown>;
    schedule?: CronSchedule;
}

export type TriggerType =
    | 'manual'
    | 'schedule'
    | 'file_change'
    | 'git_push'
    | 'email_received'
    | 'webhook'
    | 'api_call'
    | 'build_complete'
    | 'error_detected';

export interface CronSchedule {
    expression: string;
    timezone: string;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: StepType;
    action: string;
    config: Record<string, unknown>;
    conditions?: StepCondition[];
    onSuccess?: string; // Next step ID
    onError?: 'stop' | 'continue' | string; // Step ID to jump to
    timeout?: number;
    retries?: number;
}

export type StepType =
    | 'browser'
    | 'email'
    | 'calendar'
    | 'file'
    | 'terminal'
    | 'git'
    | 'api'
    | 'ai'
    | 'condition'
    | 'loop'
    | 'delay'
    | 'notify';

export interface StepCondition {
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'exists' | 'regex';
    value: unknown;
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    status: 'running' | 'completed' | 'failed' | 'cancelled';
    startedAt: number;
    completedAt?: number;
    steps: StepExecution[];
    context: Record<string, unknown>;
    error?: string;
}

export interface StepExecution {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    startedAt?: number;
    completedAt?: number;
    output?: unknown;
    error?: string;
}

interface WorkflowState {
    workflows: Map<string, Workflow>;
    runs: WorkflowRun[];
    activeRuns: Map<string, WorkflowRun>;

    // Workflow CRUD
    createWorkflow: (workflow: Omit<Workflow, 'id' | 'runCount' | 'createdAt' | 'updatedAt'>) => string;
    updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
    deleteWorkflow: (id: string) => void;

    // Execution
    runWorkflow: (id: string, context?: Record<string, unknown>) => Promise<WorkflowRun>;
    cancelRun: (runId: string) => void;

    // Steps
    addStep: (workflowId: string, step: Omit<WorkflowStep, 'id'>) => string;
    removeStep: (workflowId: string, stepId: string) => void;
    reorderSteps: (workflowId: string, stepIds: string[]) => void;

    // Templates
    getTemplates: () => WorkflowTemplate[];
    createFromTemplate: (templateId: string) => string;
}

export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    workflow: Omit<Workflow, 'id' | 'runCount' | 'createdAt' | 'updatedAt'>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
    workflows: new Map(),
    runs: [],
    activeRuns: new Map(),

    createWorkflow: (workflowData) => {
        const id = `wf-${Date.now()}`;
        const workflow: Workflow = {
            ...workflowData,
            id,
            runCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => {
            const workflows = new Map(state.workflows);
            workflows.set(id, workflow);
            return { workflows };
        });

        console.log('[Workflow] Created:', workflow.name);
        return id;
    },

    updateWorkflow: (id, updates) => {
        set(state => {
            const workflows = new Map(state.workflows);
            const workflow = workflows.get(id);
            if (workflow) {
                workflows.set(id, { ...workflow, ...updates, updatedAt: Date.now() });
            }
            return { workflows };
        });
    },

    deleteWorkflow: (id) => {
        set(state => {
            const workflows = new Map(state.workflows);
            workflows.delete(id);
            return { workflows };
        });
    },

    runWorkflow: async (id, context = {}) => {
        const workflow = get().workflows.get(id);
        if (!workflow) throw new Error('Workflow not found');

        const run: WorkflowRun = {
            id: `run-${Date.now()}`,
            workflowId: id,
            status: 'running',
            startedAt: Date.now(),
            steps: workflow.steps.map(s => ({
                stepId: s.id,
                status: 'pending' as const,
            })),
            context,
        };

        set(state => ({
            activeRuns: new Map(state.activeRuns).set(run.id, run),
        }));

        console.log('[Workflow] Running:', workflow.name);

        // Execute steps
        for (let i = 0; i < workflow.steps.length; i++) {
            const step = workflow.steps[i];

            set(state => {
                const activeRuns = new Map(state.activeRuns);
                const currentRun = activeRuns.get(run.id);
                if (currentRun) {
                    currentRun.steps[i].status = 'running';
                    currentRun.steps[i].startedAt = Date.now();
                }
                return { activeRuns };
            });

            // Simulate step execution
            await new Promise(r => setTimeout(r, 500 + Math.random() * 500));

            set(state => {
                const activeRuns = new Map(state.activeRuns);
                const currentRun = activeRuns.get(run.id);
                if (currentRun) {
                    currentRun.steps[i].status = 'completed';
                    currentRun.steps[i].completedAt = Date.now();
                    currentRun.steps[i].output = { success: true };
                }
                return { activeRuns };
            });

            console.log(`[Workflow] Step ${i + 1}/${workflow.steps.length}: ${step.name}`);
        }

        // Complete
        const completedRun: WorkflowRun = {
            ...run,
            status: 'completed',
            completedAt: Date.now(),
            steps: run.steps.map(s => ({ ...s, status: 'completed' as const })),
        };

        set(state => ({
            runs: [...state.runs, completedRun],
            activeRuns: new Map([...state.activeRuns].filter(([k]) => k !== run.id)),
            workflows: new Map(state.workflows).set(id, {
                ...workflow,
                runCount: workflow.runCount + 1,
                lastRun: Date.now(),
            }),
        }));

        return completedRun;
    },

    cancelRun: (runId) => {
        set(state => {
            const activeRuns = new Map(state.activeRuns);
            const run = activeRuns.get(runId);
            if (run) {
                run.status = 'cancelled';
                run.completedAt = Date.now();
                activeRuns.delete(runId);
                return { activeRuns, runs: [...state.runs, run] };
            }
            return state;
        });
    },

    addStep: (workflowId, stepData) => {
        const stepId = `step-${Date.now()}`;
        set(state => {
            const workflows = new Map(state.workflows);
            const workflow = workflows.get(workflowId);
            if (workflow) {
                workflows.set(workflowId, {
                    ...workflow,
                    steps: [...workflow.steps, { ...stepData, id: stepId }],
                    updatedAt: Date.now(),
                });
            }
            return { workflows };
        });
        return stepId;
    },

    removeStep: (workflowId, stepId) => {
        set(state => {
            const workflows = new Map(state.workflows);
            const workflow = workflows.get(workflowId);
            if (workflow) {
                workflows.set(workflowId, {
                    ...workflow,
                    steps: workflow.steps.filter(s => s.id !== stepId),
                    updatedAt: Date.now(),
                });
            }
            return { workflows };
        });
    },

    reorderSteps: (workflowId, stepIds) => {
        set(state => {
            const workflows = new Map(state.workflows);
            const workflow = workflows.get(workflowId);
            if (workflow) {
                const stepMap = new Map(workflow.steps.map(s => [s.id, s]));
                workflows.set(workflowId, {
                    ...workflow,
                    steps: stepIds.map(id => stepMap.get(id)!).filter(Boolean),
                    updatedAt: Date.now(),
                });
            }
            return { workflows };
        });
    },

    getTemplates: () => WORKFLOW_TEMPLATES,

    createFromTemplate: (templateId) => {
        const template = WORKFLOW_TEMPLATES.find(t => t.id === templateId);
        if (!template) throw new Error('Template not found');
        return get().createWorkflow(template.workflow);
    },
}));

// Pre-built workflow templates
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
    {
        id: 'daily-standup',
        name: 'Daily Standup Report',
        description: 'Automatically generate and send daily standup report',
        category: 'productivity',
        workflow: {
            name: 'Daily Standup Report',
            enabled: true,
            trigger: {
                type: 'schedule',
                config: {},
                schedule: { expression: '0 9 * * 1-5', timezone: 'America/New_York' },
            },
            steps: [
                { id: 's1', name: 'Get Git Activity', type: 'git', action: 'getLog', config: { limit: 10 } },
                { id: 's2', name: 'Get Calendar', type: 'calendar', action: 'getTodayEvents', config: {} },
                { id: 's3', name: 'Generate Report', type: 'ai', action: 'summarize', config: {} },
                { id: 's4', name: 'Send Email', type: 'email', action: 'send', config: {} },
            ],
        },
    },
    {
        id: 'deploy-on-push',
        name: 'Deploy on Push',
        description: 'Build and deploy when code is pushed to main',
        category: 'devops',
        workflow: {
            name: 'Deploy on Push',
            enabled: true,
            trigger: { type: 'git_push', config: { branch: 'main' } },
            steps: [
                { id: 's1', name: 'Install Dependencies', type: 'terminal', action: 'run', config: { command: 'npm install' } },
                { id: 's2', name: 'Run Tests', type: 'terminal', action: 'run', config: { command: 'npm test' } },
                { id: 's3', name: 'Build', type: 'terminal', action: 'run', config: { command: 'npm run build' } },
                { id: 's4', name: 'Deploy', type: 'terminal', action: 'run', config: { command: 'npm run deploy' } },
                { id: 's5', name: 'Notify', type: 'notify', action: 'slack', config: { message: 'Deployment complete!' } },
            ],
        },
    },
    {
        id: 'email-digest',
        name: 'Email Digest',
        description: 'Summarize and organize emails into a daily digest',
        category: 'email',
        workflow: {
            name: 'Email Digest',
            enabled: true,
            trigger: { type: 'schedule', config: {}, schedule: { expression: '0 18 * * *', timezone: 'America/New_York' } },
            steps: [
                { id: 's1', name: 'Fetch Unread', type: 'email', action: 'fetchUnread', config: {} },
                { id: 's2', name: 'Categorize', type: 'ai', action: 'categorize', config: {} },
                { id: 's3', name: 'Summarize', type: 'ai', action: 'summarize', config: {} },
                { id: 's4', name: 'Create Digest', type: 'file', action: 'write', config: {} },
            ],
        },
    },
];

/** Run a workflow by name */
export async function runWorkflowByName(name: string): Promise<WorkflowRun> {
    const store = useWorkflowStore.getState();
    const workflow = Array.from(store.workflows.values()).find(w => w.name === name);
    if (!workflow) throw new Error(`Workflow "${name}" not found`);
    return store.runWorkflow(workflow.id);
}

/** Create a simple automation */
export function createAutomation(
    name: string,
    trigger: TriggerType,
    steps: { name: string; type: StepType; action: string }[]
): string {
    const store = useWorkflowStore.getState();
    return store.createWorkflow({
        name,
        enabled: true,
        trigger: { type: trigger, config: {} },
        steps: steps.map((s, i) => ({
            id: `step-${i}`,
            name: s.name,
            type: s.type,
            action: s.action,
            config: {},
        })),
    });
}
