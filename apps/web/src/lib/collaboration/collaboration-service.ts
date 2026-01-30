/**
 * Phase 201-250: Collaboration & Real-time Features
 * 
 * Multi-user collaboration infrastructure:
 * - Real-time cursors
 * - Shared editing sessions
 * - Comments & annotations
 * - Conflict resolution
 * - Presence indicators
 * - Activity feeds
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface Collaborator {
    id: string;
    name: string;
    color: string;
    avatar?: string;
    cursor?: { line: number; column: number };
    selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
    activeFile?: string;
    lastActive: Date;
    isOnline: boolean;
}

export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    file: string;
    line: number;
    createdAt: Date;
    updatedAt?: Date;
    resolved: boolean;
    replies: CommentReply[];
}

export interface CommentReply {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: Date;
}

export interface EditOperation {
    id: string;
    userId: string;
    type: 'insert' | 'delete' | 'replace';
    file: string;
    position: { line: number; column: number };
    content?: string;
    length?: number;
    timestamp: Date;
}

export interface CollaborationSession {
    id: string;
    name: string;
    hostId: string;
    collaborators: Collaborator[];
    createdAt: Date;
    isActive: boolean;
    accessType: 'read' | 'write';
}

export interface ActivityEvent {
    id: string;
    userId: string;
    userName: string;
    type: 'join' | 'leave' | 'edit' | 'comment' | 'cursor';
    file?: string;
    message: string;
    timestamp: Date;
}

export interface CollaborationState {
    session: CollaborationSession | null;
    collaborators: Collaborator[];
    comments: Comment[];
    pendingOperations: EditOperation[];
    activityFeed: ActivityEvent[];
    isConnected: boolean;

    // Session management
    createSession: (name: string) => string;
    joinSession: (sessionId: string) => Promise<void>;
    leaveSession: () => void;
    inviteCollaborator: (email: string) => void;

    // Cursor & presence
    updateCursor: (line: number, column: number) => void;
    updateSelection: (start: { line: number; column: number }, end: { line: number; column: number }) => void;

    // Comments
    addComment: (file: string, line: number, content: string) => string;
    replyToComment: (commentId: string, content: string) => void;
    resolveComment: (commentId: string) => void;
    deleteComment: (commentId: string) => void;

    // Operations
    applyOperation: (operation: EditOperation) => void;
    getCollaboratorById: (id: string) => Collaborator | undefined;
}

// =============================================================================
// STORE
// =============================================================================

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const useCollaborationService = create<CollaborationState>((set, get) => ({
    session: null,
    collaborators: [],
    comments: [],
    pendingOperations: [],
    activityFeed: [],
    isConnected: false,

    createSession: (name) => {
        const sessionId = `session_${Date.now()}`;
        const session: CollaborationSession = {
            id: sessionId,
            name,
            hostId: 'current_user',
            collaborators: [],
            createdAt: new Date(),
            isActive: true,
            accessType: 'write',
        };
        set({ session, isConnected: true });
        return sessionId;
    },

    joinSession: async (_sessionId) => {
        await new Promise(r => setTimeout(r, 500));
        // Would connect to collaboration server
        set({ isConnected: true });
    },

    leaveSession: () => {
        set({ session: null, collaborators: [], isConnected: false });
    },

    inviteCollaborator: (email) => {
        const newCollab: Collaborator = {
            id: `collab_${Date.now()}`,
            name: email.split('@')[0],
            color: COLORS[get().collaborators.length % COLORS.length],
            lastActive: new Date(),
            isOnline: false,
        };
        set(state => ({ collaborators: [...state.collaborators, newCollab] }));
    },

    updateCursor: (_line, _column) => {
        // Would broadcast cursor position to other collaborators
    },

    updateSelection: (_start, _end) => {
        // Would broadcast selection to other collaborators
    },

    addComment: (file, line, content) => {
        const id = `comment_${Date.now()}`;
        const comment: Comment = {
            id,
            authorId: 'current_user',
            authorName: 'You',
            content,
            file,
            line,
            createdAt: new Date(),
            resolved: false,
            replies: [],
        };
        set(state => ({ comments: [...state.comments, comment] }));
        return id;
    },

    replyToComment: (commentId, content) => {
        const reply: CommentReply = {
            id: `reply_${Date.now()}`,
            authorId: 'current_user',
            authorName: 'You',
            content,
            createdAt: new Date(),
        };
        set(state => ({
            comments: state.comments.map(c =>
                c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
            ),
        }));
    },

    resolveComment: (commentId) => {
        set(state => ({
            comments: state.comments.map(c =>
                c.id === commentId ? { ...c, resolved: true } : c
            ),
        }));
    },

    deleteComment: (commentId) => {
        set(state => ({
            comments: state.comments.filter(c => c.id !== commentId),
        }));
    },

    applyOperation: (operation) => {
        set(state => ({
            pendingOperations: [...state.pendingOperations, operation],
        }));
    },

    getCollaboratorById: (id) => get().collaborators.find(c => c.id === id),
}));
