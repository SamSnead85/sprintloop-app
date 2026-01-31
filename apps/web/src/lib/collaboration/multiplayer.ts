/**
 * SprintLoop Multiplayer Collaboration System
 * 
 * Implements Zed-style peer-to-peer collaboration:
 * - Real-time multiplayer coding
 * - Encrypted connections
 * - Integrated chat
 * - Screen sharing
 * - AI as collaborative participant
 * - Async collaboration on branches
 */

import { create } from 'zustand'

// Collaborator information
export interface Collaborator {
    id: string
    name: string
    avatar?: string
    color: string
    cursor?: CursorPosition
    selection?: SelectionRange
    status: 'online' | 'away' | 'busy' | 'offline'
    isAI?: boolean
    joinedAt: number
    lastActiveAt: number
}

// Cursor position in editor
export interface CursorPosition {
    file: string
    line: number
    column: number
    timestamp: number
}

// Selection range
export interface SelectionRange {
    file: string
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
}

// Chat message
export interface ChatMessage {
    id: string
    authorId: string
    content: string
    timestamp: number
    type: 'text' | 'code' | 'link' | 'system'
    reactions?: { emoji: string; userId: string }[]
    replyTo?: string
}

// Shared document
export interface SharedDocument {
    id: string
    title: string
    content: string
    lastEditedBy: string
    lastEditedAt: number
    collaborators: string[]
}

// Screen share session
export interface ScreenShare {
    id: string
    hostId: string
    viewers: string[]
    startedAt: number
    isActive: boolean
}

// Collaboration session
export interface CollaborationSession {
    id: string
    name: string
    description?: string
    hostId: string
    collaborators: Collaborator[]
    createdAt: number
    shareLink?: string
    isPublic: boolean
    permissions: {
        canEdit: boolean
        canChat: boolean
        canScreenShare: boolean
        canInvite: boolean
    }
}

// Edit operation for CRDT-style collaboration
export interface EditOperation {
    id: string
    authorId: string
    file: string
    timestamp: number
    type: 'insert' | 'delete' | 'replace'
    position: { line: number; column: number }
    content?: string
    length?: number
}

// Predefined collaborator colors
const COLLABORATOR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
]

// Collaboration state
interface MultiplayerState {
    // Current session
    currentSession: CollaborationSession | null
    localUser: Collaborator | null

    // Collaborators
    collaborators: Collaborator[]

    // Chat
    messages: ChatMessage[]
    unreadCount: number

    // Shared documents
    sharedDocuments: SharedDocument[]

    // Screen sharing
    screenShare: ScreenShare | null

    // Edit operations (for sync)
    pendingOperations: EditOperation[]

    // Connection status
    isConnected: boolean
    connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected'

    // Actions
    createSession: (name: string, description?: string) => Promise<string>
    joinSession: (sessionId: string) => Promise<boolean>
    leaveSession: () => void

    // Collaborator management
    inviteCollaborator: (email: string) => Promise<boolean>
    removeCollaborator: (userId: string) => void
    updatePresence: (status: Collaborator['status']) => void

    // Cursor/Selection
    updateCursor: (position: CursorPosition) => void
    updateSelection: (selection: SelectionRange) => void
    getCollaboratorCursors: () => { collaborator: Collaborator; cursor: CursorPosition }[]

    // Chat
    sendMessage: (content: string, type?: ChatMessage['type']) => void
    reactToMessage: (messageId: string, emoji: string) => void
    markMessagesRead: () => void

    // Shared documents
    createSharedDocument: (title: string, content?: string) => string
    updateSharedDocument: (docId: string, content: string) => void
    deleteSharedDocument: (docId: string) => void

    // Screen sharing
    startScreenShare: () => Promise<boolean>
    stopScreenShare: () => void
    joinScreenShare: (shareId: string) => void

    // AI collaboration
    addAICollaborator: () => void
    removeAICollaborator: () => void

    // Sync operations
    broadcastOperation: (operation: EditOperation) => void
    applyRemoteOperation: (operation: EditOperation) => void
    getOperationsSince: (timestamp: number) => EditOperation[]

    // Session sharing
    getShareLink: () => string | null
    copyShareLink: () => Promise<boolean>
}

