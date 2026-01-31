/**
 * SprintLoop Premium Loading States
 * 
 * Phase 101-120: Advanced loading indicators
 * - Shimmer effects
 * - Content-aware skeletons
 * - Progress indicators
 * - Pulsing states
 */

import React, { useState, useEffect, useRef } from 'react'

// ============================================================================
// SHIMMER EFFECT
// ============================================================================

interface ShimmerProps {
    width?: string | number
    height?: string | number
    borderRadius?: string
    className?: string
}

export function Shimmer({
    width = '100%',
    height = '1rem',
    borderRadius = '4px',
    className = ''
}: ShimmerProps) {
    return (
        <div
            className={`relative overflow-hidden bg-slate-800/50 ${className}`}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
                borderRadius,
            }}
        >
            <div
                className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{
                    animation: 'shimmer 2s infinite',
                }}
            />
        </div>
    )
}

// ============================================================================
// CONTENT-AWARE SKELETONS
// ============================================================================

interface SkeletonTextProps {
    lines?: number
    lastLineWidth?: string
    gap?: number
    className?: string
}

export function SkeletonText({
    lines = 3,
    lastLineWidth = '60%',
    gap = 8,
    className = ''
}: SkeletonTextProps) {
    return (
        <div className={`flex flex-col ${className}`} style={{ gap }}>
            {Array.from({ length: lines }).map((_, i) => (
                <Shimmer
                    key={i}
                    height={14}
                    width={i === lines - 1 ? lastLineWidth : '100%'}
                />
            ))}
        </div>
    )
}

interface SkeletonAvatarProps {
    size?: number
    shape?: 'circle' | 'square'
    className?: string
}

export function SkeletonAvatar({
    size = 40,
    shape = 'circle',
    className = ''
}: SkeletonAvatarProps) {
    return (
        <Shimmer
            width={size}
            height={size}
            borderRadius={shape === 'circle' ? '50%' : '8px'}
            className={className}
        />
    )
}

interface SkeletonCardProps {
    hasImage?: boolean
    hasAvatar?: boolean
    lines?: number
    className?: string
}

export function SkeletonCard({
    hasImage = true,
    hasAvatar = false,
    lines = 3,
    className = ''
}: SkeletonCardProps) {
    return (
        <div className={`bg-slate-900/50 border border-white/5 rounded-xl p-4 ${className}`}>
            {hasImage && (
                <Shimmer height={160} borderRadius="8px" className="mb-4" />
            )}
            <div className="flex items-start gap-3">
                {hasAvatar && <SkeletonAvatar size={36} />}
                <div className="flex-1">
                    <Shimmer height={18} width="70%" className="mb-3" />
                    <SkeletonText lines={lines} />
                </div>
            </div>
        </div>
    )
}

interface SkeletonTableProps {
    rows?: number
    columns?: number
    className?: string
}

