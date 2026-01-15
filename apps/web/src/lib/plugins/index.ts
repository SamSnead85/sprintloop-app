/**
 * SprintLoop Plugin System
 * 
 * Unified interface for AI coding assistants and agents.
 */

// Core types
export * from './types';

// Plugin implementations
export { ContinuePlugin, createContinuePlugin, type ContinueConfig } from './continue';
export { ClinePlugin, createClinePlugin, type ClineConfig } from './cline';
export { OpenHandsPlugin, createOpenHandsPlugin, type OpenHandsConfig } from './openhands';
export { TabbyPlugin, createTabbyPlugin, type TabbyConfig } from './tabby';

// Plugin initialization helper
import { pluginRegistry } from './types';
import { createContinuePlugin } from './continue';
import { createClinePlugin } from './cline';
import { createOpenHandsPlugin } from './openhands';
import { createTabbyPlugin } from './tabby';

export function initializeDefaultPlugins(): void {
    // Register all default plugins
    pluginRegistry.register(createContinuePlugin());
    pluginRegistry.register(createClinePlugin());
    pluginRegistry.register(createOpenHandsPlugin());
    pluginRegistry.register(createTabbyPlugin());

    console.log('[Plugins] Registered:', pluginRegistry.getAll().map(p => p.name).join(', '));
}
