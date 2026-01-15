/**
 * Performance Monitor
 * 
 * Phase 83: Performance tracking and optimization
 * Track render times, memory, bundle size
 */

export interface PerformanceMetric {
    name: string;
    value: number;
    unit: 'ms' | 'MB' | 'KB' | '%' | 'count';
    timestamp: number;
    category: 'render' | 'memory' | 'network' | 'bundle' | 'ai';
}

export interface PerformanceReport {
    timestamp: number;
    metrics: PerformanceMetric[];
    summary: {
        avgRenderTime: number;
        maxRenderTime: number;
        memoryUsage: number;
        bundleSize: number;
        aiLatency: number;
    };
}

class PerformanceMonitor {
    private metrics: PerformanceMetric[] = [];
    private marks: Map<string, number> = new Map();

    /**
     * Start a performance mark
     */
    mark(name: string): void {
        this.marks.set(name, performance.now());
    }

    /**
     * End a mark and record the duration
     */
    measure(name: string, category: PerformanceMetric['category'] = 'render'): number {
        const startTime = this.marks.get(name);
        if (!startTime) {
            console.warn(`[Perf] No mark found for: ${name}`);
            return 0;
        }

        const duration = performance.now() - startTime;
        this.record(name, duration, 'ms', category);
        this.marks.delete(name);

        return duration;
    }

    /**
     * Record a metric
     */
    record(
        name: string,
        value: number,
        unit: PerformanceMetric['unit'],
        category: PerformanceMetric['category']
    ): void {
        this.metrics.push({
            name,
            value,
            unit,
            timestamp: Date.now(),
            category,
        });

        // Keep last 1000 metrics
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }

    /**
     * Get memory usage (if available)
     */
    getMemoryUsage(): number {
        const memory = (performance as { memory?: { usedJSHeapSize: number } }).memory;
        if (memory) {
            return memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        return 0;
    }

    /**
     * Record memory snapshot
     */
    recordMemory(): void {
        const usage = this.getMemoryUsage();
        if (usage > 0) {
            this.record('heapSize', usage, 'MB', 'memory');
        }
    }

    /**
     * Record AI latency
     */
    recordAILatency(latency: number): void {
        this.record('aiLatency', latency, 'ms', 'ai');
    }

    /**
     * Get metrics by category
     */
    getByCategory(category: PerformanceMetric['category'], limit: number = 100): PerformanceMetric[] {
        return this.metrics
            .filter(m => m.category === category)
            .slice(-limit);
    }

    /**
     * Get recent metrics
     */
    getRecent(limit: number = 50): PerformanceMetric[] {
        return this.metrics.slice(-limit);
    }

    /**
     * Generate performance report
     */
    generateReport(): PerformanceReport {
        const renderMetrics = this.getByCategory('render');
        const memoryMetrics = this.getByCategory('memory');
        const aiMetrics = this.getByCategory('ai');

        return {
            timestamp: Date.now(),
            metrics: this.getRecent(100),
            summary: {
                avgRenderTime: average(renderMetrics.map(m => m.value)),
                maxRenderTime: Math.max(...renderMetrics.map(m => m.value), 0),
                memoryUsage: memoryMetrics.length > 0 ? memoryMetrics[memoryMetrics.length - 1].value : 0,
                bundleSize: 0, // Would be set from build
                aiLatency: average(aiMetrics.map(m => m.value)),
            },
        };
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics = [];
        this.marks.clear();
    }

    /**
     * Start monitoring frame rate
     */
    startFPSMonitor(): () => void {
        let frameCount = 0;
        let lastTime = performance.now();
        let running = true;

        const measureFPS = () => {
            if (!running) return;

            frameCount++;
            const currentTime = performance.now();

            if (currentTime - lastTime >= 1000) {
                this.record('fps', frameCount, 'count', 'render');
                frameCount = 0;
                lastTime = currentTime;
            }

            requestAnimationFrame(measureFPS);
        };

        requestAnimationFrame(measureFPS);

        return () => { running = false; };
    }
}

function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Performance timing decorator
 */
export function timed(category: PerformanceMetric['category'] = 'render') {
    return function (
        _target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: unknown[]) {
            perfMonitor.mark(propertyKey);
            const result = originalMethod.apply(this, args);

            if (result instanceof Promise) {
                return result.finally(() => {
                    perfMonitor.measure(propertyKey, category);
                });
            }

            perfMonitor.measure(propertyKey, category);
            return result;
        };

        return descriptor;
    };
}

/**
 * Warn if slow
 */
export function warnIfSlow(thresholdMs: number = 100) {
    return function (
        _target: object,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: unknown[]) {
            const start = performance.now();
            const result = originalMethod.apply(this, args);

            const checkDuration = () => {
                const duration = performance.now() - start;
                if (duration > thresholdMs) {
                    console.warn(`[Perf] ${propertyKey} took ${duration.toFixed(1)}ms (threshold: ${thresholdMs}ms)`);
                }
            };

            if (result instanceof Promise) {
                return result.finally(checkDuration);
            }

            checkDuration();
            return result;
        };

        return descriptor;
    };
}