export const useMultiplayer = create<MultiplayerState>((set, get) => ({
    currentSession: null,
    localUser: null,
    collaborators: [],
    messages: [],
    unreadCount: 0,
    sharedDocuments: [],
    screenShare: null,
    pendingOperations: [],
    isConnected: false,
    connectionQuality: 'disconnected',

    createSession: async (name, description) => {
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        const userId = `user-${Date.now()}`

        const localUser: Collaborator = {
            id: userId,
            name: 'You',
            color: COLLABORATOR_COLORS[0],
            status: 'online',
            joinedAt: Date.now(),
            lastActiveAt: Date.now(),
        }

        const session: CollaborationSession = {
            id: sessionId,
            name,
            description,
            hostId: userId,
            collaborators: [localUser],
            createdAt: Date.now(),
            shareLink: `https://sprintloop.dev/collab/${sessionId}`,
            isPublic: false,
            permissions: {
                canEdit: true,
                canChat: true,
                canScreenShare: true,
                canInvite: true,
            },
        }

        set({
            currentSession: session,
            localUser,
            collaborators: [localUser],
            isConnected: true,
            connectionQuality: 'excellent',
        })

        // Add system message
        const systemMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            authorId: 'system',
            content: `Session "${name}" created. Share the link to invite collaborators.`,
            timestamp: Date.now(),
            type: 'system',
        }

        set(state => ({ messages: [...state.messages, systemMessage] }))

        return sessionId
    },

    joinSession: async (_sessionId) => {
        // In real implementation, this would connect to WebSocket server
        const userId = `user-${Date.now()}`
        const colorIndex = get().collaborators.length % COLLABORATOR_COLORS.length

        const localUser: Collaborator = {
            id: userId,
            name: 'Guest',
            color: COLLABORATOR_COLORS[colorIndex],
            status: 'online',
            joinedAt: Date.now(),
            lastActiveAt: Date.now(),
        }

        set(state => ({
            localUser,
            collaborators: [...state.collaborators, localUser],
            isConnected: true,
            connectionQuality: 'good',
        }))

        return true
    },

    leaveSession: () => {
        const { localUser, collaborators, currentSession } = get()

        if (localUser) {
            // Broadcast leave
            const systemMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                authorId: 'system',
                content: `${localUser.name} left the session`,
                timestamp: Date.now(),
                type: 'system',
            }

            set(state => ({
                messages: [...state.messages, systemMessage],
                collaborators: collaborators.filter(c => c.id !== localUser.id),
            }))
        }

        // If host, close session
        if (currentSession && localUser?.id === currentSession.hostId) {
            set({
                currentSession: null,
                localUser: null,
                collaborators: [],
                messages: [],
                sharedDocuments: [],
                screenShare: null,
                isConnected: false,
                connectionQuality: 'disconnected',
            })
        } else {
            set({
                localUser: null,
                isConnected: false,
                connectionQuality: 'disconnected',
            })
        }
    },

    inviteCollaborator: async (email) => {
        // Would send email invitation
        console.log(`Invitation sent to ${email}`)
        return true
    },

    removeCollaborator: (userId) => {
        set(state => ({
            collaborators: state.collaborators.filter(c => c.id !== userId),
        }))
    },

    updatePresence: (status) => {
        const { localUser } = get()

        if (localUser) {
            set(state => ({
                localUser: { ...localUser, status, lastActiveAt: Date.now() },
                collaborators: state.collaborators.map(c =>
                    c.id === localUser.id ? { ...c, status, lastActiveAt: Date.now() } : c
                ),
            }))
        }
    },

    updateCursor: (position) => {
        const { localUser } = get()

        if (localUser) {
            set(state => ({
                localUser: { ...localUser, cursor: position },
                collaborators: state.collaborators.map(c =>
                    c.id === localUser.id ? { ...c, cursor: position } : c
                ),
            }))
        }
    },

    updateSelection: (selection) => {
        const { localUser } = get()

        if (localUser) {
            set(state => ({
                localUser: { ...localUser, selection },
                collaborators: state.collaborators.map(c =>
                    c.id === localUser.id ? { ...c, selection } : c
                ),
            }))
        }
    },

    getCollaboratorCursors: () => {
        const { collaborators, localUser } = get()
        return collaborators
            .filter(c => c.id !== localUser?.id && c.cursor)
            .map(c => ({ collaborator: c, cursor: c.cursor! }))
    },

    sendMessage: (content, type = 'text') => {
        const { localUser } = get()

        if (!localUser) return

        const message: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            authorId: localUser.id,
            content,
            timestamp: Date.now(),
            type,
        }

        set(state => ({ messages: [...state.messages, message] }))
    },

    reactToMessage: (messageId, emoji) => {
        const { localUser } = get()

        if (!localUser) return

        set(state => ({
            messages: state.messages.map(m => {
                if (m.id === messageId) {
                    const reactions = m.reactions || []
                    const existingReaction = reactions.find(
                        r => r.emoji === emoji && r.userId === localUser.id
                    )

                    if (existingReaction) {
                        // Remove reaction
                        return {
                            ...m,
                            reactions: reactions.filter(r => r !== existingReaction),
                        }
                    }

                    // Add reaction
                    return {
                        ...m,
                        reactions: [...reactions, { emoji, userId: localUser.id }],
                    }
                }
                return m
            }),
        }))
    },

    markMessagesRead: () => set({ unreadCount: 0 }),

    createSharedDocument: (title, content = '') => {
        const { localUser } = get()

        const docId = `doc-${Date.now()}`
        const doc: SharedDocument = {
            id: docId,
            title,
            content,
            lastEditedBy: localUser?.id || 'unknown',
            lastEditedAt: Date.now(),
            collaborators: [localUser?.id || 'unknown'],
        }

        set(state => ({ sharedDocuments: [...state.sharedDocuments, doc] }))
        return docId
    },

    updateSharedDocument: (docId, content) => {
        const { localUser } = get()

        set(state => ({
            sharedDocuments: state.sharedDocuments.map(d =>
                d.id === docId
                    ? { ...d, content, lastEditedBy: localUser?.id || 'unknown', lastEditedAt: Date.now() }
                    : d
            ),
        }))
    },

    deleteSharedDocument: (docId) => {
        set(state => ({
            sharedDocuments: state.sharedDocuments.filter(d => d.id !== docId),
        }))
    },

    startScreenShare: async () => {
        const { localUser, currentSession } = get()

        if (!localUser || !currentSession) return false

        const share: ScreenShare = {
            id: `share-${Date.now()}`,
            hostId: localUser.id,
            viewers: [],
            startedAt: Date.now(),
            isActive: true,
        }

        set({ screenShare: share })

        // System message
        const systemMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            authorId: 'system',
            content: `${localUser.name} started sharing their screen`,
            timestamp: Date.now(),
            type: 'system',
        }

        set(state => ({ messages: [...state.messages, systemMessage] }))

        return true
    },

    stopScreenShare: () => {
        const { localUser } = get()

        set({ screenShare: null })

        if (localUser) {
            const systemMessage: ChatMessage = {
                id: `msg-${Date.now()}`,
                authorId: 'system',
                content: `${localUser.name} stopped sharing their screen`,
                timestamp: Date.now(),
                type: 'system',
            }

            set(state => ({ messages: [...state.messages, systemMessage] }))
        }
    },

    joinScreenShare: (shareId) => {
        const { localUser, screenShare } = get()

        if (!localUser || !screenShare || screenShare.id !== shareId) return

        set(state => ({
            screenShare: state.screenShare
                ? { ...state.screenShare, viewers: [...state.screenShare.viewers, localUser.id] }
                : null,
        }))
    },

    addAICollaborator: () => {
        const aiCollaborator: Collaborator = {
            id: 'ai-assistant',
            name: 'SprintLoop AI',
            avatar: '🤖',
            color: '#8B5CF6',
            status: 'online',
            isAI: true,
            joinedAt: Date.now(),
            lastActiveAt: Date.now(),
        }

        set(state => ({
            collaborators: [...state.collaborators.filter(c => !c.isAI), aiCollaborator],
        }))

        const systemMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            authorId: 'system',
            content: 'SprintLoop AI joined the session',
            timestamp: Date.now(),
            type: 'system',
        }

        set(state => ({ messages: [...state.messages, systemMessage] }))
    },

    removeAICollaborator: () => {
        set(state => ({
            collaborators: state.collaborators.filter(c => !c.isAI),
        }))
    },

    broadcastOperation: (operation) => {
        // In real implementation, this would broadcast via WebSocket
        set(state => ({
            pendingOperations: [...state.pendingOperations, operation],
        }))
    },

    applyRemoteOperation: (operation) => {
        // Apply operation from remote collaborator
        console.log('Applying remote operation:', operation)
    },

    getOperationsSince: (timestamp) => {
        return get().pendingOperations.filter(op => op.timestamp > timestamp)
    },

    getShareLink: () => get().currentSession?.shareLink || null,

    copyShareLink: async () => {
        const link = get().getShareLink()

        if (link && navigator.clipboard) {
            await navigator.clipboard.writeText(link)
            return true
        }

        return false
    },
}))
