/**
 * SprintLoop Real-Time Collaboration System
 * 
 * Phase 801-850: Collaborative features
 * - Presence indicators
 * - Cursor sharing
 * - Live edits
 * - User avatars
 * - Session management
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { Users, Circle, MessageSquare, Eye, Edit3, Clock, UserPlus, X } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface Collaborator {
    id: string
    name: string
    email: string
    avatar?: string
    color: string
    status: 'online' | 'away' | 'busy' | 'offline'
    lastSeen?: Date
    currentFile?: string
    cursorPosition?: {
        line: number
        column: number
        selection?: {
            startLine: number
            endLine: number
            startColumn: number
            endColumn: number
        }
    }
}

interface CollaborationSession {
    id: string
    name: string
    createdBy: string
    createdAt: Date
    participants: Collaborator[]
    isHost: boolean
}

interface CollaborationContextValue {
    session: CollaborationSession | null
    collaborators: Collaborator[]
    currentUser: Collaborator | null
    startSession: (name?: string) => Promise<void>
    joinSession: (sessionId: string) => Promise<void>
    leaveSession: () => void
    inviteUser: (email: string) => Promise<void>
    updateStatus: (status: Collaborator['status']) => void
    updateCursor: (position: Collaborator['cursorPosition']) => void
    updateCurrentFile: (file: string) => void
}

// ============================================================================
// COLORS FOR COLLABORATORS
// ============================================================================

const collaboratorColors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#22c55e', // green
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
]

function getCollaboratorColor(index: number): string {
    return collaboratorColors[index % collaboratorColors.length]
}

// ============================================================================
// CONTEXT
// ============================================================================

const CollaborationContext = createContext<CollaborationContextValue | null>(null)

export function useCollaboration() {
    const context = useContext(CollaborationContext)
    if (!context) throw new Error('useCollaboration must be used within CollaborationProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface CollaborationProviderProps {
    children: React.ReactNode
    userId?: string
    userName?: string
    userEmail?: string
    userAvatar?: string
}

export function CollaborationProvider({
    children,
    userId = 'user-1',
    userName = 'Current User',
    userEmail = 'user@example.com',
    userAvatar,
}: CollaborationProviderProps) {
    const [session, setSession] = useState<CollaborationSession | null>(null)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])

    const currentUser: Collaborator = {
        id: userId,
        name: userName,
        email: userEmail,
        avatar: userAvatar,
        color: collaboratorColors[0],
        status: 'online',
    }

    // Simulated session management (replace with real WebSocket/WebRTC)
    const startSession = useCallback(async (name?: string) => {
        const sessionId = `session-${Date.now()}`
        setSession({
            id: sessionId,
            name: name || 'Untitled Session',
            createdBy: userId,
            createdAt: new Date(),
            participants: [currentUser],
            isHost: true,
        })

        // In real implementation, connect to collaboration server
        console.log('Started collaboration session:', sessionId)
    }, [userId, currentUser])

    const joinSession = useCallback(async (sessionId: string) => {
        // In real implementation, connect to existing session
        setSession({
            id: sessionId,
            name: 'Joined Session',
            createdBy: 'host-user',
            createdAt: new Date(),
            participants: [currentUser],
            isHost: false,
        })

        console.log('Joined collaboration session:', sessionId)
    }, [currentUser])

    const leaveSession = useCallback(() => {
        setSession(null)
        setCollaborators([])
        console.log('Left collaboration session')
    }, [])

    const inviteUser = useCallback(async (email: string) => {
        // In real implementation, send invitation
        console.log('Invited user:', email)
    }, [])

    const updateStatus = useCallback((status: Collaborator['status']) => {
        // Broadcast status update
        console.log('Status updated:', status)
    }, [])

    const updateCursor = useCallback((position: Collaborator['cursorPosition']) => {
        // Broadcast cursor position
    }, [])

    const updateCurrentFile = useCallback((file: string) => {
        // Broadcast current file
    }, [])

    // Simulate other collaborators joining (for demo)
    useEffect(() => {
        if (!session) return

        const demoCollaborators: Collaborator[] = [
            {
                id: 'user-2',
                name: 'Alice Chen',
                email: 'alice@example.com',
                color: collaboratorColors[1],
                status: 'online',
                currentFile: 'src/App.tsx',
                cursorPosition: { line: 42, column: 15 },
            },
            {
                id: 'user-3',
                name: 'Bob Smith',
                email: 'bob@example.com',
                color: collaboratorColors[2],
                status: 'away',
                lastSeen: new Date(Date.now() - 5 * 60 * 1000),
                currentFile: 'src/components/Editor.tsx',
            },
        ]

        const timer = setTimeout(() => {
            setCollaborators(demoCollaborators)
        }, 1000)

        return () => clearTimeout(timer)
    }, [session])

    return (
        <CollaborationContext.Provider
            value={{
                session,
                collaborators,
                currentUser,
                startSession,
                joinSession,
                leaveSession,
                inviteUser,
                updateStatus,
                updateCursor,
                updateCurrentFile,
            }}
        >
            {children}
        </CollaborationContext.Provider>
    )
}

// ============================================================================
// PRESENCE INDICATOR
// ============================================================================

interface PresenceIndicatorProps {
    status: Collaborator['status']
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function PresenceIndicator({
    status,
    size = 'md',
    className = '',
}: PresenceIndicatorProps) {
    const sizes = {
        sm: 'w-2 h-2',
        md: 'w-2.5 h-2.5',
        lg: 'w-3 h-3',
    }

    const colors = {
        online: 'bg-green-500',
        away: 'bg-yellow-500',
        busy: 'bg-red-500',
        offline: 'bg-gray-500',
    }

    return (
        <div
            className={`
                rounded-full ${sizes[size]} ${colors[status]}
                ${status === 'online' ? 'animate-pulse' : ''}
                ${className}
            `}
        />
    )
}

// ============================================================================
// USER AVATAR
// ============================================================================

interface CollaboratorAvatarProps {
    collaborator: Collaborator
    size?: 'sm' | 'md' | 'lg'
    showPresence?: boolean
    showTooltip?: boolean
    className?: string
}

export function CollaboratorAvatar({
    collaborator,
    size = 'md',
    showPresence = true,
    showTooltip = true,
    className = '',
}: CollaboratorAvatarProps) {
    const [isHovered, setIsHovered] = useState(false)

    const sizes = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    }

    const presencePos = {
        sm: '-bottom-0.5 -right-0.5',
        md: '-bottom-0.5 -right-0.5',
        lg: '-bottom-1 -right-1',
    }

    const initials = collaborator.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div
            className={`relative ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {collaborator.avatar ? (
                <img
                    src={collaborator.avatar}
                    alt={collaborator.name}
                    className={`${sizes[size]} rounded-full object-cover ring-2`}
                    style={{ borderColor: collaborator.color }}
                />
            ) : (
                <div
                    className={`
                        ${sizes[size]} rounded-full flex items-center justify-center
                        font-medium text-white ring-2
                    `}
                    style={{
                        backgroundColor: collaborator.color,
                        borderColor: collaborator.color,
                    }}
                >
                    {initials}
                </div>
            )}

            {showPresence && (
                <div className={`absolute ${presencePos[size]}`}>
                    <PresenceIndicator status={collaborator.status} size={size === 'lg' ? 'md' : 'sm'} />
                </div>
            )}

            {showTooltip && isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 rounded-lg shadow-lg whitespace-nowrap z-10">
                    <div className="text-sm text-white font-medium">{collaborator.name}</div>
                    <div className="text-xs text-gray-400">{collaborator.status}</div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// COLLABORATOR LIST
// ============================================================================

interface CollaboratorListProps {
    showCurrentFile?: boolean
    compact?: boolean
    className?: string
}

export function CollaboratorList({
    showCurrentFile = true,
    compact = false,
    className = '',
}: CollaboratorListProps) {
    const { collaborators, currentUser, session } = useCollaboration()

    if (!session) return null

    const allUsers = [currentUser, ...collaborators]

    if (compact) {
        return (
            <div className={`flex items-center -space-x-2 ${className}`}>
                {allUsers.slice(0, 5).map((user, i) => (
                    <CollaboratorAvatar
                        key={user.id}
                        collaborator={user}
                        size="sm"
                        className="ring-2 ring-slate-900"
                    />
                ))}
                {allUsers.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white ring-2 ring-slate-900">
                        +{allUsers.length - 5}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {allUsers.map(user => (
                <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <CollaboratorAvatar collaborator={user} size="md" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                                {user.name}
                            </span>
                            {user.id === currentUser.id && (
                                <span className="text-xs text-gray-500">(you)</span>
                            )}
                        </div>
                        {showCurrentFile && user.currentFile && (
                            <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <Edit3 className="w-3 h-3" />
                                {user.currentFile}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// CURSOR OVERLAY
// ============================================================================

interface RemoteCursor {
    collaborator: Collaborator
    x: number
    y: number
}

interface CursorOverlayProps {
    cursors: RemoteCursor[]
    className?: string
}

export function CursorOverlay({ cursors, className = '' }: CursorOverlayProps) {
    return (
        <div className={`absolute inset-0 pointer-events-none z-50 ${className}`}>
            {cursors.map(cursor => (
                <div
                    key={cursor.collaborator.id}
                    className="absolute transition-all duration-75"
                    style={{
                        left: cursor.x,
                        top: cursor.y,
                    }}
                >
                    {/* Cursor */}
                    <svg
                        width="16"
                        height="18"
                        viewBox="0 0 16 18"
                        fill="none"
                        className="drop-shadow-lg"
                    >
                        <path
                            d="M1 1L1 16.5L5 12.5L9 17.5L11 16L7 11L13 11L1 1Z"
                            fill={cursor.collaborator.color}
                            stroke="white"
                            strokeWidth="1.5"
                        />
                    </svg>

                    {/* Name tag */}
                    <div
                        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap"
                        style={{ backgroundColor: cursor.collaborator.color }}
                    >
                        {cursor.collaborator.name}
                    </div>
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// SELECTION HIGHLIGHT
// ============================================================================

