/**
 * Bash Tool - Execute shell commands
 * Ported from OpenCode
 */

import type { ToolDefinition } from './registry';
import type { ToolResult } from './types';

/**
 * Execute a shell command
 */
async function executeCommand(
    command: string,
    cwd?: string,
    timeout?: number
): Promise<ToolResult> {
    try {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            const { Command } = await import('@tauri-apps/plugin-shell');

            const startTime = Date.now();
            const timeoutMs = (timeout ?? 30) * 1000;

            // Parse the command
            const parts = command.split(' ');
            const program = parts[0];
            const args = parts.slice(1);

            // Create and execute command
            const cmd = Command.create(program, args, {
                cwd: cwd,
            });

            // Execute with timeout
            const result = await Promise.race([
                cmd.execute(),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error(`Command timed out after ${timeout ?? 30} seconds`)), timeoutMs)
                ),
            ]);

            const duration = Date.now() - startTime;
            const output = result.stdout + (result.stderr ? `\n${result.stderr}` : '');

            return {
                success: result.code === 0,
                output: output || '(no output)',
                error: result.code !== 0 ? `Exit code: ${result.code}` : undefined,
                metadata: {
                    exitCode: result.code,
                    stdout: result.stdout,
                    stderr: result.stderr,
                    duration,
                    command,
                    cwd,
                },
            };
        }

        // In browser-only mode, we can't execute commands
        return {
            success: false,
            output: '',
            error: 'Shell command execution is not available in browser mode. Use the desktop app for terminal operations.',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: `Failed to execute command: ${errorMessage}`,
        };
    }
}

export const bashTool: ToolDefinition = {
    id: 'bash',
    name: 'Execute Command',
    description: 'Execute a shell command in the terminal. Use for running build commands, tests, git operations, etc. Commands run in bash/zsh.',
    parameters: [
        {
            name: 'command',
            type: 'string',
            description: 'The shell command to execute',
            required: true,
        },
        {
            name: 'cwd',
            type: 'string',
            description: 'The working directory to run the command in (optional)',
            required: false,
        },
        {
            name: 'timeout',
            type: 'number',
            description: 'Timeout in seconds (default: 30)',
            required: false,
            default: 30,
        },
    ],
    execute: async (args) => {
        const command = args.command as string;
        const cwd = args.cwd as string | undefined;
        const timeout = args.timeout as number | undefined;

        return executeCommand(command, cwd, timeout);
    },
};
