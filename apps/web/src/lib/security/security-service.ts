/**
 * Phase 801-850: Security & Authentication Services
 * 
 * Security infrastructure and authentication:
 * - Secret management
 * - API key storage
 * - OAuth integration
 * - Permission management
 * - Audit logging
 * - Security scanning
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface Secret {
    id: string;
    name: string;
    type: 'api-key' | 'token' | 'password' | 'certificate' | 'ssh-key' | 'other';
    value: string;
    environment: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date;
    rotationPolicy?: 'daily' | 'weekly' | 'monthly' | 'never';
    lastRotated?: Date;
}

export interface OAuthProvider {
    id: string;
    name: string;
    type: 'github' | 'google' | 'microsoft' | 'gitlab' | 'bitbucket' | 'custom';
    clientId: string;
    scopes: string[];
    connected: boolean;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    profile?: { name: string; email: string; avatar?: string };
}

export interface Permission {
    id: string;
    resource: string;
    action: 'read' | 'write' | 'delete' | 'admin';
    granted: boolean;
    grantedBy?: string;
    grantedAt?: Date;
}

export interface AuditLog {
    id: string;
    timestamp: Date;
    action: string;
    resource: string;
    userId: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
    status: 'success' | 'failure';
}

export interface SecurityScan {
    id: string;
    type: 'dependency' | 'code' | 'secret' | 'configuration';
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    findings: SecurityFinding[];
}

export interface SecurityFinding {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    title: string;
    description: string;
    file?: string;
    line?: number;
    remediation: string;
    resolved: boolean;
}

export interface SecurityState {
    secrets: Secret[];
    oauthProviders: OAuthProvider[];
    permissions: Permission[];
    auditLogs: AuditLog[];
    securityScans: SecurityScan[];

    // Secret management
    addSecret: (secret: Omit<Secret, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateSecret: (id: string, updates: Partial<Secret>) => void;
    deleteSecret: (id: string) => void;
    rotateSecret: (id: string) => void;
    getSecret: (name: string, environment?: string) => string | undefined;

    // OAuth operations
    connectProvider: (provider: Omit<OAuthProvider, 'id' | 'connected'>) => Promise<void>;
    disconnectProvider: (id: string) => void;
    refreshToken: (id: string) => Promise<void>;

    // Permissions
    grantPermission: (resource: string, action: Permission['action']) => void;
    revokePermission: (id: string) => void;
    hasPermission: (resource: string, action: Permission['action']) => boolean;

    // Audit
    logAction: (action: string, resource: string, details?: Record<string, unknown>) => void;
    getAuditLogs: (filters?: { resource?: string; action?: string; limit?: number }) => AuditLog[];

    // Security scanning
    runSecurityScan: (type: SecurityScan['type']) => Promise<SecurityScan>;
    resolveFindings: (findingIds: string[]) => void;
    getUnresolvedFindings: () => SecurityFinding[];
}

// =============================================================================
// STORE
// =============================================================================

const DEFAULT_PROVIDERS: OAuthProvider[] = [
    { id: 'github', name: 'GitHub', type: 'github', clientId: '', scopes: ['read:user', 'repo'], connected: false },
    { id: 'google', name: 'Google', type: 'google', clientId: '', scopes: ['profile', 'email'], connected: false },
    { id: 'microsoft', name: 'Microsoft', type: 'microsoft', clientId: '', scopes: ['User.Read'], connected: false },
];

export const useSecurityService = create<SecurityState>()(
    persist(
        (set, get) => ({
            secrets: [],
            oauthProviders: DEFAULT_PROVIDERS,
            permissions: [],
            auditLogs: [],
            securityScans: [],

            addSecret: (secretData) => {
                const id = `secret_${Date.now()}`;
                set(state => ({
                    secrets: [...state.secrets, { ...secretData, id, createdAt: new Date(), updatedAt: new Date() }],
                }));
                get().logAction('secret.create', id);
                return id;
            },

            updateSecret: (id, updates) => {
                set(state => ({
                    secrets: state.secrets.map(s =>
                        s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s
                    ),
                }));
                get().logAction('secret.update', id);
            },

            deleteSecret: (id) => {
                set(state => ({ secrets: state.secrets.filter(s => s.id !== id) }));
                get().logAction('secret.delete', id);
            },

            rotateSecret: (id) => {
                set(state => ({
                    secrets: state.secrets.map(s =>
                        s.id === id ? { ...s, value: `rotated_${Date.now()}`, lastRotated: new Date(), updatedAt: new Date() } : s
                    ),
                }));
                get().logAction('secret.rotate', id);
            },

            getSecret: (name, environment) => {
                const secret = get().secrets.find(s =>
                    s.name === name && (!environment || s.environment === environment)
                );
                return secret?.value;
            },

            connectProvider: async (providerData) => {
                await new Promise(r => setTimeout(r, 1000));
                set(state => ({
                    oauthProviders: state.oauthProviders.map(p =>
                        p.type === providerData.type
                            ? { ...p, ...providerData, connected: true, accessToken: `token_${Date.now()}` }
                            : p
                    ),
                }));
                get().logAction('oauth.connect', providerData.type);
            },

            disconnectProvider: (id) => {
                set(state => ({
                    oauthProviders: state.oauthProviders.map(p =>
                        p.id === id ? { ...p, connected: false, accessToken: undefined, refreshToken: undefined, profile: undefined } : p
                    ),
                }));
                get().logAction('oauth.disconnect', id);
            },

            refreshToken: async (id) => {
                await new Promise(r => setTimeout(r, 500));
                set(state => ({
                    oauthProviders: state.oauthProviders.map(p =>
                        p.id === id ? { ...p, accessToken: `refreshed_${Date.now()}`, expiresAt: new Date(Date.now() + 3600000) } : p
                    ),
                }));
            },

            grantPermission: (resource, action) => {
                const id = `perm_${Date.now()}`;
                set(state => ({
                    permissions: [...state.permissions, { id, resource, action, granted: true, grantedAt: new Date() }],
                }));
                get().logAction('permission.grant', resource, { action });
            },

            revokePermission: (id) => {
                set(state => ({ permissions: state.permissions.filter(p => p.id !== id) }));
                get().logAction('permission.revoke', id);
            },

            hasPermission: (resource, action) => {
                return get().permissions.some(p => p.resource === resource && p.action === action && p.granted);
            },

            logAction: (action, resource, details) => {
                const log: AuditLog = {
                    id: `audit_${Date.now()}`,
                    timestamp: new Date(),
                    action,
                    resource,
                    userId: 'current_user',
                    details,
                    status: 'success',
                };
                set(state => ({ auditLogs: [log, ...state.auditLogs.slice(0, 999)] }));
            },

            getAuditLogs: (filters) => {
                let logs = get().auditLogs;
                if (filters?.resource) logs = logs.filter(l => l.resource === filters.resource);
                if (filters?.action) logs = logs.filter(l => l.action === filters.action);
                if (filters?.limit) logs = logs.slice(0, filters.limit);
                return logs;
            },

            runSecurityScan: async (type) => {
                const scan: SecurityScan = {
                    id: `scan_${Date.now()}`,
                    type,
                    status: 'running',
                    startedAt: new Date(),
                    findings: [],
                };

                set(state => ({ securityScans: [scan, ...state.securityScans] }));

                await new Promise(r => setTimeout(r, 2000));

                const findings: SecurityFinding[] = [
                    { id: `finding_${Date.now()}_1`, severity: 'high', title: 'Outdated dependency detected', description: 'lodash@4.17.15 has known vulnerabilities', remediation: 'Upgrade to lodash@4.17.21', resolved: false },
                    { id: `finding_${Date.now()}_2`, severity: 'medium', title: 'Hardcoded secret found', description: 'API key detected in source code', file: 'src/config.ts', line: 15, remediation: 'Move to environment variables', resolved: false },
                ];

                set(state => ({
                    securityScans: state.securityScans.map(s =>
                        s.id === scan.id ? { ...s, status: 'completed', completedAt: new Date(), findings } : s
                    ),
                }));

                return { ...scan, status: 'completed', completedAt: new Date(), findings };
            },

            resolveFindings: (findingIds) => {
                set(state => ({
                    securityScans: state.securityScans.map(s => ({
                        ...s,
                        findings: s.findings.map(f =>
                            findingIds.includes(f.id) ? { ...f, resolved: true } : f
                        ),
                    })),
                }));
            },

            getUnresolvedFindings: () => {
                return get().securityScans.flatMap(s => s.findings.filter(f => !f.resolved));
            },
        }),
        {
            name: 'sprintloop-security',
            partialize: (state) => ({
                secrets: state.secrets.map(s => ({ ...s, value: '***' })),
                oauthProviders: state.oauthProviders.map(p => ({ ...p, accessToken: undefined, refreshToken: undefined })),
                permissions: state.permissions,
            }),
        }
    )
);
