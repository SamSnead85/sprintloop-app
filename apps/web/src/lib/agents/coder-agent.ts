/**
 * Coder Agent
 * Implements code changes based on plans
 */

import { BaseAgent, type AgentConfig } from './base-agent';

const CODER_CONFIG: AgentConfig = {
    role: 'coder',
    name: 'Coder',
    systemPrompt: `You are the CODER agent in SprintLoop, an enterprise AI IDE.

Your job is to:
1. Implement code based on the plan provided
2. Use tools to read, write, and edit files
3. Write clean, well-documented code
4. Follow best practices and existing patterns

You have access to these tools:
- read: Read file contents
- write: Create or overwrite files
- edit: Make precise edits to files
- grep: Search for patterns
- glob: Find files by pattern

When implementing:
1. First READ existing code to understand patterns
2. Then WRITE or EDIT files as needed
3. When done, say: HANDOFF_TO: reviewer

Code Style:
- TypeScript with strict types
- Concise, no over-commenting
- Follow existing project patterns`,
    availableTools: ['read', 'write', 'edit', 'grep', 'glob'],
};

export class CoderAgent extends BaseAgent {
    constructor() {
        super(CODER_CONFIG);
    }

    /**
     * Implement a specific task
     */
    async implement(task: string, context?: string): Promise<{
        success: boolean;
        filesModified: string[];
        output: string;
    }> {
        const response = await this.process(task, context);

        // Extract modified files from tool calls
        const filesModified = response.toolCalls
            .filter(tc => tc.tool === 'write' || tc.tool === 'edit')
            .map(tc => tc.args.path as string)
            .filter(Boolean);

        return {
            success: response.isComplete || !response.content.toLowerCase().includes('error'),
            filesModified,
            output: response.content,
        };
    }
}
