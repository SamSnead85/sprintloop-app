/**
 * Diagnostics Service
 * 
 * Problems panel with errors, warnings, and info messages from linters/compilers.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Diagnostic {
    id: string;
    filePath: string;
    severity: DiagnosticSeverity;
    message: string;
    source: string;
    code?: string | number;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
    relatedInformation?: RelatedInformation[];
    tags?: DiagnosticTag[];
}

export interface RelatedInformation {
    filePath: string;
    message: string;
    range: {
        startLine: number;
        startColumn: number;
        endLine: number;
        endColumn: number;
    };
}

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';
export type DiagnosticTag = 'unnecessary' | 'deprecated';

export interface DiagnosticsFilter {
    severity?: DiagnosticSeverity[];
    source?: string[];
    files?: string[];
}

export interface DiagnosticsState {
    diagnostics: Map<string, Diagnostic[]>;
    filter: DiagnosticsFilter;
    isProblemsOpen: boolean;
    hoveredDiagnostic: string | null;

    // Counts
    errorCount: number;
    warningCount: number;
    infoCount: number;

    // CRUD
    setDiagnostics: (filePath: string, diagnostics: Diagnostic[]) => void;
    addDiagnostic: (diagnostic: Diagnostic) => void;
    removeDiagnostic: (id: string) => void;
    clearDiagnostics: (filePath?: string) => void;

    // Queries
    getDiagnosticsForFile: (filePath: string) => Diagnostic[];
    getAllDiagnostics: () => Diagnostic[];
    getFilteredDiagnostics: () => Diagnostic[];
    getDiagnosticById: (id: string) => Diagnostic | undefined;

    // Filtering
    setFilter: (filter: DiagnosticsFilter) => void;
    clearFilter: () => void;

    // UI State
    setProblemsOpen: (open: boolean) => void;
    setHoveredDiagnostic: (id: string | null) => void;

    // Navigation
    goToFirstError: () => Diagnostic | null;
    goToNextProblem: (currentFilePath?: string, currentLine?: number) => Diagnostic | null;
    goToPreviousProblem: (currentFilePath?: string, currentLine?: number) => Diagnostic | null;
}

// =============================================================================
// DIAGNOSTICS STORE
// =============================================================================

let diagnosticIdCounter = 0;

export const useDiagnosticsService = create<DiagnosticsState>((set, get) => ({
    diagnostics: new Map(),
    filter: {},
    isProblemsOpen: false,
    hoveredDiagnostic: null,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,

    setDiagnostics: (filePath, diagnostics) => {
        set(state => {
            const newDiagnostics = new Map(state.diagnostics);
            newDiagnostics.set(filePath, diagnostics);
            const counts = calculateCounts(newDiagnostics);
            return {
                diagnostics: newDiagnostics,
                ...counts,
            };
        });
    },

    addDiagnostic: (diagnostic) => {
        set(state => {
            const newDiagnostics = new Map(state.diagnostics);
            const existing = newDiagnostics.get(diagnostic.filePath) || [];
            newDiagnostics.set(diagnostic.filePath, [...existing, diagnostic]);
            const counts = calculateCounts(newDiagnostics);
            return {
                diagnostics: newDiagnostics,
                ...counts,
            };
        });
    },

    removeDiagnostic: (id) => {
        set(state => {
            const newDiagnostics = new Map(state.diagnostics);
            for (const [filePath, diags] of newDiagnostics) {
                const filtered = diags.filter(d => d.id !== id);
                if (filtered.length !== diags.length) {
                    newDiagnostics.set(filePath, filtered);
                    break;
                }
            }
            const counts = calculateCounts(newDiagnostics);
            return {
                diagnostics: newDiagnostics,
                ...counts,
            };
        });
    },

    clearDiagnostics: (filePath) => {
        set(state => {
            const newDiagnostics = new Map(state.diagnostics);
            if (filePath) {
                newDiagnostics.delete(filePath);
            } else {
                newDiagnostics.clear();
            }
            const counts = calculateCounts(newDiagnostics);
            return {
                diagnostics: newDiagnostics,
                ...counts,
            };
        });
    },

    getDiagnosticsForFile: (filePath) => {
        return get().diagnostics.get(filePath) || [];
    },

    getAllDiagnostics: () => {
        const all: Diagnostic[] = [];
        for (const diags of get().diagnostics.values()) {
            all.push(...diags);
        }
        return all.sort((a, b) => {
            // Sort by severity (errors first), then by file, then by line
            const severityOrder = { error: 0, warning: 1, info: 2, hint: 3 };
            const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
            if (severityDiff !== 0) return severityDiff;

            const fileDiff = a.filePath.localeCompare(b.filePath);
            if (fileDiff !== 0) return fileDiff;

            return a.range.startLine - b.range.startLine;
        });
    },

    getFilteredDiagnostics: () => {
        const { filter } = get();
        let diagnostics = get().getAllDiagnostics();

        if (filter.severity && filter.severity.length > 0) {
            diagnostics = diagnostics.filter(d => filter.severity!.includes(d.severity));
        }

        if (filter.source && filter.source.length > 0) {
            diagnostics = diagnostics.filter(d => filter.source!.includes(d.source));
        }

        if (filter.files && filter.files.length > 0) {
            diagnostics = diagnostics.filter(d => filter.files!.includes(d.filePath));
        }

        return diagnostics;
    },

    getDiagnosticById: (id) => {
        for (const diags of get().diagnostics.values()) {
            const found = diags.find(d => d.id === id);
            if (found) return found;
        }
        return undefined;
    },

    setFilter: (filter) => {
        set({ filter });
    },

    clearFilter: () => {
        set({ filter: {} });
    },

    setProblemsOpen: (open) => {
        set({ isProblemsOpen: open });
    },

    setHoveredDiagnostic: (id) => {
        set({ hoveredDiagnostic: id });
    },

    goToFirstError: () => {
        const diagnostics = get().getAllDiagnostics();
        const firstError = diagnostics.find(d => d.severity === 'error');
        return firstError || diagnostics[0] || null;
    },

    goToNextProblem: (currentFilePath, currentLine) => {
        const diagnostics = get().getAllDiagnostics();
        if (diagnostics.length === 0) return null;

        if (!currentFilePath) {
            return diagnostics[0];
        }

        const currentIndex = diagnostics.findIndex(d =>
            d.filePath === currentFilePath && d.range.startLine >= (currentLine || 0)
        );

        if (currentIndex === -1 || currentIndex === diagnostics.length - 1) {
            return diagnostics[0];
        }

        return diagnostics[currentIndex + 1];
    },

    goToPreviousProblem: (currentFilePath, currentLine) => {
        const diagnostics = get().getAllDiagnostics();
        if (diagnostics.length === 0) return null;

        if (!currentFilePath) {
            return diagnostics[diagnostics.length - 1];
        }

        const currentIndex = diagnostics.findIndex(d =>
            d.filePath === currentFilePath && d.range.startLine >= (currentLine || 0)
        );

        if (currentIndex <= 0) {
            return diagnostics[diagnostics.length - 1];
        }

        return diagnostics[currentIndex - 1];
    },
}));

// =============================================================================
// HELPERS
// =============================================================================

function calculateCounts(diagnostics: Map<string, Diagnostic[]>): {
    errorCount: number;
    warningCount: number;
    infoCount: number;
} {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    for (const diags of diagnostics.values()) {
        for (const d of diags) {
            switch (d.severity) {
                case 'error': errorCount++; break;
                case 'warning': warningCount++; break;
                case 'info':
                case 'hint': infoCount++; break;
            }
        }
    }

    return { errorCount, warningCount, infoCount };
}

// =============================================================================
// FACTORY
// =============================================================================

export function createDiagnostic(
    filePath: string,
    severity: DiagnosticSeverity,
    message: string,
    source: string,
    range: Diagnostic['range'],
    options?: {
        code?: string | number;
        tags?: DiagnosticTag[];
        relatedInformation?: RelatedInformation[];
    }
): Diagnostic {
    return {
        id: `diag_${++diagnosticIdCounter}`,
        filePath,
        severity,
        message,
        source,
        range,
        ...options,
    };
}

// =============================================================================
// SEVERITY HELPERS
// =============================================================================

export function getSeverityIcon(severity: DiagnosticSeverity): string {
    switch (severity) {
        case 'error': return '❌';
        case 'warning': return '⚠️';
        case 'info': return 'ℹ️';
        case 'hint': return '💡';
    }
}

export function getSeverityColor(severity: DiagnosticSeverity): string {
    switch (severity) {
        case 'error': return 'var(--color-error, #ef4444)';
        case 'warning': return 'var(--color-warning, #eab308)';
        case 'info': return 'var(--color-info, #3b82f6)';
        case 'hint': return 'var(--color-hint, #22c55e)';
    }
}
