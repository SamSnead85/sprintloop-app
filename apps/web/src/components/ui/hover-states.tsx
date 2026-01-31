/**
 * SprintLoop Hover & Focus States
 * 
 * Phase 181-200: Premium interaction states
 * - Consistent hover effects
 * - Focus ring styling
 * - Active state feedback
 * - Disabled state clarity
 * - Interactive cards
 */

import React, { useState, useRef, useCallback } from 'react'

// ============================================================================
// HOVER CARD
// ============================================================================

interface HoverCardProps {
    children: React.ReactNode
    hoverContent: React.ReactNode
    side?: 'top' | 'right' | 'bottom' | 'left'
    align?: 'start' | 'center' | 'end'
    delay?: number
    className?: string
}

export function HoverCard({
    children,
    hoverContent,
    side = 'bottom',
    align = 'center',
    delay = 200,
    className = '',
}: HoverCardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current) return

        const rect = triggerRef.current.getBoundingClientRect()
        const offset = 8

        let x = 0
        let y = 0

        switch (side) {
            case 'top':
                y = rect.top - offset
                break
            case 'bottom':
                y = rect.bottom + offset
                break
            case 'left':
                x = rect.left - offset
                break
            case 'right':
                x = rect.right + offset
                break
        }

        switch (align) {
            case 'start':
                if (side === 'top' || side === 'bottom') x = rect.left
                else y = rect.top
                break
            case 'center':
                if (side === 'top' || side === 'bottom') x = rect.left + rect.width / 2
                else y = rect.top + rect.height / 2
                break
            case 'end':
                if (side === 'top' || side === 'bottom') x = rect.right
                else y = rect.bottom
                break
        }

        setPosition({ x, y })
    }, [side, align])

    const handleMouseEnter = () => {
        timeoutRef.current = setTimeout(() => {
            calculatePosition()
            setIsOpen(true)
        }, delay)
    }

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsOpen(false)
    }

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`inline-block ${className}`}
            >
                {children}
            </div>

            {isOpen && (
                <div
                    className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
                    style={{
                        left: position.x,
                        top: position.y,
                        transform: `translate(${side === 'left' ? '-100%' :
                                side === 'right' ? '0' :
                                    align === 'start' ? '0' :
                                        align === 'end' ? '-100%' : '-50%'
                            }, ${side === 'top' ? '-100%' :
                                side === 'bottom' ? '0' :
                                    align === 'start' ? '0' :
                                        align === 'end' ? '-100%' : '-50%'
                            })`,
                    }}
                >
                    <div className="bg-slate-800 border border-white/10 rounded-xl p-4 shadow-xl backdrop-blur-xl">
                        {hoverContent}
                    </div>
                </div>
            )}
        </>
    )
}

// ============================================================================
// INTERACTIVE CARD
// ============================================================================

interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    variant?: 'default' | 'elevated' | 'bordered' | 'ghost'
    isSelected?: boolean
    isDisabled?: boolean
    onPress?: () => void
}

export function InteractiveCard({
    children,
    variant = 'default',
    isSelected = false,
    isDisabled = false,
    onPress,
    className = '',
    ...props
}: InteractiveCardProps) {
    const [isPressed, setIsPressed] = useState(false)

    const baseStyles = 'rounded-xl transition-all duration-200 outline-none'

    const variantStyles = {
        default: `
            bg-slate-900/50 border border-white/5
            hover:bg-slate-800/50 hover:border-white/10
            focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        `,
        elevated: `
            bg-slate-900/80 shadow-lg shadow-black/20
            hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5
            focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900
        `,
        bordered: `
            bg-transparent border-2 border-white/10
            hover:border-purple-500/50 hover:bg-purple-500/5
            focus-visible:border-purple-500 focus-visible:bg-purple-500/5
        `,
        ghost: `
            bg-transparent
            hover:bg-white/5
            focus-visible:ring-2 focus-visible:ring-purple-500/50
        `,
    }

    const selectedStyles = isSelected
        ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
        : ''

    const disabledStyles = isDisabled
        ? 'opacity-50 cursor-not-allowed pointer-events-none'
        : 'cursor-pointer'

    const pressedStyles = isPressed ? 'scale-[0.98]' : ''

    return (
        <div
            {...props}
            role={onPress ? 'button' : undefined}
            tabIndex={onPress && !isDisabled ? 0 : undefined}
            onClick={!isDisabled ? onPress : undefined}
            onKeyDown={(e) => {
                if (onPress && !isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onPress()
                }
            }}
            onMouseDown={() => setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
            className={`
                ${baseStyles}
                ${variantStyles[variant]}
                ${selectedStyles}
                ${disabledStyles}
                ${pressedStyles}
                ${className}
            `}
        >
            {children}
        </div>
    )
}

// ============================================================================
// FOCUS RING UTILITY
// ============================================================================

interface FocusRingProps {
    children: React.ReactNode
    color?: 'purple' | 'blue' | 'green' | 'red' | 'white'
    offset?: number
    width?: number
    className?: string
}

const focusColors = {
    purple: 'focus-visible:ring-purple-500',
    blue: 'focus-visible:ring-blue-500',
    green: 'focus-visible:ring-green-500',
    red: 'focus-visible:ring-red-500',
    white: 'focus-visible:ring-white',
}

export function FocusRing({
    children,
    color = 'purple',
    offset = 2,
    width = 2,
    className = '',
}: FocusRingProps) {
    return (
        <div
            className={`
                outline-none
                focus-visible:ring-${width}
                ${focusColors[color]}
                focus-visible:ring-offset-${offset}
                focus-visible:ring-offset-slate-900
                ${className}
            `}
        >
            {children}
        </div>
    )
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================

interface RippleConfig {
    color?: string
    duration?: number
    disabled?: boolean
}

export function useRipple({
    color = 'rgba(255, 255, 255, 0.3)',
    duration = 600,
    disabled = false,
}: RippleConfig = {}) {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])
    const containerRef = useRef<HTMLDivElement>(null)

    const addRipple = useCallback((e: React.MouseEvent) => {
        if (disabled || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()

        setRipples(prev => [...prev, { x, y, id }])

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id))
        }, duration)
    }, [disabled, duration])

    const RippleContainer = useCallback(({ children }: { children: React.ReactNode }) => (
        <div
            ref={containerRef}
            className="relative overflow-hidden"
            onMouseDown={addRipple}
        >
            {children}
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full animate-ripple pointer-events-none"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        backgroundColor: color,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
        </div>
    ), [ripples, color, addRipple])

    return { RippleContainer, addRipple }
}

