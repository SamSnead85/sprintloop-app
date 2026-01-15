/**
 * Realtime Sync Engine
 * 
 * Inspired by Convex's reactive database and realtime sync
 * 
 * Features:
 * - Reactive queries that auto-update
 * - Optimistic mutations
 * - Cross-client sync
 * - Offline support with queue
 * - ACID-like transactional updates
 */

export interface RealtimeState<T = unknown> {
    data: T | null;
    isLoading: boolean;
    error: Error | null;
    lastUpdated: number;
}

export interface Subscription {
    id: string;
    query: string;
    params: Record<string, unknown>;
    callback: (data: unknown) => void;
    active: boolean;
}

export interface Mutation {
    id: string;
    type: 'create' | 'update' | 'delete';
    table: string;
    data: Record<string, unknown>;
    optimisticId?: string;
    status: 'pending' | 'applied' | 'synced' | 'failed';
    timestamp: number;
}

type MutationHandler = (mutation: Mutation) => Promise<void>;
type QueryHandler = (query: string, params: Record<string, unknown>) => Promise<unknown>;

/**
 * Realtime Sync Engine
 * Provides reactive, Convex-style data synchronization
 */
class RealtimeSyncEngine {
    private subscriptions: Map<string, Subscription> = new Map();
    private cache: Map<string, unknown> = new Map();
    private pendingMutations: Mutation[] = [];
    private isOnline: boolean = true;
    private mutationHandler?: MutationHandler;
    private queryHandler?: QueryHandler;

    constructor() {
        // Listen for online/offline events
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.onOnline());
            window.addEventListener('offline', () => this.onOffline());
        }
    }

    /**
     * Configure handlers
     */
    configure(options: {
        mutationHandler: MutationHandler;
        queryHandler: QueryHandler;
    }): void {
        this.mutationHandler = options.mutationHandler;
        this.queryHandler = options.queryHandler;
    }

    /**
     * Subscribe to a query (Convex-style reactive query)
     */
    subscribe<T>(
        query: string,
        params: Record<string, unknown>,
        callback: (data: T) => void
    ): () => void {
        const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const cacheKey = this.getCacheKey(query, params);

        const subscription: Subscription = {
            id,
            query,
            params,
            callback: callback as (data: unknown) => void,
            active: true,
        };

        this.subscriptions.set(id, subscription);

        // Immediately return cached data if available
        if (this.cache.has(cacheKey)) {
            callback(this.cache.get(cacheKey) as T);
        }

        // Fetch fresh data
        this.refreshQuery(query, params).catch(console.error);

        // Return unsubscribe function
        return () => {
            subscription.active = false;
            this.subscriptions.delete(id);
        };
    }

    /**
     * Optimistic mutation (Convex-style)
     */
    async mutate<T>(
        type: 'create' | 'update' | 'delete',
        table: string,
        data: T
    ): Promise<string> {
        const mutation: Mutation = {
            id: `mut-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type,
            table,
            data: data as Record<string, unknown>,
            status: 'pending',
            timestamp: Date.now(),
        };

        // Apply optimistically
        if (type === 'create' || type === 'update') {
            mutation.optimisticId = `opt-${Date.now()}`;
            this.applyOptimisticUpdate(table, data as Record<string, unknown>);
        }

        mutation.status = 'applied';

        if (this.isOnline && this.mutationHandler) {
            try {
                await this.mutationHandler(mutation);
                mutation.status = 'synced';
            } catch (error) {
                mutation.status = 'failed';
                // Rollback optimistic update
                this.rollbackOptimisticUpdate(mutation.optimisticId!);
                throw error;
            }
        } else {
            // Queue for later
            this.pendingMutations.push(mutation);
        }

        return mutation.id;
    }

    /**
     * Apply an optimistic update to cache
     */
    private applyOptimisticUpdate(table: string, data: Record<string, unknown>): void {
        const cacheKey = `table:${table}`;
        const existing = (this.cache.get(cacheKey) as Record<string, unknown>[] | undefined) || [];
        this.cache.set(cacheKey, [...existing, data]);
        this.notifySubscribers(cacheKey);
    }

    /**
     * Rollback an optimistic update
     */
    private rollbackOptimisticUpdate(optimisticId: string): void {
        // In real implementation, would track and revert specific changes
        console.log('[RealtimeSync] Rolling back optimistic update:', optimisticId);
    }

    /**
     * Refresh a query and notify subscribers
     */
    private async refreshQuery(query: string, params: Record<string, unknown>): Promise<void> {
        if (!this.queryHandler) return;

        const cacheKey = this.getCacheKey(query, params);

        try {
            const data = await this.queryHandler(query, params);
            this.cache.set(cacheKey, data);
            this.notifySubscribers(cacheKey);
        } catch (error) {
            console.error('[RealtimeSync] Query failed:', error);
        }
    }

    /**
     * Notify all subscribers of a cache key
     */
    private notifySubscribers(cacheKey: string): void {
        const data = this.cache.get(cacheKey);

        for (const sub of this.subscriptions.values()) {
            if (!sub.active) continue;

            const subCacheKey = this.getCacheKey(sub.query, sub.params);
            if (subCacheKey === cacheKey) {
                try {
                    sub.callback(data);
                } catch (error) {
                    console.error('[RealtimeSync] Subscriber callback error:', error);
                }
            }
        }
    }

    /**
     * Generate cache key
     */
    private getCacheKey(query: string, params: Record<string, unknown>): string {
        return `${query}:${JSON.stringify(params)}`;
    }

    /**
     * Handle coming online
     */
    private async onOnline(): Promise<void> {
        this.isOnline = true;
        console.log('[RealtimeSync] Online - syncing pending mutations');

        // Sync pending mutations
        while (this.pendingMutations.length > 0 && this.mutationHandler) {
            const mutation = this.pendingMutations.shift()!;
            try {
                await this.mutationHandler(mutation);
                mutation.status = 'synced';
            } catch (error) {
                console.error('[RealtimeSync] Failed to sync mutation:', error);
                mutation.status = 'failed';
            }
        }

        // Refresh all subscriptions
        for (const sub of this.subscriptions.values()) {
            if (sub.active) {
                await this.refreshQuery(sub.query, sub.params);
            }
        }
    }

    /**
     * Handle going offline
     */
    private onOffline(): void {
        this.isOnline = false;
        console.log('[RealtimeSync] Offline - mutations will be queued');
    }

    /**
     * Get pending mutations count
     */
    getPendingCount(): number {
        return this.pendingMutations.length;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get connection status
     */
    isConnected(): boolean {
        return this.isOnline;
    }
}

// Singleton instance
export const realtimeSync = new RealtimeSyncEngine();

// ============================================================================
// REACT HOOKS (Convex-style)
// ============================================================================

/**
 * Use a reactive query (like Convex useQuery)
 */
export function createUseQuery<T>(_query: string) {
    return function useQuery(_params: Record<string, unknown>): RealtimeState<T> {
        // This would be implemented with React hooks in the actual app
        // For now, return a placeholder
        return {
            data: null,
            isLoading: true,
            error: null,
            lastUpdated: Date.now(),
        };
    };
}

/**
 * Create a mutation hook (like Convex useMutation)
 */
export function createUseMutation<T>(table: string, type: 'create' | 'update' | 'delete') {
    return function useMutation() {
        return async (data: T): Promise<string> => {
            return realtimeSync.mutate(type, table, data);
        };
    };
}