interface SelectionHighlight {
    collaborator: Collaborator
    startLine: number
    endLine: number
    lineHeight: number
}

interface SelectionOverlayProps {
    selections: SelectionHighlight[]
    className?: string
}

export function SelectionOverlay({ selections, className = '' }: SelectionOverlayProps) {
    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            {selections.map((selection, i) => (
                <div
                    key={`${selection.collaborator.id}-${i}`}
                    className="absolute left-0 right-0"
                    style={{
                        top: selection.startLine * selection.lineHeight,
                        height: (selection.endLine - selection.startLine + 1) * selection.lineHeight,
                        backgroundColor: `${selection.collaborator.color}20`,
                        borderLeft: `2px solid ${selection.collaborator.color}`,
                    }}
                />
            ))}
        </div>
    )
}

// ============================================================================
// COLLABORATION TOOLBAR
// ============================================================================

interface CollaborationToolbarProps {
    className?: string
}

export function CollaborationToolbar({ className = '' }: CollaborationToolbarProps) {
    const {
        session,
        collaborators,
        currentUser,
        startSession,
        leaveSession,
        updateStatus,
    } = useCollaboration()

    const [showInvite, setShowInvite] = useState(false)
    const [showStatusMenu, setShowStatusMenu] = useState(false)

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {session ? (
                <>
                    {/* Collaborator avatars */}
                    <CollaboratorList compact />

                    {/* Session info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Circle className="w-2 h-2 text-green-500 fill-current animate-pulse" />
                        <span>{collaborators.length + 1} users</span>
                    </div>

                    {/* Actions */}
                    <button
                        onClick={() => setShowInvite(true)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        title="Invite"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>

                    <button
                        onClick={leaveSession}
                        className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        Leave
                    </button>
                </>
            ) : (
                <button
                    onClick={() => startSession()}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors"
                >
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-medium">Start Session</span>
                </button>
            )}

            {/* Invite modal */}
            {showInvite && (
                <InviteModal onClose={() => setShowInvite(false)} />
            )}
        </div>
    )
}