export function SkeletonTable({
    rows = 5,
    columns = 4,
    className = ''
}: SkeletonTableProps) {
    return (
        <div className={`bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden ${className}`}>
            {/* Header */}
            <div className="flex gap-4 p-4 border-b border-white/5 bg-slate-800/30">
                {Array.from({ length: columns }).map((_, i) => (
                    <Shimmer key={i} height={14} width={`${100 / columns}%`} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, row) => (
                <div
                    key={row}
                    className="flex gap-4 p-4 border-b border-white/5 last:border-0"
                >
                    {Array.from({ length: columns }).map((_, col) => (
                        <Shimmer
                            key={col}
                            height={12}
                            width={col === 0 ? '80%' : `${100 / columns}%`}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

interface SkeletonListProps {
    items?: number
    hasIcon?: boolean
    hasAction?: boolean
    className?: string
}

export function SkeletonList({
    items = 5,
    hasIcon = true,
    hasAction = false,
    className = ''
}: SkeletonListProps) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: items }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 bg-slate-900/30 rounded-lg"
                >
                    {hasIcon && <Shimmer width={20} height={20} borderRadius="4px" />}
                    <Shimmer height={14} className="flex-1" />
                    {hasAction && <Shimmer width={60} height={28} borderRadius="6px" />}
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// FILE EXPLORER SKELETON
// ============================================================================

interface SkeletonFileTreeProps {
    depth?: number
    items?: number
    className?: string
}

export function SkeletonFileTree({
    depth = 3,
    items = 8,
    className = ''
}: SkeletonFileTreeProps) {
    const generateTree = (currentDepth: number, count: number): React.ReactNode[] => {
        const result: React.ReactNode[] = []
        let remaining = count

        while (remaining > 0 && result.length < count) {
            const indent = Math.min(currentDepth, depth - 1)
            const isFolder = Math.random() > 0.6

            result.push(
                <div
                    key={result.length}
                    className="flex items-center gap-2 py-1"
                    style={{ paddingLeft: `${indent * 16}px` }}
                >
                    <Shimmer width={16} height={16} borderRadius="2px" />
                    <Shimmer
                        height={12}
                        width={`${40 + Math.random() * 40}%`}
                    />
                </div>
            )

            remaining--

            if (isFolder && remaining > 0 && currentDepth < depth - 1) {
                const childCount = Math.min(Math.floor(Math.random() * 3) + 1, remaining)
                result.push(...generateTree(currentDepth + 1, childCount))
                remaining -= childCount
            }
        }

        return result
    }

    return (
        <div className={`p-2 ${className}`}>
            {generateTree(0, items)}
        </div>
    )
}

// ============================================================================
// EDITOR SKELETON
// ============================================================================

interface SkeletonEditorProps {
    lines?: number
    showLineNumbers?: boolean
    className?: string
}

export function SkeletonEditor({
    lines = 20,
    showLineNumbers = true,
    className = ''
}: SkeletonEditorProps) {
    const lineWidths = Array.from({ length: lines }, () =>
        `${20 + Math.random() * 60}%`
    )

    return (
        <div className={`bg-slate-900/80 rounded-lg overflow-hidden ${className}`}>
            {/* Tab bar */}
            <div className="flex gap-1 p-2 border-b border-white/5 bg-slate-800/50">
                <Shimmer width={100} height={28} borderRadius="6px" />
                <Shimmer width={80} height={28} borderRadius="6px" />
            </div>
            {/* Editor content */}
            <div className="p-4 font-mono text-sm">
                {lineWidths.map((width, i) => (
                    <div key={i} className="flex items-center gap-4 py-0.5">
                        {showLineNumbers && (
                            <span className="w-8 text-right text-slate-600 text-xs">
                                {i + 1}
                            </span>
                        )}
                        <Shimmer height={14} width={width} />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// PROGRESS INDICATORS
// ============================================================================

interface ProgressBarProps {
    value: number
    max?: number
    showLabel?: boolean
    variant?: 'default' | 'success' | 'warning' | 'error'
    size?: 'sm' | 'md' | 'lg'
    animated?: boolean
    className?: string
}

const progressVariants = {
    default: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
}

const progressSizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
}

export function ProgressBar({
    value,
    max = 100,
    showLabel = false,
    variant = 'default',
    size = 'md',
    animated = true,
    className = ''
}: ProgressBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
        <div className={`w-full ${className}`}>
            <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${progressSizes[size]}`}>
                <div
                    className={`
                        ${progressSizes[size]} ${progressVariants[variant]} rounded-full
                        transition-all duration-300 ease-out
                        ${animated ? 'relative overflow-hidden' : ''}
                    `}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                >
                    {animated && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    )}
                </div>
            </div>
            {showLabel && (
                <div className="mt-1 text-xs text-gray-400 text-right">
                    {Math.round(percentage)}%
                </div>
            )}
        </div>
    )
}

interface CircularProgressProps {
    value: number
    max?: number
    size?: number
    strokeWidth?: number
    showLabel?: boolean
    variant?: 'default' | 'success' | 'warning' | 'error'
    className?: string
}

export function CircularProgress({
    value,
    max = 100,
    size = 48,
    strokeWidth = 4,
    showLabel = true,
    variant = 'default',
    className = ''
}: CircularProgressProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    const colors = {
        default: 'stroke-purple-500',
        success: 'stroke-green-500',
        warning: 'stroke-yellow-500',
        error: 'stroke-red-500',
    }

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <svg
                width={size}
                height={size}
                className="transform -rotate-90"
            >
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    className="stroke-slate-700 fill-none"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className={`fill-none transition-all duration-300 ease-out ${colors[variant]}`}
                />
            </svg>
            {showLabel && (
                <span className="absolute text-xs font-medium text-white">
                    {Math.round(percentage)}%
                </span>
            )}
        </div>
    )
}

// ============================================================================
// SPINNER VARIANTS
// ============================================================================

interface SpinnerProps {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    variant?: 'default' | 'dots' | 'bars' | 'pulse'
    className?: string
}

const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
}

export function Spinner({ size = 'md', variant = 'default', className = '' }: SpinnerProps) {
    if (variant === 'dots') {
        return (
            <div className={`flex gap-1 ${className}`}>
                {[0, 1, 2].map(i => (
                    <div
                        key={i}
                        className={`rounded-full bg-purple-500 animate-bounce ${size === 'xs' || size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
                            }`}
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        )
    }

    if (variant === 'bars') {
        return (
            <div className={`flex gap-0.5 items-end ${className}`}>
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="w-1 bg-purple-500 rounded-full animate-pulse"
                        style={{
                            height: `${8 + i * 4}px`,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    />
                ))}
            </div>
        )
    }

    if (variant === 'pulse') {
        return (
            <div className={`relative ${spinnerSizes[size]} ${className}`}>
                <div className="absolute inset-0 rounded-full bg-purple-500/40 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-purple-500" />
            </div>
        )
    }

    // Default spinner
    return (
        <svg
            className={`animate-spin ${spinnerSizes[size]} ${className}`}
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    )
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

interface LoadingOverlayProps {
    isLoading: boolean
    message?: string
    blur?: boolean
    children: React.ReactNode
    className?: string
}

export function LoadingOverlay({
    isLoading,
    message,
    blur = true,
    children,
    className = ''
}: LoadingOverlayProps) {
    return (
        <div className={`relative ${className}`}>
            {children}
            {isLoading && (
                <div
                    className={`
                        absolute inset-0 flex flex-col items-center justify-center
                        bg-slate-900/80 z-50
                        ${blur ? 'backdrop-blur-sm' : ''}
                    `}
                >
                    <Spinner size="lg" />
                    {message && (
                        <p className="mt-4 text-sm text-gray-400">{message}</p>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// PULSING INDICATOR
// ============================================================================

interface PulseIndicatorProps {
    active?: boolean
    color?: 'green' | 'yellow' | 'red' | 'blue' | 'purple'
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

const pulseColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
}

const pulseSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
}

export function PulseIndicator({
    active = true,
    color = 'green',
    size = 'md',
    className = ''
}: PulseIndicatorProps) {
    return (
        <span className={`relative inline-flex ${className}`}>
            {active && (
                <span
                    className={`
                        absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping
                        ${pulseColors[color]}
                    `}
                />
            )}
            <span
                className={`
                    relative inline-flex rounded-full
                    ${pulseColors[color]} ${pulseSizes[size]}
                `}
            />
        </span>
    )
}

// ============================================================================
// STEP INDICATOR
// ============================================================================

interface Step {
    id: string
    label: string
    description?: string
}

interface StepIndicatorProps {
    steps: Step[]
    currentStep: number
    className?: string
}

export function StepIndicator({ steps, currentStep, className = '' }: StepIndicatorProps) {
    return (
        <div className={`flex items-center ${className}`}>
            {steps.map((step, index) => {
                const isComplete = index < currentStep
                const isCurrent = index === currentStep
                const isLast = index === steps.length - 1

                return (
                    <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center">
                            <div
                                className={`
                                    w-8 h-8 rounded-full flex items-center justify-center
                                    text-sm font-medium transition-all duration-300
                                    ${isComplete
                                        ? 'bg-purple-500 text-white'
                                        : isCurrent
                                            ? 'bg-purple-500/20 text-purple-400 ring-2 ring-purple-500'
                                            : 'bg-slate-800 text-slate-500'
                                    }
                                `}
                            >
                                {isComplete ? (
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <span
                                className={`
                                    mt-2 text-xs font-medium
                                    ${isCurrent ? 'text-white' : 'text-slate-500'}
                                `}
                            >
                                {step.label}
                            </span>
                        </div>
                        {!isLast && (
                            <div
                                className={`
                                    flex-1 h-0.5 mx-3 transition-all duration-300
                                    ${isComplete ? 'bg-purple-500' : 'bg-slate-700'}
                                `}
                            />
                        )}
                    </React.Fragment>
                )
            })}
        </div>
    )
}

// ============================================================================
// INLINE LOADING
// ============================================================================

interface InlineLoadingProps {
    text?: string
    className?: string
}

export function InlineLoading({ text = 'Loading', className = '' }: InlineLoadingProps) {
    const [dots, setDots] = useState('')

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => (prev.length >= 3 ? '' : prev + '.'))
        }, 400)
        return () => clearInterval(interval)
    }, [])

    return (
        <span className={`text-gray-400 ${className}`}>
            {text}{dots}
        </span>
    )
}

// ============================================================================
// TYPEWRITER LOADING
// ============================================================================

interface TypewriterLoadingProps {
    messages: string[]
    speed?: number
    className?: string
}

export function TypewriterLoading({
    messages,
    speed = 50,
    className = ''
}: TypewriterLoadingProps) {
    const [currentMessage, setCurrentMessage] = useState(0)
    const [displayText, setDisplayText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const message = messages[currentMessage]

        if (!isDeleting && displayText === message) {
            setTimeout(() => setIsDeleting(true), 2000)
            return
        }

        if (isDeleting && displayText === '') {
            setIsDeleting(false)
            setCurrentMessage((prev) => (prev + 1) % messages.length)
            return
        }

        const timeout = setTimeout(
            () => {
                setDisplayText(prev =>
                    isDeleting
                        ? prev.slice(0, -1)
                        : message.slice(0, prev.length + 1)
                )
            },
            isDeleting ? speed / 2 : speed
        )

        return () => clearTimeout(timeout)
    }, [displayText, isDeleting, currentMessage, messages, speed])

    return (
        <span className={`text-gray-300 ${className}`}>
            {displayText}
            <span className="animate-pulse">|</span>
        </span>
    )
}

// ============================================================================
// CSS STYLES (add to global CSS)
// ============================================================================

export const loadingStyles = `
@keyframes shimmer {
    0% {
        transform: translateX(-100%);
    }
    100% {
        transform: translateX(100%);
    }
}

.animate-shimmer {
    animation: shimmer 2s infinite;
}
`
