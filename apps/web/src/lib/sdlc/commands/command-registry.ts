/**
 * BMAD Command Registry
 * 
 * Slash commands for structured SDLC workflows.
 * Based on BMAD (Breakthrough Method for Agile AI-Driven Development)
 */

import { create } from 'zustand';
import { getAgentForWorkflow, useAgentRegistry } from '../agents/agent-registry';

// =============================================================================
// TYPES
// =============================================================================

export type CommandCategory =
    | 'discovery'
    | 'planning'
    | 'architecture'
    | 'development'
    | 'testing'
    | 'management';

export interface CommandDefinition {
    id: string;
    name: string;
    description: string;
    category: CommandCategory;
    agentRole?: string;
    shortcut?: string;
    usage: string;
    examples: string[];
    outputArtifact?: string;
    execute: (args: CommandArgs) => Promise<CommandResult>;
}

export interface CommandArgs {
    rawInput: string;
    args: string[];
    flags: Record<string, string | boolean>;
    projectContext?: ProjectContext;
}

export interface ProjectContext {
    projectPath?: string;
    currentPhase?: string;
    existingArtifacts?: string[];
    currentSprint?: string;
}

export interface CommandResult {
    success: boolean;
    output: string;
    artifact?: {
        name: string;
        path: string;
        content: string;
    };
    nextCommand?: string;
    agentId?: string;
    error?: string;
}

export interface CommandRegistryState {
    commands: Map<string, CommandDefinition>;
    history: CommandExecution[];

    // Actions
    registerCommand: (command: CommandDefinition) => void;
    getCommand: (id: string) => CommandDefinition | undefined;
    listCommands: (category?: CommandCategory) => CommandDefinition[];
    executeCommand: (input: string, context?: ProjectContext) => Promise<CommandResult>;
    parseCommandInput: (input: string) => ParsedCommand | null;

    // Initialization
    initializeBuiltinCommands: () => void;
}

export interface CommandExecution {
    commandId: string;
    input: string;
    result: CommandResult;
    timestamp: number;
    duration: number;
}

export interface ParsedCommand {
    commandId: string;
    args: string[];
    flags: Record<string, string | boolean>;
    rawInput: string;
}

// =============================================================================
// COMMAND REGISTRY STORE
// =============================================================================

export const useCommandRegistry = create<CommandRegistryState>((set, get) => ({
    commands: new Map(),
    history: [],

    registerCommand: (command: CommandDefinition) => {
        set(state => ({
            commands: new Map(state.commands).set(command.id, command),
        }));
    },

    getCommand: (id: string) => get().commands.get(id),

    listCommands: (category?: CommandCategory) => {
        const commands = Array.from(get().commands.values());
        return category ? commands.filter(c => c.category === category) : commands;
    },

    parseCommandInput: (input: string): ParsedCommand | null => {
        const trimmed = input.trim();
        if (!trimmed.startsWith('/')) return null;

        const parts = trimmed.split(/\s+/);
        const commandName = parts[0].slice(1); // Remove leading /

        // Parse flags and args
        const args: string[] = [];
        const flags: Record<string, string | boolean> = {};

        for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (part.startsWith('--')) {
                const [key, value] = part.slice(2).split('=');
                flags[key] = value ?? true;
            } else if (part.startsWith('-')) {
                flags[part.slice(1)] = true;
            } else {
                args.push(part);
            }
        }

        return {
            commandId: commandName,
            args,
            flags,
            rawInput: input,
        };
    },

    executeCommand: async (input: string, context?: ProjectContext): Promise<CommandResult> => {
        const startTime = Date.now();
        const parsed = get().parseCommandInput(input);

        if (!parsed) {
            return {
                success: false,
                output: 'Invalid command format. Commands must start with /',
                error: 'INVALID_FORMAT',
            };
        }

        const command = get().commands.get(parsed.commandId);

        if (!command) {
            // Check for similar commands
            const suggestions = getSimilarCommands(parsed.commandId, get().commands);
            return {
                success: false,
                output: `Unknown command: /${parsed.commandId}` +
                    (suggestions.length > 0 ? `\n\nDid you mean: ${suggestions.join(', ')}?` : '') +
                    '\n\nType /bmad-help for available commands.',
                error: 'UNKNOWN_COMMAND',
            };
        }

        // Set the appropriate agent
        const agent = getAgentForWorkflow(parsed.commandId);
        if (agent) {
            useAgentRegistry.getState().setActiveAgent(agent.id);
        }

        try {
            const result = await command.execute({
                rawInput: input,
                args: parsed.args,
                flags: parsed.flags,
                projectContext: context,
            });

            // Record execution
            const execution: CommandExecution = {
                commandId: parsed.commandId,
                input,
                result,
                timestamp: Date.now(),
                duration: Date.now() - startTime,
            };

            set(state => ({
                history: [...state.history.slice(-49), execution], // Keep last 50
            }));

            return { ...result, agentId: agent?.id };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                output: `Command failed: ${errorMsg}`,
                error: errorMsg,
            };
        }
    },

    initializeBuiltinCommands: () => {
        const commands = getBuiltinCommands();
        for (const command of commands) {
            get().registerCommand(command);
        }
        console.log(`[CommandRegistry] Initialized ${commands.length} built-in commands`);
    },
}));

