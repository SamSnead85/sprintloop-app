/**
 * MCP Bridge
 * 
 * Phase 16: Model Context Protocol integration
 * Inspired by Cursor/Cline's MCP tool integration
 * 
 * Enables AI agents to use external tools via MCP servers
 */

export interface MCPServer {
    id: string;
    name: string;
    description: string;
    url: string;
    status: 'connected' | 'disconnected' | 'error';
    tools: MCPTool[];
    resources: MCPResource[];
    prompts: MCPPrompt[];
}

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: object;
    serverId: string;
}

export interface MCPResource {
    uri: string;
    name: string;
    description: string;
    mimeType: string;
    serverId: string;
}

export interface MCPPrompt {
    name: string;
    description: string;
    arguments: MCPPromptArgument[];
    serverId: string;
}

export interface MCPPromptArgument {
    name: string;
    description: string;
    required: boolean;
}

export interface MCPToolCall {
    serverId: string;
    toolName: string;
    arguments: Record<string, unknown>;
}

export interface MCPToolResult {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}

/**
 * MCP Bridge - connects AI agents to MCP servers
 */
export class MCPBridge {
    private servers: Map<string, MCPServer> = new Map();
    private connections: Map<string, WebSocket> = new Map();

    /**
     * Register an MCP server
     */
    async registerServer(config: {
        id: string;
        name: string;
        description: string;
        url: string;
    }): Promise<MCPServer> {
        const server: MCPServer = {
            ...config,
            status: 'disconnected',
            tools: [],
            resources: [],
            prompts: [],
        };

        this.servers.set(config.id, server);

        // Connect and discover capabilities
        await this.connect(config.id);

        return this.servers.get(config.id)!;
    }

    /**
     * Connect to an MCP server
     */
    async connect(serverId: string): Promise<void> {
        const server = this.servers.get(serverId);
        if (!server) throw new Error(`Server ${serverId} not found`);

        console.log(`[MCP] Connecting to ${server.name}...`);

        try {
            // In real implementation, establish WebSocket/stdio connection
            // and perform capability negotiation

            // Simulate connection
            server.status = 'connected';

            // Discover tools, resources, prompts
            await this.discoverCapabilities(serverId);

            console.log(`[MCP] Connected to ${server.name}`);
        } catch (error) {
            server.status = 'error';
            console.error(`[MCP] Failed to connect to ${server.name}:`, error);
            throw error;
        }
    }

    /**
     * Discover server capabilities
     */
    private async discoverCapabilities(serverId: string): Promise<void> {
        const server = this.servers.get(serverId);
        if (!server) return;

        // In real implementation, send list_tools, list_resources, list_prompts requests
        // For now, simulate with example tools

        server.tools = [
            {
                name: 'web_search',
                description: 'Search the web for information',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                    },
                    required: ['query'],
                },
                serverId,
            },
            {
                name: 'fetch_url',
                description: 'Fetch content from a URL',
                inputSchema: {
                    type: 'object',
                    properties: {
                        url: { type: 'string', description: 'URL to fetch' },
                    },
                    required: ['url'],
                },
                serverId,
            },
        ];
    }

    /**
     * Disconnect from a server
     */
    disconnect(serverId: string): void {
        const server = this.servers.get(serverId);
        if (server) {
            server.status = 'disconnected';
        }

        const ws = this.connections.get(serverId);
        if (ws) {
            ws.close();
            this.connections.delete(serverId);
        }
    }

    /**
     * Call a tool on an MCP server
     */
    async callTool(call: MCPToolCall): Promise<MCPToolResult> {
        const server = this.servers.get(call.serverId);
        if (!server) {
            throw new Error(`Server ${call.serverId} not found`);
        }

        if (server.status !== 'connected') {
            throw new Error(`Server ${call.serverId} is not connected`);
        }

        const tool = server.tools.find(t => t.name === call.toolName);
        if (!tool) {
            throw new Error(`Tool ${call.toolName} not found on server ${call.serverId}`);
        }

        console.log(`[MCP] Calling ${call.toolName} on ${server.name}`, call.arguments);

        // In real implementation, send tool call request and await response
        // Simulate response
        return {
            content: [
                {
                    type: 'text',
                    text: `[Simulated result from ${call.toolName}]`,
                },
            ],
        };
    }

    /**
     * Read a resource from an MCP server
     */
    async readResource(serverId: string, uri: string): Promise<string> {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`Server ${serverId} not found`);
        }

        console.log(`[MCP] Reading resource ${uri} from ${server.name}`);

        // In real implementation, send read_resource request
        return `[Simulated resource content from ${uri}]`;
    }

    /**
     * Get a prompt from an MCP server
     */
    async getPrompt(
        serverId: string,
        promptName: string,
        args: Record<string, string>
    ): Promise<string> {
        const server = this.servers.get(serverId);
        if (!server) {
            throw new Error(`Server ${serverId} not found`);
        }

        console.log(`[MCP] Getting prompt ${promptName} from ${server.name}`, args);

        // In real implementation, send get_prompt request
        return `[Simulated prompt from ${promptName} with args: ${JSON.stringify(args)}]`;
    }

    /**
     * Get all registered servers
     */
    getServers(): MCPServer[] {
        return Array.from(this.servers.values());
    }

    /**
     * Get all available tools across all servers
     */
    getAllTools(): MCPTool[] {
        const tools: MCPTool[] = [];
        for (const server of this.servers.values()) {
            if (server.status === 'connected') {
                tools.push(...server.tools);
            }
        }
        return tools;
    }

    /**
     * Convert MCP tools to AI provider format
     */
    toOpenAIToolFormat(): object[] {
        return this.getAllTools().map(tool => ({
            type: 'function',
            function: {
                name: `mcp_${tool.serverId}_${tool.name}`,
                description: `[MCP: ${tool.serverId}] ${tool.description}`,
                parameters: tool.inputSchema,
            },
        }));
    }
}

// Singleton instance
export const mcpBridge = new MCPBridge();

/**
 * Built-in MCP server configs
 */
export const BUILT_IN_MCP_SERVERS = [
    {
        id: 'web',
        name: 'Web Tools',
        description: 'Web browsing and search capabilities',
        url: 'mcp://localhost:3001',
    },
    {
        id: 'fs',
        name: 'File System',
        description: 'Local file system access',
        url: 'mcp://localhost:3002',
    },
    {
        id: 'git',
        name: 'Git Operations',
        description: 'Git version control operations',
        url: 'mcp://localhost:3003',
    },
];
