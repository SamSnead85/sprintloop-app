/**
 * Cost Tracker
 * 
 * Phase 18: Token usage and cost tracking
 * Track AI API costs across providers
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TokenUsage {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
}

export interface CostEntry {
    id: string;
    timestamp: number;
    provider: 'anthropic' | 'openai' | 'google';
    model: string;
    usage: TokenUsage;
    cost: number;
    conversationId?: string;
    description?: string;
}

export interface DailyStats {
    date: string;
    totalTokens: number;
    totalCost: number;
    byProvider: Record<string, { tokens: number; cost: number }>;
    byModel: Record<string, { tokens: number; cost: number }>;
}

// Pricing per 1M tokens (input/output)
const PRICING: Record<string, { input: number; output: number }> = {
    // Anthropic
    'claude-4-opus': { input: 15, output: 75 },
    'claude-4-sonnet': { input: 3, output: 15 },
    'claude-4-haiku': { input: 0.25, output: 1.25 },

    // OpenAI
    'gpt-5': { input: 5, output: 15 },
    'gpt-4-turbo': { input: 10, output: 30 },
    'gpt-4o': { input: 2.5, output: 10 },
    'gpt-4o-mini': { input: 0.15, output: 0.6 },

    // Google
    'gemini-2.5-pro': { input: 1.25, output: 5 },
    'gemini-2.5-flash': { input: 0.075, output: 0.3 },

    // Default
    'default': { input: 1, output: 3 },
};

/**
 * Calculate cost for token usage
 */
export function calculateCost(model: string, usage: TokenUsage): number {
    const pricing = PRICING[model] || PRICING.default;

    const inputCost = (usage.inputTokens / 1_000_000) * pricing.input;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.output;

    return Math.round((inputCost + outputCost) * 10000) / 10000; // Round to 4 decimal places
}

interface CostTrackerState {
    entries: CostEntry[];
    dailyBudget: number | null;
    monthlyBudget: number | null;

    // Actions
    addEntry: (entry: Omit<CostEntry, 'id' | 'cost'>) => void;
    getToday: () => DailyStats;
    getThisMonth: () => DailyStats;
    getHistory: (days: number) => DailyStats[];
    setDailyBudget: (budget: number | null) => void;
    setMonthlyBudget: (budget: number | null) => void;
    isOverBudget: () => boolean;
    clearHistory: () => void;
}

export const useCostTrackerStore = create<CostTrackerState>()(
    persist(
        (set, get) => ({
            entries: [],
            dailyBudget: null,
            monthlyBudget: null,

            addEntry: (entry) => {
                const cost = calculateCost(entry.model, entry.usage);
                const newEntry: CostEntry = {
                    ...entry,
                    id: `cost-${Date.now()}`,
                    cost,
                };

                set((state) => ({
                    entries: [...state.entries, newEntry].slice(-10000), // Keep last 10k entries
                }));
            },

            getToday: () => {
                const { entries } = get();
                const today = new Date().toISOString().split('T')[0];
                return aggregateStats(entries.filter(e =>
                    new Date(e.timestamp).toISOString().split('T')[0] === today
                ), today);
            },

            getThisMonth: () => {
                const { entries } = get();
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                return aggregateStats(entries.filter(e => e.timestamp >= monthStart), 'month');
            },

            getHistory: (days) => {
                const { entries } = get();
                const results: DailyStats[] = [];

                for (let i = 0; i < days; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];

                    const dayEntries = entries.filter(e =>
                        new Date(e.timestamp).toISOString().split('T')[0] === dateStr
                    );

                    results.push(aggregateStats(dayEntries, dateStr));
                }

                return results;
            },

            setDailyBudget: (budget) => set({ dailyBudget: budget }),
            setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),

            isOverBudget: () => {
                const { dailyBudget, monthlyBudget } = get();

                if (dailyBudget !== null) {
                    const today = get().getToday();
                    if (today.totalCost >= dailyBudget) return true;
                }

                if (monthlyBudget !== null) {
                    const month = get().getThisMonth();
                    if (month.totalCost >= monthlyBudget) return true;
                }

                return false;
            },

            clearHistory: () => set({ entries: [] }),
        }),
        {
            name: 'sprintloop:costs',
            partialize: (state) => ({
                entries: state.entries.slice(-1000), // Persist last 1000 only
                dailyBudget: state.dailyBudget,
                monthlyBudget: state.monthlyBudget,
            }),
        }
    )
);

/**
 * Aggregate entries into stats
 */
function aggregateStats(entries: CostEntry[], date: string): DailyStats {
    const byProvider: Record<string, { tokens: number; cost: number }> = {};
    const byModel: Record<string, { tokens: number; cost: number }> = {};

    let totalTokens = 0;
    let totalCost = 0;

    for (const entry of entries) {
        totalTokens += entry.usage.totalTokens;
        totalCost += entry.cost;

        // By provider
        if (!byProvider[entry.provider]) {
            byProvider[entry.provider] = { tokens: 0, cost: 0 };
        }
        byProvider[entry.provider].tokens += entry.usage.totalTokens;
        byProvider[entry.provider].cost += entry.cost;

        // By model
        if (!byModel[entry.model]) {
            byModel[entry.model] = { tokens: 0, cost: 0 };
        }
        byModel[entry.model].tokens += entry.usage.totalTokens;
        byModel[entry.model].cost += entry.cost;
    }

    return {
        date,
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        byProvider,
        byModel,
    };
}

/**
 * Format cost for display
 */
export function formatCost(cost: number): string {
    if (cost < 0.01) {
        return `$${(cost * 100).toFixed(2)}¢`;
    }
    return `$${cost.toFixed(4)}`;
}

/**
 * Format token count
 */
export function formatTokens(tokens: number): string {
    if (tokens >= 1_000_000) {
        return `${(tokens / 1_000_000).toFixed(1)}M`;
    }
    if (tokens >= 1_000) {
        return `${(tokens / 1_000).toFixed(1)}K`;
    }
    return tokens.toString();
}
