/**
 * SprintLoop Keyboard Navigation System
 * 
 * Phase 221-260: Advanced keyboard navigation
 * - Global shortcuts
 * - Context-aware navigation
 * - Vim-style navigation
 * - Command chains
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// TYPES
// ============================================================================

type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta'

interface KeyBinding {
    key: string
    modifiers?: ModifierKey[]
    action: () => void
    description: string
    scope?: string
    when?: () => boolean
}

interface KeySequence {
    sequence: string[]
    action: () => void
    description: string
    timeout?: number
}

interface KeyboardNavigationState {
    activeScope: string
    isRecording: boolean
    pendingSequence: string[]
    lastKeyTime: number
}

interface KeyboardContextValue {
    state: KeyboardNavigationState
    registerBinding: (binding: KeyBinding) => () => void
    registerSequence: (sequence: KeySequence) => () => void
    setScope: (scope: string) => void
    getBindingsForScope: (scope: string) => KeyBinding[]
    startRecording: () => void
    stopRecording: () => string
}

// ============================================================================
// CONTEXT
// ============================================================================

const KeyboardContext = createContext<KeyboardContextValue | null>(null)

export function useKeyboard() {
    const context = useContext(KeyboardContext)
    if (!context) throw new Error('useKeyboard must be used within KeyboardProvider')
    return context
}

// ============================================================================
// KEYBOARD PROVIDER
// ============================================================================

interface KeyboardProviderProps {
    children: React.ReactNode
    sequenceTimeout?: number
}

export function KeyboardProvider({
    children,
    sequenceTimeout = 1000,
}: KeyboardProviderProps) {
    const [state, setState] = useState<KeyboardNavigationState>({
        activeScope: 'global',
        isRecording: false,
        pendingSequence: [],
        lastKeyTime: 0,
    })

    const bindingsRef = useRef<Map<string, KeyBinding>>(new Map())
    const sequencesRef = useRef<Map<string, KeySequence>>(new Map())
    const recordedKeysRef = useRef<string[]>([])

    const getKeyId = (key: string, modifiers: ModifierKey[] = []) => {
        const mods = modifiers.sort().join('+')
        return mods ? `${mods}+${key.toLowerCase()}` : key.toLowerCase()
    }

    const registerBinding = useCallback((binding: KeyBinding) => {
        const id = getKeyId(binding.key, binding.modifiers)
        const scopedId = `${binding.scope || 'global'}:${id}`
        bindingsRef.current.set(scopedId, binding)

        return () => {
            bindingsRef.current.delete(scopedId)
        }
    }, [])

    const registerSequence = useCallback((sequence: KeySequence) => {
        const id = sequence.sequence.join(',')
        sequencesRef.current.set(id, sequence)

        return () => {
            sequencesRef.current.delete(id)
        }
    }, [])

    const setScope = useCallback((scope: string) => {
        setState(prev => ({ ...prev, activeScope: scope }))
    }, [])

    const getBindingsForScope = useCallback((scope: string) => {
        return Array.from(bindingsRef.current.entries())
            .filter(([key]) => key.startsWith(`${scope}:`) || key.startsWith('global:'))
            .map(([, binding]) => binding)
    }, [])

    const startRecording = useCallback(() => {
        recordedKeysRef.current = []
        setState(prev => ({ ...prev, isRecording: true }))
    }, [])

    const stopRecording = useCallback(() => {
        setState(prev => ({ ...prev, isRecording: false }))
        return recordedKeysRef.current.join(' ')
    }, [])

    // Handle key events
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts in inputs
            const target = e.target as HTMLElement
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return
            }

            const modifiers: ModifierKey[] = []
            if (e.ctrlKey) modifiers.push('ctrl')
            if (e.altKey) modifiers.push('alt')
            if (e.shiftKey) modifiers.push('shift')
            if (e.metaKey) modifiers.push('meta')

            const keyId = getKeyId(e.key, modifiers)

            // Recording mode
            if (state.isRecording) {
                recordedKeysRef.current.push(keyId)
                return
            }

            // Check for key sequences
            const now = Date.now()
            const timeDiff = now - state.lastKeyTime

            if (timeDiff > sequenceTimeout) {
                setState(prev => ({ ...prev, pendingSequence: [], lastKeyTime: now }))
            }

            const newSequence = [...state.pendingSequence, keyId]
            const sequenceKey = newSequence.join(',')

            // Check for exact match
            const matchedSequence = sequencesRef.current.get(sequenceKey)
            if (matchedSequence) {
                e.preventDefault()
                matchedSequence.action()
                setState(prev => ({ ...prev, pendingSequence: [], lastKeyTime: now }))
                return
            }

            // Check for partial match (for sequences in progress)
            const hasPartialMatch = Array.from(sequencesRef.current.keys()).some(
                key => key.startsWith(sequenceKey + ',')
            )

            if (hasPartialMatch) {
                setState(prev => ({
                    ...prev,
                    pendingSequence: newSequence,
                    lastKeyTime: now,
                }))
                return
            }

            // Check for single key binding
            const scopedId = `${state.activeScope}:${keyId}`
            const globalId = `global:${keyId}`

            const binding =
                bindingsRef.current.get(scopedId) ||
                bindingsRef.current.get(globalId)

            if (binding && (!binding.when || binding.when())) {
                e.preventDefault()
                binding.action()
            }

            setState(prev => ({ ...prev, pendingSequence: [], lastKeyTime: now }))
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [state.activeScope, state.isRecording, state.pendingSequence, state.lastKeyTime, sequenceTimeout])

    return (
        <KeyboardContext.Provider
            value={{
                state,
                registerBinding,
                registerSequence,
                setScope,
                getBindingsForScope,
                startRecording,
                stopRecording,
            }}
        >
            {children}
        </KeyboardContext.Provider>
    )
}

// ============================================================================
// USE SHORTCUT HOOK
// ============================================================================

interface UseShortcutOptions {
    key: string
    modifiers?: ModifierKey[]
    action: () => void
    description: string
    scope?: string
    when?: () => boolean
    enabled?: boolean
}

export function useShortcut({
    key,
    modifiers,
    action,
    description,
    scope,
    when,
    enabled = true,
}: UseShortcutOptions) {
    const { registerBinding } = useKeyboard()

    useEffect(() => {
        if (!enabled) return

        return registerBinding({
            key,
            modifiers,
            action,
            description,
            scope,
            when,
        })
    }, [key, modifiers, action, description, scope, when, enabled, registerBinding])
}

// ============================================================================
// USE KEY SEQUENCE HOOK
// ============================================================================

interface UseKeySequenceOptions {
    sequence: string[]
    action: () => void
    description: string
    enabled?: boolean
}

export function useKeySequence({
    sequence,
    action,
    description,
    enabled = true,
}: UseKeySequenceOptions) {
    const { registerSequence } = useKeyboard()

    useEffect(() => {
        if (!enabled) return

        return registerSequence({
            sequence,
            action,
            description,
        })
    }, [sequence, action, description, enabled, registerSequence])
}

// ============================================================================
// VIM MODE PROVIDER
// ============================================================================

type VimMode = 'normal' | 'insert' | 'visual' | 'command'

interface VimModeContextValue {
    mode: VimMode
    setMode: (mode: VimMode) => void
    isNormalMode: boolean
    isInsertMode: boolean
    isVisualMode: boolean
    isCommandMode: boolean
}

const VimModeContext = createContext<VimModeContextValue | null>(null)

export function useVimMode() {
    const context = useContext(VimModeContext)
    if (!context) throw new Error('useVimMode must be used within VimModeProvider')
    return context
}

interface VimModeProviderProps {
    children: React.ReactNode
    enabled?: boolean
}

export function VimModeProvider({ children, enabled = true }: VimModeProviderProps) {
    const [mode, setMode] = useState<VimMode>('normal')

    useEffect(() => {
        if (!enabled) return

        const handleKeyDown = (e: KeyboardEvent) => {
            // ESC -> Normal mode
            if (e.key === 'Escape') {
                setMode('normal')
                return
            }

            if (mode === 'normal') {
                switch (e.key) {
                    case 'i':
                        e.preventDefault()
                        setMode('insert')
                        break
                    case 'v':
                        e.preventDefault()
                        setMode('visual')
                        break
                    case ':':
                        e.preventDefault()
                        setMode('command')
                        break
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [mode, enabled])

    if (!enabled) {
        return <>{children}</>
    }

    return (
        <VimModeContext.Provider
            value={{
                mode,
                setMode,
                isNormalMode: mode === 'normal',
                isInsertMode: mode === 'insert',
                isVisualMode: mode === 'visual',
                isCommandMode: mode === 'command',
            }}
        >
            {children}
        </VimModeContext.Provider>
    )
}

// ============================================================================
// ARROW KEY NAVIGATION
// ============================================================================

interface UseArrowNavigationOptions {
    items: HTMLElement[] | null
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
    onSelect?: (index: number) => void
}

export function useArrowNavigation({
    items,
    orientation = 'vertical',
    loop = true,
    onSelect,
}: UseArrowNavigationOptions) {
    const [focusedIndex, setFocusedIndex] = useState(0)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!items || items.length === 0) return

            let newIndex = focusedIndex

            const canMoveVertical = orientation !== 'horizontal'
            const canMoveHorizontal = orientation !== 'vertical'

            switch (e.key) {
                case 'ArrowUp':
                    if (canMoveVertical) {
                        e.preventDefault()
                        newIndex = loop
                            ? (focusedIndex - 1 + items.length) % items.length
                            : Math.max(focusedIndex - 1, 0)
                    }
                    break
                case 'ArrowDown':
                    if (canMoveVertical) {
                        e.preventDefault()
                        newIndex = loop
                            ? (focusedIndex + 1) % items.length
                            : Math.min(focusedIndex + 1, items.length - 1)
                    }
                    break
                case 'ArrowLeft':
                    if (canMoveHorizontal) {
                        e.preventDefault()
                        newIndex = loop
                            ? (focusedIndex - 1 + items.length) % items.length
                            : Math.max(focusedIndex - 1, 0)
                    }
                    break
                case 'ArrowRight':
                    if (canMoveHorizontal) {
                        e.preventDefault()
                        newIndex = loop
                            ? (focusedIndex + 1) % items.length
                            : Math.min(focusedIndex + 1, items.length - 1)
                    }
                    break
                case 'Home':
                    e.preventDefault()
                    newIndex = 0
                    break
                case 'End':
                    e.preventDefault()
                    newIndex = items.length - 1
                    break
                case 'Enter':
                case ' ':
                    e.preventDefault()
                    onSelect?.(focusedIndex)
                    return
            }

            if (newIndex !== focusedIndex) {
                setFocusedIndex(newIndex)
                items[newIndex]?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [items, focusedIndex, orientation, loop, onSelect])

    return {
        focusedIndex,
        setFocusedIndex,
        focusItem: (index: number) => {
            setFocusedIndex(index)
            items?.[index]?.focus()
        },
    }
}

// ============================================================================
// KEYBOARD SHORTCUTS DISPLAY
// ============================================================================

interface ShortcutDisplayProps {
    shortcut: string
    className?: string
}

export function ShortcutDisplay({ shortcut, className = '' }: ShortcutDisplayProps) {
    const keys = shortcut.split('+').map(key => {
        switch (key.toLowerCase()) {
            case 'ctrl':
                return '⌃'
            case 'alt':
                return '⌥'
            case 'shift':
                return '⇧'
            case 'meta':
            case 'cmd':
                return '⌘'
            case 'enter':
                return '↵'
            case 'escape':
            case 'esc':
                return '⎋'
            case 'backspace':
                return '⌫'
            case 'delete':
                return '⌦'
            case 'tab':
                return '⇥'
            case 'space':
                return '␣'
            case 'up':
                return '↑'
            case 'down':
                return '↓'
            case 'left':
                return '←'
            case 'right':
                return '→'
            default:
                return key.toUpperCase()
        }
    })

    return (
        <span className={`inline-flex items-center gap-1 ${className}`}>
            {keys.map((key, i) => (
                <kbd
                    key={i}
                    className="px-1.5 py-0.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-gray-400"
                >
                    {key}
                </kbd>
            ))}
        </span>
    )
}

// ============================================================================
// SHORTCUT HINT
// ============================================================================

interface ShortcutHintProps {
    children: React.ReactNode
    shortcut: string
    placement?: 'top' | 'right' | 'bottom' | 'left'
    className?: string
}

export function ShortcutHint({
    children,
    shortcut,
    placement = 'top',
    className = '',
}: ShortcutHintProps) {
    const [isVisible, setIsVisible] = useState(false)

    const placementStyles = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    }

    return (
        <div
            className={`relative inline-block ${className}`}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    className={`
                        absolute z-50 px-2 py-1 bg-slate-800 rounded-lg shadow-lg
                        border border-slate-700 whitespace-nowrap
                        animate-in fade-in zoom-in-95 duration-150
                        ${placementStyles[placement]}
                    `}
                >
                    <ShortcutDisplay shortcut={shortcut} />
                </div>
            )}
        </div>
    )
}

// ============================================================================
// KEYBOARD SHORTCUTS PANEL
// ============================================================================

interface ShortcutCategory {
    name: string
    shortcuts: Array<{
        shortcut: string
        description: string
    }>
}

interface ShortcutsPanelProps {
    categories: ShortcutCategory[]
    isOpen: boolean
    onClose: () => void
}

export function ShortcutsPanel({ categories, isOpen, onClose }: ShortcutsPanelProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose()
            }
        }

        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-900 border border-white/10 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-auto shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Keyboard Shortcuts</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                    {categories.map(category => (
                        <div key={category.name}>
                            <h3 className="text-sm font-medium text-gray-400 mb-3">
                                {category.name}
                            </h3>
                            <div className="space-y-2">
                                {category.shortcuts.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between py-1.5"
                                    >
                                        <span className="text-sm text-gray-300">
                                            {item.description}
                                        </span>
                                        <ShortcutDisplay shortcut={item.shortcut} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
