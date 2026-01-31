/**
 * SprintLoop Micro-Interactions & Feedback System
 * 
 * Delightful, informative feedback for user actions:
 * - Loading states and spinners
 * - Success/error animations
 * - Hover effects
 * - Transitions
 */

import React, { useState, useEffect, useRef } from 'react'
import { Check, X, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

// ============================================================================
// LOADING SPINNER
// ============================================================================

interface SpinnerProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    color?: string
    label?: string
}

const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
}

export function Spinner({ size = 'md', color, label }: SpinnerProps) {
    return (
        <div role="status" aria-label={label || 'Loading'}>
            <Loader2
                className={`animate-spin ${spinnerSizes[size]}`}
                style={{ color }}
            />
            {label && <span className="sr-only">{label}</span>}
        </div>
    )
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
    isLoading: boolean
    text?: string
    blur?: boolean
}

export function LoadingOverlay({ isLoading, text, blur = true }: LoadingOverlayProps) {
    if (!isLoading) return null

    return (
        <div
            className={`
                absolute inset-0 z-50 flex flex-col items-center justify-center
                bg-slate-900/80 ${blur ? 'backdrop-blur-sm' : ''}
                animate-in fade-in duration-200
            `}
        >
            <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
                <Spinner size="lg" />
            </div>
            {text && (
                <p className="mt-4 text-sm text-gray-400">{text}</p>
            )}
        </div>
    )
}

// ============================================================================
// PROGRESS STEPS
// ============================================================================

interface StepIndicatorProps {
    steps: string[]
    currentStep: number
    orientation?: 'horizontal' | 'vertical'
}

