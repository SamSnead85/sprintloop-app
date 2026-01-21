/**
 * Glob Tool - Find files matching patterns
 * Ported from OpenCode
 */

import type { ToolDefinition } from './registry';
import type { ToolResult } from './types';

/**
 * Find files matching a glob pattern
 */
async function globSearch(
    pattern: string,
    path: string,
    options?: {
        maxResults?: number;
        includeDirectories?: boolean;
    }
): Promise<ToolResult> {
    try {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            const { Command } = await import('@tauri-apps/plugin-shell');

            // Use fd for fast file finding (commonly installed on dev machines)
            // Falls back to find if fd isn't available
            const args = [
                pattern,
                path,
                '--max-results', String(options?.maxResults ?? 100),
            ];

            if (!options?.includeDirectories) {
                args.push('--type', 'f');
            }

            const cmd = Command.create('fd', args);
            const result = await cmd.execute();

            if (result.code !== 0) {
                // Try fallback to find command
                const findArgs = [
                    path,
                    '-name', pattern,
                    '-type', options?.includeDirectories ? 'd,f' : 'f',
                ];

                const findCmd = Command.create('find', findArgs);
                const findResult = await findCmd.execute();

                if (findResult.code !== 0) {
                    return {
                        success: false,
                        output: '',
                        error: findResult.stderr || 'File search failed',
                    };
                }

                const output = findResult.stdout.trim();
                const files = output ? output.split('\n').slice(0, options?.maxResults ?? 100) : [];

                return {
                    success: true,
                    output: files.join('\n') || 'No files found',
                    metadata: {
                        pattern,
                        path,
                        fileCount: files.length,
                        tool: 'find',
                    },
                };
            }

            const output = result.stdout.trim();
            const files = output ? output.split('\n') : [];

            return {
                success: true,
                output: output || 'No files found',
                metadata: {
                    pattern,
                    path,
                    fileCount: files.length,
                    tool: 'fd',
                },
            };
        }

        return {
            success: false,
            output: '',
            error: 'File search is not available in browser mode. Use the desktop app.',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: `File search failed: ${errorMessage}`,
        };
    }
}

export const globTool: ToolDefinition = {
    id: 'glob',
    name: 'Find Files',
    description: 'Find files matching a glob pattern. Uses fd for fast searching with fallback to find.',
    parameters: [
        {
            name: 'pattern',
            type: 'string',
            description: 'The glob pattern to match (e.g., "*.ts", "package.json")',
            required: true,
        },
        {
            name: 'path',
            type: 'string',
            description: 'The directory to search in',
            required: true,
        },
        {
            name: 'max_results',
            type: 'number',
            description: 'Maximum number of results (default: 100)',
            required: false,
            default: 100,
        },
        {
            name: 'include_directories',
            type: 'boolean',
            description: 'Include directories in results (default: false, files only)',
            required: false,
            default: false,
        },
    ],
    execute: async (args) => {
        const pattern = args.pattern as string;
        const path = args.path as string;
        const maxResults = args.max_results as number | undefined;
        const includeDirectories = args.include_directories as boolean | undefined;

        return globSearch(pattern, path, { maxResults, includeDirectories });
    },
};