// ============================================================================
// INVITE MODAL
// ============================================================================

interface InviteModalProps {
    onClose: () => void
}

function InviteModal({ onClose }: InviteModalProps) {
    const { session, inviteUser } = useCollaboration()
    const [email, setEmail] = useState('')
    const [isSending, setIsSending] = useState(false)

    const handleInvite = async () => {
        if (!email.trim()) return

        setIsSending(true)
        try {
            await inviteUser(email)
            setEmail('')
        } finally {
            setIsSending(false)
        }
    }

    if (!session) return null

    const shareLink = `${window.location.origin}/join/${session.id}`

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Invite Collaborators</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Share link */}
                <div className="mb-6">
                    <label className="block text-sm text-gray-400 mb-2">Share link</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={shareLink}
                            readOnly
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                        <button
                            onClick={() => navigator.clipboard.writeText(shareLink)}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 transition-colors text-sm"
                        >
                            Copy
                        </button>
                    </div>
                </div>

                {/* Email invite */}
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Invite by email</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500"
                        />
                        <button
                            onClick={handleInvite}
                            disabled={!email.trim() || isSending}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                        >
                            {isSending ? 'Sending...' : 'Invite'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// FOLLOW USER
// ============================================================================

interface FollowUserButtonProps {
    collaborator: Collaborator
    isFollowing?: boolean
    onFollow?: (collaboratorId: string) => void
    onUnfollow?: () => void
    className?: string
}

export function FollowUserButton({
    collaborator,
    isFollowing = false,
    onFollow,
    onUnfollow,
    className = '',
}: FollowUserButtonProps) {
    return (
        <button
            onClick={() => isFollowing ? onUnfollow?.() : onFollow?.(collaborator.id)}
            className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                ${isFollowing
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
                ${className}
            `}
        >
            <Eye className="w-3.5 h-3.5" />
            {isFollowing ? 'Following' : 'Follow'}
        </button>
    )
}
