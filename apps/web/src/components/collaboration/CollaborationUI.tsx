/**
 * SprintLoop Multiplayer Collaboration UI Components
 * 
 * Premium collaboration features:
 * - Collaborator avatars and cursors
 * - Real-time presence indicators
 * - Chat panel
 * - Screen share viewer
 * - Session management
 */

import { useState, useRef, useEffect } from 'react'
import {
    Users,
    MessageCircle,
    Monitor,
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Share2,
    UserPlus,
    Check,
    Send,
    Smile,
    X
} from 'lucide-react'
import { useMultiplayer, type Collaborator } from '@/lib/collaboration/multiplayer'

// Collaborator cursor component
export function CollaboratorCursor({
    collaborator,
    position
}: {
    collaborator: Collaborator
    position: { x: number; y: number }
}) {
    return (
        <div
            className="fixed pointer-events-none z-50 transition-transform duration-75"
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
        >
            {/* Cursor arrow */}
            <svg
                width="16"
                height="20"
                viewBox="0 0 16 20"
                fill="none"
                className="drop-shadow-lg"
            >
                <path
                    d="M1 1L15 12L8.5 12L5 18L1 1Z"
                    fill={collaborator.color}
                    stroke="white"
                    strokeWidth="1.5"
                />
            </svg>

            {/* Name tag */}
            <div
                className="absolute left-4 top-4 px-2 py-0.5 rounded-lg text-xs font-medium text-white whitespace-nowrap shadow-lg"
                style={{ backgroundColor: collaborator.color }}
            >
                {collaborator.name}
            </div>
        </div>
    )
}

