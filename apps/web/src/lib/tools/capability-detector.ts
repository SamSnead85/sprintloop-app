/**
 * Platform Capability Detection
 * 
 * Detects whether we're running in Tauri (desktop) or browser (web)
 * and provides capability-based tool availability
 */

// Platform types
export type Platform = 'desktop' | 'web';

// Capability definitions
export interface PlatformCapabilities {
    fileSystem: {
        read: boolean;
        write: boolean;
        watch: boolean;
    };
    shell: {
        execute: boolean;
        interactive: boolean;
    };
    git: {
        available: boolean;
    };
    network: {
        fetch: boolean;
        websocket: boolean;
    };
    system: {
        notifications: boolean;
        clipboard: boolean;
        dialog: boolean;
    };
}

// Tool requirement types
export type CapabilityRequirement =
    | 'fileSystem.read'
    | 'fileSystem.write'
    | 'fileSystem.watch'
    | 'shell.execute'
    | 'shell.interactive'
    | 'git.available'
    | 'network.fetch'
    | 'network.websocket'
    | 'system.notifications'
    | 'system.clipboard'
    | 'system.dialog';

/**
 * Check if running in Tauri desktop environment
 */
export function isPlatformDesktop(): boolean {
    return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Get current platform
 */
export function getPlatform(): Platform {
    return isPlatformDesktop() ? 'desktop' : 'web';
}

/**
 * Get capabilities for current platform
 */
export function getPlatformCapabilities(): PlatformCapabilities {
    const isDesktop = isPlatformDesktop();

    return {
        fileSystem: {
            read: isDesktop,      // Only desktop can read local files
            write: isDesktop,     // Only desktop can write local files
            watch: isDesktop,     // Only desktop can watch file changes
        },
        shell: {
            execute: isDesktop,   // Only desktop can run shell commands
            interactive: isDesktop, // Only desktop has interactive terminals
        },
        git: {
            available: isDesktop, // Only desktop can use git CLI
        },
        network: {
            fetch: true,          // Both can make HTTP requests
            websocket: true,      // Both can use WebSockets
        },
        system: {
            notifications: true,  // Both support notifications (different APIs)
            clipboard: true,      // Both support clipboard
            dialog: isDesktop,    // Only desktop has native dialogs
        },
    };
}

/**
 * Check if a specific capability is available
 */
export function hasCapability(requirement: CapabilityRequirement): boolean {
    const capabilities = getPlatformCapabilities();
    const [category, feature] = requirement.split('.') as [keyof PlatformCapabilities, string];

    const categoryCapabilities = capabilities[category];
    if (!categoryCapabilities) return false;

    return (categoryCapabilities as Record<string, boolean>)[feature] ?? false;
}

/**
 * Check if a tool can be executed based on its requirements
 */
export function canExecuteTool(requirements: CapabilityRequirement[]): {
    canExecute: boolean;
    missingCapabilities: CapabilityRequirement[];
    suggestions: string[];
} {
    const missing: CapabilityRequirement[] = [];
    const suggestions: string[] = [];

    for (const req of requirements) {
        if (!hasCapability(req)) {
            missing.push(req);
            suggestions.push(getSuggestionForMissingCapability(req));
        }
    }

    return {
        canExecute: missing.length === 0,
        missingCapabilities: missing,
        suggestions: suggestions.filter(Boolean),
    };
}

/**
 * Get alternative suggestion when a capability is missing
 */
function getSuggestionForMissingCapability(requirement: CapabilityRequirement): string {
    const suggestions: Record<CapabilityRequirement, string> = {
        'fileSystem.read': 'Use the file upload feature or connect to a remote workspace',
        'fileSystem.write': 'Download the generated file or use the SprintLoop desktop app',
        'fileSystem.watch': 'Manually refresh to see changes or use the desktop app',
        'shell.execute': 'Use the SprintLoop desktop app for shell access',
        'shell.interactive': 'Use the SprintLoop desktop app for terminal access',
        'git.available': 'Use the GitHub integration or the desktop app for git operations',
        'network.fetch': 'Check your network connection',
        'network.websocket': 'WebSocket connections are not available',
        'system.notifications': 'Enable browser notifications in settings',
        'system.clipboard': 'Clipboard access requires user permission',
        'system.dialog': 'Use browser file picker or the desktop app',
    };

    return suggestions[requirement] || '';
}

/**
 * Decorator for tools that require specific capabilities
 */
export function requiresCapabilities(requirements: CapabilityRequirement[]) {
    return function <T extends (...args: unknown[]) => Promise<unknown>>(
        target: T
    ): T {
        return (async function (...args: unknown[]) {
            const { canExecute, missingCapabilities, suggestions } = canExecuteTool(requirements);

            if (!canExecute) {
                const platform = getPlatform();
                throw new ToolCapabilityError(
                    `This action is not available in ${platform} mode`,
                    missingCapabilities,
                    suggestions
                );
            }

            return target(...args);
        }) as T;
    };
}

/**
 * Error class for capability-related failures
 */
export class ToolCapabilityError extends Error {
    constructor(
        message: string,
        public readonly missingCapabilities: CapabilityRequirement[],
        public readonly suggestions: string[]
    ) {
        super(message);
        this.name = 'ToolCapabilityError';
    }
}

/**
 * Get a user-friendly description of the current platform
 */
export function getPlatformDescription(): string {
    const platform = getPlatform();
    const capabilities = getPlatformCapabilities();

    if (platform === 'desktop') {
        return 'SprintLoop Desktop - Full local development capabilities';
    }

    const availableFeatures: string[] = [];
    if (capabilities.network.fetch) availableFeatures.push('API access');
    if (capabilities.network.websocket) availableFeatures.push('real-time sync');
    if (capabilities.system.clipboard) availableFeatures.push('clipboard');

    return `SprintLoop Web - ${availableFeatures.join(', ')}. For full capabilities, use the desktop app.`;
}
