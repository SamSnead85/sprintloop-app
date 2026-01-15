/**
 * SprintLoop Agent Module
 * 
 * Core agentic framework infusing best practices from:
 * - Cline: Plan/Act modes, approval workflows
 * - Codex CLI: Full Auto mode, terminal-first
 * - OpenCode: Event-driven, custom agents, LSP integration
 */

// Core harness
export {
    UnifiedAgentHarness,
    createAgentFromPreset,
    PRESET_AGENTS,
    BUILT_IN_TOOLS,
    agentEvents,
} from './harness';
export type {
    AgentMode,
    AgentConfig,
    AgentTool,
    ToolResult,
    AgentAction,
    AgentPlan,
    PlanStep,
    AgentEvent,
    AgentEventType,
    AgentSession,
    SessionMessage,
    ToolCall,
} from './harness';

// Personas
export {
    AGENT_PERSONAS,
    getPersona,
    getAllPersonas,
    createCustomPersona,
    buildPersonaPrompt,
} from './personas';
export type { AgentPersona } from './personas';

// Tools
export {
    toolRegistry,
    formatToolResultForChat,
} from './tools';
export type {
    ToolDefinition,
    ToolParameter,
    ToolExample,
    ToolExecutionResult,
    ToolExecutionLog,
} from './tools';
