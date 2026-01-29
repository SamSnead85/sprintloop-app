/**
 * Write Tool - Create or overwrite files
 * Ported from OpenCode
 */

import type { ToolDefinition } from './registry';
import type { ToolResult } from './types';

/**
 * Write content to a file
 */
async function writeFile(filePath: string, content: string): Promise<ToolResult> {
    try {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            const { writeTextFile, mkdir } = await import('@tauri-apps/plugin-fs');

            // Ensure parent directory exists
            const parentDir = filePath.substring(0, filePath.lastIndexOf('/'));
            if (parentDir) {
                try {
                    await mkdir(parentDir, { recursive: true });
                } catch {
                    // Directory might already exist
                }
            }

            await writeTextFile(filePath, content);

            const lineCount = content.split('\n').length;
            return {
                success: true,
                output: `Successfully wrote ${lineCount} lines to ${filePath}`,
                metadata: {
                    path: filePath,
                    lineCount,
                    bytes: new TextEncoder().encode(content).length,
                },
            };
        }

        // In browser-only mode, we can't write files
        return {
            success: false,
            output: '',
            error: 'File writing is not available in browser mode. Use the desktop app for file operations.',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: `Failed to write file '${filePath}': ${errorMessage}`,
        };
    }
}

export const writeTool: ToolDefinition = {
    id: 'write',
    name: 'Write File',
    description: 'Write content to a file. Creates the file if it does not exist, or overwrites it if it does. Creates parent directories as needed.',
    requiredCapabilities: ['fileSystem.write'],
    parameters: [
        {
            name: 'file_path',
            type: 'string',
            description: 'The absolute path to the file to write',
            required: true,
        },
        {
            name: 'content',
            type: 'string',
            description: 'The content to write to the file',
            required: true,
        },
    ],
    execute: async (args) => {
        const filePath = args.file_path as string;
        const content = args.content as string;

        return writeFile(filePath, content);
    },
};
