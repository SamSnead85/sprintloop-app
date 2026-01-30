/**
 * Phase 901-950: Workflow Automation Services
 * 
 * Automation and workflow management:
 * - CI/CD pipelines
 * - GitHub Actions
 * - Custom automations
 * - Scheduled tasks
 * - Webhooks
 * - Event triggers
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Workflow {
    id: string;
    name: string;
    description?: string;
    trigger: WorkflowTrigger;
    steps: WorkflowStep[];
    status: 'draft' | 'active' | 'paused' | 'disabled';
    createdAt: Date;
    updatedAt: Date;
    lastRun?: Date;
    runCount: number;
}

export interface WorkflowTrigger {
    type: 'manual' | 'schedule' | 'webhook' | 'event' | 'file-change' | 'git-push';
    config: Record<string, unknown>;
}

export interface WorkflowStep {
    id: string;
    name: string;
    type: 'shell' | 'script' | 'api' | 'condition' | 'parallel' | 'loop';
    config: Record<string, unknown>;
    timeout?: number;
    retries?: number;
    continueOnError?: boolean;
}

export interface WorkflowRun {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
    startedAt: Date;
    completedAt?: Date;
    duration?: number;
    triggeredBy: string;
    steps: WorkflowStepRun[];
    logs: string;
    outputs?: Record<string, unknown>;
}

export interface WorkflowStepRun {
    stepId: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    startedAt?: Date;
    completedAt?: Date;
    output?: string;
    error?: string;
}

export interface ScheduledTask {
    id: string;
    name: string;
    workflowId: string;
    schedule: string; // cron expression
    nextRun?: Date;
    lastRun?: Date;
    enabled: boolean;
}

export interface Webhook {
    id: string;
    name: string;
    url: string;
    secret?: string;
    events: string[];
    workflowId?: string;
    enabled: boolean;
    createdAt: Date;
}

export interface WorkflowAutomationState {
    workflows: Workflow[];
    runs: WorkflowRun[];
    scheduledTasks: ScheduledTask[];
    webhooks: Webhook[];

    // Workflow operations
    createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>) => string;
    updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
    deleteWorkflow: (id: string) => void;
    activateWorkflow: (id: string) => void;
    pauseWorkflow: (id: string) => void;

    // Step operations
    addStep: (workflowId: string, step: Omit<WorkflowStep, 'id'>) => void;
    updateStep: (workflowId: string, stepId: string, updates: Partial<WorkflowStep>) => void;
    removeStep: (workflowId: string, stepId: string) => void;
    reorderSteps: (workflowId: string, stepIds: string[]) => void;

    // Run operations
    runWorkflow: (workflowId: string) => Promise<WorkflowRun>;
    cancelRun: (runId: string) => void;
    retryRun: (runId: string) => Promise<WorkflowRun>;
    getRunsByWorkflow: (workflowId: string) => WorkflowRun[];

    // Scheduling
    scheduleWorkflow: (workflowId: string, schedule: string) => string;
    unscheduleWorkflow: (taskId: string) => void;

    // Webhooks
    createWebhook: (webhook: Omit<Webhook, 'id' | 'createdAt'>) => string;
    deleteWebhook: (id: string) => void;
    regenerateWebhookSecret: (id: string) => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useWorkflowAutomation = create<WorkflowAutomationState>()(
    persist(
        (set, get) => ({
            workflows: [],
            runs: [],
            scheduledTasks: [],
            webhooks: [],

            createWorkflow: (workflowData) => {
                const id = `wf_${Date.now()}`;
                set(state => ({
                    workflows: [...state.workflows, { ...workflowData, id, createdAt: new Date(), updatedAt: new Date(), runCount: 0 }],
                }));
                return id;
            },

            updateWorkflow: (id, updates) => {
                set(state => ({
                    workflows: state.workflows.map(w =>
                        w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w
                    ),
                }));
            },

            deleteWorkflow: (id) => {
                set(state => ({
                    workflows: state.workflows.filter(w => w.id !== id),
                    runs: state.runs.filter(r => r.workflowId !== id),
                    scheduledTasks: state.scheduledTasks.filter(t => t.workflowId !== id),
                }));
            },

            activateWorkflow: (id) => {
                set(state => ({
                    workflows: state.workflows.map(w =>
                        w.id === id ? { ...w, status: 'active', updatedAt: new Date() } : w
                    ),
                }));
            },

            pauseWorkflow: (id) => {
                set(state => ({
                    workflows: state.workflows.map(w =>
                        w.id === id ? { ...w, status: 'paused', updatedAt: new Date() } : w
                    ),
                }));
            },

            addStep: (workflowId, stepData) => {
                const stepId = `step_${Date.now()}`;
                set(state => ({
                    workflows: state.workflows.map(w =>
                        w.id === workflowId ? { ...w, steps: [...w.steps, { ...stepData, id: stepId }], updatedAt: new Date() } : w
                    ),
                }));
            },

            updateStep: (workflowId, stepId, updates) => {
                set(state => ({
                    workflows: state.workflows.map(w =>
                        w.id === workflowId
                            ? { ...w, steps: w.steps.map(s => s.id === stepId ? { ...s, ...updates } : s), updatedAt: new Date() }
                            : w
                    ),
                }));
            },

            removeStep: (workflowId, stepId) => {
                set(state => ({
                    workflows: state.workflows.map(w =>
                        w.id === workflowId ? { ...w, steps: w.steps.filter(s => s.id !== stepId), updatedAt: new Date() } : w
                    ),
                }));
            },

            reorderSteps: (workflowId, stepIds) => {
                set(state => ({
                    workflows: state.workflows.map(w => {
                        if (w.id !== workflowId) return w;
                        const reordered = stepIds.map(id => w.steps.find(s => s.id === id)).filter(Boolean) as WorkflowStep[];
                        return { ...w, steps: reordered, updatedAt: new Date() };
                    }),
                }));
            },

            runWorkflow: async (workflowId) => {
                const workflow = get().workflows.find(w => w.id === workflowId);
                if (!workflow) throw new Error('Workflow not found');

                const run: WorkflowRun = {
                    id: `run_${Date.now()}`,
                    workflowId,
                    status: 'running',
                    startedAt: new Date(),
                    triggeredBy: 'manual',
                    steps: workflow.steps.map(s => ({ stepId: s.id, status: 'pending' })),
                    logs: '',
                };

                set(state => ({ runs: [run, ...state.runs] }));

                // Simulate workflow execution
                for (let i = 0; i < workflow.steps.length; i++) {
                    await new Promise(r => setTimeout(r, 500));
                    set(state => ({
                        runs: state.runs.map(r =>
                            r.id === run.id
                                ? { ...r, steps: r.steps.map((s, idx) => idx === i ? { ...s, status: 'running', startedAt: new Date() } : s), logs: r.logs + `Running step ${i + 1}...\n` }
                                : r
                        ),
                    }));

                    await new Promise(r => setTimeout(r, 300));
                    set(state => ({
                        runs: state.runs.map(r =>
                            r.id === run.id
                                ? { ...r, steps: r.steps.map((s, idx) => idx === i ? { ...s, status: 'success', completedAt: new Date() } : s), logs: r.logs + `Step ${i + 1} completed\n` }
                                : r
                        ),
                    }));
                }

                set(state => ({
                    runs: state.runs.map(r =>
                        r.id === run.id ? { ...r, status: 'success', completedAt: new Date(), duration: Date.now() - run.startedAt.getTime() } : r
                    ),
                    workflows: state.workflows.map(w =>
                        w.id === workflowId ? { ...w, lastRun: new Date(), runCount: w.runCount + 1 } : w
                    ),
                }));

                return get().runs.find(r => r.id === run.id)!;
            },

            cancelRun: (runId) => {
                set(state => ({
                    runs: state.runs.map(r =>
                        r.id === runId ? { ...r, status: 'cancelled', completedAt: new Date() } : r
                    ),
                }));
            },

            retryRun: async (runId) => {
                const run = get().runs.find(r => r.id === runId);
                if (!run) throw new Error('Run not found');
                return get().runWorkflow(run.workflowId);
            },

            getRunsByWorkflow: (workflowId) => get().runs.filter(r => r.workflowId === workflowId),

            scheduleWorkflow: (workflowId, schedule) => {
                const id = `sched_${Date.now()}`;
                const workflow = get().workflows.find(w => w.id === workflowId);
                set(state => ({
                    scheduledTasks: [...state.scheduledTasks, { id, name: workflow?.name || 'Scheduled task', workflowId, schedule, enabled: true }],
                }));
                return id;
            },

            unscheduleWorkflow: (taskId) => {
                set(state => ({ scheduledTasks: state.scheduledTasks.filter(t => t.id !== taskId) }));
            },

            createWebhook: (webhookData) => {
                const id = `webhook_${Date.now()}`;
                set(state => ({
                    webhooks: [...state.webhooks, { ...webhookData, id, createdAt: new Date(), secret: `whsec_${Date.now()}` }],
                }));
                return id;
            },

            deleteWebhook: (id) => {
                set(state => ({ webhooks: state.webhooks.filter(w => w.id !== id) }));
            },

            regenerateWebhookSecret: (id) => {
                set(state => ({
                    webhooks: state.webhooks.map(w =>
                        w.id === id ? { ...w, secret: `whsec_${Date.now()}` } : w
                    ),
                }));
            },
        }),
        { name: 'sprintloop-workflows' }
    )
);
