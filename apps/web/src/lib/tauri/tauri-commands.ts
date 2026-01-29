/**
 * Tauri Commands Wrapper
 * 
 * TypeScript wrappers for Tauri Rust commands with web fallbacks.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface FileInfo {
    path: string;
    name: string;
    isDir: boolean;
    isFile: boolean;
    size: number;
    modified: number;
    created: number;
}

export interface CommandResult {
    stdout: string;
    stderr: string;
    exitCode: number;
}

export interface WatchEvent {
    type: 'create' | 'modify' | 'delete' | 'rename';
    path: string;
    oldPath?: string;
}

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

// Type for Tauri window object (avoiding global declaration conflict)
interface TauriWindow {
    invoke: <T>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    event: {
        listen: <T>(event: string, handler: (event: { payload: T }) => void) => Promise<() => void>;
    };
}

function getTauri(): TauriWindow | undefined {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (window as any).__TAURI__ as TauriWindow | undefined;
}

export function isTauri(): boolean {
    return typeof window !== 'undefined' && !!getTauri();
}

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    const tauri = getTauri();
    if (!tauri) {
        throw new Error('Tauri is not available. Running in web mode.');
    }
    return tauri.invoke<T>(cmd, args);
}

// =============================================================================
// FILE SYSTEM COMMANDS
// =============================================================================

export async function readFile(path: string): Promise<string> {
    if (!isTauri()) {
        // Web fallback: use File System Access API if available
        console.warn('[Tauri] readFile not available in web mode');
        return '';
    }
    return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, contents: string): Promise<void> {
    if (!isTauri()) {
        console.warn('[Tauri] writeFile not available in web mode');
        return;
    }
    await invoke<void>('write_file', { path, contents });
}

export async function readDir(path: string): Promise<FileInfo[]> {
    if (!isTauri()) {
        console.warn('[Tauri] readDir not available in web mode');
        return [];
    }
    return invoke<FileInfo[]>('read_dir', { path });
}

export async function createDir(path: string, recursive = true): Promise<void> {
    if (!isTauri()) {
        console.warn('[Tauri] createDir not available in web mode');
        return;
    }
    await invoke<void>('create_dir', { path, recursive });
}

export async function removeFile(path: string): Promise<void> {
    if (!isTauri()) {
        console.warn('[Tauri] removeFile not available in web mode');
        return;
    }
    await invoke<void>('remove_file', { path });
}

export async function removeDir(path: string, recursive = true): Promise<void> {
    if (!isTauri()) {
        console.warn('[Tauri] removeDir not available in web mode');
        return;
    }
    await invoke<void>('remove_dir', { path, recursive });
}

export async function rename(from: string, to: string): Promise<void> {
    if (!isTauri()) {
        console.warn('[Tauri] rename not available in web mode');
        return;
    }
    await invoke<void>('rename', { from, to });
}

export async function copyFile(from: string, to: string): Promise<void> {
    if (!isTauri()) {
        console.warn('[Tauri] copyFile not available in web mode');
        return;
    }
    await invoke<void>('copy_file', { from, to });
}

export async function exists(path: string): Promise<boolean> {
    if (!isTauri()) {
        return false;
    }
    return invoke<boolean>('exists', { path });
}

export async function getFileInfo(path: string): Promise<FileInfo | null> {
    if (!isTauri()) {
        return null;
    }
    return invoke<FileInfo | null>('get_file_info', { path });
}

// =============================================================================
// TERMINAL COMMANDS
// =============================================================================

export async function executeCommand(
    command: string,
    args: string[] = [],
    cwd?: string
): Promise<CommandResult> {
    if (!isTauri()) {
        console.warn('[Tauri] executeCommand not available in web mode');
        return { stdout: '', stderr: 'Not available in web mode', exitCode: 1 };
    }
    return invoke<CommandResult>('execute_command', { command, args, cwd });
}

export async function spawnCommand(
    command: string,
    args: string[] = [],
    cwd?: string
): Promise<number> {
    if (!isTauri()) {
        throw new Error('Not available in web mode');
    }
    return invoke<number>('spawn_command', { command, args, cwd });
}

export async function killProcess(pid: number): Promise<void> {
    if (!isTauri()) {
        return;
    }
    await invoke<void>('kill_process', { pid });
}

export async function sendInput(pid: number, input: string): Promise<void> {
    if (!isTauri()) {
        return;
    }
    await invoke<void>('send_input', { pid, input });
}

// =============================================================================
// GIT COMMANDS
// =============================================================================

export async function gitCommand(args: string[], cwd: string): Promise<CommandResult> {
    return executeCommand('git', args, cwd);
}

export async function gitStatus(cwd: string): Promise<CommandResult> {
    return gitCommand(['status', '--porcelain=v2', '-b'], cwd);
}

export async function gitDiff(cwd: string, staged = false): Promise<CommandResult> {
    const args = staged ? ['diff', '--cached'] : ['diff'];
    return gitCommand(args, cwd);
}

export async function gitAdd(paths: string[], cwd: string): Promise<CommandResult> {
    return gitCommand(['add', ...paths], cwd);
}

export async function gitCommit(message: string, cwd: string): Promise<CommandResult> {
    return gitCommand(['commit', '-m', message], cwd);
}

export async function gitPush(cwd: string, remote = 'origin', branch?: string): Promise<CommandResult> {
    const args = branch ? ['push', remote, branch] : ['push', remote];
    return gitCommand(args, cwd);
}

export async function gitPull(cwd: string): Promise<CommandResult> {
    return gitCommand(['pull'], cwd);
}

export async function gitBranches(cwd: string): Promise<CommandResult> {
    return gitCommand(['branch', '-a', '-v'], cwd);
}

export async function gitLog(cwd: string, limit = 20): Promise<CommandResult> {
    return gitCommand(['log', `--format=%H|%h|%s|%an|%at|%P`, `-${limit}`], cwd);
}

// =============================================================================
// FILE WATCHING
// =============================================================================

let watchUnsubscribe: (() => void) | null = null;

export async function watchDirectory(
    path: string,
    callback: (event: WatchEvent) => void
): Promise<() => void> {
    if (!isTauri()) {
        console.warn('[Tauri] watchDirectory not available in web mode');
        return () => { };
    }

    const tauri = getTauri();
    if (!tauri) {
        return () => { };
    }

    // Start watching
    await invoke<void>('watch_directory', { path });

    // Listen for events
    watchUnsubscribe = await tauri.event.listen<WatchEvent>(
        'file-change',
        (event: { payload: WatchEvent }) => callback(event.payload)
    );

    return () => {
        if (watchUnsubscribe) {
            watchUnsubscribe();
            watchUnsubscribe = null;
        }
        invoke<void>('unwatch_directory', { path });
    };
}

// =============================================================================
// DIALOG COMMANDS
// =============================================================================

export interface OpenDialogOptions {
    title?: string;
    filters?: { name: string; extensions: string[] }[];
    directory?: boolean;
    multiple?: boolean;
}

export async function openDialog(options: OpenDialogOptions = {}): Promise<string[] | null> {
    if (!isTauri()) {
        // Web fallback: use File System Access API
        if ('showOpenFilePicker' in window) {
            try {
                const handles = await (window as any).showOpenFilePicker({
                    multiple: options.multiple,
                });
                return handles.map((h: any) => h.name);
            } catch {
                return null;
            }
        }
        return null;
    }
    return invoke<string[] | null>('open_dialog', options as unknown as Record<string, unknown>);
}

export async function saveDialog(options: OpenDialogOptions = {}): Promise<string | null> {
    if (!isTauri()) {
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await (window as any).showSaveFilePicker();
                return handle.name;
            } catch {
                return null;
            }
        }
        return null;
    }
    return invoke<string | null>('save_dialog', options as unknown as Record<string, unknown>);
}

// =============================================================================
// WINDOW COMMANDS
// =============================================================================

export async function setTitle(title: string): Promise<void> {
    if (!isTauri()) {
        document.title = title;
        return;
    }
    await invoke<void>('set_title', { title });
}

export async function minimize(): Promise<void> {
    if (!isTauri()) return;
    await invoke<void>('minimize');
}

export async function maximize(): Promise<void> {
    if (!isTauri()) return;
    await invoke<void>('maximize');
}

export async function close(): Promise<void> {
    if (!isTauri()) {
        window.close();
        return;
    }
    await invoke<void>('close');
}

// =============================================================================
// CLIPBOARD
// =============================================================================

export async function readClipboard(): Promise<string> {
    if (!isTauri()) {
        return navigator.clipboard.readText();
    }
    return invoke<string>('read_clipboard');
}

export async function writeClipboard(text: string): Promise<void> {
    if (!isTauri()) {
        await navigator.clipboard.writeText(text);
        return;
    }
    await invoke<void>('write_clipboard', { text });
}

// =============================================================================
// ENVIRONMENT
// =============================================================================

export async function getEnv(name: string): Promise<string | null> {
    if (!isTauri()) {
        return null;
    }
    return invoke<string | null>('get_env', { name });
}

export async function getHomeDir(): Promise<string | null> {
    if (!isTauri()) {
        return null;
    }
    return invoke<string | null>('get_home_dir');
}

export async function getCurrentDir(): Promise<string | null> {
    if (!isTauri()) {
        return null;
    }
    return invoke<string | null>('get_current_dir');
}
