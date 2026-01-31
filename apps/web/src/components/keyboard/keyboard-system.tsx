/**
 * SprintLoop Keyboard Shortcuts System
 * 
 * Phase 3151-3200: Hotkeys
 * - Keyboard shortcut registration
 * - Shortcut display
 * - Hotkey hooks
 */

import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface Shortcut {
    id: string
    keys: string[]
    description: string
    handler: () => void
    enabled?: boolean
    scope?: string
}

interface ShortcutContextValue {
    shortcuts: Map<string, Shortcut>
    registerShortcut: (shortcut: Shortcut) => void
    unregisterShortcut: (id: string) => void
    activeScope: string
    setActiveScope: (scope: string) => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const ShortcutContext = createContext<ShortcutContextValue | null>(null)

export function ShortcutProvider({ children }: { children: React.ReactNode }) {
    const [shortcuts, setShortcuts] = useState<Map<string, Shortcut>>(new Map())
    const [activeScope, setActiveScope] = useState('global')
    const shortcutsRef = useRef(shortcuts)
    shortcutsRef.current = shortcuts

    const registerShortcut = useCallback((shortcut: Shortcut) => {
        setShortcuts(prev => {
            const next = new Map(prev)
            next.set(shortcut.id, shortcut)
            return next
        })
    }, [])

    const unregisterShortcut = useCallback((id: string) => {
        setShortcuts(prev => {
            const next = new Map(prev)
            next.delete(id)
            return next
        })
    }, [])

    // Global keyboard handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Build current key combination
            const keys: string[] = []
            if (e.ctrlKey || e.metaKey) keys.push('Cmd')
            if (e.altKey) keys.push('Alt')
            if (e.shiftKey) keys.push('Shift')

            // Add the actual key
            if (e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Shift') {
                keys.push(e.key.toUpperCase())
            }

            const keyCombo = keys.join('+')

            // Check for matching shortcuts
            for (const shortcut of shortcutsRef.current.values()) {
                if (shortcut.enabled === false) continue
                if (shortcut.scope && shortcut.scope !== activeScope) continue

                const shortcutCombo = shortcut.keys.join('+')
                if (shortcutCombo === keyCombo) {
                    e.preventDefault()
                    shortcut.handler()
                    break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [activeScope])

    return (
        <ShortcutContext.Provider
            value={{
                shortcuts,
                registerShortcut,
                unregisterShortcut,
                activeScope,
                setActiveScope,
            }}
        >
            {children}
        </ShortcutContext.Provider>
    )
}

export function useShortcuts() {
    const context = useContext(ShortcutContext)
    if (!context) {
        throw new Error('useShortcuts must be used within ShortcutProvider')
    }
    return context
}

// ============================================================================
// USE HOTKEY HOOK
// ============================================================================

interface UseHotkeyOptions {
    enabled?: boolean
    scope?: string
    preventDefault?: boolean
}

export function useHotkey(
    keys: string[],
    handler: () => void,
    options: UseHotkeyOptions = {}
) {
    const { enabled = true, scope, preventDefault = true } = options
    const handlerRef = useRef(handler)
    handlerRef.current = handler

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            const pressedKeys: string[] = []
            if (e.ctrlKey || e.metaKey) pressedKeys.push('Cmd')
            if (e.altKey) pressedKeys.push('Alt')
            if (e.shiftKey) pressedKeys.push('Shift')
            if (e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Shift') {
                pressedKeys.push(e.key.toUpperCase())
            }

            const matches = keys.every(k => pressedKeys.includes(k.toUpperCase())) &&
                pressedKeys.length === keys.length

            if (matches) {
                if (preventDefault) e.preventDefault()
                handlerRef.current()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [keys, enabled, preventDefault])
}

// ============================================================================
// KEYBOARD KEY DISPLAY
// ============================================================================

interface KbdProps {
    children: string
    variant?: 'default' | 'outlined' | 'filled'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const keyLabels: Record<string, string> = {
    'Cmd': '⌘',
    'Ctrl': '⌃',
    'Alt': '⌥',
    'Shift': '⇧',
    'Enter': '↵',
    'Tab': '⇥',
    'Escape': 'Esc',
    'Backspace': '⌫',
    'Delete': '⌦',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Space': '␣',
}

export function Kbd({
    children,
    variant = 'default',
    size = 'md',
    className = '',
}: KbdProps) {
    const label = keyLabels[children] || children

    const sizeStyles = {
        sm: 'text-[10px] min-w-4 h-4 px-1',
        md: 'text-xs min-w-5 h-5 px-1.5',
        lg: 'text-sm min-w-6 h-6 px-2',
    }

    const variantStyles = {
        default: 'bg-white/5 border border-white/10 text-gray-400',
        outlined: 'border border-white/10 text-gray-400',
        filled: 'bg-slate-700 text-gray-300',
    }

    return (
        <kbd
            className={`
                inline-flex items-center justify-center rounded font-mono font-medium
                ${sizeStyles[size]}
                ${variantStyles[variant]}
                ${className}
            `}
        >
            {label}
        </kbd>
    )
}

// ============================================================================
// KEYBOARD SHORTCUT DISPLAY
// ============================================================================

interface ShortcutDisplayProps {
    keys: string[]
    separator?: React.ReactNode
    variant?: 'default' | 'outlined' | 'filled'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function ShortcutDisplay({
    keys,
    separator = null,
    variant = 'default',
    size = 'md',
    className = '',
}: ShortcutDisplayProps) {
    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`}>
            {keys.map((key, index) => (
                <React.Fragment key={key}>
                    <Kbd variant={variant} size={size}>{key}</Kbd>
                    {index < keys.length - 1 && separator}
                </React.Fragment>
            ))}
        </span>
    )
}

// ============================================================================
// SHORTCUT HINT
// ============================================================================

interface ShortcutHintProps {
    label: string
    keys: string[]
    className?: string
}

export function ShortcutHint({
    label,
    keys,
    className = '',
}: ShortcutHintProps) {
    return (
        <div className={`flex items-center justify-between gap-4 ${className}`}>
            <span className="text-sm text-gray-400">{label}</span>
            <ShortcutDisplay keys={keys} size="sm" />
        </div>
    )
}

// ============================================================================
// SHORTCUTS PANEL
// ============================================================================

interface ShortcutsPanelProps {
    shortcuts: Array<{
        category: string
        items: Array<{ label: string; keys: string[] }>
    }>
    className?: string
}

export function ShortcutsPanel({
    shortcuts,
    className = '',
}: ShortcutsPanelProps) {
    const [searchQuery, setSearchQuery] = useState('')

    const filteredShortcuts = shortcuts
        .map(category => ({
            ...category,
            items: category.items.filter(item =>
                item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.keys.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()))
            ),
        }))
        .filter(category => category.items.length > 0)

    return (
        <div className={className}>
            {/* Search */}
            <div className="mb-4">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shortcuts..."
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
            </div>

            {/* Categories */}
            <div className="space-y-6">
                {filteredShortcuts.map(category => (
                    <div key={category.category}>
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                            {category.category}
                        </h3>
                        <div className="space-y-2">
                            {category.items.map(item => (
                                <ShortcutHint
                                    key={item.label}
                                    label={item.label}
                                    keys={item.keys}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filteredShortcuts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No shortcuts found
                </div>
            )}
        </div>
    )
}

// ============================================================================
// KEYBOARD LISTENER (for recording shortcuts)
// ============================================================================

interface KeyboardListenerProps {
    onCapture: (keys: string[]) => void
    children: React.ReactNode
    className?: string
}

export function KeyboardListener({
    onCapture,
    children,
    className = '',
}: KeyboardListenerProps) {
    const [isListening, setIsListening] = useState(false)
    const [capturedKeys, setCapturedKeys] = useState<string[]>([])

    useEffect(() => {
        if (!isListening) return

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault()

            const keys: string[] = []
            if (e.ctrlKey || e.metaKey) keys.push('Cmd')
            if (e.altKey) keys.push('Alt')
            if (e.shiftKey) keys.push('Shift')
            if (e.key !== 'Control' && e.key !== 'Meta' && e.key !== 'Alt' && e.key !== 'Shift') {
                keys.push(e.key.toUpperCase())
            }

            setCapturedKeys(keys)
        }

        const handleKeyUp = () => {
            if (capturedKeys.length > 0) {
                onCapture(capturedKeys)
                setIsListening(false)
                setCapturedKeys([])
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [isListening, capturedKeys, onCapture])

    return (
        <button
            onClick={() => setIsListening(true)}
            className={`
                px-3 py-2 rounded-lg border transition-colors text-left
                ${isListening
                    ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                }
                ${className}
            `}
        >
            {isListening ? (
                capturedKeys.length > 0 ? (
                    <ShortcutDisplay keys={capturedKeys} size="sm" />
                ) : (
                    <span className="text-sm">Press keys...</span>
                )
            ) : (
                children
            )}
        </button>
    )
}
