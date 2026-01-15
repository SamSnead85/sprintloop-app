/**
 * Audit Logger
 * 
 * Phase 74: Security audit logging
 * Track all sensitive operations for compliance
 */

export type AuditEventType =
    | 'auth.login'
    | 'auth.logout'
    | 'auth.failed'
    | 'file.read'
    | 'file.write'
    | 'file.delete'
    | 'terminal.execute'
    | 'ai.request'
    | 'ai.tool_call'
    | 'git.push'
    | 'git.commit'
    | 'settings.change'
    | 'api_key.add'
    | 'api_key.remove'
    | 'project.open'
    | 'project.close';

export interface AuditEvent {
    id: string;
    timestamp: number;
    type: AuditEventType;
    userId?: string;
    sessionId: string;
    action: string;
    resource?: string;
    details?: Record<string, unknown>;
    result: 'success' | 'failure' | 'pending';
    ipAddress?: string;
    userAgent?: string;
}

export interface AuditFilter {
    types?: AuditEventType[];
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    result?: 'success' | 'failure';
    search?: string;
}

// In-memory storage (would be persisted in production)
let auditLog: AuditEvent[] = [];
const sessionId = `session-${Date.now()}`;

/**
 * Log an audit event
 */
export function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'sessionId'>): AuditEvent {
    const auditEvent: AuditEvent = {
        ...event,
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
        sessionId,
    };

    auditLog.push(auditEvent);

    // Keep last 10000 events
    if (auditLog.length > 10000) {
        auditLog = auditLog.slice(-10000);
    }

    // Log sensitive events to console in development
    if (event.type.startsWith('auth.') || event.type.includes('api_key')) {
        console.log('[Audit]', event.type, event.action, event.result);
    }

    return auditEvent;
}

/**
 * Get audit events with filtering
 */
export function getAuditEvents(filter?: AuditFilter): AuditEvent[] {
    let events = [...auditLog];

    if (filter?.types?.length) {
        events = events.filter(e => filter.types!.includes(e.type));
    }

    if (filter?.startDate) {
        events = events.filter(e => e.timestamp >= filter.startDate!.getTime());
    }

    if (filter?.endDate) {
        events = events.filter(e => e.timestamp <= filter.endDate!.getTime());
    }

    if (filter?.userId) {
        events = events.filter(e => e.userId === filter.userId);
    }

    if (filter?.result) {
        events = events.filter(e => e.result === filter.result);
    }

    if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        events = events.filter(e =>
            e.action.toLowerCase().includes(searchLower) ||
            e.resource?.toLowerCase().includes(searchLower)
        );
    }

    return events.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Export audit log
 */
export function exportAuditLog(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
        const headers = ['timestamp', 'type', 'action', 'resource', 'result', 'sessionId'];
        const rows = auditLog.map(e => [
            new Date(e.timestamp).toISOString(),
            e.type,
            e.action,
            e.resource || '',
            e.result,
            e.sessionId,
        ]);
        return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    return JSON.stringify(auditLog, null, 2);
}

/**
 * Clear audit log (admin only)
 */
export function clearAuditLog(): void {
    logAuditEvent({
        type: 'settings.change',
        action: 'Cleared audit log',
        result: 'success',
    });
    auditLog = [];
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

export function auditFileRead(path: string): void {
    logAuditEvent({
        type: 'file.read',
        action: 'Read file',
        resource: path,
        result: 'success',
    });
}

export function auditFileWrite(path: string): void {
    logAuditEvent({
        type: 'file.write',
        action: 'Write file',
        resource: path,
        result: 'success',
    });
}

export function auditTerminalCommand(command: string): void {
    logAuditEvent({
        type: 'terminal.execute',
        action: 'Execute command',
        details: { command: command.slice(0, 200) },
        result: 'pending',
    });
}

export function auditAIRequest(model: string, tokens: number): void {
    logAuditEvent({
        type: 'ai.request',
        action: 'AI API request',
        resource: model,
        details: { tokens },
        result: 'success',
    });
}

export function auditToolCall(toolName: string, approved: boolean): void {
    logAuditEvent({
        type: 'ai.tool_call',
        action: `Tool call: ${toolName}`,
        resource: toolName,
        details: { approved },
        result: approved ? 'success' : 'failure',
    });
}

export function auditAuthEvent(action: 'login' | 'logout' | 'failed', userId?: string): void {
    logAuditEvent({
        type: `auth.${action}` as AuditEventType,
        action: `User ${action}`,
        userId,
        result: action === 'failed' ? 'failure' : 'success',
    });
}
