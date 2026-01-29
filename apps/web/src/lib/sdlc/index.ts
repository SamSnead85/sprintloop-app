/**
 * SDLC Module Index
 * 
 * Central export for all SDLC-related functionality.
 */

// Agents
export {
    useAgentRegistry,
    getAgentForWorkflow,
    getActiveSystemPrompt,
    formatAgentBadge,
    type AgentPersona,
    type AgentRole,
    type AgentSession,
} from './agents/agent-registry';

// Commands
export {
    useCommandRegistry,
    isSlashCommand,
    getCommandSuggestions,
    type CommandDefinition,
    type CommandArgs,
    type CommandResult,
    type CommandCategory,
} from './commands/command-registry';

// Project Lifecycle
export {
    useProjectLifecycle,
    getPhaseInfo,
    getPhaseCommand,
    type ProjectState,
    type ProjectPhase,
    type ProjectComplexity,
    type Artifact,
    type ArtifactType,
} from './project-lifecycle';

// Sprint Management
export {
    useSprintManager,
    getStoryTypeEmoji,
    getPriorityColor,
    getStatusColor,
    formatStoryId,
    type Story,
    type Epic,
    type Sprint,
    type StoryStatus,
    type StoryPriority,
    type StoryType,
    type SprintProgress,
    type BoardColumn,
} from './sprint-manager';

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize all SDLC subsystems
 */
export function initializeSDLC(): void {
    const { initializeBuiltinAgents } = require('./agents/agent-registry').useAgentRegistry.getState();
    const { initializeBuiltinCommands } = require('./commands/command-registry').useCommandRegistry.getState();

    initializeBuiltinAgents();
    initializeBuiltinCommands();

    console.log('[SDLC] SprintLoop SDLC system initialized');
}
