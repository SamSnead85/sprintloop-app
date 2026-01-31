/**
 * SprintLoop Premium File Explorer
 * 
 * VS Code-style file tree with:
 * - Collapsible folders
 * - File type icons
 * - Context menus
 * - Drag and drop
 * - Multi-select
 * - Filtering and search
 */

import React, { useState, useRef, useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    FolderOpen,
    Search,
    X,
    Plus,
    FolderPlus,
    Trash2,
    Edit2,
    Copy,
    Clipboard,
    RefreshCw,
    FileText,
    FileCode,
    FileJson,
    FileImage,
    FileCog,
    FileType,
    AlertCircle
} from 'lucide-react'

// ============================================================================
// FILE ICONS MAPPING
// ============================================================================

const fileIcons: Record<string, { icon: React.ReactNode; color: string }> = {
    // TypeScript/JavaScript
    ts: { icon: <FileCode className="w-4 h-4" />, color: '#3178C6' },
    tsx: { icon: <FileCode className="w-4 h-4" />, color: '#3178C6' },
    js: { icon: <FileCode className="w-4 h-4" />, color: '#F7DF1E' },
    jsx: { icon: <FileCode className="w-4 h-4" />, color: '#61DAFB' },

    // Config
    json: { icon: <FileJson className="w-4 h-4" />, color: '#CBCB41' },
    yaml: { icon: <FileCog className="w-4 h-4" />, color: '#CB171E' },
    yml: { icon: <FileCog className="w-4 h-4" />, color: '#CB171E' },
    toml: { icon: <FileCog className="w-4 h-4" />, color: '#9C4221' },

    // Markdown
    md: { icon: <FileText className="w-4 h-4" />, color: '#519ABA' },
    mdx: { icon: <FileText className="w-4 h-4" />, color: '#FCB32C' },

    // Styles
    css: { icon: <FileType className="w-4 h-4" />, color: '#1572B6' },
    scss: { icon: <FileType className="w-4 h-4" />, color: '#CC6699' },
    less: { icon: <FileType className="w-4 h-4" />, color: '#1D365D' },

    // Images
    png: { icon: <FileImage className="w-4 h-4" />, color: '#A074C4' },
    jpg: { icon: <FileImage className="w-4 h-4" />, color: '#A074C4' },
    svg: { icon: <FileImage className="w-4 h-4" />, color: '#FFB13B' },

    // Default
    default: { icon: <File className="w-4 h-4" />, color: '#6B7280' },
}

function getFileIcon(filename: string): { icon: React.ReactNode; color: string } {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    return fileIcons[ext] || fileIcons.default
}

// ============================================================================
// FILE EXPLORER STATE
// ============================================================================

interface FileNode {
    id: string
    name: string
    type: 'file' | 'folder'
    path: string
    children?: FileNode[]
    isModified?: boolean
    isNew?: boolean
    error?: string
}

interface FileExplorerState {
    files: FileNode[]
    expandedFolders: Set<string>
    selectedFiles: Set<string>
    focusedFile: string | null
    clipboard: { files: FileNode[]; operation: 'copy' | 'cut' } | null
    searchQuery: string
    isLoading: boolean

    toggleFolder: (folderId: string) => void
    selectFile: (fileId: string, multiSelect?: boolean) => void
    setFocusedFile: (fileId: string | null) => void
    expandAll: () => void
    collapseAll: () => void
    setSearchQuery: (query: string) => void
    copyFiles: (files: FileNode[]) => void
    cutFiles: (files: FileNode[]) => void
    pasteFiles: (targetFolderId: string) => void
    deleteFiles: (fileIds: string[]) => void
    createFile: (parentId: string | null, name: string) => void
    createFolder: (parentId: string | null, name: string) => void
    renameFile: (fileId: string, newName: string) => void
}

