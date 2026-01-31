/**
 * SprintLoop File Tree System
 * 
 * Phase 1301-1350: Advanced file tree
 * - Collapsible folders
 * - File icons by type
 * - Drag and drop
 * - Context menus
 * - Search/filter
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
    File,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Plus,
    Trash2,
    Edit3,
    Copy,
    Clipboard,
    RefreshCw,
    Search,
    MoreHorizontal,
    FileText,
    FileCode,
    FileJson,
    Image,
    FileVideo,
    FileAudio,
    Archive,
    Settings,
    Package,
    Database,
    Globe,
    FileType,
    Braces,
    Hash,
    Code
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface FileNode {
    id: string
    name: string
    type: 'file' | 'folder'
    path: string
    children?: FileNode[]
    extension?: string
    size?: number
    modified?: Date
    isNew?: boolean
    isRenaming?: boolean
}

interface FileTreeContextValue {
    selectedFile: string | null
    expandedFolders: Set<string>
    clipboard: { nodes: FileNode[]; operation: 'copy' | 'cut' } | null
    onSelect: (path: string) => void
    onExpand: (path: string) => void
    onCollapse: (path: string) => void
    onRename: (path: string, newName: string) => void
    onDelete: (path: string) => void
    onCreateFile: (parentPath: string) => void
    onCreateFolder: (parentPath: string) => void
    onCopy: (nodes: FileNode[]) => void
    onCut: (nodes: FileNode[]) => void
    onPaste: (targetPath: string) => void
}

// ============================================================================
// FILE ICONS
// ============================================================================

function getFileIcon(name: string, extension?: string) {
    const ext = extension || name.split('.').pop()?.toLowerCase()

    const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
        ts: { icon: <FileCode className="w-4 h-4" />, color: '#3178c6' },
        tsx: { icon: <Braces className="w-4 h-4" />, color: '#61dafb' },
        js: { icon: <FileCode className="w-4 h-4" />, color: '#f7df1e' },
        jsx: { icon: <Braces className="w-4 h-4" />, color: '#61dafb' },
        json: { icon: <FileJson className="w-4 h-4" />, color: '#cbcb41' },
        md: { icon: <FileText className="w-4 h-4" />, color: '#519aba' },
        html: { icon: <Globe className="w-4 h-4" />, color: '#e44d26' },
        css: { icon: <Hash className="w-4 h-4" />, color: '#563d7c' },
        scss: { icon: <Hash className="w-4 h-4" />, color: '#c6538c' },
        py: { icon: <Code className="w-4 h-4" />, color: '#3776ab' },
        rs: { icon: <Settings className="w-4 h-4" />, color: '#dea584' },
        go: { icon: <Code className="w-4 h-4" />, color: '#00add8' },
        png: { icon: <Image className="w-4 h-4" />, color: '#a074c4' },
        jpg: { icon: <Image className="w-4 h-4" />, color: '#a074c4' },
        jpeg: { icon: <Image className="w-4 h-4" />, color: '#a074c4' },
        gif: { icon: <Image className="w-4 h-4" />, color: '#a074c4' },
        svg: { icon: <Image className="w-4 h-4" />, color: '#ffb13b' },
        mp4: { icon: <FileVideo className="w-4 h-4" />, color: '#f34b7d' },
        mp3: { icon: <FileAudio className="w-4 h-4" />, color: '#1db954' },
        zip: { icon: <Archive className="w-4 h-4" />, color: '#6d8086' },
        sql: { icon: <Database className="w-4 h-4" />, color: '#336791' },
        env: { icon: <Settings className="w-4 h-4" />, color: '#ecd53f' },
    }

    // Special files
    const specialFiles: Record<string, { icon: React.ReactNode; color: string }> = {
        'package.json': { icon: <Package className="w-4 h-4" />, color: '#cb3837' },
        'tsconfig.json': { icon: <Settings className="w-4 h-4" />, color: '#3178c6' },
        '.gitignore': { icon: <FileText className="w-4 h-4" />, color: '#f14e32' },
        'README.md': { icon: <FileText className="w-4 h-4" />, color: '#519aba' },
    }

    if (specialFiles[name]) return specialFiles[name]
    if (ext && iconMap[ext]) return iconMap[ext]

    return { icon: <File className="w-4 h-4" />, color: '#6d8086' }
}

// ============================================================================
// FILE TREE NODE
// ============================================================================

interface FileTreeNodeProps {
    node: FileNode
    depth: number
    context: FileTreeContextValue
}

function FileTreeNode({ node, depth, context }: FileTreeNodeProps) {
    const [isRenaming, setIsRenaming] = useState(false)
    const [newName, setNewName] = useState(node.name)
    const [showContextMenu, setShowContextMenu] = useState(false)
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
    const inputRef = useRef<HTMLInputElement>(null)

    const isExpanded = context.expandedFolders.has(node.path)
    const isSelected = context.selectedFile === node.path

    const handleClick = () => {
        if (node.type === 'folder') {
            if (isExpanded) {
                context.onCollapse(node.path)
            } else {
                context.onExpand(node.path)
            }
        } else {
            context.onSelect(node.path)
        }
    }

    const handleDoubleClick = () => {
        if (node.type === 'file') {
            setIsRenaming(true)
            setTimeout(() => inputRef.current?.select(), 0)
        }
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault()
        setContextMenuPos({ x: e.clientX, y: e.clientY })
        setShowContextMenu(true)
    }

    const handleRenameSubmit = () => {
        if (newName && newName !== node.name) {
            context.onRename(node.path, newName)
        }
        setIsRenaming(false)
    }

    const { icon, color } = node.type === 'folder'
        ? { icon: isExpanded ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />, color: '#dcb67a' }
        : getFileIcon(node.name, node.extension)

    return (
        <div>
            <div
                onClick={handleClick}
                onDoubleClick={handleDoubleClick}
                onContextMenu={handleContextMenu}
                className={`
                    group flex items-center gap-1 px-2 py-1 cursor-pointer transition-colors
                    ${isSelected ? 'bg-purple-500/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}
                `}
                style={{ paddingLeft: `${8 + depth * 16}px` }}
            >
                {/* Expand/collapse arrow for folders */}
                {node.type === 'folder' && (
                    <span className="flex-shrink-0 w-4">
                        {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                        )}
                    </span>
                )}

                {/* Icon */}
                <span style={{ color }} className="flex-shrink-0">
                    {icon}
                </span>

                {/* Name */}
                {isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit()
                            if (e.key === 'Escape') setIsRenaming(false)
                        }}
                        className="flex-1 px-1 bg-slate-800 border border-purple-500 rounded text-sm text-white outline-none"
                        autoFocus
                    />
                ) : (
                    <span className="flex-1 text-sm truncate">{node.name}</span>
                )}

                {/* Actions */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setContextMenuPos({ x: e.clientX, y: e.clientY })
                        setShowContextMenu(true)
                    }}
                    className="p-0.5 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-all"
                >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Children */}
            {node.type === 'folder' && isExpanded && node.children && (
                <div>
                    {node.children
                        .sort((a, b) => {
                            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
                            return a.name.localeCompare(b.name)
                        })
                        .map(child => (
                            <FileTreeNode
                                key={child.id}
                                node={child}
                                depth={depth + 1}
                                context={context}
                            />
                        ))}
                </div>
            )}

            {/* Context Menu */}
            {showContextMenu && (
                <div
                    className="fixed z-50 bg-slate-800 border border-white/10 rounded-lg shadow-xl py-1 min-w-48"
                    style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
                    onClick={() => setShowContextMenu(false)}
                >
                    {node.type === 'folder' && (
                        <>
                            <button
                                onClick={() => context.onCreateFile(node.path)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                            >
                                <Plus className="w-4 h-4" />
                                New File
                            </button>
                            <button
                                onClick={() => context.onCreateFolder(node.path)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                            >
                                <Folder className="w-4 h-4" />
                                New Folder
                            </button>
                            <div className="h-px bg-white/5 my-1" />
                        </>
                    )}
                    <button
                        onClick={() => context.onCopy([node])}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                    >
                        <Copy className="w-4 h-4" />
                        Copy
                    </button>
                    <button
                        onClick={() => context.onCut([node])}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                    >
                        <Copy className="w-4 h-4" />
                        Cut
                    </button>
                    {node.type === 'folder' && context.clipboard && (
                        <button
                            onClick={() => context.onPaste(node.path)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                        >
                            <Clipboard className="w-4 h-4" />
                            Paste
                        </button>
                    )}
                    <div className="h-px bg-white/5 my-1" />
                    <button
                        onClick={() => setIsRenaming(true)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/5"
                    >
                        <Edit3 className="w-4 h-4" />
                        Rename
                    </button>
                    <button
                        onClick={() => context.onDelete(node.path)}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// FILE TREE
// ============================================================================

interface FileTreeProps {
    files: FileNode[]
    onFileSelect?: (path: string) => void
    onFileCreate?: (parentPath: string, name: string, type: 'file' | 'folder') => void
    onFileDelete?: (path: string) => void
    onFileRename?: (path: string, newName: string) => void
    className?: string
}

export function FileTree({
    files,
    onFileSelect,
    onFileCreate,
    onFileDelete,
    onFileRename,
    className = '',
}: FileTreeProps) {
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'src/components']))
    const [clipboard, setClipboard] = useState<{ nodes: FileNode[]; operation: 'copy' | 'cut' } | null>(null)
    const [filter, setFilter] = useState('')

    const context: FileTreeContextValue = useMemo(() => ({
        selectedFile,
        expandedFolders,
        clipboard,
        onSelect: (path) => {
            setSelectedFile(path)
            onFileSelect?.(path)
        },
        onExpand: (path) => setExpandedFolders(prev => new Set([...prev, path])),
        onCollapse: (path) => setExpandedFolders(prev => {
            const next = new Set(prev)
            next.delete(path)
            return next
        }),
        onRename: (path, newName) => onFileRename?.(path, newName),
        onDelete: (path) => onFileDelete?.(path),
        onCreateFile: (parentPath) => onFileCreate?.(parentPath, 'untitled', 'file'),
        onCreateFolder: (parentPath) => onFileCreate?.(parentPath, 'new-folder', 'folder'),
        onCopy: (nodes) => setClipboard({ nodes, operation: 'copy' }),
        onCut: (nodes) => setClipboard({ nodes, operation: 'cut' }),
        onPaste: (targetPath) => {
            console.log('Paste to', targetPath, clipboard)
            setClipboard(null)
        },
    }), [selectedFile, expandedFolders, clipboard, onFileSelect, onFileRename, onFileDelete, onFileCreate])

    // Filter files
    const filterFiles = useCallback((nodes: FileNode[], query: string): FileNode[] => {
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
    }, [])

    const filteredFiles = useMemo(() => filterFiles(files, filter), [files, filter, filterFiles])

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-xs font-medium text-gray-400 uppercase">Explorer</span>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onFileCreate?.('', 'untitled', 'file')}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="New File"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onFileCreate?.('', 'new-folder', 'folder')}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="New Folder"
                    >
                        <Folder className="w-4 h-4" />
                    </button>
                    <button
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-2 py-2">
                <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-7 pr-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto">
                {filteredFiles.map(node => (
                    <FileTreeNode
                        key={node.id}
                        node={node}
                        depth={0}
                        context={context}
                    />
                ))}

                {filteredFiles.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                        No files found
                    </div>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// DEMO DATA
// ============================================================================

export const demoFileTree: FileNode[] = [
    {
        id: 'src',
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
            {
                id: 'src/components',
                name: 'components',
                type: 'folder',
                path: 'src/components',
                children: [
                    { id: 'src/components/App.tsx', name: 'App.tsx', type: 'file', path: 'src/components/App.tsx', extension: 'tsx' },
                    { id: 'src/components/Editor.tsx', name: 'Editor.tsx', type: 'file', path: 'src/components/Editor.tsx', extension: 'tsx' },
                    { id: 'src/components/Sidebar.tsx', name: 'Sidebar.tsx', type: 'file', path: 'src/components/Sidebar.tsx', extension: 'tsx' },
                ],
            },
            {
                id: 'src/utils',
                name: 'utils',
                type: 'folder',
                path: 'src/utils',
                children: [
                    { id: 'src/utils/helpers.ts', name: 'helpers.ts', type: 'file', path: 'src/utils/helpers.ts', extension: 'ts' },
                    { id: 'src/utils/api.ts', name: 'api.ts', type: 'file', path: 'src/utils/api.ts', extension: 'ts' },
                ],
            },
            { id: 'src/index.tsx', name: 'index.tsx', type: 'file', path: 'src/index.tsx', extension: 'tsx' },
            { id: 'src/styles.css', name: 'styles.css', type: 'file', path: 'src/styles.css', extension: 'css' },
        ],
    },
    { id: 'package.json', name: 'package.json', type: 'file', path: 'package.json', extension: 'json' },
    { id: 'tsconfig.json', name: 'tsconfig.json', type: 'file', path: 'tsconfig.json', extension: 'json' },
    { id: 'README.md', name: 'README.md', type: 'file', path: 'README.md', extension: 'md' },
]
