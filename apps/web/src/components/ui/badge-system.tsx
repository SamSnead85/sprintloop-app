/**
 * SprintLoop Badge & Tag System
 * 
 * Phase 2651-2700: Badges and tags
 * - Notification badges
 * - Status indicators
 * - Tag components
 * - Avatar badges
 */

import React from 'react'
import { X } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'
type BadgeSize = 'xs' | 'sm' | 'md'

interface BadgeProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: BadgeSize
    dot?: boolean
    className?: string
}

interface TagProps {
    children: React.ReactNode
    variant?: BadgeVariant
    size?: BadgeSize
    removable?: boolean
    onRemove?: () => void
    icon?: React.ReactNode
    className?: string
}

interface StatusDotProps {
    status: 'online' | 'offline' | 'away' | 'busy' | 'dnd'
    size?: BadgeSize
    pulse?: boolean
    className?: string
}

interface AvatarBadgeProps {
    children: React.ReactNode
    badge?: React.ReactNode
    badgePosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'
    className?: string
}

interface CountBadgeProps {
    count: number
    max?: number
    size?: BadgeSize
    variant?: BadgeVariant
    showZero?: boolean
    className?: string
}

// ============================================================================
// STYLES
// ============================================================================

const variantStyles: Record<BadgeVariant, string> = {
    default: 'bg-white/10 text-gray-300',
    primary: 'bg-purple-500/20 text-purple-400',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
}

const dotStyles: Record<BadgeVariant, string> = {
    default: 'bg-gray-400',
    primary: 'bg-purple-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
}

const sizeStyles: Record<BadgeSize, string> = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
}

const dotSizeStyles: Record<BadgeSize, string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
}

// ============================================================================
// BADGE
// ============================================================================

export function Badge({
    children,
    variant = 'default',
    size = 'sm',
    dot = false,
    className = '',
}: BadgeProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1.5 font-medium rounded-full
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}
        >
            {dot && (
                <span className={`rounded-full ${dotStyles[variant]} ${dotSizeStyles[size]}`} />
            )}
            {children}
        </span>
    )
}

// ============================================================================
// TAG
// ============================================================================

export function Tag({
    children,
    variant = 'default',
    size = 'sm',
    removable = false,
    onRemove,
    icon,
    className = '',
}: TagProps) {
    return (
        <span
            className={`
                inline-flex items-center gap-1 font-medium rounded-md
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
            {removable && (
                <button
                    onClick={onRemove}
                    className="flex-shrink-0 ml-0.5 -mr-0.5 p-0.5 rounded hover:bg-black/20 transition-colors"
                >
                    <X className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                </button>
            )}
        </span>
    )
}

// ============================================================================
// STATUS DOT
// ============================================================================

const statusColors: Record<StatusDotProps['status'], string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-orange-500',
    dnd: 'bg-red-500',
}

export function StatusDot({
    status,
    size = 'sm',
    pulse = false,
    className = '',
}: StatusDotProps) {
    return (
        <span className={`relative inline-block ${className}`}>
            <span
                className={`
                    block rounded-full
                    ${statusColors[status]}
                    ${dotSizeStyles[size]}
                `}
            />
            {pulse && status === 'online' && (
                <span
                    className={`
                        absolute inset-0 rounded-full animate-ping
                        ${statusColors[status]}
                        opacity-75
                    `}
                />
            )}
        </span>
    )
}

// ============================================================================
// COUNT BADGE
// ============================================================================

export function CountBadge({
    count,
    max = 99,
    size = 'sm',
    variant = 'error',
    showZero = false,
    className = '',
}: CountBadgeProps) {
    if (count === 0 && !showZero) return null

    const displayCount = count > max ? `${max}+` : count

    const sizeClasses = {
        xs: 'min-w-4 h-4 text-[10px]',
        sm: 'min-w-5 h-5 text-xs',
        md: 'min-w-6 h-6 text-sm',
    }

    return (
        <span
            className={`
                inline-flex items-center justify-center font-medium rounded-full px-1
                ${dotStyles[variant]} text-white
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {displayCount}
        </span>
    )
}

// ============================================================================
// AVATAR BADGE
// ============================================================================

const badgePositions: Record<Required<AvatarBadgeProps>['badgePosition'], string> = {
    'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
    'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
    'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
}

export function AvatarBadge({
    children,
    badge,
    badgePosition = 'bottom-right',
    className = '',
}: AvatarBadgeProps) {
    return (
        <div className={`relative inline-block ${className}`}>
            {children}
            {badge && (
                <span className={`absolute ${badgePositions[badgePosition]}`}>
                    {badge}
                </span>
            )}
        </div>
    )
}

// ============================================================================
// INDICATOR
// ============================================================================

interface IndicatorProps {
    children: React.ReactNode
    show?: boolean
    variant?: BadgeVariant
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
    size?: BadgeSize
    className?: string
}

export function Indicator({
    children,
    show = true,
    variant = 'error',
    position = 'top-right',
    size = 'xs',
    className = '',
}: IndicatorProps) {
    return (
        <div className={`relative inline-block ${className}`}>
            {children}
            {show && (
                <span
                    className={`
                        absolute block rounded-full ring-2 ring-slate-900
                        ${dotStyles[variant]}
                        ${dotSizeStyles[size]}
                        ${badgePositions[position]}
                    `}
                />
            )}
        </div>
    )
}

// ============================================================================
// LABEL
// ============================================================================

interface LabelProps {
    children: React.ReactNode
    variant?: BadgeVariant
    uppercase?: boolean
    className?: string
}

export function Label({
    children,
    variant = 'default',
    uppercase = true,
    className = '',
}: LabelProps) {
    return (
        <span
            className={`
                inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded
                ${variantStyles[variant]}
                ${uppercase ? 'uppercase' : ''}
                ${className}
            `}
        >
            {children}
        </span>
    )
}
