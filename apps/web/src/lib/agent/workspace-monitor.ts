/**
 * Workspace Monitoring Agent
 * 
 * Phase 118: Automated issue detection and fixes
 * Background linting, error correction, proactive suggestions
 * Source: Cline
 */

import { create } from 'zustand';

export interface WorkspaceIssue {
    id: string;
    type: IssueType;
    severity: 'info' | 'warning' | 'error' | 'critical';
    file: string;
    line?: number;
    column?: number;
    message: string;
    code?: string;
    source: string; // e.g., 'eslint', 'typescript', 'custom'
    suggestion?: IssueSuggestion;
    autoFixable: boolean;
    detectedAt: number;
    resolvedAt?: number;
}

export type IssueType =
    | 'lint_error'
    | 'type_error'
    | 'import_error'
    | 'unused_variable'
    | 'unused_import'
    | 'missing_dependency'
    | 'security_vulnerability'
    | 'performance_issue'
    | 'code_smell'
    | 'documentation_missing';

export interface IssueSuggestion {
    description: string;
    fix: string;
    confidence: number;
}

export interface WorkspaceWatch {
    id: string;
    paths: string[];
    patterns: string[];
    enabled: boolean;
    onIssue: 'ignore' | 'notify' | 'auto_fix';
}

export interface MonitoringStats {
    issuesDetected: number;
    issuesResolved: number;
    autoFixesApplied: number;
    lastScanAt: number;
    filesScanned: number;
}

interface WorkspaceMonitorState {
    issues: WorkspaceIssue[];
    watches: WorkspaceWatch[];
    stats: MonitoringStats;
    isScanning: boolean;
    autoFixEnabled: boolean;
    scanInterval: number; // ms

    // Issue management
    addIssue: (issue: Omit<WorkspaceIssue, 'id' | 'detectedAt'>) => string;
    resolveIssue: (issueId: string) => void;
    applyFix: (issueId: string) => Promise<boolean>;
    ignoreIssue: (issueId: string) => void;

    // Watch management
    addWatch: (watch: Omit<WorkspaceWatch, 'id'>) => string;
    removeWatch: (watchId: string) => void;
    toggleWatch: (watchId: string) => void;

    // Scanning
    startScan: (paths?: string[]) => Promise<void>;
    stopScan: () => void;

    // Queries
    getIssuesByFile: (file: string) => WorkspaceIssue[];
    getIssuesBySeverity: (severity: WorkspaceIssue['severity']) => WorkspaceIssue[];
    getUnresolvedIssues: () => WorkspaceIssue[];

    // Settings
    setAutoFix: (enabled: boolean) => void;
    setScanInterval: (interval: number) => void;
}

