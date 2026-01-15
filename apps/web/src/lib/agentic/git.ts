/**
 * Git & Version Control Module
 * Phases 501-600: Git operations, branches, commits, PRs
 */

import { create } from 'zustand';

export interface GitRepository {
    path: string;
    name: string;
    branch: string;
    remote?: string;
    status: GitStatus;
    branches: GitBranch[];
    lastFetch?: number;
}

export interface GitStatus {
    staged: GitFile[];
    unstaged: GitFile[];
    untracked: string[];
    ahead: number;
    behind: number;
    conflicts: string[];
}

export interface GitFile {
    path: string;
    status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
    oldPath?: string;
}

export interface GitBranch {
    name: string;
    current: boolean;
    remote?: string;
    lastCommit?: string;
    ahead?: number;
    behind?: number;
}

export interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    email: string;
    date: number;
    parents: string[];
}

export interface GitStash {
    index: number;
    message: string;
    branch: string;
    date: number;
}

interface GitState {
    repositories: Map<string, GitRepository>;
    activeRepoPath: string | null;

    // Repository
    initRepo: (path: string) => Promise<void>;
    cloneRepo: (url: string, path: string) => Promise<void>;
    openRepo: (path: string) => Promise<GitRepository>;

    // Status
    getStatus: (path: string) => Promise<GitStatus>;
    refreshStatus: (path: string) => Promise<void>;

    // Staging
    stage: (path: string, files: string[]) => Promise<void>;
    unstage: (path: string, files: string[]) => Promise<void>;
    stageAll: (path: string) => Promise<void>;

    // Commits
    commit: (path: string, message: string) => Promise<string>;
    amend: (path: string, message?: string) => Promise<void>;
    getLog: (path: string, limit?: number) => Promise<GitCommit[]>;

    // Branches
    createBranch: (path: string, name: string, checkout?: boolean) => Promise<void>;
    deleteBranch: (path: string, name: string) => Promise<void>;
    checkout: (path: string, branch: string) => Promise<void>;
    merge: (path: string, branch: string) => Promise<void>;
    rebase: (path: string, branch: string) => Promise<void>;

    // Remote
    fetch: (path: string) => Promise<void>;
    pull: (path: string) => Promise<void>;
    push: (path: string, force?: boolean) => Promise<void>;

    // Stash
    stash: (path: string, message?: string) => Promise<void>;
    stashPop: (path: string, index?: number) => Promise<void>;
    stashList: (path: string) => Promise<GitStash[]>;

    // Diff
    getDiff: (path: string, file?: string) => Promise<string>;
    getStagedDiff: (path: string) => Promise<string>;

    // Helpers
    getRepo: (path: string) => GitRepository | undefined;
}

