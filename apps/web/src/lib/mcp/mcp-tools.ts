/**
 * SprintLoop MCP (Model Context Protocol) Integration
 * 
 * Implements Claude Code-style MCP tools:
 * - GitHub integration (issues, PRs, CI/CD)
 * - Database queries (PostgreSQL, Prisma)
 * - Design tools (Figma)
 * - Automation (Zapier, webhooks)
 * - File system operations
 * - Web browsing (Puppeteer)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// MCP tool definition
export interface MCPTool {
    id: string
    name: string
    description: string
    category: MCPToolCategory
    icon: string
    color: string
    inputSchema: Record<string, MCPToolInput>
    enabled: boolean
    configured: boolean
    configuration?: Record<string, string>
}

export type MCPToolCategory =
    | 'version-control'
    | 'database'
    | 'design'
    | 'automation'
    | 'filesystem'
    | 'browser'
    | 'communication'
    | 'search'
    | 'memory'

export interface MCPToolInput {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    description: string
    required: boolean
    default?: unknown
    enum?: string[]
}

// MCP tool execution result
export interface MCPToolResult {
    toolId: string
    success: boolean
    data?: unknown
    error?: string
    executionTime: number
    timestamp: number
}

// Built-in MCP tools
const BUILTIN_MCP_TOOLS: MCPTool[] = [
    // Version Control
    {
        id: 'github',
        name: 'GitHub',
        description: 'Manage issues, PRs, actions, and commits',
        category: 'version-control',
        icon: '🐙',
        color: 'gray',
        inputSchema: {
            action: { type: 'string', description: 'Action type', required: true, enum: ['list_issues', 'create_issue', 'create_pr', 'list_prs', 'run_action', 'get_commits'] },
            repo: { type: 'string', description: 'Repository name', required: true },
            data: { type: 'object', description: 'Action-specific data', required: false },
        },
        enabled: true,
        configured: false,
    },
    {
        id: 'git',
        name: 'Git',
        description: 'Local git operations (status, diff, commit, branch)',
        category: 'version-control',
        icon: '🔀',
        color: 'orange',
        inputSchema: {
            command: { type: 'string', description: 'Git command', required: true, enum: ['status', 'diff', 'commit', 'branch', 'log', 'stash', 'checkout'] },
            args: { type: 'array', description: 'Command arguments', required: false },
        },
        enabled: true,
        configured: true,
    },

    // Database
    {
        id: 'postgresql',
        name: 'PostgreSQL',
        description: 'Query PostgreSQL database with natural language',
        category: 'database',
        icon: '🐘',
        color: 'blue',
        inputSchema: {
            query: { type: 'string', description: 'Natural language or SQL query', required: true },
            database: { type: 'string', description: 'Database name', required: false },
        },
        enabled: true,
        configured: false,
    },
    {
        id: 'prisma',
        name: 'Prisma',
        description: 'Prisma schema operations and migrations',
        category: 'database',
        icon: '◆',
        color: 'purple',
        inputSchema: {
            action: { type: 'string', description: 'Prisma action', required: true, enum: ['migrate', 'generate', 'introspect', 'push', 'pull'] },
            name: { type: 'string', description: 'Migration name', required: false },
        },
        enabled: true,
        configured: true,
    },

    // Design
    {
        id: 'figma',
        name: 'Figma',
        description: 'Access Figma designs and generate code',
        category: 'design',
        icon: '🎨',
        color: 'pink',
        inputSchema: {
            action: { type: 'string', description: 'Action type', required: true, enum: ['get_file', 'get_components', 'generate_code'] },
            fileKey: { type: 'string', description: 'Figma file key', required: true },
            nodeId: { type: 'string', description: 'Node ID', required: false },
        },
        enabled: true,
        configured: false,
    },

    // Automation
    {
        id: 'zapier',
        name: 'Zapier',
        description: 'Trigger Zapier automations and webhooks',
        category: 'automation',
        icon: '⚡',
        color: 'orange',
        inputSchema: {
            webhookUrl: { type: 'string', description: 'Webhook URL', required: true },
            payload: { type: 'object', description: 'Payload data', required: false },
        },
        enabled: true,
        configured: false,
    },
    {
        id: 'webhook',
        name: 'Webhook',
        description: 'Call custom HTTP webhooks',
        category: 'automation',
        icon: '🪝',
        color: 'gray',
        inputSchema: {
            url: { type: 'string', description: 'Webhook URL', required: true },
            method: { type: 'string', description: 'HTTP method', required: true, enum: ['GET', 'POST', 'PUT', 'DELETE'] },
            body: { type: 'object', description: 'Request body', required: false },
            headers: { type: 'object', description: 'Request headers', required: false },
        },
        enabled: true,
        configured: true,
    },

    // Filesystem
    {
        id: 'filesystem',
        name: 'File System',
        description: 'Read, write, and edit local files',
        category: 'filesystem',
        icon: '📁',
        color: 'yellow',
        inputSchema: {
            action: { type: 'string', description: 'File action', required: true, enum: ['read', 'write', 'edit', 'delete', 'list', 'search', 'move', 'copy'] },
            path: { type: 'string', description: 'File or directory path', required: true },
            content: { type: 'string', description: 'File content (for write/edit)', required: false },
        },
        enabled: true,
        configured: true,
    },

    // Browser
    {
        id: 'puppeteer',
        name: 'Puppeteer',
        description: 'Browser automation and web scraping',
        category: 'browser',
        icon: '🎭',
        color: 'green',
        inputSchema: {
            action: { type: 'string', description: 'Browser action', required: true, enum: ['navigate', 'click', 'type', 'screenshot', 'scrape', 'wait'] },
            url: { type: 'string', description: 'URL to navigate', required: false },
            selector: { type: 'string', description: 'CSS selector', required: false },
            value: { type: 'string', description: 'Input value', required: false },
        },
        enabled: true,
        configured: true,
    },
    {
        id: 'playwright',
        name: 'Playwright',
        description: 'Cross-browser testing and automation',
        category: 'browser',
        icon: '🎪',
        color: 'green',
        inputSchema: {
            action: { type: 'string', description: 'Action type', required: true, enum: ['test', 'record', 'codegen', 'screenshot'] },
            browser: { type: 'string', description: 'Browser type', required: false, enum: ['chromium', 'firefox', 'webkit'] },
            url: { type: 'string', description: 'URL', required: false },
        },
        enabled: true,
        configured: true,
    },

    // Communication
    {
        id: 'slack',
        name: 'Slack',
        description: 'Send messages and read channels',
        category: 'communication',
        icon: '💬',
        color: 'purple',
        inputSchema: {
            action: { type: 'string', description: 'Slack action', required: true, enum: ['send_message', 'read_channel', 'list_channels'] },
            channel: { type: 'string', description: 'Channel name or ID', required: false },
            message: { type: 'string', description: 'Message text', required: false },
        },
        enabled: true,
        configured: false,
    },
    {
        id: 'notion',
        name: 'Notion',
        description: 'Manage Notion pages and databases',
        category: 'communication',
        icon: '📓',
        color: 'black',
        inputSchema: {
            action: { type: 'string', description: 'Notion action', required: true, enum: ['get_page', 'create_page', 'update_page', 'query_database'] },
            pageId: { type: 'string', description: 'Page ID', required: false },
            databaseId: { type: 'string', description: 'Database ID', required: false },
            properties: { type: 'object', description: 'Page properties', required: false },
        },
        enabled: true,
        configured: false,
    },

    // Search
    {
        id: 'web-search',
        name: 'Web Search',
        description: 'Search the web for information',
        category: 'search',
        icon: '🔍',
        color: 'blue',
        inputSchema: {
            query: { type: 'string', description: 'Search query', required: true },
            maxResults: { type: 'number', description: 'Max results', required: false, default: 5 },
        },
        enabled: true,
        configured: true,
    },
    {
        id: 'tavily',
        name: 'Tavily',
        description: 'Real-time web information with advanced filtering',
        category: 'search',
        icon: '🌐',
        color: 'teal',
        inputSchema: {
            query: { type: 'string', description: 'Search query', required: true },
            searchDepth: { type: 'string', description: 'Search depth', required: false, enum: ['basic', 'advanced'] },
        },
        enabled: true,
        configured: false,
    },

    // Memory
    {
        id: 'memory-bank',
        name: 'Memory Bank',
        description: 'Persistent context across sessions',
        category: 'memory',
        icon: '🧠',
        color: 'pink',
        inputSchema: {
            action: { type: 'string', description: 'Memory action', required: true, enum: ['remember', 'recall', 'search', 'forget'] },
            key: { type: 'string', description: 'Memory key', required: false },
            value: { type: 'string', description: 'Memory value', required: false },
            query: { type: 'string', description: 'Search query', required: false },
        },
        enabled: true,
        configured: true,
    },
]

// MCP state
interface MCPToolsState {
    tools: MCPTool[]
    executionHistory: MCPToolResult[]
    maxHistory: number
    isExecuting: boolean
    currentTool: string | null

    // Actions
    getToolsByCategory: (category: MCPToolCategory) => MCPTool[]
    getEnabledTools: () => MCPTool[]
    getTool: (id: string) => MCPTool | undefined

    enableTool: (id: string) => void
    disableTool: (id: string) => void
    configureTool: (id: string, config: Record<string, string>) => void

    // Execution
    executeTool: (id: string, inputs: Record<string, unknown>) => Promise<MCPToolResult>
    getRecentExecutions: (count?: number) => MCPToolResult[]
    clearHistory: () => void

    // Generate tool documentation for AI
    generateToolDocs: () => string
}

export const useMCPTools = create<MCPToolsState>()(
    persist(
        (set, get) => ({
            tools: BUILTIN_MCP_TOOLS,
            executionHistory: [],
            maxHistory: 100,
            isExecuting: false,
            currentTool: null,

            getToolsByCategory: (category) => get().tools.filter(t => t.category === category),

            getEnabledTools: () => get().tools.filter(t => t.enabled),

            getTool: (id) => get().tools.find(t => t.id === id),

            enableTool: (id) => {
                set(state => ({
                    tools: state.tools.map(t => t.id === id ? { ...t, enabled: true } : t),
                }))
            },

            disableTool: (id) => {
                set(state => ({
                    tools: state.tools.map(t => t.id === id ? { ...t, enabled: false } : t),
                }))
            },

            configureTool: (id, config) => {
                set(state => ({
                    tools: state.tools.map(t =>
                        t.id === id ? { ...t, configuration: config, configured: true } : t
                    ),
                }))
            },

            executeTool: async (id, inputs) => {
                const tool = get().getTool(id)

                if (!tool) {
                    const result: MCPToolResult = {
                        toolId: id,
                        success: false,
                        error: `Tool ${id} not found`,
                        executionTime: 0,
                        timestamp: Date.now(),
                    }
                    return result
                }

                if (!tool.enabled) {
                    const result: MCPToolResult = {
                        toolId: id,
                        success: false,
                        error: `Tool ${tool.name} is disabled`,
                        executionTime: 0,
                        timestamp: Date.now(),
                    }
                    return result
                }

                set({ isExecuting: true, currentTool: id })

                const startTime = Date.now()

                try {
                    // In a real implementation, this would call the actual tool
                    // For now, we simulate execution
                    await new Promise(resolve => setTimeout(resolve, 500))

                    const result: MCPToolResult = {
                        toolId: id,
                        success: true,
                        data: { message: `Executed ${tool.name} with inputs: ${JSON.stringify(inputs)}` },
                        executionTime: Date.now() - startTime,
                        timestamp: Date.now(),
                    }

                    set(state => {
                        let history = [...state.executionHistory, result]
                        if (history.length > state.maxHistory) {
                            history = history.slice(-state.maxHistory)
                        }
                        return {
                            executionHistory: history,
                            isExecuting: false,
                            currentTool: null,
                        }
                    })

                    return result
                } catch (error) {
                    const result: MCPToolResult = {
                        toolId: id,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        executionTime: Date.now() - startTime,
                        timestamp: Date.now(),
                    }

                    set(state => ({
                        executionHistory: [...state.executionHistory, result].slice(-state.maxHistory),
                        isExecuting: false,
                        currentTool: null,
                    }))

                    return result
                }
            },

            getRecentExecutions: (count = 10) => get().executionHistory.slice(-count),

            clearHistory: () => set({ executionHistory: [] }),

            generateToolDocs: () => {
                const tools = get().getEnabledTools()

                if (tools.length === 0) return ''

                const docs = tools.map(tool => {
                    const inputs = Object.entries(tool.inputSchema)
                        .map(([name, schema]) => `  - ${name}${schema.required ? '*' : ''}: ${schema.type} - ${schema.description}`)
                        .join('\n')

                    return `### ${tool.name} (${tool.id})
${tool.description}
Inputs:
${inputs}`
                }).join('\n\n')

                return `## Available MCP Tools\n\n${docs}`
            },
        }),
        {
            name: 'sprintloop-mcp-tools',
            partialize: (state) => ({
                tools: state.tools.map(t => ({
                    id: t.id,
                    enabled: t.enabled,
                    configured: t.configured,
                    configuration: t.configuration,
                })),
            }),
            merge: (persisted, current) => {
                const persistedState = persisted as { tools?: Array<{ id: string; enabled: boolean; configured: boolean; configuration?: Record<string, string> }> }

                if (!persistedState?.tools) return current

                const mergedTools = current.tools.map(tool => {
                    const saved = persistedState.tools?.find(t => t.id === tool.id)
                    if (saved) {
                        return {
                            ...tool,
                            enabled: saved.enabled,
                            configured: saved.configured,
                            configuration: saved.configuration,
                        }
                    }
                    return tool
                })

                return { ...current, tools: mergedTools }
            },
        }
    )
)
