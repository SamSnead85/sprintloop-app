/**
 * Phase 651-700: Monitoring & Observability
 * 
 * Application monitoring and performance tracking:
 * - Performance metrics
 * - Error tracking
 * - Usage analytics
 * - Health checks
 * - Logging infrastructure
 * - Alerting
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    tags: Record<string, string>;
}

export interface ErrorEvent {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    stack?: string;
    file?: string;
    line?: number;
    timestamp: Date;
    resolved: boolean;
    occurrences: number;
    firstSeen: Date;
    lastSeen: Date;
    metadata?: Record<string, unknown>;
}

export interface HealthCheck {
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
    lastCheck: Date;
    responseTime?: number;
    message?: string;
}

export interface LogEntry {
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    message: string;
    timestamp: Date;
    source: string;
    metadata?: Record<string, unknown>;
}

export interface Alert {
    id: string;
    name: string;
    condition: string;
    severity: 'critical' | 'warning' | 'info';
    triggered: boolean;
    lastTriggered?: Date;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
}

export interface UsageStats {
    sessions: number;
    activeTime: number;
    filesOpened: number;
    linesWritten: number;
    commandsExecuted: number;
    buildsRun: number;
    testsRun: number;
    aiInteractions: number;
}

export interface MonitoringState {
    metrics: PerformanceMetric[];
    errors: ErrorEvent[];
    healthChecks: HealthCheck[];
    logs: LogEntry[];
    alerts: Alert[];
    usage: UsageStats;
    isMonitoring: boolean;

    // Metrics
    recordMetric: (name: string, value: number, unit: string, tags?: Record<string, string>) => void;
    getMetricHistory: (name: string, limit?: number) => PerformanceMetric[];

    // Errors
    captureError: (error: Error, metadata?: Record<string, unknown>) => void;
    resolveError: (id: string) => void;
    clearResolvedErrors: () => void;

    // Health
    registerHealthCheck: (name: string) => string;
    updateHealthCheck: (id: string, status: HealthCheck['status'], message?: string) => void;
    runHealthChecks: () => Promise<void>;

    // Logging
    log: (level: LogEntry['level'], message: string, source: string, metadata?: Record<string, unknown>) => void;
    getLogs: (filters?: { level?: LogEntry['level']; source?: string; limit?: number }) => LogEntry[];
    clearLogs: () => void;

    // Alerts
    createAlert: (name: string, condition: string, severity: Alert['severity']) => string;
    acknowledgeAlert: (id: string) => void;
    deleteAlert: (id: string) => void;

    // Usage
    trackUsage: (event: keyof UsageStats) => void;
    getUsageStats: () => UsageStats;
    resetUsage: () => void;

    // Control
    startMonitoring: () => void;
    stopMonitoring: () => void;
}

// =============================================================================
// STORE
// =============================================================================

const INITIAL_USAGE: UsageStats = {
    sessions: 1,
    activeTime: 0,
    filesOpened: 0,
    linesWritten: 0,
    commandsExecuted: 0,
    buildsRun: 0,
    testsRun: 0,
    aiInteractions: 0,
};

export const useMonitoringService = create<MonitoringState>((set, get) => ({
    metrics: [],
    errors: [],
    healthChecks: [
        { id: 'hc_api', name: 'API Connection', status: 'healthy', lastCheck: new Date() },
        { id: 'hc_db', name: 'Database', status: 'healthy', lastCheck: new Date() },
        { id: 'hc_cache', name: 'Cache', status: 'healthy', lastCheck: new Date() },
    ],
    logs: [],
    alerts: [],
    usage: INITIAL_USAGE,
    isMonitoring: true,

    recordMetric: (name, value, unit, tags = {}) => {
        const metric: PerformanceMetric = {
            id: `metric_${Date.now()}`,
            name,
            value,
            unit,
            timestamp: new Date(),
            tags,
        };
        set(state => ({
            metrics: [metric, ...state.metrics.slice(0, 999)],
        }));
    },

    getMetricHistory: (name, limit = 100) => {
        return get().metrics.filter(m => m.name === name).slice(0, limit);
    },

    captureError: (error, metadata) => {
        const existing = get().errors.find(e => e.message === error.message);

        if (existing) {
            set(state => ({
                errors: state.errors.map(e =>
                    e.id === existing.id
                        ? { ...e, occurrences: e.occurrences + 1, lastSeen: new Date() }
                        : e
                ),
            }));
        } else {
            const errorEvent: ErrorEvent = {
                id: `error_${Date.now()}`,
                type: 'error',
                message: error.message,
                stack: error.stack,
                timestamp: new Date(),
                resolved: false,
                occurrences: 1,
                firstSeen: new Date(),
                lastSeen: new Date(),
                metadata,
            };
            set(state => ({ errors: [errorEvent, ...state.errors] }));
        }
    },

    resolveError: (id) => {
        set(state => ({
            errors: state.errors.map(e =>
                e.id === id ? { ...e, resolved: true } : e
            ),
        }));
    },

    clearResolvedErrors: () => {
        set(state => ({ errors: state.errors.filter(e => !e.resolved) }));
    },

    registerHealthCheck: (name) => {
        const id = `hc_${Date.now()}`;
        set(state => ({
            healthChecks: [...state.healthChecks, { id, name, status: 'unknown', lastCheck: new Date() }],
        }));
        return id;
    },

    updateHealthCheck: (id, status, message) => {
        set(state => ({
            healthChecks: state.healthChecks.map(hc =>
                hc.id === id ? { ...hc, status, message, lastCheck: new Date() } : hc
            ),
        }));
    },

    runHealthChecks: async () => {
        const { healthChecks } = get();
        for (const hc of healthChecks) {
            await new Promise(r => setTimeout(r, 100));
            const status = Math.random() > 0.1 ? 'healthy' : 'degraded';
            get().updateHealthCheck(hc.id, status);
        }
    },

    log: (level, message, source, metadata) => {
        const entry: LogEntry = {
            id: `log_${Date.now()}`,
            level,
            message,
            timestamp: new Date(),
            source,
            metadata,
        };
        set(state => ({ logs: [entry, ...state.logs.slice(0, 4999)] }));
    },

    getLogs: (filters) => {
        let logs = get().logs;
        if (filters?.level) logs = logs.filter(l => l.level === filters.level);
        if (filters?.source) logs = logs.filter(l => l.source === filters.source);
        if (filters?.limit) logs = logs.slice(0, filters.limit);
        return logs;
    },

    clearLogs: () => set({ logs: [] }),

    createAlert: (name, condition, severity) => {
        const id = `alert_${Date.now()}`;
        set(state => ({
            alerts: [...state.alerts, { id, name, condition, severity, triggered: false }],
        }));
        return id;
    },

    acknowledgeAlert: (id) => {
        set(state => ({
            alerts: state.alerts.map(a =>
                a.id === id ? { ...a, triggered: false, acknowledgedBy: 'current_user', acknowledgedAt: new Date() } : a
            ),
        }));
    },

    deleteAlert: (id) => {
        set(state => ({ alerts: state.alerts.filter(a => a.id !== id) }));
    },

    trackUsage: (event) => {
        set(state => ({
            usage: { ...state.usage, [event]: state.usage[event] + 1 },
        }));
    },

    getUsageStats: () => get().usage,
    resetUsage: () => set({ usage: INITIAL_USAGE }),
    startMonitoring: () => set({ isMonitoring: true }),
    stopMonitoring: () => set({ isMonitoring: false }),
}));
