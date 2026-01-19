/**
 * Tauri Bridge Module
 * Provides type-safe access to Tauri backend commands
 */

// Check if we're running in Tauri
export const isTauri = (): boolean => {
    return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Define types for Tauri invoke
declare global {
    interface Window {
        __TAURI__?: {
            core: {
                invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
            };
        };
    }
}

// Generic invoke wrapper
async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    if (!isTauri()) {
        throw new Error('Not running in Tauri environment');
    }
    return window.__TAURI__!.core.invoke<T>(command, args);
}

// File entry from Rust backend
export interface TauriFileEntry {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    modified: number;
}

// ============================================================================
// FILESYSTEM COMMANDS
// ============================================================================

/**
 * Read directory contents
 */
export async function readDirectory(path: string): Promise<TauriFileEntry[]> {
    return invoke<TauriFileEntry[]>('read_directory', { path });
}

/**
 * Read file content as string
 */
export async function readFileContent(path: string): Promise<string> {
    return invoke<string>('read_file_content', { path });
}

/**
 * Write content to file
 */
export async function writeFileContent(path: string, content: string): Promise<void> {
    return invoke<void>('write_file_content', { path, content });
}

/**
 * Get user's home directory
 */
export async function getHomeDir(): Promise<string> {
    return invoke<string>('get_home_dir', {});
}

/**
 * Get system info
 */
export async function getSystemInfo(): Promise<{
    os: string;
    arch: string;
    family: string;
}> {
    return invoke('get_system_info', {});
}

// ============================================================================
// DIALOG COMMANDS (via @tauri-apps/plugin-dialog)
// ============================================================================

/**
 * Open folder picker dialog
 */
export async function openFolderDialog(): Promise<string | null> {
    if (!isTauri()) {
        console.warn('Folder dialog not available outside Tauri');
        return null;
    }

    try {
        // Use the Tauri dialog plugin
        const { open } = await import('@tauri-apps/plugin-dialog');
        const result = await open({
            directory: true,
            multiple: false,
            title: 'Select Project Folder',
        });
        return result as string | null;
    } catch (e) {
        console.error('Failed to open folder dialog:', e);
        return null;
    }
}

/**
 * Open file picker dialog
 */
export async function openFileDialog(filters?: { name: string; extensions: string[] }[]): Promise<string | null> {
    if (!isTauri()) {
        console.warn('File dialog not available outside Tauri');
        return null;
    }

    try {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const result = await open({
            directory: false,
            multiple: false,
            filters,
        });
        return result as string | null;
    } catch (e) {
        console.error('Failed to open file dialog:', e);
        return null;
    }
}

/**
 * Save file dialog
 */
export async function saveFileDialog(defaultPath?: string): Promise<string | null> {
    if (!isTauri()) {
        console.warn('Save dialog not available outside Tauri');
        return null;
    }

    try {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const result = await save({
            defaultPath,
            title: 'Save File',
        });
        return result as string | null;
    } catch (e) {
        console.error('Failed to open save dialog:', e);
        return null;
    }
}