// Collaborator avatar stack
export function CollaboratorAvatars() {
    const { collaborators, currentSession } = useMultiplayer()
    const [showPanel, setShowPanel] = useState(false)

    const onlineCollaborators = collaborators.filter(c => c.status !== 'offline')

    if (!currentSession) return null

    return (
        <div className="relative">
            {/* Avatar Stack */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
                <div className="flex -space-x-2">
                    {onlineCollaborators.slice(0, 4).map((collaborator, i) => (
                        <div
                            key={collaborator.id}
                            className="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-semibold text-white"
                            style={{
                                backgroundColor: collaborator.color,
                                zIndex: 4 - i,
                            }}
                            title={collaborator.name}
                        >
                            {collaborator.avatar || collaborator.name.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {onlineCollaborators.length > 4 && (
                        <div
                            className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-xs font-medium text-white"
                            style={{ zIndex: 0 }}
                        >
                            +{onlineCollaborators.length - 4}
                        </div>
                    )}
                </div>

                <span className="text-sm text-gray-400">
                    {onlineCollaborators.length} online
                </span>
            </button>

            {/* Collaborator Panel */}
            {showPanel && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl overflow-hidden z-50">
                    <div className="p-3 border-b border-white/5 flex items-center justify-between">
                        <span className="font-medium text-white">Collaborators</span>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="p-1 rounded hover:bg-white/5 text-gray-500"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {onlineCollaborators.map(collaborator => (
                            <div
                                key={collaborator.id}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-white/5"
                            >
                                <div
                                    className="relative w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                                    style={{ backgroundColor: collaborator.color }}
                                >
                                    {collaborator.avatar || collaborator.name.charAt(0).toUpperCase()}
                                    {/* Status indicator */}
                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${collaborator.status === 'online' ? 'bg-green-500' :
                                        collaborator.status === 'away' ? 'bg-yellow-500' :
                                            collaborator.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                                        }`} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-white truncate">
                                            {collaborator.name}
                                        </span>
                                        {collaborator.isAI && (
                                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-purple-500/20 text-purple-400">
                                                AI
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                        {collaborator.status}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Invite button */}
                    <div className="p-3 border-t border-white/5">
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium">
                            <UserPlus className="w-4 h-4" />
                            Invite Collaborator
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// Chat panel component
export function CollaborationChatPanel() {
    const {
        messages,
        collaborators,
        localUser,
        sendMessage,
        reactToMessage,
        markMessagesRead
    } = useMultiplayer()

    const [message, setMessage] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = () => {
        if (!message.trim()) return
        sendMessage(message.trim())
        setMessage('')
    }

    const getCollaborator = (id: string) => collaborators.find(c => c.id === id)

    if (!isOpen) {
        return (
            <button
                onClick={() => {
                    setIsOpen(true)
                    markMessagesRead()
                }}
                className="fixed bottom-4 right-4 p-3 rounded-full bg-blue-500 text-white shadow-lg hover:bg-blue-600 transition-colors z-40"
            >
                <MessageCircle className="w-5 h-5" />
            </button>
        )
    }

    return (
        <div className="fixed bottom-4 right-4 w-80 h-96 bg-slate-800/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl flex flex-col overflow-hidden z-50">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">Chat</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-white/5 text-gray-500"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => {
                    const author = getCollaborator(msg.authorId)
                    const isSystem = msg.type === 'system'
                    const isOwn = msg.authorId === localUser?.id

                    if (isSystem) {
                        return (
                            <div key={msg.id} className="text-center">
                                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                                    {msg.content}
                                </span>
                            </div>
                        )
                    }

                    return (
                        <div key={msg.id} className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                            {!isOwn && author && (
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                                    style={{ backgroundColor: author.color }}
                                >
                                    {author.avatar || author.name.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <div className={`max-w-[75%] ${isOwn ? 'text-right' : ''}`}>
                                {!isOwn && author && (
                                    <div className="text-xs text-gray-500 mb-1">
                                        {author.name}
                                    </div>
                                )}
                                <div className={`px-3 py-2 rounded-xl text-sm ${isOwn
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white/5 text-gray-300'
                                    }`}>
                                    {msg.type === 'code' ? (
                                        <pre className="font-mono text-xs overflow-x-auto">
                                            {msg.content}
                                        </pre>
                                    ) : (
                                        msg.content
                                    )}
                                </div>

                                {/* Reactions */}
                                {msg.reactions && msg.reactions.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                        {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => reactToMessage(msg.id, emoji)}
                                                className="px-1.5 py-0.5 rounded bg-white/5 text-xs hover:bg-white/10"
                                            >
                                                {emoji} {msg.reactions?.filter(r => r.emoji === emoji).length}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-white/5 text-gray-500">
                        <Smile className="w-4 h-4" />
                    </button>
                    <input
                        type="text"
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none border border-transparent focus:border-white/10"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!message.trim()}
                        className="p-2 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

// Share link button
export function ShareSessionButton() {
    const { getShareLink, copyShareLink } = useMultiplayer()
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        const success = await copyShareLink()
        if (success) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const shareLink = getShareLink()
    if (!shareLink) return null

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors text-sm"
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                </>
            ) : (
                <>
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                </>
            )}
        </button>
    )
}

// Session controls (for screen sharing, voice, etc.)
export function SessionControls() {
    const { screenShare, startScreenShare, stopScreenShare, leaveSession } = useMultiplayer()
    const [isMuted, setIsMuted] = useState(true)
    const [isVideoOn, setIsVideoOn] = useState(false)

    return (
        <div className="flex items-center gap-2">
            {/* Microphone toggle */}
            <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${isMuted
                    ? 'bg-white/5 text-gray-500 hover:bg-white/10'
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                title={isMuted ? 'Unmute' : 'Mute'}
            >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Video toggle */}
            <button
                onClick={() => setIsVideoOn(!isVideoOn)}
                className={`p-2 rounded-lg transition-colors ${isVideoOn
                    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                title={isVideoOn ? 'Stop video' : 'Start video'}
            >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
            </button>

            {/* Screen share */}
            <button
                onClick={() => screenShare ? stopScreenShare() : startScreenShare()}
                className={`p-2 rounded-lg transition-colors ${screenShare
                    ? 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                    : 'bg-white/5 text-gray-500 hover:bg-white/10'
                    }`}
                title={screenShare ? 'Stop sharing' : 'Share screen'}
            >
                <Monitor className="w-4 h-4" />
            </button>

            {/* Leave session */}
            <button
                onClick={leaveSession}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Leave session"
            >
                <PhoneOff className="w-4 h-4" />
            </button>
        </div>
    )
}

// Collaboration toolbar (combines all controls)
export function CollaborationToolbar() {
    const { currentSession } = useMultiplayer()

    if (!currentSession) return null

    return (
        <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/50 border-b border-white/5">
            {/* Session info */}
            <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm text-white font-medium">
                    {currentSession.name}
                </span>
            </div>

            <div className="h-4 w-px bg-white/10" />

            {/* Collaborator avatars */}
            <CollaboratorAvatars />

            <div className="flex-1" />

            {/* Share button */}
            <ShareSessionButton />

            {/* Session controls */}
            <SessionControls />
        </div>
    )
}
