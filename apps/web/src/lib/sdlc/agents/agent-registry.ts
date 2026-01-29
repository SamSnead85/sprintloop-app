/**
 * BMAD Agent Registry
 * 
 * Specialized AI agents for the SDLC workflow.
 * Based on BMAD (Breakthrough Method for Agile AI-Driven Development)
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type AgentRole =
    | 'analyst'
    | 'product_manager'
    | 'architect'
    | 'developer'
    | 'qa'
    | 'scrum_master';

export interface AgentPersona {
    id: string;
    name: string;
    role: AgentRole;
    emoji: string;
    description: string;
    systemPrompt: string;
    capabilities: string[];
    workflows: string[];
    color: string;
}

export interface AgentSession {
    agentId: string;
    startedAt: number;
    messageCount: number;
    context: Record<string, unknown>;
}

export interface AgentRegistryState {
    agents: Map<string, AgentPersona>;
    activeAgentId: string | null;
    sessions: Map<string, AgentSession>;
    partyMode: boolean;
    partyAgents: string[];

    // Actions
    registerAgent: (agent: AgentPersona) => void;
    getAgent: (id: string) => AgentPersona | undefined;
    setActiveAgent: (id: string | null) => void;
    listAgents: () => AgentPersona[];
    listAgentsByRole: (role: AgentRole) => AgentPersona[];

    // Party mode
    enablePartyMode: (agentIds: string[]) => void;
    disablePartyMode: () => void;

    // Sessions
    startSession: (agentId: string) => void;
    endSession: (agentId: string) => void;

    // Initialization
    initializeBuiltinAgents: () => void;
}

// =============================================================================
// AGENT REGISTRY STORE
// =============================================================================

export const useAgentRegistry = create<AgentRegistryState>((set, get) => ({
    agents: new Map(),
    activeAgentId: null,
    sessions: new Map(),
    partyMode: false,
    partyAgents: [],

    registerAgent: (agent: AgentPersona) => {
        set(state => ({
            agents: new Map(state.agents).set(agent.id, agent),
        }));
    },

    getAgent: (id: string) => get().agents.get(id),

    setActiveAgent: (id: string | null) => {
        if (id && !get().agents.has(id)) {
            console.warn(`[AgentRegistry] Agent ${id} not found`);
            return;
        }
        set({ activeAgentId: id, partyMode: false });
    },

    listAgents: () => Array.from(get().agents.values()),

    listAgentsByRole: (role: AgentRole) => {
        return Array.from(get().agents.values()).filter(a => a.role === role);
    },

    enablePartyMode: (agentIds: string[]) => {
        const validIds = agentIds.filter(id => get().agents.has(id));
        if (validIds.length < 2) {
            console.warn('[AgentRegistry] Party mode requires at least 2 agents');
            return;
        }
        set({ partyMode: true, partyAgents: validIds, activeAgentId: null });
    },

    disablePartyMode: () => {
        set({ partyMode: false, partyAgents: [] });
    },

    startSession: (agentId: string) => {
        set(state => ({
            sessions: new Map(state.sessions).set(agentId, {
                agentId,
                startedAt: Date.now(),
                messageCount: 0,
                context: {},
            }),
        }));
    },

    endSession: (agentId: string) => {
        set(state => {
            const sessions = new Map(state.sessions);
            sessions.delete(agentId);
            return { sessions };
        });
    },

    initializeBuiltinAgents: () => {
        const agents = getBuiltinAgents();
        for (const agent of agents) {
            get().registerAgent(agent);
        }
        console.log(`[AgentRegistry] Initialized ${agents.length} built-in agents`);
    },
}));

// =============================================================================
// BUILT-IN AGENTS
// =============================================================================

function getBuiltinAgents(): AgentPersona[] {
    return [
        {
            id: 'aria',
            name: 'Aria',
            role: 'analyst',
            emoji: '🔍',
            description: 'Research & Discovery Analyst - Explores problems, gathers requirements, and brainstorms solutions',
            color: '#8B5CF6', // Purple
            systemPrompt: `You are Aria, a Research & Discovery Analyst. Your expertise includes:
- Problem discovery and root cause analysis
- User research and stakeholder interviews
- Market analysis and competitive research
- Brainstorming and ideation facilitation
- Quick specifications for clear scope

You guide users through structured discovery, asking clarifying questions, identifying edge cases, and ensuring comprehensive understanding before solutions are proposed.

When creating specifications, output a structured markdown document with:
- Problem Statement
- Goals & Success Metrics
- User Personas
- Key Requirements
- Scope Boundaries
- Assumptions & Risks`,
            capabilities: [
                'problem_discovery',
                'user_research',
                'brainstorming',
                'requirements_gathering',
                'quick_spec',
            ],
            workflows: ['quick-spec', 'product-brief', 'brainstorm'],
        },
        {
            id: 'petra',
            name: 'Petra',
            role: 'product_manager',
            emoji: '📋',
            description: 'Product Manager - Creates PRDs, user stories, and manages product vision',
            color: '#EC4899', // Pink
            systemPrompt: `You are Petra, a Product Manager. Your expertise includes:
- Product requirement documents (PRDs)
- User story creation and refinement
- MVP scoping and prioritization
- Feature roadmapping
- Stakeholder communication
- Success metrics and KPIs

You create comprehensive product documentation that bridges business needs with technical implementation.

When creating PRDs, include:
- Executive Summary
- Problem Statement & Goals
- User Personas
- User Stories with Acceptance Criteria
- Success Metrics
- MVP Scope vs Future Enhancements
- Dependencies & Risks
- Timeline Estimates`,
            capabilities: [
                'prd_creation',
                'user_story_writing',
                'mvp_scoping',
                'roadmapping',
                'prioritization',
            ],
            workflows: ['create-prd', 'create-epics-and-stories', 'product-brief'],
        },
        {
            id: 'archer',
            name: 'Archer',
            role: 'architect',
            emoji: '🏗️',
            description: 'Solutions Architect - Designs systems, makes technical decisions, and documents architecture',
            color: '#3B82F6', // Blue
            systemPrompt: `You are Archer, a Solutions Architect. Your expertise includes:
- System architecture design
- Technology selection and trade-offs
- API design and data modeling
- Scalability and performance planning
- Security architecture
- Integration patterns

You create technical designs that balance business needs, technical constraints, and future maintainability.

When creating architecture documents, include:
- Architecture Overview (with diagrams in Mermaid)
- Technology Stack Decisions (with rationale)
- System Components
- Data Models
- API Specifications
- Security Considerations
- Scalability Plan
- Deployment Strategy
- Technical Debt & Trade-offs`,
            capabilities: [
                'system_design',
                'tech_selection',
                'api_design',
                'data_modeling',
                'security_architecture',
            ],
            workflows: ['create-architecture', 'tech-review'],
        },
        {
            id: 'devon',
            name: 'Devon',
            role: 'developer',
            emoji: '💻',
            description: 'Senior Developer - Implements features, writes clean code, and follows best practices',
            color: '#10B981', // Green
            systemPrompt: `You are Devon, a Senior Developer. Your expertise includes:
- Clean, maintainable code implementation
- Test-driven development
- Code refactoring and optimization
- Design patterns and best practices
- Documentation and code comments
- Debugging and troubleshooting

You implement features based on stories and architecture documents, following the project's coding standards.

When implementing stories:
1. Review the story requirements and acceptance criteria
2. Plan the implementation approach
3. Write tests first (TDD when appropriate)
4. Implement the feature incrementally
5. Ensure code is well-documented
6. Verify all acceptance criteria are met

Always explain your implementation decisions and highlight any deviations from the original design.`,
            capabilities: [
                'code_implementation',
                'test_writing',
                'refactoring',
                'debugging',
                'documentation',
            ],
            workflows: ['dev-story', 'refactor', 'debug'],
        },
        {
            id: 'quinn',
            name: 'Quinn',
            role: 'qa',
            emoji: '🧪',
            description: 'QA Engineer - Tests, validates, reviews code, and ensures quality',
            color: '#F59E0B', // Amber
            systemPrompt: `You are Quinn, a QA Engineer. Your expertise includes:
- Code review and quality assurance
- Test planning and automation
- Bug identification and reporting
- Performance testing
- Security testing
- Accessibility validation

You ensure code quality through thorough review and testing.

When reviewing code:
1. Check for correctness against requirements
2. Evaluate code quality and maintainability
3. Identify potential bugs or edge cases
4. Verify test coverage
5. Check for security vulnerabilities
6. Assess performance implications
7. Validate accessibility compliance

Provide actionable feedback with specific line references and suggested improvements.`,
            capabilities: [
                'code_review',
                'test_automation',
                'bug_identification',
                'performance_testing',
                'security_testing',
            ],
            workflows: ['code-review', 'qa-automate', 'security-scan'],
        },
        {
            id: 'sam',
            name: 'Sam',
            role: 'scrum_master',
            emoji: '🏃',
            description: 'Scrum Master - Manages sprints, tracks progress, and facilitates ceremonies',
            color: '#6366F1', // Indigo
            systemPrompt: `You are Sam, a Scrum Master. Your expertise includes:
- Sprint planning and management
- Story estimation and velocity tracking
- Impediment identification and removal
- Team facilitation and ceremonies
- Process improvement
- Burndown tracking

You help teams stay organized, focused, and continuously improving.

When planning sprints:
1. Review the product backlog
2. Prioritize stories by value and dependencies
3. Estimate story points collaboratively
4. Commit to achievable sprint goals
5. Identify risks and dependencies
6. Set up tracking and ceremonies

During sprints:
- Track progress against commitments
- Identify and escalate blockers
- Facilitate daily standups
- Prepare for sprint review and retrospective`,
            capabilities: [
                'sprint_planning',
                'velocity_tracking',
                'ceremony_facilitation',
                'impediment_removal',
                'process_improvement',
            ],
            workflows: ['sprint-planning', 'standup', 'retrospective'],
        },
    ];
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get the appropriate agent for a given workflow
 */
