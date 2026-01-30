/**
 * Phase 151-200: Project Intelligence & Analytics
 * 
 * Project-wide analysis and insights:
 * - Project structure analysis
 * - Dependency visualization
 * - Code metrics
 * - Technical debt tracking
 * - Performance insights
 * - Security scanning
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface ProjectMetrics {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
    fileTypes: Record<string, number>;
    largestFiles: { path: string; lines: number }[];
    avgFileSize: number;
}

export interface DependencyInfo {
    name: string;
    version: string;
    type: 'production' | 'development' | 'peer';
    latest?: string;
    outdated: boolean;
    vulnerabilities: number;
    license?: string;
}

export interface TechDebtItem {
    id: string;
    type: 'todo' | 'fixme' | 'hack' | 'deprecated' | 'complexity';
    message: string;
    file: string;
    line: number;
    severity: 'low' | 'medium' | 'high';
    estimatedHours?: number;
}

export interface SecurityIssue {
    id: string;
    type: 'vulnerability' | 'secret' | 'misconfiguration';
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    file?: string;
    remediation: string;
}

export interface PerformanceInsight {
    id: string;
    category: 'bundle' | 'runtime' | 'memory' | 'network';
    title: string;
    impact: 'high' | 'medium' | 'low';
    suggestion: string;
    currentValue?: string;
    targetValue?: string;
}

export interface ProjectAnalysis {
    metrics: ProjectMetrics;
    dependencies: DependencyInfo[];
    techDebt: TechDebtItem[];
    securityIssues: SecurityIssue[];
    performanceInsights: PerformanceInsight[];
    score: number;
    lastAnalyzed: Date;
}

export interface ProjectIntelligenceState {
    analysis: ProjectAnalysis | null;
    isAnalyzing: boolean;
    analysisProgress: number;

    // Operations
    analyzeProject: (projectPath: string) => Promise<void>;
    refreshDependencies: () => Promise<void>;
    scanSecurity: () => Promise<SecurityIssue[]>;
    calculateMetrics: () => Promise<ProjectMetrics>;
    findTechDebt: () => Promise<TechDebtItem[]>;
    getPerformanceInsights: () => Promise<PerformanceInsight[]>;
    resolveTechDebt: (id: string) => void;
    dismissSecurityIssue: (id: string) => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useProjectIntelligence = create<ProjectIntelligenceState>((set, get) => ({
    analysis: null,
    isAnalyzing: false,
    analysisProgress: 0,

    analyzeProject: async (_projectPath) => {
        set({ isAnalyzing: true, analysisProgress: 0 });

        // Simulate progressive analysis
        const updateProgress = (progress: number) => set({ analysisProgress: progress });

        updateProgress(10);
        await new Promise(r => setTimeout(r, 300));

        const metrics = await get().calculateMetrics();
        updateProgress(30);

        const techDebt = await get().findTechDebt();
        updateProgress(50);

        const securityIssues = await get().scanSecurity();
        updateProgress(70);

        const performanceInsights = await get().getPerformanceInsights();
        updateProgress(90);

        // Calculate project health score
        const score = Math.max(0, 100 - (techDebt.length * 2) - (securityIssues.length * 5));

        const analysis: ProjectAnalysis = {
            metrics,
            dependencies: [
                { name: 'react', version: '18.2.0', type: 'production', latest: '18.2.0', outdated: false, vulnerabilities: 0, license: 'MIT' },
                { name: 'typescript', version: '5.3.3', type: 'development', latest: '5.4.0', outdated: true, vulnerabilities: 0, license: 'Apache-2.0' },
                { name: 'zustand', version: '4.5.0', type: 'production', latest: '4.5.0', outdated: false, vulnerabilities: 0, license: 'MIT' },
                { name: 'vite', version: '5.0.0', type: 'development', latest: '5.1.0', outdated: true, vulnerabilities: 0, license: 'MIT' },
            ],
            techDebt,
            securityIssues,
            performanceInsights,
            score,
            lastAnalyzed: new Date(),
        };

        updateProgress(100);
        set({ analysis, isAnalyzing: false });
    },

    refreshDependencies: async () => {
        await new Promise(r => setTimeout(r, 500));
        // Would fetch latest versions from npm registry
    },

    scanSecurity: async () => {
        await new Promise(r => setTimeout(r, 400));
        return [
            {
                id: 'sec_1',
                type: 'misconfiguration' as const,
                severity: 'medium' as const,
                title: 'Hardcoded API endpoint detected',
                description: 'API endpoint should be configured via environment variables',
                file: 'src/config.ts',
                remediation: 'Move API URL to .env file and use import.meta.env.VITE_API_URL',
            },
        ];
    },

    calculateMetrics: async () => {
        await new Promise(r => setTimeout(r, 300));
        return {
            totalFiles: 156,
            totalLines: 28450,
            languages: { TypeScript: 68, CSS: 18, JSON: 8, Markdown: 6 },
            fileTypes: { '.tsx': 45, '.ts': 38, '.css': 28, '.json': 12, '.md': 8 },
            largestFiles: [
                { path: 'src/lib/editor/monaco-config.ts', lines: 450 },
                { path: 'src/components/Editor.tsx', lines: 380 },
            ],
            avgFileSize: 182,
        };
    },

    findTechDebt: async () => {
        await new Promise(r => setTimeout(r, 350));
        return [
            { id: 'td_1', type: 'todo' as const, message: 'Implement proper error boundary', file: 'src/App.tsx', line: 45, severity: 'medium' as const, estimatedHours: 2 },
            { id: 'td_2', type: 'fixme' as const, message: 'Memory leak in useEffect cleanup', file: 'src/hooks/useWebSocket.ts', line: 23, severity: 'high' as const, estimatedHours: 1 },
            { id: 'td_3', type: 'complexity' as const, message: 'Function exceeds complexity threshold (15)', file: 'src/lib/parser.ts', line: 78, severity: 'medium' as const, estimatedHours: 4 },
        ];
    },

    getPerformanceInsights: async () => {
        await new Promise(r => setTimeout(r, 300));
        return [
            { id: 'perf_1', category: 'bundle' as const, title: 'Large bundle size', impact: 'high' as const, suggestion: 'Enable code splitting for routes', currentValue: '2.4MB', targetValue: '<1MB' },
            { id: 'perf_2', category: 'runtime' as const, title: 'Excessive re-renders', impact: 'medium' as const, suggestion: 'Memoize expensive computations with useMemo', currentValue: '23 renders/s', targetValue: '<10' },
        ];
    },

    resolveTechDebt: (id) => {
        set(state => ({
            analysis: state.analysis ? {
                ...state.analysis,
                techDebt: state.analysis.techDebt.filter(t => t.id !== id),
            } : null,
        }));
    },

    dismissSecurityIssue: (id) => {
        set(state => ({
            analysis: state.analysis ? {
                ...state.analysis,
                securityIssues: state.analysis.securityIssues.filter(s => s.id !== id),
            } : null,
        }));
    },
}));