export function StepIndicator({ steps, currentStep, orientation = 'horizontal' }: StepIndicatorProps) {
    return (
        <div
            className={`flex ${orientation === 'vertical' ? 'flex-col' : 'items-center'}`}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={steps.length}
        >
            {steps.map((step, index) => (
                <div
                    key={index}
                    className={`flex ${orientation === 'vertical' ? 'flex-row' : 'flex-col'} items-center`}
                >
                    {/* Step circle */}
                    <div
                        className={`
                            flex items-center justify-center w-8 h-8 rounded-full
                            font-medium text-sm transition-all duration-300
                            ${index < currentStep
                                ? 'bg-green-500 text-white'
                                : index === currentStep
                                    ? 'bg-purple-500 text-white ring-4 ring-purple-500/30'
                                    : 'bg-white/10 text-gray-500'
                            }
                        `}
                    >
                        {index < currentStep ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            index + 1
                        )}
                    </div>

                    {/* Step label */}
                    <span
                        className={`
                            ${orientation === 'vertical' ? 'ml-3' : 'mt-2'}
                            text-sm font-medium
                            ${index <= currentStep ? 'text-white' : 'text-gray-500'}
                        `}
                    >
                        {step}
                    </span>

                    {/* Connector line */}
                    {index < steps.length - 1 && (
                        <div
                            className={`
                                ${orientation === 'vertical'
                                    ? 'w-px h-8 ml-4 my-2'
                                    : 'h-px w-12 mx-2 mt-4'
                                }
                                ${index < currentStep ? 'bg-green-500' : 'bg-white/10'}
                                transition-colors duration-300
                            `}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// OPTIMISTIC UPDATE INDICATOR
// ============================================================================

type OptimisticStatus = 'pending' | 'success' | 'error' | 'idle'

interface OptimisticIndicatorProps {
    status: OptimisticStatus
    pendingText?: string
    successText?: string
    errorText?: string
}

export function OptimisticIndicator({
    status,
    pendingText = 'Saving...',
    successText = 'Saved',
    errorText = 'Error'
}: OptimisticIndicatorProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (status !== 'idle') {
            setVisible(true)
            if (status === 'success') {
                const timer = setTimeout(() => setVisible(false), 2000)
                return () => clearTimeout(timer)
            }
        }
    }, [status])

    if (!visible || status === 'idle') return null

    return (
        <div
            className={`
                inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
                animate-in fade-in slide-in-from-right-2 duration-200
                ${status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : ''}
                ${status === 'success' ? 'bg-green-500/20 text-green-400' : ''}
                ${status === 'error' ? 'bg-red-500/20 text-red-400' : ''}
            `}
        >
            {status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
            {status === 'success' && <Check className="w-3 h-3" />}
            {status === 'error' && <AlertCircle className="w-3 h-3" />}
            <span>
                {status === 'pending' && pendingText}
                {status === 'success' && successText}
                {status === 'error' && errorText}
            </span>
        </div>
    )
}

// ============================================================================
// PULSE INDICATOR
// ============================================================================

interface PulseProps {
    color?: 'green' | 'red' | 'yellow' | 'blue' | 'purple'
    size?: 'sm' | 'md' | 'lg'
}

const pulseColors = {
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
}

const pulseSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
}

export function Pulse({ color = 'green', size = 'md' }: PulseProps) {
    return (
        <span className="relative flex">
            <span
                className={`
                    animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                    ${pulseColors[color]}
                `}
            />
            <span
                className={`
                    relative inline-flex rounded-full
                    ${pulseColors[color]}
                    ${pulseSizes[size]}
                `}
            />
        </span>
    )
}

// ============================================================================
// SHIMMER EFFECT
// ============================================================================

export function Shimmer({ className }: { className?: string }) {
    return (
        <div
            className={`
                relative overflow-hidden
                before:absolute before:inset-0
                before:-translate-x-full
                before:animate-[shimmer_2s_infinite]
                before:bg-gradient-to-r
                before:from-transparent before:via-white/10 before:to-transparent
                ${className || ''}
            `}
        />
    )
}

// ============================================================================
// RIPPLE EFFECT
// ============================================================================

export interface RippleProps {
    color?: string
}

export function useRipple(color: string = 'rgba(255, 255, 255, 0.3)') {
    const containerRef = useRef<HTMLDivElement>(null)
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([])

    const addRipple = (e: React.MouseEvent) => {
        const container = containerRef.current
        if (!container) return

        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        const id = Date.now()

        setRipples(prev => [...prev, { x, y, id }])

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id))
        }, 600)
    }

    const RippleContainer = () => (
        <div
            ref={containerRef}
            className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none"
        >
            {ripples.map(ripple => (
                <span
                    key={ripple.id}
                    className="absolute rounded-full animate-ripple"
                    style={{
                        left: ripple.x,
                        top: ripple.y,
                        backgroundColor: color,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
        </div>
    )

    return { addRipple, RippleContainer }
}

// ============================================================================
// SUCCESS/ERROR FLASH
// ============================================================================

interface FlashMessageProps {
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    isVisible: boolean
    onDismiss?: () => void
}

export function FlashMessage({ type, message, isVisible, onDismiss }: FlashMessageProps) {
    const icons = {
        success: <Check className="w-5 h-5" />,
        error: <X className="w-5 h-5" />,
        info: <AlertCircle className="w-5 h-5" />,
        warning: <AlertCircle className="w-5 h-5" />,
    }

    const styles = {
        success: 'bg-green-500/20 border-green-500/30 text-green-400',
        error: 'bg-red-500/20 border-red-500/30 text-red-400',
        info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
        warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    }

    if (!isVisible) return null

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg border
                animate-in slide-in-from-top-2 fade-in duration-300
                ${styles[type]}
            `}
            role="alert"
        >
            {icons[type]}
            <span className="flex-1 text-sm font-medium">{message}</span>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    )
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

export function TypingIndicator() {
    return (
        <div className="flex items-center gap-1 p-2">
            <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                        style={{ animationDelay: `${i * 150}ms` }}
                    />
                ))}
            </div>
            <span className="sr-only">Typing...</span>
        </div>
    )
}

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

interface CountdownProps {
    seconds: number
    onComplete?: () => void
    size?: 'sm' | 'md' | 'lg'
}

export function Countdown({ seconds: initialSeconds, onComplete, size = 'md' }: CountdownProps) {
    const [seconds, setSeconds] = useState(initialSeconds)

    useEffect(() => {
        if (seconds <= 0) {
            onComplete?.()
            return
        }

        const timer = setInterval(() => {
            setSeconds(s => s - 1)
        }, 1000)

        return () => clearInterval(timer)
    }, [seconds, onComplete])

    const percentage = (seconds / initialSeconds) * 100
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-sm',
        lg: 'w-16 h-16 text-base',
    }

    return (
        <div
            className={`relative ${sizes[size]} flex items-center justify-center`}
            role="timer"
            aria-live="polite"
        >
            <svg className="w-full h-full transform -rotate-90">
                <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-white/10"
                />
                <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${percentage * 2.83} 283`}
                    className="text-purple-500 transition-all duration-1000"
                />
            </svg>
            <span className="absolute font-mono font-semibold text-white">
                {seconds}
            </span>
        </div>
    )
}

// ============================================================================
// REFRESH INDICATOR
// ============================================================================

interface RefreshIndicatorProps {
    isRefreshing: boolean
    onRefresh: () => void
}

export function RefreshIndicator({ isRefreshing, onRefresh }: RefreshIndicatorProps) {
    return (
        <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className={`
                p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5
                transition-all disabled:opacity-50
            `}
            aria-label={isRefreshing ? 'Refreshing...' : 'Refresh'}
        >
            <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
        </button>
    )
}

// ============================================================================
// CONFETTI CELEBRATION
// ============================================================================

export function useConfetti() {
    const [particles, setParticles] = useState<Array<{
        id: number
        x: number
        color: string
        delay: number
    }>>([])

    const celebrate = () => {
        const colors = ['#A855F7', '#3B82F6', '#10B981', '#F59E0B', '#EC4899']
        const newParticles = Array.from({ length: 50 }).map((_, i) => ({
            id: Date.now() + i,
            x: Math.random() * 100,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: Math.random() * 0.5,
        }))

        setParticles(newParticles)
        setTimeout(() => setParticles([]), 3000)
    }

    const ConfettiContainer = () => (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {particles.map(particle => (
                <div
                    key={particle.id}
                    className="absolute w-3 h-3 animate-confetti"
                    style={{
                        left: `${particle.x}%`,
                        top: '-10px',
                        backgroundColor: particle.color,
                        animationDelay: `${particle.delay}s`,
                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    }}
                />
            ))}
        </div>
    )

    return { celebrate, ConfettiContainer }
}

// ============================================================================
// INLINE EDITING FEEDBACK
// ============================================================================

interface InlineEditFeedbackProps {
    status: 'idle' | 'editing' | 'saving' | 'saved' | 'error'
}

export function InlineEditFeedback({ status }: InlineEditFeedbackProps) {
    if (status === 'idle') return null

    return (
        <span
            className={`
                inline-flex items-center gap-1 text-xs
                ${status === 'editing' ? 'text-blue-400' : ''}
                ${status === 'saving' ? 'text-yellow-400' : ''}
                ${status === 'saved' ? 'text-green-400' : ''}
                ${status === 'error' ? 'text-red-400' : ''}
            `}
        >
            {status === 'editing' && '✎ Editing'}
            {status === 'saving' && (
                <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                </>
            )}
            {status === 'saved' && (
                <>
                    <Check className="w-3 h-3" />
                    Saved
                </>
            )}
            {status === 'error' && (
                <>
                    <AlertCircle className="w-3 h-3" />
                    Error
                </>
            )}
        </span>
    )
}