// ============================================================================
// HOVER HIGHLIGHT
// ============================================================================

interface HoverHighlightProps {
    children: React.ReactNode
    className?: string
}

export function HoverHighlight({ children, className = '' }: HoverHighlightProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        })
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {children}
            {isHovering && (
                <div
                    className="pointer-events-none absolute inset-0 transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle 150px at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.15), transparent)`,
                    }}
                />
            )}
        </div>
    )
}

// ============================================================================
// TILT EFFECT
// ============================================================================

interface TiltProps {
    children: React.ReactNode
    maxTilt?: number
    perspective?: number
    scale?: number
    className?: string
}

export function Tilt({
    children,
    maxTilt = 10,
    perspective = 1000,
    scale = 1.02,
    className = '',
}: TiltProps) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const [isHovering, setIsHovering] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const x = ((e.clientY - centerY) / (rect.height / 2)) * maxTilt
        const y = ((e.clientX - centerX) / (rect.width / 2)) * -maxTilt

        setTilt({ x, y })
    }

    const handleMouseLeave = () => {
        setIsHovering(false)
        setTilt({ x: 0, y: 0 })
    }

    return (
        <div
            ref={containerRef}
            className={`transition-transform duration-200 ${className}`}
            style={{
                perspective: `${perspective}px`,
            }}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
        >
            <div
                style={{
                    transform: isHovering
                        ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${scale})`
                        : 'rotateX(0) rotateY(0) scale(1)',
                    transition: 'transform 0.2s ease-out',
                }}
            >
                {children}
            </div>
        </div>
    )
}

// ============================================================================
// MAGNETIC BUTTON
// ============================================================================

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode
    strength?: number
}

export function MagneticButton({
    children,
    strength = 0.3,
    className = '',
    ...props
}: MagneticButtonProps) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const buttonRef = useRef<HTMLButtonElement>(null)

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!buttonRef.current) return

        const rect = buttonRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        setPosition({
            x: (e.clientX - centerX) * strength,
            y: (e.clientY - centerY) * strength,
        })
    }

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 })
    }

    return (
        <button
            ref={buttonRef}
            {...props}
            className={`transition-transform duration-200 ${className}`}
            style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
        </button>
    )
}

// ============================================================================
// GLOW EFFECT
// ============================================================================

interface GlowProps {
    children: React.ReactNode
    color?: string
    intensity?: number
    className?: string
}

export function Glow({
    children,
    color = 'rgba(139, 92, 246, 0.5)',
    intensity = 20,
    className = '',
}: GlowProps) {
    const [isHovering, setIsHovering] = useState(false)

    return (
        <div
            className={`relative ${className}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Glow layer */}
            <div
                className="absolute inset-0 rounded-xl transition-opacity duration-300 blur-xl"
                style={{
                    backgroundColor: color,
                    opacity: isHovering ? 1 : 0,
                    transform: `scale(1.${intensity})`,
                }}
            />
            {/* Content */}
            <div className="relative">{children}</div>
        </div>
    )
}

// ============================================================================
// PRESSED STATE WRAPPER
// ============================================================================

interface PressableProps {
    children: React.ReactNode
    onPress?: () => void
    disabled?: boolean
    className?: string
}

export function Pressable({
    children,
    onPress,
    disabled = false,
    className = '',
}: PressableProps) {
    const [isPressed, setIsPressed] = useState(false)

    return (
        <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            className={`
                cursor-pointer select-none transition-transform duration-100
                ${isPressed ? 'scale-[0.97]' : 'scale-100'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.97]'}
                ${className}
            `}
            onClick={!disabled ? onPress : undefined}
            onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onPress?.()
                }
            }}
            onMouseDown={() => !disabled && setIsPressed(true)}
            onMouseUp={() => setIsPressed(false)}
            onMouseLeave={() => setIsPressed(false)}
        >
            {children}
        </div>
    )
}

// ============================================================================
// CSS STYLES (add to global CSS)
// ============================================================================

export const interactionStyles = `
@keyframes ripple {
    0% {
        width: 0;
        height: 0;
        opacity: 0.5;
    }
    100% {
        width: 500px;
        height: 500px;
        opacity: 0;
    }
}

.animate-ripple {
    animation: ripple 0.6s ease-out forwards;
}
`
