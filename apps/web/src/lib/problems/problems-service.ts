/**
 * Problems Service
 * 
 * Collects and manages diagnostics from linters, compilers, and language servers.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type ProblemSeverity = 'error' | 'warning' | 'info' | 'hint';
export type ProblemSource = 'typescript' | 'eslint' | 'prettier' | 'stylelint' | 'custom';

export interface Problem {
    id: string;
    file: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    message: string;
    severity: ProblemSeverity;
    source: ProblemSource;
    code?: string | number;
    relatedInfo?: Array<{
        file: string;
        line: number;
        message: string;
    }>;
}

export interface ProblemGroup {
    file: string;
    problems: Problem[];
    errorCount: number;
    warningCount: number;
}

export interface ProblemsFilter {
    severity?: ProblemSeverity[];
    source?: ProblemSource[];
    searchQuery?: string;
    showResolved?: boolean;
}

export interface ProblemsState {
    problems: Problem[];
    filter: ProblemsFilter;
    selectedProblem: string | null;
    isAutoRefresh: boolean;

    // Problem management
    setProblems: (problems: Problem[]) => void;
    addProblems: (problems: Problem[]) => void;
    clearProblems: (source?: ProblemSource) => void;
    clearFileProblems: (file: string) => void;

    // Filtering
    setFilter: (filter: Partial<ProblemsFilter>) => void;
    getFilteredProblems: () => Problem[];
    getGroupedProblems: () => ProblemGroup[];

    // Selection
    selectProblem: (id: string | null) => void;
    goToNextProblem: () => void;
    goToPreviousProblem: () => void;

    // Stats
    getErrorCount: () => number;
    getWarningCount: () => number;
    getInfoCount: () => number;

    // Settings
    toggleAutoRefresh: () => void;
}

// =============================================================================
// MOCK PROBLEMS
// =============================================================================

const MOCK_PROBLEMS: Problem[] = [
    {
        id: 'p1',
        file: 'src/App.tsx',
        line: 15,
        column: 10,
        message: "Cannot find name 'useState'. Did you mean 'useEffect'?",
        severity: 'error',
        source: 'typescript',
        code: 'TS2552',
    },
    {
        id: 'p2',
        file: 'src/App.tsx',
        line: 23,
        column: 5,
        message: "Parameter 'event' implicitly has an 'any' type.",
        severity: 'warning',
        source: 'typescript',
        code: 'TS7006',
    },
    {
        id: 'p3',
        file: 'src/components/Editor.tsx',
        line: 42,
        column: 1,
        message: 'Unexpected console statement.',
        severity: 'warning',
        source: 'eslint',
        code: 'no-console',
    },
    {
        id: 'p4',
        file: 'src/components/Editor.tsx',
        line: 67,
        column: 15,
        message: "Missing return type on function.",
        severity: 'info',
        source: 'typescript',
        code: 'TS7050',
    },
    {
        id: 'p5',
        file: 'src/lib/utils.ts',
        line: 12,
        column: 8,
        message: "'lodash' should be listed in the project's dependencies.",
        severity: 'error',
        source: 'eslint',
        code: 'import/no-extraneous-dependencies',
    },
    {
        id: 'p6',
        file: 'src/styles/index.css',
        line: 5,
        column: 1,
        message: 'Unknown property "backdrop-filter".',
        severity: 'warning',
        source: 'stylelint',
        code: 'property-no-unknown',
    },
    {
        id: 'p7',
        file: 'src/components/Header.tsx',
        line: 8,
        column: 12,
        endLine: 8,
        endColumn: 24,
        message: "Prefer using nullish coalescing operator (??) instead of a logical or (||).",
        severity: 'hint',
        source: 'eslint',
        code: '@typescript-eslint/prefer-nullish-coalescing',
    },
];

// =============================================================================
// PROBLEMS STORE
// =============================================================================

export const useProblemsService = create<ProblemsState>((set, get) => ({
    problems: MOCK_PROBLEMS,
    filter: {},
    selectedProblem: null,
    isAutoRefresh: true,

    setProblems: (problems) => {
        set({ problems });
    },

    addProblems: (newProblems) => {
        set(state => ({
            problems: [...state.problems, ...newProblems],
        }));
    },

    clearProblems: (source?) => {
        if (source) {
            set(state => ({
                problems: state.problems.filter(p => p.source !== source),
            }));
        } else {
            set({ problems: [] });
        }
    },

    clearFileProblems: (file) => {
        set(state => ({
            problems: state.problems.filter(p => p.file !== file),
        }));
    },

    setFilter: (filter) => {
        set(state => ({
            filter: { ...state.filter, ...filter },
        }));
    },

    getFilteredProblems: () => {
        const { problems, filter } = get();
        let filtered = [...problems];

        if (filter.severity?.length) {
            filtered = filtered.filter(p => filter.severity!.includes(p.severity));
        }

        if (filter.source?.length) {
            filtered = filtered.filter(p => filter.source!.includes(p.source));
        }

        if (filter.searchQuery) {
            const query = filter.searchQuery.toLowerCase();
            filtered = filtered.filter(p =>
                p.message.toLowerCase().includes(query) ||
                p.file.toLowerCase().includes(query) ||
                p.code?.toString().toLowerCase().includes(query)
            );
        }

        return filtered;
    },

    getGroupedProblems: () => {
        const filtered = get().getFilteredProblems();
        const groups = new Map<string, Problem[]>();

        for (const problem of filtered) {
            const existing = groups.get(problem.file) || [];
            groups.set(problem.file, [...existing, problem]);
        }

        return Array.from(groups.entries())
            .map(([file, problems]) => ({
                file,
                problems: problems.sort((a, b) => a.line - b.line),
                errorCount: problems.filter(p => p.severity === 'error').length,
                warningCount: problems.filter(p => p.severity === 'warning').length,
            }))
            .sort((a, b) => {
                // Sort by error count, then warning count
                if (a.errorCount !== b.errorCount) return b.errorCount - a.errorCount;
                return b.warningCount - a.warningCount;
            });
    },

    selectProblem: (id) => {
        set({ selectedProblem: id });
    },

    goToNextProblem: () => {
        const problems = get().getFilteredProblems();
        const current = get().selectedProblem;

        if (problems.length === 0) return;

        if (!current) {
            set({ selectedProblem: problems[0].id });
            return;
        }

        const currentIndex = problems.findIndex(p => p.id === current);
        const nextIndex = (currentIndex + 1) % problems.length;
        set({ selectedProblem: problems[nextIndex].id });
    },

    goToPreviousProblem: () => {
        const problems = get().getFilteredProblems();
        const current = get().selectedProblem;

        if (problems.length === 0) return;

        if (!current) {
            set({ selectedProblem: problems[problems.length - 1].id });
            return;
        }

        const currentIndex = problems.findIndex(p => p.id === current);
        const prevIndex = currentIndex === 0 ? problems.length - 1 : currentIndex - 1;
        set({ selectedProblem: problems[prevIndex].id });
    },

    getErrorCount: () => get().problems.filter(p => p.severity === 'error').length,
    getWarningCount: () => get().problems.filter(p => p.severity === 'warning').length,
    getInfoCount: () => get().problems.filter(p => p.severity === 'info' || p.severity === 'hint').length,

    toggleAutoRefresh: () => {
        set(state => ({ isAutoRefresh: !state.isAutoRefresh }));
    },
}));

// =============================================================================
// UTILITIES
// =============================================================================

export function getSeverityIcon(severity: ProblemSeverity): string {
    const icons: Record<ProblemSeverity, string> = {
        error: '🔴',
        warning: '🟡',
        info: '🔵',
        hint: '💡',
    };
    return icons[severity];
}

export function getSeverityColor(severity: ProblemSeverity): string {
    const colors: Record<ProblemSeverity, string> = {
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        hint: '#8b5cf6',
    };
    return colors[severity];
}

export function getSourceLabel(source: ProblemSource): string {
    const labels: Record<ProblemSource, string> = {
        typescript: 'TypeScript',
        eslint: 'ESLint',
        prettier: 'Prettier',
        stylelint: 'Stylelint',
        custom: 'Custom',
    };
    return labels[source];
}

export function formatProblemLocation(problem: Problem): string {
    if (problem.endLine && problem.endLine !== problem.line) {
        return `Ln ${problem.line}-${problem.endLine}, Col ${problem.column}`;
    }
    return `Ln ${problem.line}, Col ${problem.column}`;
}
