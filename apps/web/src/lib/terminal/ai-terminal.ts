/**
 * AI Terminal Service
 * 
 * Natural language to command translation and error detection.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface TerminalCommand {
    id: string;
    input: string;
    output: string;
    exitCode: number;
    timestamp: number;
    duration: number;
    suggestion?: CommandSuggestion;
}

export interface CommandSuggestion {
    type: 'fix' | 'explain' | 'alternative';
    message: string;
    command?: string;
    explanation?: string;
}

export interface NLCommand {
    naturalLanguage: string;
    generatedCommand: string;
    explanation: string;
    confidence: number;
    shell: 'bash' | 'zsh' | 'powershell';
}

export interface AITerminalState {
    history: TerminalCommand[];
    suggestions: CommandSuggestion[];
    isProcessing: boolean;

    // Actions
    addCommand: (command: Omit<TerminalCommand, 'id' | 'timestamp'>) => void;
    translateNL: (input: string) => Promise<NLCommand>;
    analyzeOutput: (output: string, exitCode: number) => Promise<CommandSuggestion | null>;
    getSuggestions: (partialCommand: string) => Promise<string[]>;
    explainCommand: (command: string) => Promise<string>;
    clearHistory: () => void;
}

// =============================================================================
// AI TERMINAL STORE
// =============================================================================

export const useAITerminal = create<AITerminalState>((set, get) => ({
    history: [],
    suggestions: [],
    isProcessing: false,

    addCommand: (command) => {
        const fullCommand: TerminalCommand = {
            ...command,
            id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
        };

        set(state => ({
            history: [...state.history.slice(-99), fullCommand],
        }));

        // Auto-analyze if error
        if (command.exitCode !== 0) {
            get().analyzeOutput(command.output, command.exitCode).then(suggestion => {
                if (suggestion) {
                    set(state => ({
                        suggestions: [...state.suggestions.slice(-9), suggestion],
                    }));
                }
            });
        }
    },

    translateNL: async (input: string): Promise<NLCommand> => {
        set({ isProcessing: true });

        try {
            const result = await mockTranslateNL(input);
            set({ isProcessing: false });
            return result;
        } catch (error) {
            set({ isProcessing: false });
            throw error;
        }
    },

    analyzeOutput: async (output: string, exitCode: number): Promise<CommandSuggestion | null> => {
        if (exitCode === 0) return null;

        return mockAnalyzeOutput(output, exitCode);
    },

    getSuggestions: async (partialCommand: string): Promise<string[]> => {
        return mockGetSuggestions(partialCommand);
    },

    explainCommand: async (command: string): Promise<string> => {
        return mockExplainCommand(command);
    },

    clearHistory: () => {
        set({ history: [], suggestions: [] });
    },
}));

// =============================================================================
// MOCK IMPLEMENTATIONS
// =============================================================================

async function mockTranslateNL(input: string): Promise<NLCommand> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const inputLower = input.toLowerCase();

    // Pattern matching for common requests
    const patterns: { match: RegExp; command: string; explanation: string }[] = [
        {
            match: /list.*files|show.*files|ls/i,
            command: 'ls -la',
            explanation: 'Lists all files including hidden ones with detailed information',
        },
        {
            match: /find.*file.*named\s+(\S+)/i,
            command: 'find . -name "$1"',
            explanation: 'Searches for files matching the pattern recursively',
        },
        {
            match: /search.*for\s+"?([^"]+)"?.*in.*files/i,
            command: 'grep -r "$1" .',
            explanation: 'Searches for text pattern in all files recursively',
        },
        {
            match: /install.*dependencies|npm install/i,
            command: 'npm install',
            explanation: 'Installs all dependencies from package.json',
        },
        {
            match: /start.*server|run.*dev/i,
            command: 'npm run dev',
            explanation: 'Starts the development server',
        },
        {
            match: /build.*project|npm build/i,
            command: 'npm run build',
            explanation: 'Builds the project for production',
        },
        {
            match: /run.*tests|test/i,
            command: 'npm test',
            explanation: 'Runs the test suite',
        },
        {
            match: /create.*directory|mkdir\s+(\S+)/i,
            command: 'mkdir -p $1',
            explanation: 'Creates a directory (and parent directories if needed)',
        },
        {
            match: /delete.*file|remove.*file|rm\s+(\S+)/i,
            command: 'rm $1',
            explanation: 'Removes the specified file',
        },
        {
            match: /show.*disk.*space|disk.*usage/i,
            command: 'df -h',
            explanation: 'Shows disk space usage in human-readable format',
        },
        {
            match: /show.*running.*processes|ps/i,
            command: 'ps aux',
            explanation: 'Lists all running processes with details',
        },
        {
            match: /git.*status/i,
            command: 'git status',
            explanation: 'Shows the current state of the git repository',
        },
        {
            match: /git.*commit.*message\s+"?([^"]+)"?/i,
            command: 'git commit -m "$1"',
            explanation: 'Commits staged changes with the given message',
        },
        {
            match: /push.*to.*remote|git.*push/i,
            command: 'git push origin main',
            explanation: 'Pushes commits to the remote repository',
        },
    ];

    for (const { match, command, explanation } of patterns) {
        const m = inputLower.match(match);
        if (m) {
            let finalCommand = command;
            // Replace capture groups
            for (let i = 1; i < m.length; i++) {
                finalCommand = finalCommand.replace(`$${i}`, m[i] || '');
            }

            return {
                naturalLanguage: input,
                generatedCommand: finalCommand,
                explanation,
                confidence: 0.9,
                shell: 'bash',
            };
        }
    }

    // Default fallback
    return {
        naturalLanguage: input,
        generatedCommand: `# Could not translate: "${input}"`,
        explanation: 'Unable to translate this request. Try being more specific.',
        confidence: 0.3,
        shell: 'bash',
    };
}

async function mockAnalyzeOutput(output: string, _exitCode: number): Promise<CommandSuggestion | null> {
    const outputLower = output.toLowerCase();

    // Common error patterns
    if (outputLower.includes('command not found')) {
        const match = output.match(/(\w+): command not found/);
        const cmd = match?.[1];

        return {
            type: 'fix',
            message: `Command '${cmd}' not found`,
            command: cmd ? `npm install -g ${cmd}` : undefined,
            explanation: 'The command is not installed. Try installing it globally.',
        };
    }

    if (outputLower.includes('permission denied')) {
        return {
            type: 'fix',
            message: 'Permission denied',
            command: 'sudo !!',
            explanation: 'Try running with elevated privileges using sudo.',
        };
    }

    if (outputLower.includes('no such file or directory')) {
        return {
            type: 'explain',
            message: 'File or directory not found',
            explanation: 'The specified path does not exist. Check the path and try again.',
        };
    }

    if (outputLower.includes('enoent') || outputLower.includes('module not found')) {
        return {
            type: 'fix',
            message: 'Missing dependencies',
            command: 'npm install',
            explanation: 'Some dependencies are missing. Try running npm install.',
        };
    }

    if (outputLower.includes('port') && outputLower.includes('in use')) {
        return {
            type: 'fix',
            message: 'Port already in use',
            command: 'lsof -i :3000',
            explanation: 'Another process is using the port. Find and kill it, or use a different port.',
        };
    }

    return {
        type: 'explain',
        message: 'Command failed',
        explanation: 'The command exited with an error. Review the output for details.',
    };
}

async function mockGetSuggestions(partial: string): Promise<string[]> {
    const suggestions: Record<string, string[]> = {
        'git': ['git status', 'git add .', 'git commit -m ""', 'git push', 'git pull'],
        'npm': ['npm install', 'npm run dev', 'npm run build', 'npm test', 'npm run lint'],
        'npx': ['npx tsc --noEmit', 'npx prettier --write .', 'npx eslint .'],
        'cd': ['cd ..', 'cd src', 'cd ~'],
        'ls': ['ls -la', 'ls -lh'],
        'rm': ['rm -rf node_modules', 'rm -rf dist'],
    };

    const prefix = partial.split(' ')[0];
    return suggestions[prefix] || [];
}

async function mockExplainCommand(command: string): Promise<string> {
    const explanations: Record<string, string> = {
        'ls -la': '**ls -la** lists all files (-a includes hidden) with details (-l long format)',
        'grep -r': '**grep -r** searches recursively through all files for a pattern',
        'npm install': '**npm install** reads package.json and installs all dependencies',
        'git status': '**git status** shows the current state of the working tree and staging area',
    };

    for (const [pattern, explanation] of Object.entries(explanations)) {
        if (command.includes(pattern)) {
            return explanation;
        }
    }

    return `The command **${command}** executes in the shell. Use 'man ${command.split(' ')[0]}' for more info.`;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if input looks like natural language
 */
export function isNaturalLanguage(input: string): boolean {
    // Natural language indicators
    const nlPatterns = [
        /^(please|can you|how do i|show me|find|search|list|create|delete|run|start|stop)/i,
        /\?$/,
        /\s(the|a|an|in|on|at|to|from|with)\s/i,
    ];

    // Command indicators  
    const cmdPatterns = [
        /^(ls|cd|rm|mv|cp|cat|grep|find|git|npm|npx|node|python|docker)/i,
        /^[.\/~]/,
        /\||\>|\</,
    ];

    // Check if it looks like a command
    for (const pattern of cmdPatterns) {
        if (pattern.test(input)) return false;
    }

    // Check if it looks like natural language
    for (const pattern of nlPatterns) {
        if (pattern.test(input)) return true;
    }

    // Default: treat as natural language if it has spaces and no special chars
    return input.includes(' ') && !/[|><;$`]/.test(input);
}

/**
 * Get shell type
 */
export function detectShell(): 'bash' | 'zsh' | 'powershell' {
    // In real implementation, detect from environment
    return 'zsh';
}
