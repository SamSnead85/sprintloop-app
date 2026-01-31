/**
 * SprintLoop Progress Components
 * 
 * Phase 2751-2800: Progress indicators
 * - Progress bar
 * - Circular progress
 * - Steps indicator
 * - Loading spinners
 */

import React from 'react'
import { Check, Loader2 } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ProgressVariant = 'default' | 'success' | 'warning' | 'error' | 'info'
type ProgressSize = 'xs' | 'sm' | 'md' | 'lg'

interface ProgressBarProps {
    value: number
    max?: number
    variant?: ProgressVariant
    size?: ProgressSize
    showLabel?: boolean
    animated?: boolean
    striped?: boolean
    indeterminate?: boolean
    className?: string
}

interface CircularProgressProps {
    value: number
    max?: number
    size?: number
    strokeWidth?: number
    variant?: ProgressVariant
    showValue?: boolean
    children?: React.ReactNode
    className?: string
}

interface StepsProps {
    steps: Array<{
        label: string
        description?: string
        status?: 'complete' | 'current' | 'upcoming' | 'error'
    }>
    orientation?: 'horizontal' | 'vertical'
    size?: ProgressSize
    className?: string
}

interface SpinnerProps {
    size?: ProgressSize
    variant?: ProgressVariant
    className?: string
}

// ============================================================================
// STYLES
// ============================================================================

const variantColors: Record<ProgressVariant, string> = {
    default: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
}

const variantTextColors: Record<ProgressVariant, string> = {
    default: 'text-purple-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400',
}

const sizeStyles: Record<ProgressSize, string> = {
    xs: 'h-1',
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
}

const spinnerSizes: Record<ProgressSize, string> = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
}

// ============================================================================
// PROGRESS BAR
// ============================================================================

export function ProgressBar({
    value,
    max = 100,
    variant = 'default',
    size = 'md',
    showLabel = false,
    animated = false,
    striped = false,
    indeterminate = false,
    className = '',
}: ProgressBarProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))

    return (
        <div className={className}>
            {showLabel && (
                <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">{Math.round(percentage)}%</span>
                </div>
            )}
            <div className={`relative overflow-hidden rounded-full bg-white/10 ${sizeStyles[size]}`}>
                <div
                    className={`
                        h-full transition-all duration-300 ease-out rounded-full
                        ${variantColors[variant]}
                        ${indeterminate ? 'animate-progress-indeterminate w-1/3' : ''}
                        ${striped ? 'bg-stripes' : ''}
                        ${animated && !indeterminate ? 'animate-pulse' : ''}
                    `}
                    style={indeterminate ? undefined : { width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={max}
                />
            </div>
        </div>
    )
}

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

export function CircularProgress({
    value,
    max = 100,
    size = 48,
    strokeWidth = 4,
    variant = 'default',
    showValue = true,
    children,
    className = '',
}: CircularProgressProps) {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (percentage / 100) * circumference

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
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-white/10"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className={`${variantTextColors[variant]} transition-all duration-300`}
                />
            </svg>
            {(showValue || children) && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {children || (
                        <span className="text-sm font-medium text-white">
                            {Math.round(percentage)}%
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// STEPS
// ============================================================================

export function Steps({
    steps,
    orientation = 'horizontal',
    size = 'md',
    className = '',
}: StepsProps) {
    const stepSizes = {
        xs: 'w-5 h-5 text-xs',
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    }

    const iconSizes = {
        xs: 'w-3 h-3',
        sm: 'w-3.5 h-3.5',
        md: 'w-4 h-4',
        lg: 'w-5 h-5',
    }

    return (
        <div
            className={`
                flex
                ${orientation === 'vertical' ? 'flex-col' : 'items-center'}
                ${className}
            `}
        >
            {steps.map((step, index) => {
                const isLast = index === steps.length - 1
                const status = step.status || 'upcoming'

                return (
                    <div
                        key={index}
                        className={`
                            flex
                            ${orientation === 'vertical' ? 'items-start' : 'items-center flex-col'}
                            ${!isLast && orientation === 'horizontal' ? 'flex-1' : ''}
                        `}
                    >
                        <div className={`flex ${orientation === 'vertical' ? 'flex-col items-center' : 'items-center'}`}>
                            {/* Step circle */}
                            <div
                                className={`
                                    flex items-center justify-center rounded-full font-medium
                                    ${stepSizes[size]}
                                    ${status === 'complete'
                                        ? 'bg-green-500 text-white'
                                        : status === 'current'
                                            ? 'bg-purple-500 text-white'
                                            : status === 'error'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white/10 text-gray-500'
                                    }
                                `}
                            >
                                {status === 'complete' ? (
                                    <Check className={iconSizes[size]} />
                                ) : (
                                    index + 1
                                )}
                            </div>

                            {/* Label */}
                            <div className={`${orientation === 'vertical' ? 'ml-4' : 'mt-2 text-center'}`}>
                                <div className={`font-medium ${status === 'upcoming' ? 'text-gray-500' : 'text-white'}`}>
                                    {step.label}
                                </div>
                                {step.description && (
                                    <div className="text-xs text-gray-500 max-w-24">
                                        {step.description}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connector */}
                        {!isLast && (
                            <div
                                className={`
                                    ${orientation === 'vertical'
                                        ? 'w-px h-8 ml-4 my-2'
                                        : 'flex-1 h-px mx-4 mt-4'
                                    }
                                    ${status === 'complete' ? 'bg-green-500' : 'bg-white/10'}
                                `}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// SPINNER
// ============================================================================

export function Spinner({
    size = 'md',
    variant = 'default',
    className = '',
}: SpinnerProps) {
    return (
        <Loader2
            className={`
                animate-spin
                ${spinnerSizes[size]}
                ${variantTextColors[variant]}
                ${className}
            `}
        />
    )
}

// ============================================================================
// LOADING DOTS
// ============================================================================

interface LoadingDotsProps {
    size?: ProgressSize
    variant?: ProgressVariant
    className?: string
}

export function LoadingDots({
    size = 'md',
    variant = 'default',
    className = '',
}: LoadingDotsProps) {
    const dotSizes = {
        xs: 'w-1 h-1',
        sm: 'w-1.5 h-1.5',
        md: 'w-2 h-2',
        lg: 'w-2.5 h-2.5',
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className={`
                        rounded-full animate-bounce
                        ${dotSizes[size]}
                        ${variantColors[variant]}
                    `}
                    style={{
                        animationDelay: `${i * 150}ms`,
                        animationDuration: '600ms',
                    }}
                />
            ))}
        </div>
    )
}

// ============================================================================
// SKELETON
// ============================================================================

interface SkeletonProps {
    width?: string | number
    height?: string | number
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
    animation?: 'pulse' | 'wave' | 'none'
    className?: string
}

export function Skeleton({
    width,
    height,
    variant = 'rectangular',
    animation = 'pulse',
    className = '',
}: SkeletonProps) {
    const variantStyles = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: '',
        rounded: 'rounded-lg',
    }

    const animationStyles = {
        pulse: 'animate-pulse',
        wave: 'animate-shimmer',
        none: '',
    }

    return (
        <div
            className={`
                bg-white/10
                ${variantStyles[variant]}
                ${animationStyles[animation]}
                ${className}
            `}
            style={{
                width: typeof width === 'number' ? `${width}px` : width,
                height: typeof height === 'number' ? `${height}px` : height,
            }}
        />
    )
}