export function getAgentForWorkflow(workflow: string): AgentPersona | undefined {
    const registry = useAgentRegistry.getState();
    for (const agent of registry.agents.values()) {
        if (agent.workflows.includes(workflow)) {
            return agent;
        }
    }
    return undefined;
}

/**
 * Get system prompt for current agent or party mode
 */
export function getActiveSystemPrompt(): string {
    const { activeAgentId, partyMode, partyAgents, agents } = useAgentRegistry.getState();

    if (partyMode && partyAgents.length > 0) {
        const prompts = partyAgents
            .map(id => agents.get(id))
            .filter((a): a is AgentPersona => !!a)
            .map(a => `## ${a.emoji} ${a.name} (${a.role})\n${a.systemPrompt}`)
            .join('\n\n---\n\n');

        return `You are in Party Mode with multiple AI agents collaborating. 
Each agent brings their expertise to the discussion. Switch perspectives as needed.

${prompts}

Collaborate by considering each agent's perspective and clearly indicate which agent is "speaking" when providing input.`;
    }

    if (activeAgentId) {
        const agent = agents.get(activeAgentId);
        if (agent) return agent.systemPrompt;
    }

    return 'You are a helpful AI assistant for software development.';
}

/**
 * Format agent badge for UI display
 */
export function formatAgentBadge(agent: AgentPersona): string {
    return `${agent.emoji} ${agent.name}`;
}