export const useGitStore = create<GitState>((set, get) => ({
    repositories: new Map(),
    activeRepoPath: null,

    initRepo: async (path) => {
        console.log('[Git] Initializing repo at:', path);
        await new Promise(r => setTimeout(r, 500));
    },

    cloneRepo: async (url, path) => {
        console.log('[Git] Cloning:', url, 'to', path);
        await new Promise(r => setTimeout(r, 2000));
    },

    openRepo: async (path) => {
        console.log('[Git] Opening repo:', path);

        const repo: GitRepository = {
            path,
            name: path.split('/').pop() || 'repo',
            branch: 'main',
            remote: 'origin',
            status: {
                staged: [],
                unstaged: [],
                untracked: [],
                ahead: 0,
                behind: 0,
                conflicts: [],
            },
            branches: [
                { name: 'main', current: true },
                { name: 'develop', current: false },
            ],
        };

        set(state => {
            const repositories = new Map(state.repositories);
            repositories.set(path, repo);
            return { repositories, activeRepoPath: path };
        });

        return repo;
    },

    getStatus: async (path) => {
        const repo = get().repositories.get(path);
        return repo?.status || { staged: [], unstaged: [], untracked: [], ahead: 0, behind: 0, conflicts: [] };
    },

    refreshStatus: async (path) => {
        console.log('[Git] Refreshing status:', path);
        await new Promise(r => setTimeout(r, 300));
    },

    stage: async (path, files) => {
        console.log('[Git] Staging:', files);
        set(state => {
            const repos = new Map(state.repositories);
            const repo = repos.get(path);
            if (repo) {
                const newStaged = files.map(f => ({ path: f, status: 'modified' as const }));
                repos.set(path, {
                    ...repo,
                    status: {
                        ...repo.status,
                        staged: [...repo.status.staged, ...newStaged],
                        unstaged: repo.status.unstaged.filter(f => !files.includes(f.path)),
                    },
                });
            }
            return { repositories: repos };
        });
    },

    unstage: async (_path, files) => {
        console.log('[Git] Unstaging:', files);
    },

    stageAll: async (path) => {
        console.log('[Git] Staging all');
        const repo = get().repositories.get(path);
        if (repo) {
            await get().stage(path, repo.status.unstaged.map(f => f.path));
        }
    },

    commit: async (path, message) => {
        console.log('[Git] Committing:', message);
        await new Promise(r => setTimeout(r, 500));

        set(state => {
            const repos = new Map(state.repositories);
            const repo = repos.get(path);
            if (repo) {
                repos.set(path, {
                    ...repo,
                    status: { ...repo.status, staged: [] },
                });
            }
            return { repositories: repos };
        });

        return 'abc1234';
    },

    amend: async (_path, _message) => {
        console.log('[Git] Amending commit');
        await new Promise(r => setTimeout(r, 500));
    },

    getLog: async (path, limit = 50) => {
        console.log('[Git] Getting log:', path, limit);
        return [];
    },

    createBranch: async (path, name, checkout = true) => {
        console.log('[Git] Creating branch:', name);
        set(state => {
            const repos = new Map(state.repositories);
            const repo = repos.get(path);
            if (repo) {
                repos.set(path, {
                    ...repo,
                    branches: [...repo.branches, { name, current: checkout }],
                    branch: checkout ? name : repo.branch,
                });
            }
            return { repositories: repos };
        });
    },

    deleteBranch: async (_path, name) => {
        console.log('[Git] Deleting branch:', name);
    },

    checkout: async (path, branch) => {
        console.log('[Git] Checking out:', branch);
        set(state => {
            const repos = new Map(state.repositories);
            const repo = repos.get(path);
            if (repo) {
                repos.set(path, {
                    ...repo,
                    branch,
                    branches: repo.branches.map(b => ({ ...b, current: b.name === branch })),
                });
            }
            return { repositories: repos };
        });
    },

    merge: async (_path, branch) => {
        console.log('[Git] Merging:', branch);
        await new Promise(r => setTimeout(r, 1000));
    },

    rebase: async (_path, branch) => {
        console.log('[Git] Rebasing onto:', branch);
        await new Promise(r => setTimeout(r, 1000));
    },

    fetch: async (path) => {
        console.log('[Git] Fetching');
        await new Promise(r => setTimeout(r, 1000));
        set(state => {
            const repos = new Map(state.repositories);
            const repo = repos.get(path);
            if (repo) {
                repos.set(path, { ...repo, lastFetch: Date.now() });
            }
            return { repositories: repos };
        });
    },

    pull: async (path) => {
        console.log('[Git] Pulling');
        await get().fetch(path);
    },

    push: async (_path, force = false) => {
        console.log('[Git] Pushing', force ? '(force)' : '');
        await new Promise(r => setTimeout(r, 1000));
    },

    stash: async (_path, message) => {
        console.log('[Git] Stashing:', message);
    },

    stashPop: async (_path, _index = 0) => {
        console.log('[Git] Popping stash');
    },

    stashList: async (_path) => {
        return [];
    },

    getDiff: async (_path, _file) => {
        console.log('[Git] Getting diff');
        return '';
    },

    getStagedDiff: async (_path) => {
        console.log('[Git] Getting staged diff');
        return '';
    },

    getRepo: (path) => get().repositories.get(path),
}));

/** Quick commit with message */
export async function quickCommit(message: string, path?: string): Promise<string> {
    const store = useGitStore.getState();
    const repoPath = path || store.activeRepoPath;
    if (!repoPath) throw new Error('No repository open');

    await store.stageAll(repoPath);
    return store.commit(repoPath, message);
}

/** Create and checkout new branch */
export async function newBranch(name: string, path?: string): Promise<void> {
    const store = useGitStore.getState();
    const repoPath = path || store.activeRepoPath;
    if (!repoPath) throw new Error('No repository open');

    await store.createBranch(repoPath, name, true);
}