// =============================================================================
// BUILT-IN COMMANDS
// =============================================================================

function getBuiltinCommands(): CommandDefinition[] {
    return [
        // === Help ===
        {
            id: 'bmad-help',
            name: 'BMAD Help',
            description: 'Get contextual help and guidance on what to do next',
            category: 'management',
            usage: '/bmad-help [topic]',
            examples: [
                '/bmad-help',
                '/bmad-help How should I build a web app?',
                '/bmad-help What do I do after architecture?',
            ],
            execute: async (args) => {
                const topic = args.args.join(' ');
                if (!topic) {
                    return {
                        success: true,
                        output: `# 🚀 SprintLoop BMAD Help

## Quick Start Commands

### Discovery & Planning
| Command | Description |
|---------|-------------|
| \`/product-brief\` | Define problem, users, and MVP scope |
| \`/quick-spec\` | Fast spec for clear scope |
| \`/create-prd\` | Full product requirements document |

### Architecture & Design
| Command | Description |
|---------|-------------|
| \`/create-architecture\` | System design and tech decisions |

### Development
| Command | Description |
|---------|-------------|
| \`/create-epics-and-stories\` | Break work into user stories |
| \`/dev-story\` | Implement a specific story |
| \`/code-review\` | Review code quality |

### Sprint Management
| Command | Description |
|---------|-------------|
| \`/sprint-planning\` | Plan and start a sprint |
| \`/standup\` | Daily standup check-in |

## Recommended Flow

**Simple (Bug Fix/Small Feature):**
\`/quick-spec\` → \`/dev-story\` → \`/code-review\`

**Full Planning (Product/Platform):**
\`/product-brief\` → \`/create-prd\` → \`/create-architecture\` → \`/create-epics-and-stories\` → \`/sprint-planning\` → \`/dev-story\`

---
*Ask me anything! Example: "/bmad-help How do I start building a SaaS app?"*`,
                    };
                }

                return {
                    success: true,
                    output: `Looking at your question: "${topic}"

Let me analyze your project context and provide guidance...

Based on the BMAD methodology, here's my recommendation:

1. **Understand your scope** - Is this a quick fix, feature, or full product?
2. **Choose your path**:
   - Quick fix → \`/quick-spec\` → \`/dev-story\`
   - New feature → \`/product-brief\` → \`/create-prd\` → \`/dev-story\`
   - New product → Full BMAD flow starting with \`/product-brief\`

Would you like me to help you get started with a specific command?`,
                };
            },
        },

        // === Discovery ===
        {
            id: 'quick-spec',
            name: 'Quick Spec',
            description: 'Quickly analyze scope and create a technical specification',
            category: 'discovery',
            agentRole: 'analyst',
            usage: '/quick-spec [description]',
            examples: [
                '/quick-spec Add user authentication to the app',
                '/quick-spec Fix the checkout bug',
            ],
            outputArtifact: 'docs/specs/quick-spec.md',
            execute: async (args) => {
                const description = args.args.join(' ') || 'Please describe what you want to build or fix.';

                return {
                    success: true,
                    output: `# 🔍 Quick Specification

**Analyzing:** ${description}

I'll help you create a focused specification. Let me ask a few questions:

## 1. Problem Definition
What specific problem does this solve?

## 2. Scope
- What's IN scope?
- What's explicitly OUT of scope?

## 3. Success Criteria
How will we know when this is done?

## 4. Technical Considerations
Any constraints or technical requirements?

---

*Please provide details and I'll generate your quick-spec document.*`,
                    nextCommand: 'dev-story',
                };
            },
        },

        {
            id: 'product-brief',
            name: 'Product Brief',
            description: 'Define the problem, target users, and initial MVP scope',
            category: 'discovery',
            agentRole: 'analyst',
            usage: '/product-brief',
            examples: ['/product-brief'],
            outputArtifact: 'docs/product-brief.md',
            execute: async () => {
                return {
                    success: true,
                    output: `# 📋 Product Brief Workshop

Let's define your product vision. I'll guide you through the key questions.

## Part 1: The Problem
1. **What problem are you solving?**
2. **Who experiences this problem?**
3. **How are they solving it today?**

## Part 2: The Solution
4. **What's your proposed solution?**
5. **Why is now the right time?**
6. **What's your unique advantage?**

## Part 3: MVP Scope
7. **What are the 3-5 must-have features?**
8. **What are nice-to-haves for later?**
9. **What's the smallest version we can ship?**

---

*Share your answers and I'll synthesize them into a product-brief.md*`,
                    nextCommand: 'create-prd',
                };
            },
        },

        // === Planning ===
        {
            id: 'create-prd',
            name: 'Create PRD',
            description: 'Generate a comprehensive Product Requirements Document',
            category: 'planning',
            agentRole: 'product_manager',
            usage: '/create-prd',
            examples: ['/create-prd'],
            outputArtifact: 'docs/prd.md',
            execute: async () => {
                return {
                    success: true,
                    output: `# 📝 Product Requirements Document

I'll help you create a comprehensive PRD. Let's build this section by section.

## Document Sections

1. **Executive Summary** - One paragraph overview
2. **Problem Statement** - What we're solving and why
3. **Goals & Success Metrics** - How we measure success
4. **User Personas** - Who we're building for
5. **User Stories** - What users need to do
6. **Functional Requirements** - Detailed features
7. **Non-Functional Requirements** - Performance, security, etc.
8. **MVP Scope** - What's in v1
9. **Future Considerations** - What's next
10. **Dependencies & Risks** - What could go wrong
11. **Timeline** - When we'll deliver

---

*Let's start with the Executive Summary. Describe your product in 2-3 sentences.*`,
                    nextCommand: 'create-architecture',
                };
            },
        },

        {
            id: 'create-epics-and-stories',
            name: 'Create Epics & Stories',
            description: 'Break down the PRD into epics and user stories',
            category: 'planning',
            agentRole: 'product_manager',
            usage: '/create-epics-and-stories',
            examples: ['/create-epics-and-stories'],
            outputArtifact: 'docs/epics/',
            execute: async () => {
                return {
                    success: true,
                    output: `# 📚 Epics & Stories Workshop

I'll help you break down your requirements into actionable work items.

## Story Format
\`\`\`
As a [user type]
I want to [action]
So that [benefit]

Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
\`\`\`

## Let's Start

Based on your PRD, I'll identify the major **Epics** (large features) and break them into **Stories** (implementable chunks).

**What's your PRD or feature list?** Share it and I'll generate the breakdown.

---

*Each story will be estimated in story points and prioritized for sprints.*`,
                    nextCommand: 'sprint-planning',
                };
            },
        },

        // === Architecture ===
        {
            id: 'create-architecture',
            name: 'Create Architecture',
            description: 'Design system architecture and make technical decisions',
            category: 'architecture',
            agentRole: 'architect',
            usage: '/create-architecture',
            examples: ['/create-architecture'],
            outputArtifact: 'docs/architecture.md',
            execute: async () => {
                return {
                    success: true,
                    output: `# 🏗️ Architecture Design Session

I'll help you design a robust, scalable architecture.

## Key Decisions We'll Make

### 1. System Overview
- High-level component diagram
- Data flow

### 2. Technology Stack
- Frontend framework
- Backend language/framework
- Database(s)
- Infrastructure/hosting

### 3. Data Model
- Core entities
- Relationships
- Storage strategy

### 4. API Design
- REST vs GraphQL vs tRPC
- Key endpoints
- Authentication strategy

### 5. Non-Functional Requirements
- Scalability approach
- Security measures
- Monitoring/observability

---

**Let's start:** What type of application are you building? (Web app, mobile app, API, etc.)`,
                    nextCommand: 'create-epics-and-stories',
                };
            },
        },

        // === Development ===
        {
            id: 'dev-story',
            name: 'Develop Story',
            description: 'Implement a specific user story',
            category: 'development',
            agentRole: 'developer',
            usage: '/dev-story [story-id or description]',
            examples: [
                '/dev-story US-001',
                '/dev-story Add login form component',
            ],
            execute: async (args) => {
                const story = args.args.join(' ') || 'No story specified';

                return {
                    success: true,
                    output: `# 💻 Implementing Story: ${story}

## Implementation Plan

### Step 1: Understand Requirements
Let me review the acceptance criteria...

### Step 2: Design Approach
- Component/file structure
- Key functions/classes
- Test strategy

### Step 3: Implementation
I'll implement this incrementally, showing you each change.

### Step 4: Verification
- Run tests
- Manual verification
- Update documentation

---

**Ready to start?** Provide the story details or point me to the story document.`,
                    nextCommand: 'code-review',
                };
            },
        },

        // === Testing ===
        {
            id: 'code-review',
            name: 'Code Review',
            description: 'Review code for quality, security, and best practices',
            category: 'testing',
            agentRole: 'qa',
            usage: '/code-review [file or PR]',
            examples: [
                '/code-review',
                '/code-review src/components/Login.tsx',
            ],
            execute: async (args) => {
                const target = args.args.join(' ') || 'recent changes';

                return {
                    success: true,
                    output: `# 🧪 Code Review: ${target}

## Review Checklist

### 1. Correctness
- [ ] Meets acceptance criteria
- [ ] Edge cases handled
- [ ] Error handling complete

### 2. Code Quality
- [ ] Clear, readable code
- [ ] Follows project conventions
- [ ] No code smells
- [ ] DRY principles

### 3. Testing
- [ ] Unit tests present
- [ ] Tests are meaningful
- [ ] Good coverage

### 4. Security
- [ ] No vulnerabilities
- [ ] Input validation
- [ ] Auth/authz correct

### 5. Performance
- [ ] No obvious bottlenecks
- [ ] Efficient algorithms
- [ ] Proper caching

---

**Share the code** you want reviewed and I'll provide detailed feedback.`,
                };
            },
        },

        // === Sprint Management ===
        {
            id: 'sprint-planning',
            name: 'Sprint Planning',
            description: 'Plan and initialize a new sprint',
            category: 'management',
            agentRole: 'scrum_master',
            usage: '/sprint-planning',
            examples: ['/sprint-planning'],
            outputArtifact: 'docs/sprints/',
            execute: async () => {
                return {
                    success: true,
                    output: `# 🏃 Sprint Planning

## Sprint Setup

### Sprint Details
- **Sprint Number:** [Auto-increment]
- **Duration:** 2 weeks (recommended)
- **Start Date:** Today
- **End Date:** +2 weeks

### Sprint Goal
What's the ONE main objective for this sprint?

### Story Selection
Based on your backlog, let's select stories:

| Priority | Story | Points | Status |
|----------|-------|--------|--------|
| P0 | ... | ... | Ready |
| P1 | ... | ... | Ready |

### Capacity Planning
- **Team capacity:** X story points
- **Selected work:** Y story points
- **Buffer:** 20% for unknowns

---

**Share your backlog** and I'll help you plan an achievable sprint.`,
                };
            },
        },

        {
            id: 'standup',
            name: 'Daily Standup',
            description: 'Quick daily check-in and blocker identification',
            category: 'management',
            agentRole: 'scrum_master',
            usage: '/standup',
            examples: ['/standup'],
            execute: async () => {
                return {
                    success: true,
                    output: `# 🌅 Daily Standup

## Three Questions

### 1. What did you complete yesterday?
- 

### 2. What will you work on today?
- 

### 3. Any blockers or impediments?
- 

---

*Share your updates and I'll help track progress and resolve blockers.*`,
                };
            },
        },
    ];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getSimilarCommands(input: string, commands: Map<string, CommandDefinition>): string[] {
    const similar: string[] = [];
    const inputLower = input.toLowerCase();

    for (const [id] of commands) {
        // Simple similarity check
        if (id.includes(inputLower) || inputLower.includes(id.slice(0, 3))) {
            similar.push(`/${id}`);
        }
    }

    return similar.slice(0, 3);
}

/**
 * Check if input is a slash command
 */
export function isSlashCommand(input: string): boolean {
    return input.trim().startsWith('/');
}

/**
 * Get command suggestions for autocomplete
 */
export function getCommandSuggestions(partial: string): CommandDefinition[] {
    const commands = useCommandRegistry.getState().listCommands();
    const partialLower = partial.toLowerCase().replace(/^\//, '');

    return commands
        .filter(c => c.id.includes(partialLower) || c.name.toLowerCase().includes(partialLower))
        .slice(0, 5);
}
