/**
 * SprintLoop Session Manager
 * 
 * Manages chat sessions, project context, and conversation history
 * Ported from OpenCode's session management
 */

import { getModel } from '../ai/provider';

// Session types
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    timestamp: number;
    metadata?: {
        model?: string;
        toolCalls?: ToolCall[];
        tokens?: {
            input: number;
            output: number;
        };
        cost?: number;
    };
}

export interface ToolCall {
    id: string;
    name: string;
    arguments: Record<string, unknown>;
    result?: {
        success: boolean;
        output: string;
        error?: string;
    };
}

export interface Session {
    id: string;
    name: string;
    projectPath: string;
    modelId: string;
    messages: ChatMessage[];
    createdAt: number;
    updatedAt: number;
    totalTokens: number;
    totalCost: number;
}

// Session store (in-memory, could be persisted to localStorage/IndexedDB)
const sessions = new Map<string, Session>();
let activeSessionId: string | null = null;

/**
 * Generate a unique ID
 */
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new session
 */
export function createSession(
    projectPath: string,
    modelId: string,
    name?: string
): Session {
    const session: Session = {
        id: generateId(),
        name: name ?? `Session ${sessions.size + 1}`,
        projectPath,
        modelId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalTokens: 0,
        totalCost: 0,
    };

    sessions.set(session.id, session);
    activeSessionId = session.id;
    persistSessions();

    return session;
}

/**
 * Get the active session
 */
export function getActiveSession(): Session | null {
    if (!activeSessionId) return null;
    return sessions.get(activeSessionId) ?? null;
}

/**
 * Set the active session
 */
export function setActiveSession(sessionId: string): boolean {
    if (sessions.has(sessionId)) {
        activeSessionId = sessionId;
        return true;
    }
    return false;
}

/**
 * Get a session by ID
 */
export function getSession(sessionId: string): Session | undefined {
    return sessions.get(sessionId);
}

/**
 * Get all sessions
 */
export function getAllSessions(): Session[] {
    return Array.from(sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Add a message to a session
 */
export function addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const session = sessions.get(sessionId);
    if (!session) {
        throw new Error(`Session ${sessionId} not found`);
    }

    const fullMessage: ChatMessage = {
        ...message,
        id: generateId(),
        timestamp: Date.now(),
    };

    session.messages.push(fullMessage);
    session.updatedAt = Date.now();

    // Update token/cost tracking
    if (fullMessage.metadata?.tokens) {
        session.totalTokens += fullMessage.metadata.tokens.input + fullMessage.metadata.tokens.output;
    }
    if (fullMessage.metadata?.cost) {
        session.totalCost += fullMessage.metadata.cost;
    }

    persistSessions();
    return fullMessage;
}

/**
 * Get recent messages from a session (for context window)
 */
export function getRecentMessages(
    sessionId: string,
    maxMessages?: number,
    maxTokens?: number
): ChatMessage[] {
    const session = sessions.get(sessionId);
    if (!session) return [];

    let messages = session.messages.slice();

    // Filter by max messages
    if (maxMessages) {
        messages = messages.slice(-maxMessages);
    }

    // Filter by max tokens (approximate)
    if (maxTokens) {
        let tokenCount = 0;
        const filtered: ChatMessage[] = [];

        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            const estimatedTokens = Math.ceil(msg.content.length / 4);

            if (tokenCount + estimatedTokens > maxTokens) break;

            tokenCount += estimatedTokens;
            filtered.unshift(msg);
        }

        return filtered;
    }

    return messages;
}

/**
 * Delete a session
 */
export function deleteSession(sessionId: string): boolean {
    const deleted = sessions.delete(sessionId);
    if (activeSessionId === sessionId) {
        const remaining = getAllSessions();
        activeSessionId = remaining.length > 0 ? remaining[0].id : null;
    }
    persistSessions();
    return deleted;
}

/**
 * Clear all messages in a session
 */
export function clearSession(sessionId: string): boolean {
    const session = sessions.get(sessionId);
    if (!session) return false;

    session.messages = [];
    session.totalTokens = 0;
    session.totalCost = 0;
    session.updatedAt = Date.now();
    persistSessions();
    return true;
}

/**
 * Persist sessions to localStorage
 */
function persistSessions(): void {
    if (typeof localStorage === 'undefined') return;

    try {
        const data = {
            sessions: Array.from(sessions.entries()),
            activeSessionId,
        };
        localStorage.setItem('sprintloop_sessions', JSON.stringify(data));
    } catch {
        console.warn('[Session] Failed to persist sessions');
    }
}

/**
 * Load sessions from localStorage
 */
export function loadSessions(): void {
    if (typeof localStorage === 'undefined') return;

    try {
        const stored = localStorage.getItem('sprintloop_sessions');
        if (stored) {
            const data = JSON.parse(stored);
            sessions.clear();
            for (const [id, session] of data.sessions) {
                sessions.set(id, session);
            }
            activeSessionId = data.activeSessionId;
        }
    } catch {
        console.warn('[Session] Failed to load sessions');
    }
}

/**
 * Calculate estimated cost for a message
 */
export function calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const model = getModel(modelId);
    if (!model) return 0;

    return (
        (inputTokens / 1000) * model.costPer1kInput +
        (outputTokens / 1000) * model.costPer1kOutput
    );
}

// Initialize sessions on module load
loadSessions();
