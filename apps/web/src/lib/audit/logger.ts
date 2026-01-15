/**
 * SOC 2 / HITRUST Compliant Audit Logger
 * Logs all significant actions for compliance reporting
 */
import { db } from '../storage'

export interface AuditEntry {
    id: string
    timestamp: string
    userId: string
    sessionId: string
    action: AuditAction
    resource: string
    resourceType: 'file' | 'project' | 'chat' | 'setting' | 'ai_action'
    result: 'success' | 'failure' | 'pending'
    metadata?: Record<string, unknown>
    previousValue?: unknown
    newValue?: unknown
}

export type AuditAction =
    | 'create'
    | 'read'
    | 'update'
    | 'delete'
    | 'ai_request'
    | 'ai_response'
    | 'ai_approval'
    | 'ai_rejection'
    | 'model_switch'
    | 'project_open'
    | 'project_close'
    | 'file_save'
    | 'setting_change'
    | 'login'
    | 'logout'

// Session management
let currentSessionId: string | null = null
let currentUserId = 'local-user' // Will be replaced with real auth

export function initAuditSession(): string {
    currentSessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`

    // Log session start
    log({
        action: 'login',
        resource: currentSessionId,
        resourceType: 'setting',
        result: 'success',
        metadata: {
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
        }
    })

    return currentSessionId
}

export function getSessionId(): string {
    if (!currentSessionId) {
        currentSessionId = initAuditSession()
    }
    return currentSessionId
}

export function setUserId(userId: string): void {
    const previousUserId = currentUserId
    currentUserId = userId

    log({
        action: 'setting_change',
        resource: 'userId',
        resourceType: 'setting',
        result: 'success',
        previousValue: previousUserId,
        newValue: userId,
    })
}

// Core logging function
export async function log(entry: Omit<AuditEntry, 'id' | 'timestamp' | 'userId' | 'sessionId'>): Promise<void> {
    const auditEntry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
        sessionId: getSessionId(),
        ...entry,
    }

    try {
        await db.put('auditLog', auditEntry)
    } catch (error) {
        // Fallback to console if IndexedDB fails (don't lose audit data)
        console.error('[AUDIT]', auditEntry)
        console.error('Failed to persist audit entry:', error)
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
        console.log('%c[AUDIT]', 'color: #8b5cf6', entry.action, entry.resource, entry.result)
    }
}

// Convenience wrappers for common actions
export const audit = {
    aiRequest: (prompt: string, modelId: string) => log({
        action: 'ai_request',
        resource: modelId,
        resourceType: 'ai_action',
        result: 'pending',
        metadata: { promptLength: prompt.length, modelId }
    }),

    aiResponse: (modelId: string, responseLength: number, durationMs: number) => log({
        action: 'ai_response',
        resource: modelId,
        resourceType: 'ai_action',
        result: 'success',
        metadata: { responseLength, durationMs, modelId }
    }),

    aiApproval: (actionId: string, description: string) => log({
        action: 'ai_approval',
        resource: actionId,
        resourceType: 'ai_action',
        result: 'success',
        metadata: { description }
    }),

    aiRejection: (actionId: string, reason: string) => log({
        action: 'ai_rejection',
        resource: actionId,
        resourceType: 'ai_action',
        result: 'failure',
        metadata: { reason }
    }),

    modelSwitch: (fromModel: string, toModel: string) => log({
        action: 'model_switch',
        resource: 'ai-model',
        resourceType: 'setting',
        result: 'success',
        previousValue: fromModel,
        newValue: toModel,
    }),

    projectOpen: (projectPath: string, projectName: string) => log({
        action: 'project_open',
        resource: projectPath,
        resourceType: 'project',
        result: 'success',
        metadata: { projectName }
    }),

    projectClose: (projectPath: string) => log({
        action: 'project_close',
        resource: projectPath,
        resourceType: 'project',
        result: 'success',
    }),

    fileSave: (filePath: string, changeDescription?: string) => log({
        action: 'file_save',
        resource: filePath,
        resourceType: 'file',
        result: 'success',
        metadata: changeDescription ? { description: changeDescription } : undefined
    }),

    settingChange: (setting: string, previousValue: unknown, newValue: unknown) => log({
        action: 'setting_change',
        resource: setting,
        resourceType: 'setting',
        result: 'success',
        previousValue,
        newValue,
    }),
}

// Export audit log for compliance reporting
export async function exportAuditLog(
    startDate?: Date,
    endDate?: Date
): Promise<AuditEntry[]> {
    const allEntries = await db.getAll<AuditEntry>('auditLog')

    let filtered = allEntries

    if (startDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) >= startDate)
    }
    if (endDate) {
        filtered = filtered.filter(e => new Date(e.timestamp) <= endDate)
    }

    // Sort by timestamp descending
    return filtered.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
}

// Generate compliance report
export async function generateComplianceReport(): Promise<string> {
    const entries = await exportAuditLog()

    const report = {
        generatedAt: new Date().toISOString(),
        totalEntries: entries.length,
        summary: {
            aiRequests: entries.filter(e => e.action === 'ai_request').length,
            aiApprovals: entries.filter(e => e.action === 'ai_approval').length,
            aiRejections: entries.filter(e => e.action === 'ai_rejection').length,
            fileChanges: entries.filter(e => e.action === 'file_save').length,
            settingChanges: entries.filter(e => e.action === 'setting_change').length,
        },
        entries,
    }

    return JSON.stringify(report, null, 2)
}
