/**
 * SprintLoop Keyboard Shortcuts System
 * 
 * Phase 1951-2000: Keyboard shortcuts
 * - Shortcuts list
 * - Custom keybindings
 * - Conflict detection
 * - Categories
 * - Search
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
    Keyboard,
    Search,
    Edit3,
    Plus,
    Trash2,
    AlertTriangle,
    Check,
    X,
    RotateCcw,
    Download,
    Upload,
    ChevronRight,
    Command,
    Info
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface KeyboardShortcut {
    id: string
    command: string
    label: string
    description?: string
    keybinding: string
    category: string
    isCustom?: boolean
    isDefault?: boolean
    conflictsWith?: string[]
}

type ShortcutCategory = 'general' | 'editor' | 'navigation' | 'search' | 'debug' | 'terminal' | 'git'

// ============================================================================
// KEY DISPLAY
// ============================================================================

interface KeyDisplayProps {
    keybinding: string
    className?: string
}

function KeyDisplay({ keybinding, className = '' }: KeyDisplayProps) {
    const keys = keybinding.split('+').map(k => k.trim())

    const formatKey = (key: string) => {
        const keyMap: Record<string, string> = {
            'cmd': '⌘',
            'ctrl': '⌃',
            'alt': '⌥',
            'shift': '⇧',
            'enter': '↵',
            'tab': '⇥',
            'backspace': '⌫',
            'delete': '⌦',
            'escape': 'Esc',
            'space': '␣',
            'up': '↑',
            'down': '↓',
            'left': '←',
            'right': '→',
        }
        return keyMap[key.toLowerCase()] || key.toUpperCase()
    }

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {keys.map((key, i) => (
                <kbd
                    key={i}
                    className="min-w-6 px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-gray-300 text-center"
                >
                    {formatKey(key)}
                </kbd>
            ))}
        </div>
    )
}

// ============================================================================
// KEYBINDING INPUT
// ============================================================================

interface KeybindingInputProps {
    value: string
    onChange: (value: string) => void
    onCancel: () => void
}

function KeybindingInput({ value, onChange, onCancel }: KeybindingInputProps) {
    const [recording, setRecording] = useState(false)
    const [keys, setKeys] = useState<string[]>([])

    useEffect(() => {
        if (!recording) return

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault()
            e.stopPropagation()

            const modifiers: string[] = []
            if (e.metaKey) modifiers.push('Cmd')
            if (e.ctrlKey) modifiers.push('Ctrl')
            if (e.altKey) modifiers.push('Alt')
            if (e.shiftKey) modifiers.push('Shift')

            const key = e.key
            if (!['Meta', 'Control', 'Alt', 'Shift'].includes(key)) {
                const keybinding = [...modifiers, key].join('+')
                onChange(keybinding)
                setRecording(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [recording, onChange])

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => setRecording(!recording)}
                className={`
                    flex-1 px-3 py-2 border rounded-lg text-sm text-left transition-colors
                    ${recording
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500'
                    }
                `}
            >
                {recording ? 'Press keys...' : value || 'Click to record'}
            </button>
            <button
                onClick={onCancel}
                className="p-2 text-gray-500 hover:text-white transition-colors"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    )
}

// ============================================================================
// SHORTCUT ITEM
// ============================================================================

interface ShortcutItemProps {
    shortcut: KeyboardShortcut
    onEdit: () => void
    onReset?: () => void
    onDelete?: () => void
    isEditing?: boolean
    onEditSave?: (keybinding: string) => void
    onEditCancel?: () => void
}

function ShortcutItem({
    shortcut,
    onEdit,
    onReset,
    onDelete,
    isEditing,
    onEditSave,
    onEditCancel,
}: ShortcutItemProps) {
    const [editValue, setEditValue] = useState(shortcut.keybinding)

    const hasConflict = shortcut.conflictsWith && shortcut.conflictsWith.length > 0

    return (
        <div className={`
            group flex items-center gap-4 px-4 py-2.5 border-b border-white/5 transition-colors
            ${isEditing ? 'bg-white/5' : 'hover:bg-white/5'}
        `}>
            {/* Command info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">{shortcut.label}</span>
                    {shortcut.isCustom && (
                        <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                            Custom
                        </span>
                    )}
                    {hasConflict && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                            <AlertTriangle className="w-3 h-3" />
                            Conflict
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-600">{shortcut.command}</div>
            </div>

            {/* Keybinding */}
            {isEditing ? (
                <div className="w-48">
                    <KeybindingInput
                        value={editValue}
                        onChange={(v) => {
                            setEditValue(v)
                            onEditSave?.(v)
                        }}
                        onCancel={() => onEditCancel?.()}
                    />
                </div>
            ) : (
                <button
                    onClick={onEdit}
                    className="flex items-center gap-2 hover:bg-white/5 rounded px-2 py-1 transition-colors"
                >
                    <KeyDisplay keybinding={shortcut.keybinding} />
                    <Edit3 className="w-3.5 h-3.5 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {shortcut.isCustom && onReset && (
                    <button
                        onClick={onReset}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                        title="Reset to default"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={onDelete}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="Remove keybinding"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// KEYBOARD SHORTCUTS PANEL
// ============================================================================

interface KeyboardShortcutsPanelProps {
    shortcuts?: KeyboardShortcut[]
    onUpdateShortcut?: (id: string, keybinding: string) => void
    onResetShortcut?: (id: string) => void
    onDeleteShortcut?: (id: string) => void
    onExport?: () => void
    onImport?: () => void
    className?: string
}

export function KeyboardShortcutsPanel({
    shortcuts: propShortcuts,
    onUpdateShortcut,
    onResetShortcut,
    onDeleteShortcut,
    onExport,
    onImport,
    className = '',
}: KeyboardShortcutsPanelProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all')
    const [editingId, setEditingId] = useState<string | null>(null)

    // Demo shortcuts
    const defaultShortcuts: KeyboardShortcut[] = [
        { id: 's1', command: 'workbench.action.files.save', label: 'Save File', keybinding: 'Cmd+S', category: 'general' },
        { id: 's2', command: 'workbench.action.files.saveAll', label: 'Save All', keybinding: 'Cmd+Alt+S', category: 'general' },
        { id: 's3', command: 'workbench.action.quickOpen', label: 'Quick Open', keybinding: 'Cmd+P', category: 'navigation' },
        { id: 's4', command: 'workbench.action.showCommands', label: 'Command Palette', keybinding: 'Cmd+Shift+P', category: 'navigation' },
        { id: 's5', command: 'editor.action.formatDocument', label: 'Format Document', keybinding: 'Shift+Alt+F', category: 'editor' },
        { id: 's6', command: 'editor.action.commentLine', label: 'Toggle Comment', keybinding: 'Cmd+/', category: 'editor', isCustom: true },
        { id: 's7', command: 'workbench.action.findInFiles', label: 'Search in Files', keybinding: 'Cmd+Shift+F', category: 'search' },
        { id: 's8', command: 'editor.action.startFindReplaceAction', label: 'Find and Replace', keybinding: 'Cmd+H', category: 'search' },
        { id: 's9', command: 'workbench.action.debug.start', label: 'Start Debugging', keybinding: 'F5', category: 'debug' },
        { id: 's10', command: 'workbench.action.debug.stepOver', label: 'Step Over', keybinding: 'F10', category: 'debug' },
        { id: 's11', command: 'workbench.action.terminal.new', label: 'New Terminal', keybinding: 'Ctrl+`', category: 'terminal' },
        { id: 's12', command: 'git.commit', label: 'Git Commit', keybinding: 'Ctrl+Enter', category: 'git' },
    ]

    const shortcuts = propShortcuts || defaultShortcuts

    // Categories
    const categories: { id: ShortcutCategory | 'all'; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'general', label: 'General' },
        { id: 'editor', label: 'Editor' },
        { id: 'navigation', label: 'Navigation' },
        { id: 'search', label: 'Search' },
        { id: 'debug', label: 'Debug' },
        { id: 'terminal', label: 'Terminal' },
        { id: 'git', label: 'Git' },
    ]

    // Filter shortcuts
    const filteredShortcuts = useMemo(() => {
        return shortcuts.filter(shortcut => {
            if (selectedCategory !== 'all' && shortcut.category !== selectedCategory) return false
            if (searchQuery) {
                const query = searchQuery.toLowerCase()
                return (
                    shortcut.label.toLowerCase().includes(query) ||
                    shortcut.command.toLowerCase().includes(query) ||
                    shortcut.keybinding.toLowerCase().includes(query)
                )
            }
            return true
        })
    }, [shortcuts, selectedCategory, searchQuery])

    // Handle edit save
    const handleEditSave = useCallback((id: string, keybinding: string) => {
        onUpdateShortcut?.(id, keybinding)
        setEditingId(null)
    }, [onUpdateShortcut])

    return (
        <div className={`flex flex-col h-full bg-slate-900 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-medium text-white">Keyboard Shortcuts</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onImport}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Import"
                    >
                        <Upload className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onExport}
                        className="p-1.5 text-gray-400 hover:text-white transition-colors"
                        title="Export"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="px-4 py-2 border-b border-white/5">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search shortcuts..."
                        className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${selectedCategory === cat.id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Shortcuts list */}
            <div className="flex-1 overflow-y-auto">
                {filteredShortcuts.length > 0 ? (
                    filteredShortcuts.map(shortcut => (
                        <ShortcutItem
                            key={shortcut.id}
                            shortcut={shortcut}
                            isEditing={editingId === shortcut.id}
                            onEdit={() => setEditingId(shortcut.id)}
                            onEditSave={(kb) => handleEditSave(shortcut.id, kb)}
                            onEditCancel={() => setEditingId(null)}
                            onReset={shortcut.isCustom ? () => onResetShortcut?.(shortcut.id) : undefined}
                            onDelete={() => onDeleteShortcut?.(shortcut.id)}
                        />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Keyboard className="w-8 h-8 mb-2 opacity-30" />
                        <p className="text-sm">No shortcuts found</p>
                    </div>
                )}
            </div>

            {/* Footer info */}
            <div className="px-4 py-2 border-t border-white/5 text-xs text-gray-600 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Click on a keybinding to change it
            </div>
        </div>
    )
}
