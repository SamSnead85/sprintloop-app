/**
 * GitHub Integration
 * 
 * Phase 39-41: GitHub OAuth, repo browser, PR integration
 * Inspired by Cursor's GitHub integration
 */

export interface GitHubUser {
    id: number;
    login: string;
    name: string;
    email: string;
    avatarUrl: string;
}

export interface GitHubRepo {
    id: number;
    name: string;
    fullName: string;
    description: string;
    private: boolean;
    defaultBranch: string;
    url: string;
    cloneUrl: string;
    sshUrl: string;
    language: string;
    stargazers: number;
    forks: number;
    openIssues: number;
    updatedAt: string;
}

export interface GitHubBranch {
    name: string;
    commit: string;
    protected: boolean;
}

export interface GitHubCommit {
    sha: string;
    message: string;
    author: string;
    date: string;
    url: string;
}

export interface GitHubPullRequest {
    id: number;
    number: number;
    title: string;
    body: string;
    state: 'open' | 'closed' | 'merged';
    headBranch: string;
    baseBranch: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    url: string;
    additions: number;
    deletions: number;
    changedFiles: number;
}

export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string;
    state: 'open' | 'closed';
    labels: string[];
    author: string;
    createdAt: string;
    url: string;
}

/**
 * GitHub Integration Service
 */
class GitHubService {
    private token: string | null = null;
    private user: GitHubUser | null = null;
    private baseUrl = 'https://api.github.com';

    /**
     * Initialize with OAuth token
     */
    setToken(token: string): void {
        this.token = token;
    }

    /**
     * Check if authenticated
     */
    isAuthenticated(): boolean {
        return this.token !== null;
    }

    /**
     * Get current user
     */
    async getCurrentUser(): Promise<GitHubUser> {
        if (this.user) return this.user;

        const response = await this.request('/user') as Record<string, unknown>;
        this.user = {
            id: response.id as number,
            login: response.login as string,
            name: response.name as string,
            email: response.email as string,
            avatarUrl: response.avatar_url as string,
        };

        return this.user;
    }

    /**
     * List user's repositories
     */
    async listRepositories(options?: {
        type?: 'all' | 'owner' | 'member';
        sort?: 'created' | 'updated' | 'pushed' | 'full_name';
        per_page?: number;
    }): Promise<GitHubRepo[]> {
        const params = new URLSearchParams({
            type: options?.type || 'owner',
            sort: options?.sort || 'updated',
            per_page: String(options?.per_page || 30),
        });

        const response = await this.request(`/user/repos?${params}`) as Record<string, unknown>[];

        return response.map((repo: Record<string, unknown>) => ({
            id: repo.id as number,
            name: repo.name as string,
            fullName: repo.full_name as string,
            description: (repo.description as string) || '',
            private: repo.private as boolean,
            defaultBranch: repo.default_branch as string,
            url: repo.html_url as string,
            cloneUrl: repo.clone_url as string,
            sshUrl: repo.ssh_url as string,
            language: (repo.language as string) || '',
            stargazers: repo.stargazers_count as number,
            forks: repo.forks_count as number,
            openIssues: repo.open_issues_count as number,
            updatedAt: repo.updated_at as string,
        }));
    }

    /**
     * Get repository details
     */
    async getRepository(owner: string, repo: string): Promise<GitHubRepo> {
        const response = await this.request(`/repos/${owner}/${repo}`) as Record<string, unknown>;

        return {
            id: response.id as number,
            name: response.name as string,
            fullName: response.full_name as string,
            description: (response.description as string) || '',
            private: response.private as boolean,
            defaultBranch: response.default_branch as string,
            url: response.html_url as string,
            cloneUrl: response.clone_url as string,
            sshUrl: response.ssh_url as string,
            language: (response.language as string) || '',
            stargazers: response.stargazers_count as number,
            forks: response.forks_count as number,
            openIssues: response.open_issues_count as number,
            updatedAt: response.updated_at as string,
        };
    }

    /**
     * List branches
     */
    async listBranches(owner: string, repo: string): Promise<GitHubBranch[]> {
        const response = await this.request(`/repos/${owner}/${repo}/branches`) as Record<string, unknown>[];

        return response.map((branch: Record<string, unknown>) => ({
            name: branch.name as string,
            commit: (branch.commit as { sha: string }).sha,
            protected: branch.protected as boolean,
        }));
    }

