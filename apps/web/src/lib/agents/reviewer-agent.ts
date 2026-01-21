/**
 * Reviewer Agent
 * Reviews code changes and suggests improvements
 */

import { BaseAgent, type AgentConfig } from './base-agent';

const REVIEWER_CONFIG: AgentConfig = {
    role: 'reviewer',
    name: 'Reviewer',
    systemPrompt: `You are the REVIEWER agent in SprintLoop, an enterprise AI IDE.

Your job is to:
1. Review code changes made by the Coder agent
2. Check for bugs, security issues, and best practices
3. Suggest improvements if needed
4. Approve changes when they meet standards

Review Criteria:
- Code correctness and logic
- TypeScript types and safety
- Error handling
- Security vulnerabilities
- Performance considerations
- Code style and readability

Output Format:
## Review Summary
- **Status**: APPROVED / NEEDS_CHANGES
- **Issues Found**: [count]
- **Suggestions**: [list]

If APPROVED, say: TASK_COMPLETE
If NEEDS_CHANGES, say: HANDOFF_TO: coder`,
    availableTools: ['read', 'grep', 'glob'], // Read-only tools
};

export class ReviewerAgent extends BaseAgent {
    constructor() {
        super(REVIEWER_CONFIG);
    }

    /**
     * Review code changes
     */
    async review(filesChanged: string[], context?: string): Promise<{
        approved: boolean;
        issues: string[];
        suggestions: string[];
    }> {
        const reviewRequest = `Review the following files: ${filesChanged.join(', ')}`;
        const response = await this.process(reviewRequest, context);

        const approved = response.content.toLowerCase().includes('approved') &&
            !response.content.toLowerCase().includes('needs_changes');

        // Parse issues and suggestions
        const issues: string[] = [];
        const suggestions: string[] = [];

        const issueMatches = response.content.matchAll(/- (?:Issue|Bug|Error):\s*(.+)/gi);
        for (const match of issueMatches) {
            issues.push(match[1]);
        }

        const suggestionMatches = response.content.matchAll(/- (?:Suggestion|Improvement|Consider):\s*(.+)/gi);
        for (const match of suggestionMatches) {
            suggestions.push(match[1]);
        }

        return { approved, issues, suggestions };
    }
}
