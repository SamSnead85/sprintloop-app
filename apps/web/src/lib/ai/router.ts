/**
 * AI Provider Router
 * 
 * Phase 10: Multi-provider fallback with smart routing
 * - Automatic fallback when a provider fails
 * - Smart routing based on task type
 * - Health checking and retry logic
 */

import { AI_MODELS, type AIModel } from '../../config/models';

export interface ProviderHealth {
    provider: string;
    isHealthy: boolean;
    lastError?: string;
    lastCheck: number;
    consecutiveFailures: number;
    responseTime?: number;
}

export interface RoutingDecision {
    model: AIModel;
    reason: string;
    alternatives: AIModel[];
}

// Track provider health
const providerHealth: Map<string, ProviderHealth> = new Map();

// Task type patterns for smart routing
const TASK_PATTERNS: { pattern: RegExp; preferredProvider: string; reason: string }[] = [
    {
        pattern: /\b(code|function|implement|refactor|debug|fix|test)\b/i,
        preferredProvider: 'anthropic',
        reason: 'Coding tasks → Claude (strong code reasoning)'
    },
    {
        pattern: /\b(research|search|find|look up|web|browse)\b/i,
        preferredProvider: 'google',
        reason: 'Research tasks → Gemini (real-time knowledge)'
    },
    {
        pattern: /\b(creative|write|story|blog|content|marketing)\b/i,
        preferredProvider: 'openai',
        reason: 'Creative tasks → GPT (natural language fluency)'
    },
    {
        pattern: /\b(analyze|summarize|explain|understand)\b/i,
        preferredProvider: 'anthropic',
        reason: 'Analysis tasks → Claude (thorough reasoning)'
    },
];

/**
 * Initialize provider health tracking
 */
export function initializeProviderHealth(): void {
    const providers = ['anthropic', 'openai', 'google'];
    for (const provider of providers) {
        if (!providerHealth.has(provider)) {
            providerHealth.set(provider, {
                provider,
                isHealthy: true,
                lastCheck: Date.now(),
                consecutiveFailures: 0,
            });
        }
    }
}

/**
 * Report a provider success
 */
export function reportProviderSuccess(provider: string, responseTime: number): void {
    const health = providerHealth.get(provider) || {
        provider,
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
    };

    health.isHealthy = true;
    health.consecutiveFailures = 0;
    health.responseTime = responseTime;
    health.lastCheck = Date.now();
    health.lastError = undefined;

    providerHealth.set(provider, health);
}

/**
 * Report a provider failure
 */
export function reportProviderFailure(provider: string, error: string): void {
    const health = providerHealth.get(provider) || {
        provider,
        isHealthy: true,
        lastCheck: Date.now(),
        consecutiveFailures: 0,
    };

    health.consecutiveFailures++;
    health.lastError = error;
    health.lastCheck = Date.now();

    // Mark unhealthy after 3 consecutive failures
    if (health.consecutiveFailures >= 3) {
        health.isHealthy = false;
    }

    providerHealth.set(provider, health);
}

/**
 * Get current provider health status
 */
export function getProviderHealth(): ProviderHealth[] {
    return Array.from(providerHealth.values());
}

/**
 * Check if a provider is healthy
 */
export function isProviderHealthy(provider: string): boolean {
    const health = providerHealth.get(provider);
    if (!health) return true; // Assume healthy if unknown

    // Reset health after 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    if (!health.isHealthy && Date.now() - health.lastCheck > fiveMinutes) {
        health.isHealthy = true;
        health.consecutiveFailures = 0;
        providerHealth.set(provider, health);
    }

    return health.isHealthy;
}

/**
 * Smart routing: choose the best model based on task type
 */
export function routeByTaskType(userMessage: string, preferredModelId?: string): RoutingDecision {
    // Get available models (those with API keys)
    const availableModels = AI_MODELS.filter(m => {
        // In a real implementation, check if API key is configured
        return isProviderHealthy(m.provider);
    });

    if (availableModels.length === 0) {
        throw new Error('No available AI providers');
    }

    // If user has a preference and it's healthy, use it
    if (preferredModelId) {
        const preferred = availableModels.find(m => m.id === preferredModelId);
        if (preferred && isProviderHealthy(preferred.provider)) {
            return {
                model: preferred,
                reason: 'User preference',
                alternatives: availableModels.filter(m => m.id !== preferredModelId),
            };
        }
    }

    // Check task patterns for smart routing
    for (const { pattern, preferredProvider, reason } of TASK_PATTERNS) {
        if (pattern.test(userMessage)) {
            const model = availableModels.find(m => m.provider === preferredProvider);
            if (model && isProviderHealthy(model.provider)) {
                return {
                    model,
                    reason,
                    alternatives: availableModels.filter(m => m.id !== model.id),
                };
            }
        }
    }

    // Default to first healthy provider
    return {
        model: availableModels[0],
        reason: 'Default selection',
        alternatives: availableModels.slice(1),
    };
}

/**
 * Get fallback model when primary fails
 */
export function getFallbackModel(failedModelId: string): AIModel | null {
    const availableModels = AI_MODELS.filter(m =>
        m.id !== failedModelId && isProviderHealthy(m.provider)
    );

    return availableModels.length > 0 ? availableModels[0] : null;
}

/**
 * Execute with automatic fallback
 */
export async function executeWithFallback<T>(
    modelId: string,
    execute: (model: AIModel) => Promise<T>,
    maxRetries: number = 2
): Promise<{ result: T; usedModel: AIModel; retries: number }> {
    let currentModelId = modelId;
    let retries = 0;

    while (retries <= maxRetries) {
        const model = AI_MODELS.find(m => m.id === currentModelId);
        if (!model) {
            throw new Error(`Model ${currentModelId} not found`);
        }

        try {
            const startTime = Date.now();
            const result = await execute(model);
            const responseTime = Date.now() - startTime;

            reportProviderSuccess(model.provider, responseTime);

            return { result, usedModel: model, retries };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            reportProviderFailure(model.provider, errorMessage);

            // Try fallback
            const fallback = getFallbackModel(currentModelId);
            if (fallback && retries < maxRetries) {
                console.log(`[Router] Falling back from ${model.name} to ${fallback.name}`);
                currentModelId = fallback.id;
                retries++;
            } else {
                throw error;
            }
        }
    }

    throw new Error('All providers failed');
}

// Initialize on load
initializeProviderHealth();
