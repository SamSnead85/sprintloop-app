/**
 * Tool Types
 */

export interface ToolResult {
    success: boolean;
    output: string;
    error?: string;
    metadata?: Record<string, unknown>;
}

export interface FileInfo {
    path: string;
    content: string;
    lineCount: number;
    truncated: boolean;
}

export interface SearchResult {
    file: string;
    line: number;
    column: number;
    match: string;
    context: string;
}

export interface CommandResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
}
