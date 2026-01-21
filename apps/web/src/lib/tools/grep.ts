/**
 * Grep Tool - Search for patterns in files
 * Ported from OpenCode
 */

import type { ToolDefinition } from './registry';
import type { ToolResult } from './types';

/**
 * Search for a pattern in files using grep-like functionality
 */
async function grepSearch(
    pattern: string,
    path: string,
    options?: {
        ignoreCase?: boolean;
        maxResults?: number;
        includeGlob?: string;
    }
): Promise<ToolResult> {
    try {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            const { Command } = await import('@tauri-apps/plugin-shell');

            // Build ripgrep command (rg is typically available on dev machines)
            const args = [
                pattern,
                path,
                '--line-number',
                '--color=never',
                '--heading',
                '--max-count', String(options?.maxResults ?? 50),
            ];

            if (options?.ignoreCase) {
                args.push('--ignore-case');
            }

            if (options?.includeGlob) {
                args.push('--glob', options.includeGlob);
            }

            const cmd = Command.create('rg', args);
            const result = await cmd.execute();

            if (result.code !== 0 && result.code !== 1) {
                // Exit code 1 means no matches (not an error)
                return {
                    success: false,
                    output: '',
                    error: result.stderr || 'Search failed',
                };
            }

            const output = result.stdout.trim();
            const matchCount = output ? output.split('\n').length : 0;

            return {
                success: true,
                output: output || 'No matches found',
                metadata: {
                    pattern,
                    path,
                    matchCount,
                },
            };
        }

        return {
            success: false,
            output: '',
            error: 'Search is not available in browser mode. Use the desktop app for file search.',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: `Search failed: ${errorMessage}`,
        };
    }
}

export const grepTool: ToolDefinition = {
    id: 'grep',
    name: 'Search Files',
    description: 'Search for a pattern in files using ripgrep. Returns matching lines with file paths and line numbers.',
    parameters: [
        {
            name: 'pattern',
            type: 'string',
            description: 'The search pattern (supports regex)',
            required: true,
        },
        {
            name: 'path',
            type: 'string',
            description: 'The directory or file to search in',
            required: true,
        },
        {
            name: 'ignore_case',
            type: 'boolean',
            description: 'Perform case-insensitive search',
            required: false,
            default: false,
        },
        {
            name: 'max_results',
            type: 'number',
            description: 'Maximum number of results to return (default: 50)',
            required: false,
            default: 50,
        },
        {
            name: 'include_glob',
            type: 'string',
            description: 'File pattern to include (e.g., "*.ts")',
            required: false,
        },
    ],
    execute: async (args) => {
        const pattern = args.pattern as string;
        const path = args.path as string;
        const ignoreCase = args.ignore_case as boolean | undefined;
        const maxResults = args.max_results as number | undefined;
        const includeGlob = args.include_glob as string | undefined;

        return grepSearch(pattern, path, { ignoreCase, maxResults, includeGlob });
    },
};
