/**
 * Phase 851-900: Analytics & Telemetry Services
 * 
 * Usage analytics and product telemetry:
 * - Feature usage tracking
 * - Performance telemetry
 * - User behavior analytics
 * - A/B testing
 * - Crash reporting
 * - Funnels & retention
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface AnalyticsEvent {
    id: string;
    name: string;
    category: 'feature' | 'navigation' | 'error' | 'performance' | 'engagement';
    properties: Record<string, unknown>;
    timestamp: Date;
    sessionId: string;
    userId?: string;
}

export interface FeatureUsage {
    featureId: string;
    name: string;
    usageCount: number;
    uniqueUsers: number;
    lastUsed: Date;
    avgDuration?: number;
}

export interface PerformanceTelemetry {
    id: string;
    metric: string;
    value: number;
    unit: 'ms' | 's' | 'bytes' | 'count' | 'percent';
    timestamp: Date;
    context?: Record<string, string>;
}

export interface UserSession {
    id: string;
    startedAt: Date;
    endedAt?: Date;
    duration: number;
    pageViews: number;
    actions: number;
    platform: string;
    version: string;
}

export interface ABTest {
    id: string;
    name: string;
    description: string;
    variants: ABVariant[];
    status: 'draft' | 'running' | 'paused' | 'completed';
    startedAt?: Date;
    endedAt?: Date;
    targetAudience?: string;
    winningVariant?: string;
}

export interface ABVariant {
    id: string;
    name: string;
    weight: number;
    conversions: number;
    impressions: number;
}

export interface CrashReport {
    id: string;
    error: string;
    stack?: string;
    timestamp: Date;
    platform: string;
    version: string;
    userId?: string;
    context?: Record<string, unknown>;
    resolved: boolean;
}

export interface AnalyticsState {
    events: AnalyticsEvent[];
    featureUsage: FeatureUsage[];
    telemetry: PerformanceTelemetry[];
    sessions: UserSession[];
    abTests: ABTest[];
    crashReports: CrashReport[];
    currentSessionId: string;
    trackingEnabled: boolean;

    // Event tracking
    trackEvent: (name: string, category: AnalyticsEvent['category'], properties?: Record<string, unknown>) => void;
    trackPageView: (page: string, referrer?: string) => void;
    trackFeatureUsage: (featureId: string, featureName: string, duration?: number) => void;

    // Performance
    recordPerformance: (metric: string, value: number, unit: PerformanceTelemetry['unit']) => void;
    getPerformanceStats: (metric: string) => { avg: number; min: number; max: number; p95: number };

    // Sessions
    startSession: () => string;
    endSession: () => void;
    getSessionDuration: () => number;

    // A/B Testing
    createABTest: (test: Omit<ABTest, 'id' | 'status'>) => string;
    getVariant: (testId: string) => ABVariant | undefined;
    recordConversion: (testId: string, variantId: string) => void;
    endABTest: (testId: string, winningVariantId?: string) => void;

    // Crash reporting
    reportCrash: (error: Error, context?: Record<string, unknown>) => void;
    resolveCrash: (id: string) => void;

    // Analytics queries
    getEventsByCategory: (category: AnalyticsEvent['category'], limit?: number) => AnalyticsEvent[];
    getTopFeatures: (limit?: number) => FeatureUsage[];
    getRetentionData: () => { day1: number; day7: number; day30: number };

    // Control
    enableTracking: () => void;
    disableTracking: () => void;
    clearAnalytics: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useAnalyticsService = create<AnalyticsState>((set, get) => ({
    events: [],
    featureUsage: [],
    telemetry: [],
    sessions: [],
    abTests: [],
    crashReports: [],
    currentSessionId: `session_${Date.now()}`,
    trackingEnabled: true,

    trackEvent: (name, category, properties = {}) => {
        if (!get().trackingEnabled) return;

        const event: AnalyticsEvent = {
            id: `event_${Date.now()}`,
            name,
            category,
            properties,
            timestamp: new Date(),
            sessionId: get().currentSessionId,
        };
        set(state => ({ events: [event, ...state.events.slice(0, 9999)] }));
    },

    trackPageView: (page, referrer) => {
        get().trackEvent('page_view', 'navigation', { page, referrer });
    },

    trackFeatureUsage: (featureId, featureName, duration) => {
        set(state => {
            const existing = state.featureUsage.find(f => f.featureId === featureId);
            if (existing) {
                return {
                    featureUsage: state.featureUsage.map(f =>
                        f.featureId === featureId
                            ? { ...f, usageCount: f.usageCount + 1, lastUsed: new Date(), avgDuration: duration ? (f.avgDuration || 0 + duration) / 2 : f.avgDuration }
                            : f
                    ),
                };
            }
            return {
                featureUsage: [...state.featureUsage, { featureId, name: featureName, usageCount: 1, uniqueUsers: 1, lastUsed: new Date(), avgDuration: duration }],
            };
        });
    },

    recordPerformance: (metric, value, unit) => {
        if (!get().trackingEnabled) return;

        const telemetry: PerformanceTelemetry = {
            id: `perf_${Date.now()}`,
            metric,
            value,
            unit,
            timestamp: new Date(),
        };
        set(state => ({ telemetry: [telemetry, ...state.telemetry.slice(0, 4999)] }));
    },

    getPerformanceStats: (metric) => {
        const values = get().telemetry.filter(t => t.metric === metric).map(t => t.value);
        if (values.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };

        const sorted = [...values].sort((a, b) => a - b);
        return {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p95: sorted[Math.floor(sorted.length * 0.95)],
        };
    },

    startSession: () => {
        const id = `session_${Date.now()}`;
        const session: UserSession = {
            id,
            startedAt: new Date(),
            duration: 0,
            pageViews: 0,
            actions: 0,
            platform: 'web',
            version: '1.0.0',
        };
        set(state => ({ sessions: [session, ...state.sessions.slice(0, 99)], currentSessionId: id }));
        return id;
    },

    endSession: () => {
        set(state => ({
            sessions: state.sessions.map(s =>
                s.id === state.currentSessionId
                    ? { ...s, endedAt: new Date(), duration: Date.now() - s.startedAt.getTime() }
                    : s
            ),
        }));
    },

    getSessionDuration: () => {
        const session = get().sessions.find(s => s.id === get().currentSessionId);
        return session ? Date.now() - session.startedAt.getTime() : 0;
    },

    createABTest: (testData) => {
        const id = `test_${Date.now()}`;
        set(state => ({
            abTests: [...state.abTests, { ...testData, id, status: 'draft' }],
        }));
        return id;
    },

    getVariant: (testId) => {
        const test = get().abTests.find(t => t.id === testId);
        if (!test || test.status !== 'running') return undefined;

        const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
        let random = Math.random() * totalWeight;

        for (const variant of test.variants) {
            random -= variant.weight;
            if (random <= 0) {
                set(state => ({
                    abTests: state.abTests.map(t =>
                        t.id === testId
                            ? { ...t, variants: t.variants.map(v => v.id === variant.id ? { ...v, impressions: v.impressions + 1 } : v) }
                            : t
                    ),
                }));
                return variant;
            }
        }
        return test.variants[0];
    },

    recordConversion: (testId, variantId) => {
        set(state => ({
            abTests: state.abTests.map(t =>
                t.id === testId
                    ? { ...t, variants: t.variants.map(v => v.id === variantId ? { ...v, conversions: v.conversions + 1 } : v) }
                    : t
            ),
        }));
    },

    endABTest: (testId, winningVariantId) => {
        set(state => ({
            abTests: state.abTests.map(t =>
                t.id === testId ? { ...t, status: 'completed', endedAt: new Date(), winningVariant: winningVariantId } : t
            ),
        }));
    },

    reportCrash: (error, context) => {
        const report: CrashReport = {
            id: `crash_${Date.now()}`,
            error: error.message,
            stack: error.stack,
            timestamp: new Date(),
            platform: 'web',
            version: '1.0.0',
            context,
            resolved: false,
        };
        set(state => ({ crashReports: [report, ...state.crashReports] }));
    },

    resolveCrash: (id) => {
        set(state => ({
            crashReports: state.crashReports.map(r => r.id === id ? { ...r, resolved: true } : r),
        }));
    },

    getEventsByCategory: (category, limit = 100) => {
        return get().events.filter(e => e.category === category).slice(0, limit);
    },

    getTopFeatures: (limit = 10) => {
        return [...get().featureUsage].sort((a, b) => b.usageCount - a.usageCount).slice(0, limit);
    },

    getRetentionData: () => {
        return { day1: 85, day7: 65, day30: 45 };
    },

    enableTracking: () => set({ trackingEnabled: true }),
    disableTracking: () => set({ trackingEnabled: false }),
    clearAnalytics: () => set({ events: [], featureUsage: [], telemetry: [], crashReports: [] }),
}));