    /**
     * List commits
     */
    async listCommits(
        owner: string,
        repo: string,
        options?: { branch?: string; per_page?: number }
    ): Promise<GitHubCommit[]> {
        const params = new URLSearchParams();
        if (options?.branch) params.set('sha', options.branch);
        if (options?.per_page) params.set('per_page', String(options.per_page));

        const response = await this.request(`/repos/${owner}/${repo}/commits?${params}`) as Record<string, unknown>[];

        return response.map((commit: Record<string, unknown>) => {
            const c = commit.commit as { message: string; author: { name: string; date: string } };
            return {
                sha: commit.sha as string,
                message: c.message,
                author: c.author.name,
                date: c.author.date,
                url: commit.html_url as string,
            };
        });
    }

    /**
     * List pull requests
     */
    async listPullRequests(
        owner: string,
        repo: string,
        options?: { state?: 'open' | 'closed' | 'all' }
    ): Promise<GitHubPullRequest[]> {
        const params = new URLSearchParams({
            state: options?.state || 'open',
        });

        const response = await this.request(`/repos/${owner}/${repo}/pulls?${params}`) as Record<string, unknown>[];

        return response.map((pr: Record<string, unknown>) => ({
            id: pr.id as number,
            number: pr.number as number,
            title: pr.title as string,
            body: (pr.body as string) || '',
            state: pr.state as 'open' | 'closed' | 'merged',
            headBranch: (pr.head as { ref: string }).ref,
            baseBranch: (pr.base as { ref: string }).ref,
            author: (pr.user as { login: string }).login,
            createdAt: pr.created_at as string,
            updatedAt: pr.updated_at as string,
            url: pr.html_url as string,
            additions: (pr.additions as number) || 0,
            deletions: (pr.deletions as number) || 0,
            changedFiles: (pr.changed_files as number) || 0,
        }));
    }

    /**
     * Create a pull request
     */
    async createPullRequest(
        owner: string,
        repo: string,
        data: { title: string; body: string; head: string; base: string }
    ): Promise<GitHubPullRequest> {
        const response = await this.request(`/repos/${owner}/${repo}/pulls`, {
            method: 'POST',
            body: JSON.stringify(data),
        }) as Record<string, unknown>;

        return {
            id: response.id as number,
            number: response.number as number,
            title: response.title as string,
            body: (response.body as string) || '',
            state: response.state as 'open' | 'closed' | 'merged',
            headBranch: (response.head as { ref: string }).ref,
            baseBranch: (response.base as { ref: string }).ref,
            author: (response.user as { login: string }).login,
            createdAt: response.created_at as string,
            updatedAt: response.updated_at as string,
            url: response.html_url as string,
            additions: 0,
            deletions: 0,
            changedFiles: 0,
        };
    }

    /**
     * List issues
     */
    async listIssues(
        owner: string,
        repo: string,
        options?: { state?: 'open' | 'closed' | 'all'; labels?: string }
    ): Promise<GitHubIssue[]> {
        const params = new URLSearchParams({
            state: options?.state || 'open',
        });
        if (options?.labels) params.set('labels', options.labels);

        const response = await this.request(`/repos/${owner}/${repo}/issues?${params}`) as Record<string, unknown>[];

        return response
            .filter((issue: Record<string, unknown>) => !issue.pull_request)
            .map((issue: Record<string, unknown>) => ({
                id: issue.id as number,
                number: issue.number as number,
                title: issue.title as string,
                body: (issue.body as string) || '',
                state: issue.state as 'open' | 'closed',
                labels: (issue.labels as Array<{ name: string }>).map(l => l.name),
                author: (issue.user as { login: string }).login,
                createdAt: issue.created_at as string,
                url: issue.html_url as string,
            }));
    }

    /**
     * Clone a repository
     */
    async cloneRepository(cloneUrl: string, targetPath: string): Promise<void> {
        console.log(`[GitHub] Cloning ${cloneUrl} to ${targetPath}`);
        // In real implementation, use git clone command via Tauri
    }

    /**
     * Make an authenticated request
     */
    private async request(path: string, options?: RequestInit): Promise<unknown> {
        if (!this.token) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Logout
     */
    logout(): void {
        this.token = null;
        this.user = null;
    }
}

// Singleton instance
export const github = new GitHubService();

/**
 * GitHub OAuth URL generator
 */
export function getGitHubOAuthUrl(clientId: string, redirectUri: string, scope: string = 'repo user'): string {
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
    });

    return `https://github.com/login/oauth/authorize?${params}`;
}
