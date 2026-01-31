/**
 * SprintLoop Avatar System
 * 
 * Phase 2701-2750: Avatars
 * - User avatars
 * - Avatar groups
 * - Fallback initials
 * - Status indicator
 */

import React, { useState } from 'react'
import { User } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type AvatarShape = 'circle' | 'rounded' | 'square'

interface AvatarProps {
    src?: string
    alt?: string
    name?: string
    size?: AvatarSize
    shape?: AvatarShape
    status?: 'online' | 'offline' | 'away' | 'busy' | 'dnd'
    showStatus?: boolean
    className?: string
}

interface AvatarGroupProps {
    avatars: Array<{ src?: string; name?: string; alt?: string }>
    max?: number
    size?: AvatarSize
    shape?: AvatarShape
    className?: string
}

// ============================================================================
// STYLES
// ============================================================================

const sizeStyles: Record<AvatarSize, string> = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
}

const statusSizeStyles: Record<AvatarSize, string> = {
    xs: 'w-1.5 h-1.5 right-0 bottom-0',
    sm: 'w-2 h-2 right-0 bottom-0',
    md: 'w-2.5 h-2.5 right-0.5 bottom-0.5',
    lg: 'w-3 h-3 right-0.5 bottom-0.5',
    xl: 'w-4 h-4 right-1 bottom-1',
    '2xl': 'w-5 h-5 right-1 bottom-1',
}

const shapeStyles: Record<AvatarShape, string> = {
    circle: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-none',
}

const statusColors: Record<Required<AvatarProps>['status'], string> = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-orange-500',
    dnd: 'bg-red-500',
}

// ============================================================================
// HELPERS
// ============================================================================

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
}

function getColorFromName(name: string): string {
    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-sky-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
        'bg-rose-500',
    ]

    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }

    return colors[Math.abs(hash) % colors.length]
}

// ============================================================================
// AVATAR
// ============================================================================

export function Avatar({
    src,
    alt,
    name,
    size = 'md',
    shape = 'circle',
    status,
    showStatus = false,
    className = '',
}: AvatarProps) {
    const [imageError, setImageError] = useState(false)

    const showImage = src && !imageError
    const showInitials = !showImage && name
    const showFallback = !showImage && !name

    return (
        <div className={`relative inline-block ${className}`}>
            <div
                className={`
                    relative overflow-hidden flex items-center justify-center font-medium text-white
                    ${sizeStyles[size]}
                    ${shapeStyles[shape]}
                    ${showInitials ? getColorFromName(name!) : 'bg-white/10'}
                `}
            >
                {showImage && (
                    <img
                        src={src}
                        alt={alt || name || 'Avatar'}
                        onError={() => setImageError(true)}
                        className="w-full h-full object-cover"
                    />
                )}
                {showInitials && getInitials(name!)}
                {showFallback && (
                    <User className={`w-1/2 h-1/2 text-gray-400`} />
                )}
            </div>

            {showStatus && status && (
                <span
                    className={`
                        absolute ring-2 ring-slate-900 rounded-full
                        ${statusColors[status]}
                        ${statusSizeStyles[size]}
                    `}
                />
            )}
        </div>
    )
}

// ============================================================================
// AVATAR GROUP
// ============================================================================

export function AvatarGroup({
    avatars,
    max = 4,
    size = 'md',
    shape = 'circle',
    className = '',
}: AvatarGroupProps) {
    const visible = avatars.slice(0, max)
    const remaining = avatars.length - max

    const overlapStyles: Record<AvatarSize, string> = {
        xs: '-ml-1.5',
        sm: '-ml-2',
        md: '-ml-2.5',
        lg: '-ml-3',
        xl: '-ml-4',
        '2xl': '-ml-5',
    }

    return (
        <div className={`flex items-center ${className}`}>
            {visible.map((avatar, index) => (
                <div
                    key={index}
                    className={`ring-2 ring-slate-900 ${shapeStyles[shape]} ${index > 0 ? overlapStyles[size] : ''}`}
                >
                    <Avatar
                        src={avatar.src}
                        name={avatar.name}
                        alt={avatar.alt}
                        size={size}
                        shape={shape}
                    />
                </div>
            ))}
            {remaining > 0 && (
                <div
                    className={`
                        ${overlapStyles[size]} ring-2 ring-slate-900
                        ${sizeStyles[size]}
                        ${shapeStyles[shape]}
                        flex items-center justify-center bg-slate-700 text-gray-300 font-medium
                    `}
                >
                    +{remaining}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// AVATAR BUTTON
// ============================================================================

interface AvatarButtonProps extends AvatarProps {
    onClick?: () => void
}

export function AvatarButton({
    onClick,
    ...props
}: AvatarButtonProps) {
    return (
        <button
            onClick={onClick}
            className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full transition-transform hover:scale-105"
        >
            <Avatar {...props} />
        </button>
    )
}

// ============================================================================
// AVATAR WITH NAME
// ============================================================================

interface AvatarWithNameProps extends AvatarProps {
    subtitle?: string
    namePosition?: 'right' | 'bottom'
}

export function AvatarWithName({
    subtitle,
    namePosition = 'right',
    name,
    ...props
}: AvatarWithNameProps) {
    return (
        <div className={`flex items-center ${namePosition === 'bottom' ? 'flex-col text-center' : 'gap-3'}`}>
            <Avatar name={name} {...props} />
            {name && (
                <div className={namePosition === 'bottom' ? 'mt-2' : ''}>
                    <div className="font-medium text-white">{name}</div>
                    {subtitle && (
                        <div className="text-sm text-gray-500">{subtitle}</div>
                    )}
                </div>
            )}
        </div>
    )
}
