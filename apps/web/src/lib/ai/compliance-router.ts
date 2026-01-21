/**
 * Compliance-Aware AI Router
 * Routes requests to on-prem or cloud models based on compliance requirements
 * 
 * On-Prem (internal data/code): Ollama, vLLM, llama.cpp
 * Cloud (design/docs): Claude, GPT, Gemini
 */

import { getOnPremConfig, getAvailableOnPremModels, type OnPremModelConfig } from './on-prem-provider'
import { AI_MODELS, type AIModel } from '../../config/models'

export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted'
export type TargetEnvironment = 'production' | 'staging' | 'development' | 'local'
export type TaskCategory = 'code' | 'data' | 'test' | 'deploy' | 'design' | 'document' | 'research' | 'general'

export interface ComplianceConfig {
    enabled: boolean
    dataClassification: DataClassification
    targetEnvironment: TargetEnvironment
    auditEnabled: boolean
    strictMode: boolean // Force on-prem for all internal/confidential data
}

export interface RoutingContext {
    task: string
    dataClassification?: DataClassification
    targetEnvironment?: TargetEnvironment
    userPreferredModel?: string
    forceOnPrem?: boolean
    forceCloud?: boolean
}

export interface RoutingResult {
    modelType: 'onprem' | 'cloud'
    modelId: string
    modelConfig: OnPremModelConfig | AIModel
    reason: string
    complianceNotes: string[]
    auditLog?: AuditEntry
}

export interface AuditEntry {
    timestamp: Date
    taskCategory: TaskCategory
    modelType: 'onprem' | 'cloud'
    modelId: string
    dataClassification: DataClassification
    targetEnvironment: TargetEnvironment
    reason: string
    approved: boolean
}

// Task patterns for categorization
const TASK_PATTERNS: { pattern: RegExp; category: TaskCategory; requiresOnPrem: boolean }[] = [
    // Code operations - on-prem for internal code
    { pattern: /\b(code|function|implement|refactor|debug|fix|write.*class|method|variable)\b/i, category: 'code', requiresOnPrem: true },

    // Data operations - on-prem for internal data
    { pattern: /\b(data|database|query|sql|api|fetch|user.*data|customer|patient|financial)\b/i, category: 'data', requiresOnPrem: true },

    // Testing - on-prem for prod/staging tests
    { pattern: /\b(test|spec|unit|integration|e2e|cypress|jest|vitest|prod.*test|staging)\b/i, category: 'test', requiresOnPrem: true },

    // Deployment - on-prem for security
    { pattern: /\b(deploy|release|production|staging|ci\/cd|pipeline|kubernetes|docker)\b/i, category: 'deploy', requiresOnPrem: true },

    // Design - cloud is fine
    { pattern: /\b(design|mockup|ui|ux|layout|wireframe|figma|prototype|visual)\b/i, category: 'design', requiresOnPrem: false },

    // Documentation - cloud is fine
    { pattern: /\b(document|readme|wiki|guide|tutorial|explain|describe)\b/i, category: 'document', requiresOnPrem: false },

    // Research - cloud is fine
    { pattern: /\b(research|search|find|look.*up|best.*practice|how.*to|what.*is)\b/i, category: 'research', requiresOnPrem: false },
]

// Default compliance config
const DEFAULT_COMPLIANCE_CONFIG: ComplianceConfig = {
    enabled: true,
    dataClassification: 'internal',
    targetEnvironment: 'development',
    auditEnabled: true,
    strictMode: false,
}

// In-memory audit log (would be persisted in production)
const auditLog: AuditEntry[] = []

/**
 * Get compliance configuration
 */
export function getComplianceConfig(): ComplianceConfig {
    try {
        const stored = localStorage.getItem('sprintloop:compliance-config')
        if (stored) {
            return { ...DEFAULT_COMPLIANCE_CONFIG, ...JSON.parse(stored) }
        }
    } catch {
        // Ignore errors
    }
    return DEFAULT_COMPLIANCE_CONFIG
}

/**
 * Save compliance configuration
 */
export function saveComplianceConfig(config: Partial<ComplianceConfig>): void {
    const current = getComplianceConfig()
    localStorage.setItem('sprintloop:compliance-config', JSON.stringify({ ...current, ...config }))
}

/**
 * Categorize task based on content
 */
export function categorizeTask(task: string): TaskCategory {
    for (const { pattern, category } of TASK_PATTERNS) {
        if (pattern.test(task)) {
            return category
        }
    }
    return 'general'
}

/**
 * Determine if task requires on-prem based on compliance rules
 */
export function requiresOnPrem(task: string, config: ComplianceConfig): { required: boolean; reason: string } {
    const category = categorizeTask(task)
    const pattern = TASK_PATTERNS.find(p => p.category === category)

    // Strict mode forces on-prem for internal/confidential data
    if (config.strictMode && ['internal', 'confidential', 'restricted'].includes(config.dataClassification)) {
        return {
            required: true,
            reason: `Strict mode enabled for ${config.dataClassification} data classification`,
        }
    }

    // Check task-based requirements
    if (pattern?.requiresOnPrem) {
        // Code/data/test/deploy require on-prem for prod/staging
        if (['production', 'staging'].includes(config.targetEnvironment)) {
            return {
                required: true,
                reason: `${category} tasks require on-prem in ${config.targetEnvironment} environment`,
            }
        }

        // Confidential/restricted data always requires on-prem
        if (['confidential', 'restricted'].includes(config.dataClassification)) {
            return {
                required: true,
                reason: `${config.dataClassification} data requires on-prem processing`,
            }
        }
    }

    return {
        required: false,
        reason: pattern ? `${category} tasks allowed on cloud` : 'General task - cloud allowed',
    }
}

