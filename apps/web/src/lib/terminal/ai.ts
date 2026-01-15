/**
 * Terminal AI
 * 
 * Phase 55: Natural language commands and error explanation
 * Codex CLI-inspired terminal AI integration
 */

export interface TerminalAIResponse {
    type: 'command' | 'explanation' | 'suggestion' | 'error';
    content: string;
    command?: string;
    confidence: number;
    alternatives?: string[];
}

export interface TerminalContext {
    cwd: string;
    shell: string;
    os: string;
    recentCommands: string[];
    lastError?: string;
    lastOutput?: string;
}

/**
 * Convert natural language to shell command
 * Inspired by Codex CLI
 */
export async function naturalLanguageToCommand(
    input: string,
    context: TerminalContext
): Promise<TerminalAIResponse> {
    console.log(`[TerminalAI] Converting: "${input}" in ${context.cwd}`);

    // In real implementation, call AI model
    // For now, pattern match common requests

    const inputLower = input.toLowerCase();

    // File operations
    if (inputLower.includes('list') || inputLower.includes('show files')) {
        return {
            type: 'command',
            content: 'List files in directory',
            command: 'ls -la',
            confidence: 0.95,
            alternatives: ['ls', 'ls -lh', 'tree'],
        };
    }

    if (inputLower.includes('create folder') || inputLower.includes('make directory')) {
        const match = input.match(/(?:folder|directory)\s+(?:called\s+)?["']?(\w+)["']?/i);
        const name = match?.[1] || 'new_folder';
        return {
            type: 'command',
            content: `Create directory "${name}"`,
            command: `mkdir -p ${name}`,
            confidence: 0.9,
        };
    }

    // Git operations
    if (inputLower.includes('commit')) {
        const messageMatch = input.match(/message\s+["']([^"']+)["']/i);
        const message = messageMatch?.[1] || 'Update';
        return {
            type: 'command',
            content: 'Commit changes to git',
            command: `git add -A && git commit -m "${message}"`,
            confidence: 0.85,
            alternatives: [`git commit -m "${message}"`, 'git commit --amend'],
        };
    }

    if (inputLower.includes('push')) {
        return {
            type: 'command',
            content: 'Push to remote',
            command: 'git push',
            confidence: 0.9,
            alternatives: ['git push origin main', 'git push -u origin HEAD'],
        };
    }

    if (inputLower.includes('pull')) {
        return {
            type: 'command',
            content: 'Pull from remote',
            command: 'git pull',
            confidence: 0.9,
        };
    }

    if (inputLower.includes('new branch')) {
        const match = input.match(/branch\s+(?:called\s+)?["']?(\w+[-/\w]*)["']?/i);
        const name = match?.[1] || 'new-branch';
        return {
            type: 'command',
            content: `Create and switch to branch "${name}"`,
            command: `git checkout -b ${name}`,
            confidence: 0.9,
        };
    }

    // NPM/Package operations
    if (inputLower.includes('install') && (inputLower.includes('dependencies') || inputLower.includes('packages'))) {
        return {
            type: 'command',
            content: 'Install npm dependencies',
            command: 'npm install',
            confidence: 0.95,
            alternatives: ['pnpm install', 'yarn'],
        };
    }

    if (inputLower.includes('run dev') || inputLower.includes('start dev')) {
        return {
            type: 'command',
            content: 'Start development server',
            command: 'npm run dev',
            confidence: 0.9,
            alternatives: ['pnpm dev', 'yarn dev'],
        };
    }

    if (inputLower.includes('build')) {
        return {
            type: 'command',
            content: 'Build project',
            command: 'npm run build',
            confidence: 0.9,
        };
    }

    if (inputLower.includes('test')) {
        return {
            type: 'command',
            content: 'Run tests',
            command: 'npm test',
            confidence: 0.9,
            alternatives: ['npm run test:watch', 'vitest'],
        };
    }

    // Search
    if (inputLower.includes('find') && inputLower.includes('file')) {
        const match = input.match(/named?\s+["']?(\w+\.?\w*)["']?/i);
        const name = match?.[1] || '*';
        return {
            type: 'command',
            content: `Find file "${name}"`,
            command: `find . -name "${name}" -type f`,
            confidence: 0.85,
            alternatives: [`fd "${name}"`, `locate ${name}`],
        };
    }

    if (inputLower.includes('search') || inputLower.includes('grep')) {
        const match = input.match(/(?:for|pattern)\s+["']([^"']+)["']/i);
        const term = match?.[1] || 'TODO';
        return {
            type: 'command',
            content: `Search for "${term}"`,
            command: `rg "${term}"`,
            confidence: 0.85,
            alternatives: [`grep -r "${term}" .`, `ag "${term}"`],
        };
    }

    // Default: suggest asking AI
    return {
        type: 'suggestion',
        content: `I'm not sure how to handle: "${input}". Try being more specific.`,
        confidence: 0.3,
    };
}

/**
 * Explain a terminal error
 */
export async function explainError(
    error: string,
    _context: TerminalContext
): Promise<TerminalAIResponse> {
    console.log(`[TerminalAI] Explaining error: ${error.slice(0, 100)}`);

    const errorLower = error.toLowerCase();

    // Common errors
    if (errorLower.includes('command not found')) {
        const cmd = error.match(/(\w+):\s*command not found/)?.[1];
        return {
            type: 'explanation',
            content: `The command "${cmd}" is not installed or not in your PATH. You may need to install it first.`,
            confidence: 0.9,
        };
    }

    if (errorLower.includes('permission denied')) {
        return {
            type: 'explanation',
            content: 'Permission denied. You may need to run this command with sudo, or check file permissions.',
            command: 'sudo !!',
            confidence: 0.85,
        };
    }

    if (errorLower.includes('enoent') || errorLower.includes('no such file')) {
        return {
            type: 'explanation',
            content: 'File or directory not found. Check that the path exists and is spelled correctly.',
            confidence: 0.9,
        };
    }

    if (errorLower.includes('eacces')) {
        return {
            type: 'explanation',
            content: 'Access denied. You may need elevated permissions or the file may be locked.',
            confidence: 0.85,
        };
    }

    if (errorLower.includes('port') && errorLower.includes('in use')) {
        const port = error.match(/port\s*(\d+)/i)?.[1] || '3000';
        return {
            type: 'explanation',
            content: `Port ${port} is already in use by another process.`,
            command: `lsof -i :${port}`,
            confidence: 0.9,
        };
    }

    if (errorLower.includes('cannot find module')) {
        return {
            type: 'explanation',
            content: 'A required module is missing. Try running npm install to install dependencies.',
            command: 'npm install',
            confidence: 0.9,
        };
    }

    if (errorLower.includes('syntax error')) {
        return {
            type: 'explanation',
            content: 'There is a syntax error in the code or command. Check for typos, missing brackets, or quotes.',
            confidence: 0.7,
        };
    }

    return {
        type: 'explanation',
        content: 'An unknown error occurred. Please review the error message for more details.',
        confidence: 0.3,
    };
}

/**
 * Suggest commands based on context
 */
export function suggestCommands(_context: TerminalContext): string[] {
    const suggestions: string[] = [];

    // Based on recent errors
    if (_context.lastError?.includes('not found')) {
        suggestions.push('npm install');
    }

    // Common dev commands
    suggestions.push(
        'npm run dev',
        'npm test',
        'npm run build',
        'git status',
        'git log --oneline -10',
        'ls -la',
    );

    return suggestions.slice(0, 5);
}

/**
 * Format command for display
 */
export function formatCommand(command: string): string {
    // Highlight special characters
    return command
        .replace(/(\$\w+)/g, '<span class="var">$1</span>')
        .replace(/(".*?")/g, '<span class="string">$1</span>')
        .replace(/(--?\w+)/g, '<span class="flag">$1</span>');
}