export const useWorkspaceMonitorStore = create<WorkspaceMonitorState>((set, get) => ({
    issues: [],
    watches: [],
    stats: {
        issuesDetected: 0,
        issuesResolved: 0,
        autoFixesApplied: 0,
        lastScanAt: 0,
        filesScanned: 0,
    },
    isScanning: false,
    autoFixEnabled: false,
    scanInterval: 60000, // 1 minute

    addIssue: (issue) => {
        const id = `issue-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        const newIssue: WorkspaceIssue = {
            ...issue,
            id,
            detectedAt: Date.now(),
        };

        set(state => ({
            issues: [...state.issues, newIssue],
            stats: {
                ...state.stats,
                issuesDetected: state.stats.issuesDetected + 1,
            },
        }));

        // Auto-fix if enabled and fixable
        if (get().autoFixEnabled && issue.autoFixable && issue.suggestion) {
            get().applyFix(id);
        }

        return id;
    },

    resolveIssue: (issueId) => {
        set(state => ({
            issues: state.issues.map(i =>
                i.id === issueId
                    ? { ...i, resolvedAt: Date.now() }
                    : i
            ),
            stats: {
                ...state.stats,
                issuesResolved: state.stats.issuesResolved + 1,
            },
        }));
    },

    applyFix: async (issueId) => {
        const issue = get().issues.find(i => i.id === issueId);
        if (!issue || !issue.suggestion || !issue.autoFixable) {
            return false;
        }

        console.log('[WorkspaceMonitor] Applying fix:', issue.message);

        // Simulate applying fix
        await new Promise(resolve => setTimeout(resolve, 500));

        set(state => ({
            issues: state.issues.map(i =>
                i.id === issueId
                    ? { ...i, resolvedAt: Date.now() }
                    : i
            ),
            stats: {
                ...state.stats,
                issuesResolved: state.stats.issuesResolved + 1,
                autoFixesApplied: state.stats.autoFixesApplied + 1,
            },
        }));

        return true;
    },

    ignoreIssue: (issueId) => {
        set(state => ({
            issues: state.issues.filter(i => i.id !== issueId),
        }));
    },

    addWatch: (watch) => {
        const id = `watch-${Date.now()}`;
        set(state => ({
            watches: [...state.watches, { ...watch, id }],
        }));
        return id;
    },

    removeWatch: (watchId) => {
        set(state => ({
            watches: state.watches.filter(w => w.id !== watchId),
        }));
    },

    toggleWatch: (watchId) => {
        set(state => ({
            watches: state.watches.map(w =>
                w.id === watchId ? { ...w, enabled: !w.enabled } : w
            ),
        }));
    },

    startScan: async (_paths) => {
        if (get().isScanning) return;

        set({ isScanning: true });
        console.log('[WorkspaceMonitor] Starting scan...');

        // Simulate scanning
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Simulate finding some issues
        const sampleIssues: Omit<WorkspaceIssue, 'id' | 'detectedAt'>[] = [
            {
                type: 'unused_import',
                severity: 'warning',
                file: 'src/example.ts',
                line: 1,
                message: "Unused import 'fs'",
                source: 'eslint',
                autoFixable: true,
                suggestion: {
                    description: "Remove unused import 'fs'",
                    fix: "Delete line 1",
                    confidence: 95,
                },
            },
        ];

        for (const issue of sampleIssues) {
            get().addIssue(issue);
        }

        set(state => ({
            isScanning: false,
            stats: {
                ...state.stats,
                lastScanAt: Date.now(),
                filesScanned: state.stats.filesScanned + 10,
            },
        }));
    },

    stopScan: () => {
        set({ isScanning: false });
    },

    getIssuesByFile: (file) => {
        return get().issues.filter(i => i.file === file && !i.resolvedAt);
    },

    getIssuesBySeverity: (severity) => {
        return get().issues.filter(i => i.severity === severity && !i.resolvedAt);
    },

    getUnresolvedIssues: () => {
        return get().issues.filter(i => !i.resolvedAt);
    },

    setAutoFix: (enabled) => {
        set({ autoFixEnabled: enabled });
    },

    setScanInterval: (interval) => {
        set({ scanInterval: interval });
    },
}));

/**
 * Get issue summary for status bar
 */
export function getIssueSummary(): {
    errors: number;
    warnings: number;
    total: number;
} {
    const issues = useWorkspaceMonitorStore.getState().getUnresolvedIssues();

    return {
        errors: issues.filter(i => i.severity === 'error' || i.severity === 'critical').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        total: issues.length,
    };
}

/**
 * Create issue from TypeScript diagnostic
 */
export function createIssueFromDiagnostic(
    diagnostic: {
        file: string;
        line: number;
        column: number;
        message: string;
        code: number;
    }
): string {
    const store = useWorkspaceMonitorStore.getState();

    return store.addIssue({
        type: 'type_error',
        severity: 'error',
        file: diagnostic.file,
        line: diagnostic.line,
        column: diagnostic.column,
        message: diagnostic.message,
        code: `TS${diagnostic.code}`,
        source: 'typescript',
        autoFixable: false,
    });
}
