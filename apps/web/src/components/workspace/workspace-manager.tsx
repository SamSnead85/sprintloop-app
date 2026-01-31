/**
 * SprintLoop Workspace Manager System
 * 
 * Phase 2101-2150: Workspace management
 * - Recent workspaces
 * - Add folders
 * - Workspace settings
 * - Multi-root support
 */

import React, { useState, useMemo } from 'react'
import {
    Folder,
    FolderOpen,
    FolderPlus,
    Plus,
    X,
    MoreHorizontal,
    Settings,
    Clock,
    Star,
    StarOff,
    Trash2,
    ExternalLink,
    ChevronRight,
    Search,
    RefreshCw
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface WorkspaceFolder {
    id: string
    name: string
    path: string
    isRoot?: boolean
}

interface RecentWorkspace {
    id: string
    name: string
    path: string
    lastOpened: Date
    isFavorite?: boolean
    folders?: number
}

// ============================================================================
// WORKSPACE FOLDER ITEM
// ============================================================================

interface WorkspaceFolderItemProps {
    folder: WorkspaceFolder
    onRemove?: () => void
    onOpenSettings?: () => void
    onOpenInFinder?: () => void
}

function WorkspaceFolderItem({
    folder,
    onRemove,
    onOpenSettings,
    onOpenInFinder,
}: WorkspaceFolderItemProps) {
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="group flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors">
            <FolderOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{folder.name}</div>
                <div className="text-xs text-gray-600 truncate">{folder.path}</div>
            </div>

            {folder.isRoot && (
                <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                    Root
                </span>
            )}

            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>

                {showMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowMenu(false)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 py-1">
                            <button
                                onClick={() => {
                                    onOpenSettings?.()
                                    setShowMenu(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                                <Settings className="w-4 h-4" />
                                Folder Settings
                            </button>
                            <button
                                onClick={() => {
                                    onOpenInFinder?.()
                                    setShowMenu(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Open in Finder
                            </button>
                            {!folder.isRoot && (
                                <button
                                    onClick={() => {
                                        onRemove?.()
                                        setShowMenu(false)
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-white/5"
                                >
                                    <X className="w-4 h-4" />
                                    Remove from Workspace
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// RECENT WORKSPACE ITEM
// ============================================================================

interface RecentWorkspaceItemProps {
    workspace: RecentWorkspace
    onOpen?: () => void
    onToggleFavorite?: () => void
    onRemove?: () => void
}

function RecentWorkspaceItem({
    workspace,
    onOpen,
    onToggleFavorite,
    onRemove,
}: RecentWorkspaceItemProps) {
    const formatDate = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const days = Math.floor(diff / 86400000)

        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        if (days < 7) return `${days} days ago`
        return date.toLocaleDateString()
    }

    return (
        <div
            onClick={onOpen}
            className="group flex items-center gap-3 px-3 py-2 hover:bg-white/5 cursor-pointer transition-colors"
        >
            <Folder className="w-5 h-5 text-gray-400 flex-shrink-0" />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-white truncate">{workspace.name}</span>
                    {workspace.folders && workspace.folders > 1 && (
                        <span className="text-xs text-gray-600">
                            {workspace.folders} folders
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-600 truncate">{workspace.path}</div>
            </div>

            <span className="text-xs text-gray-600 flex-shrink-0">
                {formatDate(workspace.lastOpened)}
            </span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite?.()
                    }}
                    className="p-1 text-gray-500 hover:text-yellow-400 transition-colors"
                    title={workspace.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                    {workspace.isFavorite ? (
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    ) : (
                        <StarOff className="w-3.5 h-3.5" />
                    )}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove?.()
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                    title="Remove from recent"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}

// ============================================================================
// WORKSPACE MANAGER
// ============================================================================

interface WorkspaceManagerProps {
    currentFolders?: WorkspaceFolder[]
    recentWorkspaces?: RecentWorkspace[]
    onAddFolder?: () => void
    onRemoveFolder?: (folder: WorkspaceFolder) => void
    onOpenWorkspace?: (workspace: RecentWorkspace) => void
    onToggleFavorite?: (workspace: RecentWorkspace) => void
    onRemoveRecent?: (workspace: RecentWorkspace) => void
    onOpenSettings?: () => void
    onNewWindow?: () => void
    className?: string
}

export function WorkspaceManager({
    currentFolders: propFolders,
    recentWorkspaces: propRecent,
    onAddFolder,
    onRemoveFolder,
    onOpenWorkspace,
    onToggleFavorite,
    onRemoveRecent,
    onOpenSettings,
    onNewWindow,
    className = '',
}: WorkspaceManagerProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

    // Demo data
    const defaultFolders: WorkspaceFolder[] = [
        { id: 'f1', name: 'sprintloop', path: '/Users/dev/projects/sprintloop', isRoot: true },
        { id: 'f2', name: 'shared-lib', path: '/Users/dev/projects/shared-lib' },
    ]

    const defaultRecent: RecentWorkspace[] = [
        { id: 'w1', name: 'sprintloop', path: '/Users/dev/projects/sprintloop', lastOpened: new Date(), isFavorite: true, folders: 2 },
        { id: 'w2', name: 'website', path: '/Users/dev/projects/website', lastOpened: new Date(Date.now() - 86400000) },
        { id: 'w3', name: 'api-server', path: '/Users/dev/projects/api-server', lastOpened: new Date(Date.now() - 172800000), isFavorite: true },
        { id: 'w4', name: 'mobile-app', path: '/Users/dev/projects/mobile-app', lastOpened: new Date(Date.now() - 604800000) },
        { id: 'w5', name: 'design-system', path: '/Users/dev/projects/design-system', lastOpened: new Date(Date.now() - 1209600000) },
    ]

    const currentFolders = propFolders || defaultFolders
    const recentWorkspaces = propRecent || defaultRecent

    // Filter recent workspaces
    const filteredRecent = useMemo(() => {
        return recentWorkspaces.filter(ws => {
            if (showFavoritesOnly && !ws.isFavorite) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return ws.name.toLowerCase().includes(query) || ws.path.toLowerCase().includes(query)
            }
            return true
        })
    }, [recentWorkspaces, searchQuery, showFavoritesOnly])

    // Group by favorites
    const favoriteWorkspaces = filteredRecent.filter(ws => ws.isFavorite)
    const otherWorkspaces = filteredRecent.filter(ws => !ws.isFavorite)

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">Workspace</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onNewWindow}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="New Window"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Workspace Settings"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Current workspace */}
            {currentFolders.length > 0 && (
                <div className="border-b border-white/5">
                    <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-xs font-medium text-gray-400 uppercase">
                            Workspace Folders
                        </span>
                        <button
                            onClick={onAddFolder}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                            title="Add Folder to Workspace"
                        >
                            <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    {currentFolders.map(folder => (
                        <WorkspaceFolderItem
                            key={folder.id}
                            folder={folder}
                            onRemove={() => onRemoveFolder?.(folder)}
                        />
                    ))}
                </div>
            )}

            {/* Search and filter */}
            <div className="px-3 py-2 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search workspaces..."
                        className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>
                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={`mt-2 flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${showFavoritesOnly
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <Star className={`w-3.5 h-3.5 ${showFavoritesOnly ? 'fill-yellow-400' : ''}`} />
                    Favorites only
                </button>
            </div>

            {/* Recent workspaces */}
            <div className="flex-1 overflow-y-auto">
                <div className="flex items-center gap-2 px-3 py-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-400 uppercase">Recent</span>
                </div>

                {/* Favorites section */}
                {favoriteWorkspaces.length > 0 && !showFavoritesOnly && (
                    <div className="mb-2">
                        <div className="px-3 py-1">
                            <span className="text-xs text-gray-600">Favorites</span>
                        </div>
                        {favoriteWorkspaces.map(workspace => (
                            <RecentWorkspaceItem
                                key={workspace.id}
                                workspace={workspace}
                                onOpen={() => onOpenWorkspace?.(workspace)}
                                onToggleFavorite={() => onToggleFavorite?.(workspace)}
                                onRemove={() => onRemoveRecent?.(workspace)}
                            />
                        ))}
                    </div>
                )}

                {/* Other workspaces */}
                {otherWorkspaces.length > 0 && (
                    <div>
                        {favoriteWorkspaces.length > 0 && !showFavoritesOnly && (
                            <div className="px-3 py-1">
                                <span className="text-xs text-gray-600">All</span>
                            </div>
                        )}
                        {otherWorkspaces.map(workspace => (
                            <RecentWorkspaceItem
                                key={workspace.id}
                                workspace={workspace}
                                onOpen={() => onOpenWorkspace?.(workspace)}
                                onToggleFavorite={() => onToggleFavorite?.(workspace)}
                                onRemove={() => onRemoveRecent?.(workspace)}
                            />
                        ))}
                    </div>
                )}

                {filteredRecent.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Folder className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No workspaces found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