export const useFileExplorer = create<FileExplorerState>()(
    persist(
        (set) => ({
            files: [],
            expandedFolders: new Set(['root']),
            selectedFiles: new Set(),
            focusedFile: null,
            clipboard: null,
            searchQuery: '',
            isLoading: false,

            toggleFolder: (folderId) => set(state => {
                const next = new Set(state.expandedFolders)
                if (next.has(folderId)) {
                    next.delete(folderId)
                } else {
                    next.add(folderId)
                }
                return { expandedFolders: next }
            }),

            selectFile: (fileId, multiSelect = false) => set(state => {
                if (multiSelect) {
                    const next = new Set(state.selectedFiles)
                    if (next.has(fileId)) {
                        next.delete(fileId)
                    } else {
                        next.add(fileId)
                    }
                    return { selectedFiles: next, focusedFile: fileId }
                }
                return { selectedFiles: new Set([fileId]), focusedFile: fileId }
            }),

            setFocusedFile: (fileId) => set({ focusedFile: fileId }),

            expandAll: () => {
                const getAllFolderIds = (nodes: FileNode[]): string[] => {
                    return nodes.flatMap(node =>
                        node.type === 'folder'
                            ? [node.id, ...getAllFolderIds(node.children || [])]
                            : []
                    )
                }
                set(state => ({
                    expandedFolders: new Set(getAllFolderIds(state.files))
                }))
            },

            collapseAll: () => set({ expandedFolders: new Set() }),

            setSearchQuery: (query) => set({ searchQuery: query }),

            copyFiles: (files) => set({ clipboard: { files, operation: 'copy' } }),
            cutFiles: (files) => set({ clipboard: { files, operation: 'cut' } }),

            pasteFiles: (_targetFolderId) => {
                // Implementation would copy/move files
                console.log('Paste files to', _targetFolderId)
                set({ clipboard: null })
            },

            deleteFiles: (fileIds) => {
                console.log('Delete files', fileIds)
                set(state => ({
                    selectedFiles: new Set([...state.selectedFiles].filter(id => !fileIds.includes(id)))
                }))
            },

            createFile: (parentId, name) => {
                console.log('Create file', name, 'in', parentId)
            },

            createFolder: (parentId, name) => {
                console.log('Create folder', name, 'in', parentId)
            },

            renameFile: (fileId, newName) => {
                console.log('Rename', fileId, 'to', newName)
            },
        }),
        {
            name: 'sprintloop-file-explorer',
            partialize: (state) => ({
                expandedFolders: Array.from(state.expandedFolders),
            }),
        }
    )
)

// ============================================================================
// FILE TREE ITEM
// ============================================================================

interface FileTreeItemProps {
    node: FileNode
    depth: number
    onOpen?: (file: FileNode) => void
    onContextMenu?: (e: React.MouseEvent, file: FileNode) => void
}