/**
 * Select the best available on-prem model
 */
export async function selectOnPremModel(task: string): Promise<OnPremModelConfig | null> {
    const available = await getAvailableOnPremModels()

    if (available.length === 0) {
        return null
    }

    const category = categorizeTask(task)

    // Prefer coding models for code tasks
    if (['code', 'test', 'deploy'].includes(category)) {
        const codeModel = available.find(m =>
            m.modelId.includes('coder') ||
            m.modelId.includes('code') ||
            m.modelId.includes('deepseek')
        )
        if (codeModel) return codeModel
    }

    // Return first available (typically the most recently pulled)
    return available[0]
}

/**
 * Select the best cloud model
 */
export function selectCloudModel(task: string, preferredId?: string): AIModel {
    // If user has preference, use it
    if (preferredId) {
        const preferred = AI_MODELS.find(m => m.id === preferredId)
        if (preferred) return preferred
    }

    const category = categorizeTask(task)

    // Route based on task type
    switch (category) {
        case 'code':
        case 'test':
            // Claude is best for code
            return AI_MODELS.find(m => m.provider === 'Anthropic') || AI_MODELS[0]

        case 'research':
            // Gemini for research (real-time knowledge)
            return AI_MODELS.find(m => m.provider === 'Google') || AI_MODELS[0]

        case 'design':
        case 'document':
            // GPT for creative/writing
            return AI_MODELS.find(m => m.provider === 'OpenAI') || AI_MODELS[0]

        default:
            // Default to first recommended model
            return AI_MODELS.find(m => m.recommended) || AI_MODELS[0]
    }
}

/**
 * Main routing function - determines which model to use
 */
export async function routeRequest(context: RoutingContext): Promise<RoutingResult> {
    const config = getComplianceConfig()
    const complianceNotes: string[] = []

    // Override context with config defaults if not specified
    const dataClass = context.dataClassification || config.dataClassification
    const targetEnv = context.targetEnvironment || config.targetEnvironment

    // Check if on-prem is required
    const onPremCheck = requiresOnPrem(context.task, {
        ...config,
        dataClassification: dataClass,
        targetEnvironment: targetEnv,
    })

    // Determine model type
    let useOnPrem = onPremCheck.required

    // Allow overrides (but log them)
    if (context.forceOnPrem) {
        useOnPrem = true
        complianceNotes.push('User forced on-prem routing')
    } else if (context.forceCloud && !onPremCheck.required) {
        useOnPrem = false
        complianceNotes.push('User forced cloud routing')
    } else if (context.forceCloud && onPremCheck.required) {
        complianceNotes.push('⚠️ Cloud requested but on-prem required by compliance - using on-prem')
    }

    complianceNotes.push(onPremCheck.reason)

    // Select model
    let result: RoutingResult

    if (useOnPrem) {
        const onPremConfig = getOnPremConfig()

        if (!onPremConfig.enabled) {
            // Fall back to cloud with warning
            complianceNotes.push('⚠️ On-prem required but not enabled - falling back to cloud')
            const cloudModel = selectCloudModel(context.task, context.userPreferredModel)
            result = {
                modelType: 'cloud',
                modelId: cloudModel.id,
                modelConfig: cloudModel,
                reason: 'On-prem fallback to cloud',
                complianceNotes,
            }
        } else {
            const onPremModel = await selectOnPremModel(context.task)

            if (!onPremModel) {
                // No on-prem models available
                complianceNotes.push('⚠️ No on-prem models available - falling back to cloud')
                const cloudModel = selectCloudModel(context.task, context.userPreferredModel)
                result = {
                    modelType: 'cloud',
                    modelId: cloudModel.id,
                    modelConfig: cloudModel,
                    reason: 'No on-prem models available',
                    complianceNotes,
                }
            } else {
                result = {
                    modelType: 'onprem',
                    modelId: onPremModel.id,
                    modelConfig: onPremModel,
                    reason: `Selected ${onPremModel.displayName} for on-prem processing`,
                    complianceNotes,
                }
            }
        }
    } else {
        const cloudModel = selectCloudModel(context.task, context.userPreferredModel)
        result = {
            modelType: 'cloud',
            modelId: cloudModel.id,
            modelConfig: cloudModel,
            reason: `Selected ${cloudModel.name} for cloud processing`,
            complianceNotes,
        }
    }

    // Create audit log entry
    if (config.auditEnabled) {
        const entry: AuditEntry = {
            timestamp: new Date(),
            taskCategory: categorizeTask(context.task),
            modelType: result.modelType,
            modelId: result.modelId,
            dataClassification: dataClass,
            targetEnvironment: targetEnv,
            reason: result.reason,
            approved: true, // Auto-approved for now
        }
        auditLog.push(entry)
        result.auditLog = entry

        console.log('[Compliance Router]', entry)
    }

    return result
}

/**
 * Get audit log entries
 */
export function getAuditLog(limit?: number): AuditEntry[] {
    const entries = [...auditLog].reverse()
    return limit ? entries.slice(0, limit) : entries
}

/**
 * Clear audit log
 */
export function clearAuditLog(): void {
    auditLog.length = 0
}

/**
 * Export compliance types for use elsewhere
 */
export type { OnPremModelConfig } from './on-prem-provider'
