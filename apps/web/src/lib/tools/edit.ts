/**
 * Edit Tool - Edit files using search/replace or diff patches
 * Ported from OpenCode
 */

import type { ToolDefinition } from './registry';
import type { ToolResult } from './types';

/**
 * Apply a search/replace edit to a file
 */
async function editFile(
    filePath: string,
    oldContent: string,
    newContent: string
): Promise<ToolResult> {
    try {
        // Check if running in Tauri
        if (typeof window !== 'undefined' && '__TAURI__' in window) {
            const { readTextFile, writeTextFile } = await import('@tauri-apps/plugin-fs');

            // Read current file content
            const currentContent = await readTextFile(filePath);

            // Check if old content exists
            if (!currentContent.includes(oldContent)) {
                return {
                    success: false,
                    output: '',
                    error: `Could not find the specified content to replace in ${filePath}. Make sure the old_content exactly matches the file content.`,
                };
            }

            // Count occurrences
            const occurrences = currentContent.split(oldContent).length - 1;
            if (occurrences > 1) {
                return {
                    success: false,
                    output: '',
                    error: `Found ${occurrences} occurrences of the content. Please provide a more specific match or use line numbers.`,
                };
            }

            // Apply the edit
            const updatedContent = currentContent.replace(oldContent, newContent);
            await writeTextFile(filePath, updatedContent);

            // Calculate diff stats
            const oldLines = oldContent.split('\n').length;
            const newLines = newContent.split('\n').length;

            return {
                success: true,
                output: `Successfully edited ${filePath}\n- Removed: ${oldLines} lines\n+ Added: ${newLines} lines`,
                metadata: {
                    path: filePath,
                    linesRemoved: oldLines,
                    linesAdded: newLines,
                },
            };
        }

        return {
            success: false,
            output: '',
            error: 'File editing is not available in browser mode. Use the desktop app for file operations.',
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            success: false,
            output: '',
            error: `Failed to edit file '${filePath}': ${errorMessage}`,
        };
    }
}

export const editTool: ToolDefinition = {
    id: 'edit',
    name: 'Edit File',
    description: 'Edit a file by replacing specific content. Provide the exact content to find and the content to replace it with. The old_content must match exactly.',
    requiredCapabilities: ['fileSystem.read', 'fileSystem.write'],
    parameters: [
        {
            name: 'file_path',
            type: 'string',
            description: 'The absolute path to the file to edit',
            required: true,
        },
        {
            name: 'old_content',
            type: 'string',
            description: 'The exact content to find and replace. Must match exactly including whitespace.',
            required: true,
        },
        {
            name: 'new_content',
            type: 'string',
            description: 'The content to replace the old content with',
            required: true,
        },
    ],
    execute: async (args) => {
        const filePath = args.file_path as string;
        const oldContent = args.old_content as string;
        const newContent = args.new_content as string;

        return editFile(filePath, oldContent, newContent);
    },
};
