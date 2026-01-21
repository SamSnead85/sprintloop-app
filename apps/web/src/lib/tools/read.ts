/**
 * Read Tool - Read file contents with line range support
 * Ported from OpenCode
 */

import type { ToolDefinition } from './registry';
import type { ToolResult } from './types';

/**
 * Read a file with optional line range
 * In browser context, this uses the File System Access API or Tauri commands
 */
async function readFile(
    filePath: string,
    startLine?: number,
    endLine?: number
): Promise<ToolResult> {
    try {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            const { readTextFile } = await import('@tauri-apps/plugin-fs');
            const content = await readTextFile(filePath);
            const lines = content.split('\n');

            // Apply line range if specified
            if (startLine !== undefined || endLine !== undefined) {
                const start = (startLine ?? 1) - 1;
                const end = endLine ?? lines.length;
                const selectedLines = lines.slice(start, end);
                return {
                    success: true,
                    output: selectedLines.join('\n'),
                    metadata: {
                        path: filePath,
                        totalLines: lines.length,
                        startLine: start + 1,
                        endLine: Math.min(end, lines.length),
                        truncated: end < lines.length,
                    },
                };
            }

            return {
                success: true,
                output: content,
                metadata: {
                    path: filePath,
                    totalLines: lines.length,
                    truncated: false,
                },
            };
        }

        // Fallback for web: use fetch if it's a relative path
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to read file: ${response.statusText}`);
        }
        const content = await response.text();
        return {
            success: true,
            output: content,
            metadata: { path: filePath },
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: `Failed to read file '${filePath}': ${errorMessage}`,
        };
    }
}

export const readTool: ToolDefinition = {
    id: 'read',
    name: 'Read File',
    description: 'Read the contents of a file. Can optionally specify a line range to read only a portion of the file.',
    parameters: [
        {
            name: 'file_path',
            type: 'string',
            description: 'The absolute path to the file to read',
            required: true,
        },
        {
            name: 'start_line',
            type: 'number',
            description: 'The starting line number (1-indexed, inclusive)',
            required: false,
        },
        {
            name: 'end_line',
            type: 'number',
            description: 'The ending line number (1-indexed, inclusive)',
            required: false,
        },
    ],
    execute: async (args) => {
        const filePath = args.file_path as string;
        const startLine = args.start_line as number | undefined;
        const endLine = args.end_line as number | undefined;

        return readFile(filePath, startLine, endLine);
    },
};
