/**
 * Planner Agent
 * Breaks down user requests into actionable tasks
 */

import { BaseAgent, type AgentConfig } from './base-agent';

const PLANNER_CONFIG: AgentConfig = {
    role: 'planner',
    name: 'Planner',
    systemPrompt: `You are the PLANNER agent in SprintLoop, an enterprise AI IDE.

Your job is to:
1. Analyze user requests and break them into clear, actionable tasks
2. Identify dependencies between tasks
3. Determine which specialist agent should handle each task
4. Create a structured execution plan

You do NOT write code. You create plans and hand off to the CODER agent.

Output Format:
## Plan
1. [Task 1] → coder
2. [Task 2] → coder  
3. [Task 3] → reviewer

When the plan is ready, say: HANDOFF_TO: coder`,
    availableTools: ['read', 'grep', 'glob'], // Read-only tools for analysis
};

export class PlannerAgent extends BaseAgent {
    constructor() {
        super(PLANNER_CONFIG);
    }

    /**
     * Create an execution plan from a user request
     */
    async createPlan(request: string, projectContext?: string): Promise<{
        plan: string;
        tasks: Array<{ task: string; assignee: string }>;
    }> {
        const response = await this.process(request, projectContext);

        // Parse tasks from the plan
        const tasks: Array<{ task: string; assignee: string }> = [];
        const taskMatches = response.content.matchAll(/\d+\.\s*\[([^\]]+)\]\s*→\s*(\w+)/g);

        for (const match of taskMatches) {
            tasks.push({
                task: match[1],
                assignee: match[2],
            });
        }

        return {
            plan: response.content,
            tasks,
        };
    }
}
