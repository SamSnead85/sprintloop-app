/**
 * SprintLoop Tooltip System
 * 
 * Phase 2401-2450: Tooltip system
 * - Hover tooltips
 * - Rich content
 * - Keyboard shortcuts display
 * - Positioning
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

// ============================================================================
// TYPES
// ============================================================================

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'
type TooltipAlign = 'start' | 'center' | 'end'

interface TooltipProps {
    content: React.ReactNode
    shortcut?: string
    position?: TooltipPosition
    align?: TooltipAlign
    delay?: number
    disabled?: boolean
    children: React.ReactElement
    className?: string
}

interface Position {
    top: number
    left: number
}

// ============================================================================
// KEYBOARD SHORTCUT DISPLAY
// ============================================================================

interface KeyboardShortcutProps {
    shortcut: string
    className?: string
}

export function KeyboardShortcut({ shortcut, className = '' }: KeyboardShortcutProps) {
    const keys = shortcut.split('+').map(k => k.trim())

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
        }
        return keyMap[key.toLowerCase()] || key.toUpperCase()
    }

    return (
        <span className={`inline-flex items-center gap-0.5 ${className}`}>
            {keys.map((key, i) => (
                <kbd
                    key={i}
                    className="min-w-4 px-1 py-0.5 bg-black/30 border border-white/10 rounded text-[10px] text-gray-400 text-center"
                >
                    {formatKey(key)}
                </kbd>
            ))}
        </span>
    )
}

// ============================================================================
// TOOLTIP
// ============================================================================

export function Tooltip({
    content,
    shortcut,
    position = 'top',
    align = 'center',
    delay = 500,
    disabled = false,
    children,
    className = '',
}: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [tooltipPosition, setTooltipPosition] = useState<Position>({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout>()

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current || !tooltipRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const tooltipRect = tooltipRef.current.getBoundingClientRect()
        const gap = 8

        let top = 0
        let left = 0

        // Position
        switch (position) {
            case 'top':
                top = triggerRect.top - tooltipRect.height - gap
                break
            case 'bottom':
                top = triggerRect.bottom + gap
                break
            case 'left':
                left = triggerRect.left - tooltipRect.width - gap
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
                break
            case 'right':
                left = triggerRect.right + gap
                top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
                break
        }

        // Alignment for top/bottom
        if (position === 'top' || position === 'bottom') {
            switch (align) {
                case 'start':
                    left = triggerRect.left
                    break
                case 'center':
                    left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
                    break
                case 'end':
                    left = triggerRect.right - tooltipRect.width
                    break
            }
        }

        // Alignment for left/right
        if (position === 'left' || position === 'right') {
            switch (align) {
                case 'start':
                    top = triggerRect.top
                    break
                case 'center':
                    top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
                    break
                case 'end':
                    top = triggerRect.bottom - tooltipRect.height
                    break
            }
        }

        // Keep in viewport
        if (left < 8) left = 8
        if (left + tooltipRect.width > window.innerWidth - 8) {
            left = window.innerWidth - tooltipRect.width - 8
        }
        if (top < 8) top = 8
        if (top + tooltipRect.height > window.innerHeight - 8) {
            top = window.innerHeight - tooltipRect.height - 8
        }

        setTooltipPosition({ top, left })
    }, [position, align])

    const showTooltip = useCallback(() => {
        if (disabled) return
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true)
        }, delay)
    }, [delay, disabled])

    const hideTooltip = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
        setIsVisible(false)
    }, [])

    useEffect(() => {
        if (isVisible) {
            calculatePosition()
        }
    }, [isVisible, calculatePosition])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    // Clone child to add event handlers
    const trigger = React.cloneElement(children, {
        ref: triggerRef,
        onMouseEnter: (e: React.MouseEvent) => {
            showTooltip()
            children.props.onMouseEnter?.(e)
        },
        onMouseLeave: (e: React.MouseEvent) => {
            hideTooltip()
            children.props.onMouseLeave?.(e)
        },
        onFocus: (e: React.FocusEvent) => {
            showTooltip()
            children.props.onFocus?.(e)
        },
        onBlur: (e: React.FocusEvent) => {
            hideTooltip()
            children.props.onBlur?.(e)
        },
    })

    return (
        <>
            {trigger}
            {isVisible && createPortal(
                <div
                    ref={tooltipRef}
                    role="tooltip"
                    className={`
                        fixed z-[9999] px-2 py-1.5 bg-slate-800 border border-white/10 rounded-lg shadow-xl
                        text-xs text-white whitespace-nowrap pointer-events-none
                        animate-in fade-in-0 zoom-in-95 duration-150
                        ${className}
                    `}
                    style={{
                        top: tooltipPosition.top,
                        left: tooltipPosition.left,
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span>{content}</span>
                        {shortcut && <KeyboardShortcut shortcut={shortcut} />}
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}

// ============================================================================
// RICH TOOLTIP
// ============================================================================

interface RichTooltipProps {
    title: string
    description?: string
    shortcut?: string
    image?: string
    position?: TooltipPosition
    delay?: number
    disabled?: boolean
    children: React.ReactElement
}

export function RichTooltip({
    title,
    description,
    shortcut,
    image,
    position = 'top',
    delay = 500,
    disabled = false,
    children,
}: RichTooltipProps) {
    const content = (
        <div className="max-w-xs">
            {image && (
                <img src={image} alt="" className="w-full h-24 object-cover rounded mb-2" />
            )}
            <div className="flex items-center justify-between gap-4">
                <span className="font-medium">{title}</span>
                {shortcut && <KeyboardShortcut shortcut={shortcut} />}
            </div>
            {description && (
                <p className="mt-1 text-gray-400 text-[11px] whitespace-normal">{description}</p>
            )}
        </div>
    )

    return (
        <Tooltip
            content={content}
            position={position}
            delay={delay}
            disabled={disabled}
        >
            {children}
        </Tooltip>
    )
}

// ============================================================================
// INFO TOOLTIP
// ============================================================================

interface InfoTooltipProps {
    content: React.ReactNode
    position?: TooltipPosition
    className?: string
}

export function InfoTooltip({ content, position = 'top', className = '' }: InfoTooltipProps) {
    return (
        <Tooltip content={content} position={position}>
            <button
                type="button"
                className={`inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 text-gray-400 text-[10px] hover:bg-white/20 ${className}`}
            >
                ?
            </button>
        </Tooltip>
    )
}