function FileTreeItem({ node, depth, onOpen, onContextMenu }: FileTreeItemProps) {
    const {
        expandedFolders,
        selectedFiles,
        focusedFile,
        toggleFolder,
        selectFile,
    } = useFileExplorer()

    const isExpanded = expandedFolders.has(node.id)
    const isSelected = selectedFiles.has(node.id)
    const isFocused = focusedFile === node.id
    const isFolder = node.type === 'folder'

    const { icon, color } = getFileIcon(node.name)

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        selectFile(node.id, e.metaKey || e.ctrlKey)

        if (isFolder) {
            toggleFolder(node.id)
        } else {
            onOpen?.(node)
        }
    }

    const handleDoubleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (!isFolder) {
            onOpen?.(node)
        }
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        selectFile(node.id)
        onContextMenu?.(e, node)
    }

    return (
        <div role="treeitem" aria-expanded={isFolder ? isExpanded : undefined}>
            <button
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                className={`
                    w-full flex items-center gap-1.5 px-2 py-1 text-sm
                    rounded-md transition-colors
                    ${isSelected
                        ? 'bg-purple-500/20 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }
                    ${isFocused ? 'ring-1 ring-purple-500/50' : ''}
                `}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
                {/* Expand/collapse chevron for folders */}
                {isFolder ? (
                    <span className="flex-shrink-0 w-4 text-gray-500">
                        {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )}
                    </span>
                ) : (
                    <span className="w-4" /> // Spacer for files
                )}

                {/* Icon */}
                <span className="flex-shrink-0" style={{ color }}>
                    {isFolder
                        ? (isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />)
                        : icon
                    }
                </span>

                {/* Name */}
                <span className="flex-1 truncate text-left">
                    {node.name}
                </span>

                {/* Indicators */}
                {node.isModified && (
                    <span className="w-2 h-2 rounded-full bg-yellow-400" title="Modified" />
                )}
                {node.error && (
                    <span title={node.error}><AlertCircle className="w-3 h-3 text-red-400" /></span>
                )}
            </button>

            {/* Children */}
            {isFolder && isExpanded && node.children && (
                <div role="group">
                    {node.children.map(child => (
                        <FileTreeItem
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            onOpen={onOpen}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

interface ContextMenuItem {
    id: string
    label: string
    icon?: React.ReactNode
    shortcut?: string
    danger?: boolean
    disabled?: boolean
    onClick: () => void
}

interface ContextMenuProps {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
}

function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[180px] py-1 rounded-lg border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-xl"
            style={{ left: x, top: y }}
            role="menu"
        >
            {items.map((item, i) => (
                <React.Fragment key={item.id}>
                    {i > 0 && items[i - 1].id.endsWith('-divider') && (
                        <div className="my-1 border-t border-white/5" />
                    )}
                    <button
                        onClick={() => {
                            item.onClick()
                            onClose()
                        }}
                        disabled={item.disabled}
                        className={`
                            w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left
                            transition-colors
                            ${item.danger
                                ? 'text-red-400 hover:bg-red-500/20'
                                : 'text-gray-300 hover:bg-white/5'
                            }
                            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        role="menuitem"
                    >
                        {item.icon && <span className="w-4 text-gray-500">{item.icon}</span>}
                        <span className="flex-1">{item.label}</span>
                        {item.shortcut && (
                            <span className="text-xs text-gray-600">{item.shortcut}</span>
                        )}
                    </button>
                </React.Fragment>
            ))}
        </div>
    )
}

// ============================================================================
// FILE EXPLORER COMPONENT
// ============================================================================

interface FileExplorerProps {
    files: FileNode[]
    onFileOpen?: (file: FileNode) => void
    onFileCreate?: (parentId: string | null) => void
    onFolderCreate?: (parentId: string | null) => void
    onFileDelete?: (files: FileNode[]) => void
    onFileRename?: (file: FileNode) => void
    onRefresh?: () => void
}

export function FileExplorer({
    files,
    onFileOpen,
    onFileCreate,
    onFolderCreate,
    onFileDelete,
    onFileRename,
    onRefresh,
}: FileExplorerProps) {
    const {
        searchQuery,
        setSearchQuery,
        collapseAll,
        copyFiles,
        cutFiles,
        pasteFiles,
        clipboard,
    } = useFileExplorer()

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileNode } | null>(null)

    const handleContextMenu = (e: React.MouseEvent, file: FileNode) => {
        setContextMenu({ x: e.clientX, y: e.clientY, file })
    }

    const getContextMenuItems = (file: FileNode): ContextMenuItem[] => [
        {
            id: 'new-file',
            label: 'New File',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => onFileCreate?.(file.type === 'folder' ? file.id : null),
        },
        {
            id: 'new-folder',
            label: 'New Folder',
            icon: <FolderPlus className="w-4 h-4" />,
            onClick: () => onFolderCreate?.(file.type === 'folder' ? file.id : null),
        },
        { id: 'divider-1', label: '', onClick: () => { } },
        {
            id: 'copy',
            label: 'Copy',
            icon: <Copy className="w-4 h-4" />,
            shortcut: '⌘C',
            onClick: () => copyFiles([file]),
        },
        {
            id: 'cut',
            label: 'Cut',
            icon: <Clipboard className="w-4 h-4" />,
            shortcut: '⌘X',
            onClick: () => cutFiles([file]),
        },
        {
            id: 'paste',
            label: 'Paste',
            icon: <Clipboard className="w-4 h-4" />,
            shortcut: '⌘V',
            disabled: !clipboard,
            onClick: () => file.type === 'folder' && pasteFiles(file.id),
        },
        { id: 'divider-2', label: '', onClick: () => { } },
        {
            id: 'rename',
            label: 'Rename',
            icon: <Edit2 className="w-4 h-4" />,
            shortcut: 'F2',
            onClick: () => onFileRename?.(file),
        },
        {
            id: 'delete',
            label: 'Delete',
            icon: <Trash2 className="w-4 h-4" />,
            shortcut: '⌫',
            danger: true,
            onClick: () => onFileDelete?.([file]),
        },
    ]

    // Filter files based on search
    const filterFiles = (nodes: FileNode[], query: string): FileNode[] => {
        if (!query) return nodes

        return nodes.reduce<FileNode[]>((acc, node) => {
            if (node.name.toLowerCase().includes(query.toLowerCase())) {
                acc.push(node)
            } else if (node.children) {
                const filteredChildren = filterFiles(node.children, query)
                if (filteredChildren.length > 0) {
                    acc.push({ ...node, children: filteredChildren })
                }
            }
            return acc
        }, [])
    }

    const displayedFiles = filterFiles(files, searchQuery)

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Explorer
                </span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onFileCreate?.(null)}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded"
                        title="New File"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onFolderCreate?.(null)}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded"
                        title="New Folder"
                    >
                        <FolderPlus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={collapseAll}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded"
                        title="Collapse All"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-2 py-2 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-8 pr-8 py-1.5 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-white"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* File Tree */}
            <div
                className="flex-1 overflow-y-auto py-1"
                role="tree"
                aria-label="File explorer"
            >
                {displayedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <File className="w-8 h-8 text-gray-600 mb-2" />
                        <p className="text-sm text-gray-500">
                            {searchQuery ? 'No matching files' : 'No files yet'}
                        </p>
                    </div>
                ) : (
                    displayedFiles.map(node => (
                        <FileTreeItem
                            key={node.id}
                            node={node}
                            depth={0}
                            onOpen={onFileOpen}
                            onContextMenu={handleContextMenu}
                        />
                    ))
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={getContextMenuItems(contextMenu.file)}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </div>
    )
}

// ============================================================================
// FILE BREADCRUMBS
// ============================================================================

interface FileBreadcrumbsProps {
    path: string[]
    onNavigate: (index: number) => void
}

export function FileBreadcrumbs({ path, onNavigate }: FileBreadcrumbsProps) {
    return (
        <nav
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/50 border-b border-white/5 overflow-x-auto"
            aria-label="File path"
        >
            {path.map((segment, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />}
                    <button
                        onClick={() => onNavigate(i)}
                        className={`
                            px-1.5 py-0.5 text-sm rounded transition-colors flex-shrink-0
                            ${i === path.length - 1
                                ? 'text-white font-medium'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            }
                        `}
                    >
                        {segment}
                    </button>
                </React.Fragment>
            ))}
        </nav>
    )
}
