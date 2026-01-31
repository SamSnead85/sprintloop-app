/**
 * SprintLoop Model Selector - Cursor-Inspired Design
 * 
 * Follows Cursor IDE's approach:
 * - Compact trigger button for top bar placement
 * - Full-width popover that opens above/below with smart positioning
 * - Portal rendering to avoid z-index issues
 * - Keyboard navigation support
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Cpu, Sparkles, Zap, Brain } from 'lucide-react'
import { AI_MODELS, type AIModel } from '../config/models'

interface ModelSelectorProps {
    selectedModel: AIModel
    onModelChange: (model: AIModel) => void
    compact?: boolean
    placement?: 'top-bar' | 'inline' | 'chat-input'
}

// Provider icons mapping
const providerIcons: Record<string, React.ReactNode> = {
    'OpenAI': <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
    'Anthropic': <Brain className="w-3.5 h-3.5 text-orange-400" />,
    'Google': <Zap className="w-3.5 h-3.5 text-blue-400" />,
    'Cursor': <Cpu className="w-3.5 h-3.5 text-purple-400" />,
}

export function ModelSelector({
    selectedModel,
    onModelChange,
    compact = false,
    placement = 'inline'
}: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [dropdownPosition, setDropdownPosition] = useState<'above' | 'below'>('below')
    const triggerRef = useRef<HTMLButtonElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Calculate optimal dropdown position
    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - triggerRect.bottom
        const spaceAbove = triggerRect.top
        const dropdownHeight = 320 // Estimated dropdown height

        // Open above if not enough space below
        setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'above' : 'below')
    }, [])

    // Update position when opening
    useEffect(() => {
        if (isOpen) {
            updatePosition()
        }
    }, [isOpen, updatePosition])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault()
                setIsOpen(true)
                setSelectedIndex(AI_MODELS.findIndex(m => m.id === selectedModel.id))
            }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setSelectedIndex(i => Math.min(i + 1, AI_MODELS.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setSelectedIndex(i => Math.max(i - 1, 0))
                break
            case 'Enter':
            case ' ':
                e.preventDefault()
                onModelChange(AI_MODELS[selectedIndex])
                setIsOpen(false)
                break
            case 'Escape':
                e.preventDefault()
                setIsOpen(false)
                break
        }
    }, [isOpen, selectedIndex, selectedModel.id, onModelChange])

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    // Get trigger rect for portal positioning
    const getTriggerRect = () => {
        if (!triggerRef.current) return null
        return triggerRef.current.getBoundingClientRect()
    }

    const triggerRect = isOpen ? getTriggerRect() : null

    // Determine trigger appearance based on placement
    const getTriggerClasses = () => {
        const base = 'flex items-center gap-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50'

        switch (placement) {
            case 'top-bar':
                return `${base} px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20`
            case 'chat-input':
                return `${base} px-2 py-1 bg-transparent hover:bg-white/5 border border-transparent`
            default:
                return `${base} px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10`
        }
    }

    return (
        <>
            {/* Trigger Button */}
            <button
                ref={triggerRef}
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                className={getTriggerClasses()}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-1.5">
                    {providerIcons[selectedModel.provider] || <Cpu className="w-3.5 h-3.5 text-purple-400" />}
                    <span className={`font-medium text-white ${compact ? 'text-xs' : 'text-sm'}`}>
                        {selectedModel.name}
                    </span>
                </div>
                {!compact && (
                    <span className="text-xs text-gray-500 hidden sm:inline">{selectedModel.provider}</span>
                )}
                <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Dropdown Portal */}
            {isOpen && triggerRect && createPortal(
                <>
                    {/* Backdrop - highest z-index to ensure it's above everything */}
                    <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />

                    {/* Dropdown */}
                    <div
                        ref={dropdownRef}
                        role="listbox"
                        className={`
                            fixed z-[10000] w-80 max-h-80 overflow-hidden
                            bg-slate-900 border border-white/10 rounded-xl shadow-2xl shadow-black/50
                            animate-in fade-in-0 zoom-in-95 duration-150
                        `}
                        style={{
                            left: Math.min(triggerRect.left, window.innerWidth - 320 - 16),
                            ...(dropdownPosition === 'below'
                                ? { top: triggerRect.bottom + 8 }
                                : { bottom: window.innerHeight - triggerRect.top + 8 }
                            ),
                        }}
                    >
                        {/* Header */}
                        <div className="px-3 py-2 border-b border-white/5 bg-slate-800/50">
                            <div className="text-xs font-medium text-gray-400">Select AI Model</div>
                        </div>

                        {/* Model List */}
                        <div className="overflow-y-auto max-h-64 py-1">
                            {AI_MODELS.map((model, index) => (
                                <button
                                    key={model.id}
                                    onClick={() => {
                                        onModelChange(model)
                                        setIsOpen(false)
                                    }}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    role="option"
                                    aria-selected={selectedModel.id === model.id}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors
                                        ${selectedModel.id === model.id
                                            ? 'bg-purple-500/15'
                                            : index === selectedIndex
                                                ? 'bg-white/5'
                                                : 'hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {/* Provider Icon */}
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                        {providerIcons[model.provider] || <Cpu className="w-4 h-4 text-gray-400" />}
                                    </div>

                                    {/* Model Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${selectedModel.id === model.id ? 'text-white' : 'text-gray-200'}`}>
                                                {model.name}
                                            </span>
                                            {model.recommended && (
                                                <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">
                                                    <Zap className="w-2.5 h-2.5" />
                                                    Best
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-xs text-gray-500">{model.provider}</span>
                                            <span className="text-xs text-gray-600">•</span>
                                            <span className="text-xs text-gray-600 truncate">{model.description}</span>
                                        </div>
                                    </div>

                                    {/* Check mark */}
                                    {selectedModel.id === model.id && (
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Footer hint */}
                        <div className="px-3 py-2 border-t border-white/5 bg-slate-800/30">
                            <div className="flex items-center gap-4 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1 py-0.5 bg-white/5 rounded">↑↓</kbd>
                                    Navigate
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1 py-0.5 bg-white/5 rounded">↵</kbd>
                                    Select
                                </span>
                                <span className="flex items-center gap-1">
                                    <kbd className="px-1 py-0.5 bg-white/5 rounded">Esc</kbd>
                                    Close
                                </span>
                            </div>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </>
    )
}

// Compact model indicator for status bar
export function ModelIndicator({ model, onClick }: { model: AIModel; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors"
        >
            {providerIcons[model.provider] || <Cpu className="w-3 h-3 text-gray-400" />}
            <span className="text-xs text-gray-400">{model.name}</span>
        </button>
    )
}
