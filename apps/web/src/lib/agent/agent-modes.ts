/**
 * SprintLoop Agent Modes System
 * 
 * Implements Cursor-style specialized agent modes:
 * - Agent Mode: Complex coding with multi-file edits
 * - Plan Mode: Strategize before coding
 * - Debug Mode: Root cause analysis
 * - Ask Mode: Quick questions
 * 
 * Also implements:
 * - Subagents for parallel task handling
 * - Skills for specialized knowledge
 * - Clarifying questions during conversations
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useContextProviders } from '../context/context-providers'

// Agent modes (Cursor-style)
export type AgentMode = 'agent' | 'plan' | 'debug' | 'ask' | 'composer'

// Agent mode configurations
export const AGENT_MODES: Record<AgentMode, {
    id: AgentMode
    name: string
    description: string
    icon: string
    color: string
    capabilities: string[]
    systemPrompt: string
}> = {
    agent: {
        id: 'agent',
        name: 'Agent',
        description: 'Complex coding with multi-file edits and command execution',
        icon: '🤖',
        color: 'blue',
        capabilities: ['multi-file-edit', 'command-execution', 'codebase-search', 'error-resolution'],
        systemPrompt: `You are an AI coding agent with full access to the codebase. You can:
- Edit multiple files simultaneously
- Execute terminal commands
- Search the entire codebase
- Resolve errors and fix bugs
- Create directories and files
Always verify your changes work by running appropriate commands.`,
    },
    plan: {
        id: 'plan',
        name: 'Plan',
        description: 'Research codebase and create implementation plans',
        icon: '📋',
        color: 'purple',
        capabilities: ['codebase-research', 'requirement-clarification', 'plan-generation'],
        systemPrompt: `You are a planning agent. Do NOT write code yet. Instead:
1. Research the codebase to understand existing patterns
2. Clarify requirements with the user
3. Generate a detailed implementation plan
4. Break down the plan into actionable steps
Only after the user approves the plan should you proceed to implementation.`,
    },
    debug: {
        id: 'debug',
        name: 'Debug',
        description: 'Root cause analysis and bug resolution',
        icon: '🐛',
        color: 'red',
        capabilities: ['hypothesis-generation', 'log-instrumentation', 'runtime-analysis', 'fix-suggestion'],
        systemPrompt: `You are a debugging expert. Your approach:
1. Reproduce the issue by understanding the steps
2. Generate hypotheses about root causes
3. Add instrumentation/logging if needed
4. Analyze runtime behavior
5. Identify the root cause
6. Suggest or implement fixes
Always explain your debugging reasoning.`,
    },
    ask: {
        id: 'ask',
        name: 'Ask',
        description: 'Quick questions about code without making changes',
        icon: '💬',
        color: 'green',
        capabilities: ['code-explanation', 'documentation', 'questions'],
        systemPrompt: `You are a helpful coding assistant. Answer questions clearly and concisely.
Do not make any code changes unless explicitly asked.
Explain concepts, document code, and provide helpful information.`,
    },
    composer: {
        id: 'composer',
        name: 'Composer',
        description: 'Fast multi-step coding tasks (Cursor 2.0 style)',
        icon: '⚡',
        color: 'orange',
        capabilities: ['multi-file-edit', 'directory-creation', 'codebase-semantic-search', 'fast-execution'],
        systemPrompt: `You are Composer, a high-speed coding agent optimized for:
- Multi-step tasks in under 30 seconds
- Codebase-wide semantic understanding
- Creating directories and file structures
- Sweeping changes across the entire codebase
Execute tasks efficiently and verify with tests.`,
    },
}

// Subagent for parallel task handling
export interface Subagent {
    id: string
    name: string
    mode: AgentMode
    status: 'idle' | 'working' | 'complete' | 'error'
    task: string
    result?: string
    error?: string
    startedAt?: number
    completedAt?: number
}

// Skill for specialized knowledge
export interface AgentSkill {
    id: string
    name: string
    description: string
    keywords: string[]
    enable: boolean
}

// Built-in skills
const BUILT_IN_SKILLS: AgentSkill[] = [
    { id: 'react', name: 'React', description: 'React patterns, hooks, and best practices', keywords: ['react', 'jsx', 'hooks', 'component'], enable: true },
    { id: 'typescript', name: 'TypeScript', description: 'TypeScript types, generics, and patterns', keywords: ['typescript', 'type', 'interface', 'generic'], enable: true },
    { id: 'testing', name: 'Testing', description: 'Unit tests, integration tests, and TDD', keywords: ['test', 'jest', 'vitest', 'spec'], enable: true },
    { id: 'api', name: 'API Design', description: 'REST, GraphQL, and API patterns', keywords: ['api', 'rest', 'graphql', 'endpoint'], enable: true },
    { id: 'database', name: 'Database', description: 'SQL, Prisma, and database design', keywords: ['database', 'sql', 'prisma', 'query'], enable: true },
    { id: 'docker', name: 'Docker', description: 'Containerization and Docker Compose', keywords: ['docker', 'container', 'compose', 'k8s'], enable: true },
    { id: 'git', name: 'Git', description: 'Version control and branching strategies', keywords: ['git', 'branch', 'merge', 'commit'], enable: true },
    { id: 'security', name: 'Security', description: 'Security best practices and vulnerability prevention', keywords: ['security', 'auth', 'jwt', 'xss'], enable: true },
]

// Clarifying question
export interface ClarifyingQuestion {
    id: string
    question: string
    options?: string[]
    answer?: string
    required: boolean
}

// Agent execution state
interface AgentModeState {
    // Current mode
    currentMode: AgentMode
    previousMode: AgentMode | null

    // Subagents (Cursor 2.2 feature)
    subagents: Subagent[]
    maxParallelAgents: number

    // Skills
    skills: AgentSkill[]
    activeSkills: string[]

    // Clarifying questions
    pendingQuestions: ClarifyingQuestion[]
    awaitingClarification: boolean

    // Execution state
    isExecuting: boolean
    executionPlan: string[]
    currentStep: number

    // Multi-agent judging
    enableJudging: boolean
    judgingModel: string | null

    // Actions
    setMode: (mode: AgentMode) => void

    // Subagent management
    spawnSubagent: (name: string, mode: AgentMode, task: string) => string
    getSubagentStatus: (id: string) => Subagent | undefined
    completeSubagent: (id: string, result: string) => void
    failSubagent: (id: string, error: string) => void
    clearSubagents: () => void

    // Skills management
    enableSkill: (skillId: string) => void
    disableSkill: (skillId: string) => void
    getActiveSkillPrompts: () => string

    // Clarifying questions
    askQuestion: (question: string, options?: string[], required?: boolean) => string
    answerQuestion: (questionId: string, answer: string) => void
    getPendingQuestions: () => ClarifyingQuestion[]
    clearQuestions: () => void

    // Execution
    startExecution: (plan: string[]) => void
    nextStep: () => void
    completeExecution: () => void

    // Build system prompt
    buildSystemPrompt: () => string
}

export const useAgentModes = create<AgentModeState>()(
    persist(
        (set, get) => ({
            currentMode: 'agent',
            previousMode: null,
            subagents: [],
            maxParallelAgents: 8,
            skills: BUILT_IN_SKILLS,
            activeSkills: BUILT_IN_SKILLS.filter(s => s.enable).map(s => s.id),
            pendingQuestions: [],
            awaitingClarification: false,
            isExecuting: false,
            executionPlan: [],
            currentStep: 0,
            enableJudging: false,
            judgingModel: null,

            setMode: (mode) => set(state => ({
                previousMode: state.currentMode,
                currentMode: mode,
            })),

            spawnSubagent: (name, mode, task) => {
                const { subagents, maxParallelAgents } = get()

                // Check if we can spawn more
                const activeAgents = subagents.filter(s => s.status === 'working')
                if (activeAgents.length >= maxParallelAgents) {
                    throw new Error(`Maximum parallel agents (${maxParallelAgents}) reached`)
                }

                const id = `subagent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

                const newSubagent: Subagent = {
                    id,
                    name,
                    mode,
                    status: 'working',
                    task,
                    startedAt: Date.now(),
                }

                set({ subagents: [...subagents, newSubagent] })
                return id
            },

            getSubagentStatus: (id) => get().subagents.find(s => s.id === id),

            completeSubagent: (id, result) => {
                set(state => ({
                    subagents: state.subagents.map(s =>
                        s.id === id
                            ? { ...s, status: 'complete' as const, result, completedAt: Date.now() }
                            : s
                    ),
                }))
            },

            failSubagent: (id, error) => {
                set(state => ({
                    subagents: state.subagents.map(s =>
                        s.id === id
                            ? { ...s, status: 'error' as const, error, completedAt: Date.now() }
                            : s
                    ),
                }))
            },

            clearSubagents: () => set({ subagents: [] }),

            enableSkill: (skillId) => {
                set(state => ({
                    activeSkills: [...new Set([...state.activeSkills, skillId])],
                }))
            },

            disableSkill: (skillId) => {
                set(state => ({
                    activeSkills: state.activeSkills.filter(id => id !== skillId),
                }))
            },

            getActiveSkillPrompts: () => {
                const { skills, activeSkills } = get()
                const active = skills.filter(s => activeSkills.includes(s.id))

                if (active.length === 0) return ''

                return `\n\nActive Skills:\n${active.map(s => `- ${s.name}: ${s.description}`).join('\n')}`
            },

            askQuestion: (question, options, required = false) => {
                const id = `q-${Date.now()}`
                const newQuestion: ClarifyingQuestion = {
                    id,
                    question,
                    options,
                    required,
                }

                set(state => ({
                    pendingQuestions: [...state.pendingQuestions, newQuestion],
                    awaitingClarification: true,
                }))

                return id
            },

            answerQuestion: (questionId, answer) => {
                set(state => {
                    const updatedQuestions = state.pendingQuestions.map(q =>
                        q.id === questionId ? { ...q, answer } : q
                    )
                    const stillPending = updatedQuestions.some(q => q.required && !q.answer)

                    return {
                        pendingQuestions: updatedQuestions,
                        awaitingClarification: stillPending,
                    }
                })
            },

            getPendingQuestions: () => get().pendingQuestions.filter(q => !q.answer),

            clearQuestions: () => set({ pendingQuestions: [], awaitingClarification: false }),

            startExecution: (plan) => set({
                isExecuting: true,
                executionPlan: plan,
                currentStep: 0,
            }),

            nextStep: () => set(state => ({
                currentStep: Math.min(state.currentStep + 1, state.executionPlan.length),
            })),

            completeExecution: () => set({
                isExecuting: false,
                executionPlan: [],
                currentStep: 0,
            }),

            buildSystemPrompt: () => {
                const { currentMode, getActiveSkillPrompts } = get()
                const modeConfig = AGENT_MODES[currentMode]
                const skillPrompts = getActiveSkillPrompts()

                // Get context from context providers
                const contextPrompt = useContextProviders.getState().formatContextForPrompt()

                return `${modeConfig.systemPrompt}${skillPrompts}\n\n${contextPrompt}`
            },
        }),
        {
            name: 'sprintloop-agent-modes',
            partialize: (state) => ({
                currentMode: state.currentMode,
                activeSkills: state.activeSkills,
                enableJudging: state.enableJudging,
                maxParallelAgents: state.maxParallelAgents,
            }),
        }
    )
)

// Helper to detect mode from user input
export function detectModeFromInput(input: string): AgentMode | null {
    const lowered = input.toLowerCase()

    if (lowered.startsWith('/plan') || lowered.includes('create a plan')) return 'plan'
    if (lowered.startsWith('/debug') || lowered.includes('find the bug')) return 'debug'
    if (lowered.startsWith('/ask') || lowered.endsWith('?')) return 'ask'
    if (lowered.startsWith('/composer') || lowered.includes('quickly')) return 'composer'

    return null
}

// Format subagent results for multi-agent judging
export function formatSubagentResults(subagents: Subagent[]): string {
    const completed = subagents.filter(s => s.status === 'complete')

    if (completed.length === 0) return ''

    return `\n\n=== Subagent Results ===\n${completed.map(s =>
        `### ${s.name} (${s.mode})\n${s.result}`
    ).join('\n\n')}`
}
