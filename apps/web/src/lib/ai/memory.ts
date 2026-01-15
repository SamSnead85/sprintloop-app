/**
 * Conversation Memory
 * 
 * Phase 12: Persistent chat history with IndexedDB
 * - Store conversations locally
 * - Cross-session context recall
 * - Search through history
 */

import { openDB, type IDBPDatabase } from 'idb';

export interface StoredMessage {
    id: string;
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    modelId?: string;
    tokens?: number;
    timestamp: number;
}

export interface StoredConversation {
    id: string;
    title: string;
    modelId: string;
    projectPath?: string;
    createdAt: number;
    updatedAt: number;
    messageCount: number;
    summary?: string;
}

const DB_NAME = 'sprintloop-memory';
const DB_VERSION = 1;

let db: IDBPDatabase | null = null;

/**
 * Initialize the database
 */
async function initDB(): Promise<IDBPDatabase> {
    if (db) return db;

    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(database) {
            // Conversations store
            if (!database.objectStoreNames.contains('conversations')) {
                const convStore = database.createObjectStore('conversations', { keyPath: 'id' });
                convStore.createIndex('updatedAt', 'updatedAt');
                convStore.createIndex('projectPath', 'projectPath');
            }

            // Messages store
            if (!database.objectStoreNames.contains('messages')) {
                const msgStore = database.createObjectStore('messages', { keyPath: 'id' });
                msgStore.createIndex('conversationId', 'conversationId');
                msgStore.createIndex('timestamp', 'timestamp');
            }
        },
    });

    return db;
}

/**
 * Create a new conversation
 */
export async function createConversation(
    title: string,
    modelId: string,
    projectPath?: string
): Promise<StoredConversation> {
    const database = await initDB();

    const conversation: StoredConversation = {
        id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title,
        modelId,
        projectPath,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messageCount: 0,
    };

    await database.put('conversations', conversation);
    return conversation;
}

/**
 * Update conversation
 */
export async function updateConversation(
    id: string,
    updates: Partial<StoredConversation>
): Promise<void> {
    const database = await initDB();
    const conversation = await database.get('conversations', id);

    if (conversation) {
        await database.put('conversations', {
            ...conversation,
            ...updates,
            updatedAt: Date.now(),
        });
    }
}

/**
 * Get a conversation by ID
 */
export async function getConversation(id: string): Promise<StoredConversation | undefined> {
    const database = await initDB();
    return database.get('conversations', id);
}

/**
 * Get all conversations, sorted by most recent
 */
export async function getAllConversations(limit: number = 50): Promise<StoredConversation[]> {
    const database = await initDB();
    const all = await database.getAllFromIndex('conversations', 'updatedAt');
    return all.reverse().slice(0, limit);
}

/**
 * Get conversations for a project
 */
export async function getProjectConversations(projectPath: string): Promise<StoredConversation[]> {
    const database = await initDB();
    const all = await database.getAllFromIndex('conversations', 'projectPath', projectPath);
    return all.reverse();
}

/**
 * Delete a conversation and its messages
 */
export async function deleteConversation(id: string): Promise<void> {
    const database = await initDB();

    // Delete messages
    const messages = await database.getAllFromIndex('messages', 'conversationId', id);
    const tx = database.transaction('messages', 'readwrite');
    for (const msg of messages) {
        await tx.store.delete(msg.id);
    }
    await tx.done;

    // Delete conversation
    await database.delete('conversations', id);
}

/**
 * Add a message to a conversation
 */
export async function addMessage(
    conversationId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    modelId?: string,
    tokens?: number
): Promise<StoredMessage> {
    const database = await initDB();

    const message: StoredMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        conversationId,
        role,
        content,
        modelId,
        tokens,
        timestamp: Date.now(),
    };

    await database.put('messages', message);

    // Update conversation
    const conversation = await database.get('conversations', conversationId);
    if (conversation) {
        conversation.messageCount++;
        conversation.updatedAt = Date.now();
        await database.put('conversations', conversation);
    }

    return message;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
    conversationId: string
): Promise<StoredMessage[]> {
    const database = await initDB();
    const messages = await database.getAllFromIndex('messages', 'conversationId', conversationId) as StoredMessage[];
    return messages.sort((a: StoredMessage, b: StoredMessage) => a.timestamp - b.timestamp);
}

/**
 * Search messages by content
 */
export async function searchMessages(
    query: string,
    limit: number = 20
): Promise<StoredMessage[]> {
    const database = await initDB();
    const all = await database.getAll('messages');

    const queryLower = query.toLowerCase();
    const matches = (all as StoredMessage[])
        .filter((msg: StoredMessage) => msg.content.toLowerCase().includes(queryLower))
        .sort((a: StoredMessage, b: StoredMessage) => b.timestamp - a.timestamp)
        .slice(0, limit);

    return matches;
}

/**
 * Get recent context for a new conversation (cross-session recall)
 */
export async function getRecentContext(
    projectPath?: string,
    messageLimit: number = 10
): Promise<{ conversation: StoredConversation; messages: StoredMessage[] }[]> {
    await initDB();

    // Get recent conversations
    let conversations: StoredConversation[];
    if (projectPath) {
        conversations = await getProjectConversations(projectPath);
    } else {
        conversations = await getAllConversations(5);
    }

    const result = [];
    for (const conv of conversations.slice(0, 3)) {
        const messages = await getConversationMessages(conv.id);
        result.push({
            conversation: conv,
            messages: messages.slice(-messageLimit),
        });
    }

    return result;
}

/**
 * Clear all conversation data
 */
export async function clearAllConversations(): Promise<void> {
    const database = await initDB();
    await database.clear('conversations');
    await database.clear('messages');
}

/**
 * Get storage stats
 */
export async function getStorageStats(): Promise<{
    conversationCount: number;
    messageCount: number;
    oldestConversation?: Date;
}> {
    const database = await initDB();

    const conversations = await database.getAll('conversations') as StoredConversation[];
    const messages = await database.getAll('messages') as StoredMessage[];

    const oldest = conversations.reduce((min: number, c: StoredConversation) =>
        c.createdAt < min ? c.createdAt : min,
        Date.now()
    );

    return {
        conversationCount: conversations.length,
        messageCount: messages.length,
        oldestConversation: conversations.length > 0 ? new Date(oldest) : undefined,
    };
}
