/**
 * SprintLoop Git Client
 * Git operations via Tauri shell commands
 */

import { executeTool } from '../tools/registry';

export interface GitStatus {
    branch: string;
    staged: string[];
    unstaged: string[];
    untracked: string[];
    ahead: number;
    behind: number;
}

export interface GitCommit {
    hash: string;
    message: string;
    author: string;
    date: Date;
}

export interface GitBranch {
    name: string;
    current: boolean;
    remote?: string;
}

/**
 * Execute a git command and return output
 */
async function execGit(args: string, cwd?: string): Promise<{ success: boolean; output: string }> {
    const result = await executeTool('bash', {
        command: `git ${args}`,
        timeout: 10000,
        cwd,
    });
    return {
        success: result.success,
        output: result.output || result.error || '',
    };
}

/**
 * Get current git status
 */
export async function getStatus(cwd?: string): Promise<GitStatus> {
    const branchResult = await execGit('branch --show-current', cwd);
    const statusResult = await execGit('status --porcelain', cwd);
    const aheadBehindResult = await execGit('rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo "0 0"', cwd);

    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    if (statusResult.success) {
        const lines = statusResult.output.split('\n').filter(Boolean);
        for (const line of lines) {
            const status = line.substring(0, 2);
            const file = line.substring(3);

            if (status.startsWith('?')) {
                untracked.push(file);
            } else if (status[0] !== ' ') {
                staged.push(file);
            } else if (status[1] !== ' ') {
                unstaged.push(file);
            }
        }
    }

    const [behind, ahead] = (aheadBehindResult.output.trim().split(/\s+/) || ['0', '0']).map(Number);

    return {
        branch: branchResult.output.trim() || 'main',
        staged,
        unstaged,
        untracked,
        ahead: ahead || 0,
        behind: behind || 0,
    };
}

/**
 * Stage files for commit
 */
export async function stageFiles(files: string[], cwd?: string): Promise<boolean> {
    const result = await execGit(`add ${files.join(' ')}`, cwd);
    return result.success;
}

/**
 * Stage all changes
 */
export async function stageAll(cwd?: string): Promise<boolean> {
    const result = await execGit('add -A', cwd);
    return result.success;
}

/**
 * Create a commit
 */
export async function commit(message: string, cwd?: string): Promise<{ success: boolean; hash?: string }> {
    const result = await execGit(`commit -m "${message.replace(/"/g, '\\"')}"`, cwd);

    if (result.success) {
        const hashMatch = result.output.match(/\[.+?\s+([a-f0-9]+)\]/);
        return { success: true, hash: hashMatch?.[1] };
    }

    return { success: false };
}

/**
 * Get list of branches
 */
export async function getBranches(cwd?: string): Promise<GitBranch[]> {
    const result = await execGit('branch -a', cwd);

    if (!result.success) return [];

    return result.output.split('\n').filter(Boolean).map(line => {
        const current = line.startsWith('*');
        const name = line.replace(/^\*?\s+/, '').replace(/^remotes\//, '');
        const remote = line.includes('remotes/') ? line.match(/remotes\/([^/]+)/)?.[1] : undefined;

        return { name, current, remote };
    });
}

/**
 * Create a new branch
 */
export async function createBranch(name: string, cwd?: string): Promise<boolean> {
    const result = await execGit(`checkout -b ${name}`, cwd);
    return result.success;
}

/**
 * Switch to a branch
 */
export async function switchBranch(name: string, cwd?: string): Promise<boolean> {
    const result = await execGit(`checkout ${name}`, cwd);
    return result.success;
}

/**
 * Push to remote
 */
export async function push(remote = 'origin', branch?: string, cwd?: string): Promise<boolean> {
    const branchArg = branch ? branch : '';
    const result = await execGit(`push ${remote} ${branchArg}`.trim(), cwd);
    return result.success;
}

/**
 * Pull from remote
 */
export async function pull(remote = 'origin', cwd?: string): Promise<boolean> {
    const result = await execGit(`pull ${remote}`, cwd);
    return result.success;
}

/**
 * Get recent commits
 */
export async function getLog(count = 10, cwd?: string): Promise<GitCommit[]> {
    const result = await execGit(`log -${count} --format="%H|%s|%an|%aI"`, cwd);

    if (!result.success) return [];

    return result.output.split('\n').filter(Boolean).map(line => {
        const [hash, message, author, date] = line.split('|');
        return {
            hash,
            message,
            author,
            date: new Date(date),
        };
    });
}

/**
 * Get diff for a file
 */
export async function getDiff(file?: string, cwd?: string): Promise<string> {
    const fileArg = file ? ` -- ${file}` : '';
    const result = await execGit(`diff${fileArg}`, cwd);
    return result.success ? result.output : '';
}
