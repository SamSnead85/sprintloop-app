/**
 * SprintLoop Context Menu System
 * 
 * Phase 2351-2400: Context menus
 * - Right-click menus
 * - Nested submenus
 * - Keyboard shortcuts
 * - Separators
 * - Icons
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
    ChevronRight,
    Check,
    Circle
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ContextMenuItem {
    id: string
    label: string
    icon?: React.ReactNode
    shortcut?: string
    disabled?: boolean
    danger?: boolean
    checked?: boolean
    radio?: boolean
    items?: ContextMenuItem[]
    onSelect?: () => void
    separator?: boolean
}

interface Position {
    x: number
    y: number
}

// ============================================================================
// CONTEXT MENU ITEM
// ============================================================================

interface MenuItemProps {
    item: ContextMenuItem
    onSelect: () => void
    onSubmenuOpen: (id: string, position: Position) => void
    isSubmenuOpen: boolean
}

function MenuItem({ item, onSelect, onSubmenuOpen, isSubmenuOpen }: MenuItemProps) {
    const itemRef = useRef<HTMLButtonElement>(null)

    const handleMouseEnter = () => {
        if (item.items && itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect()
            onSubmenuOpen(item.id, { x: rect.right, y: rect.top })
        }
    }

    if (item.separator) {
        return <div className="h-px bg-white/10 my-1" />
    }

    const hasSubmenu = item.items && item.items.length > 0

    return (
        <button
            ref={itemRef}
            onClick={() => {
                if (!hasSubmenu && !item.disabled) {
                    item.onSelect?.()
                    onSelect()
                }
            }}
            onMouseEnter={handleMouseEnter}
            disabled={item.disabled}
            className={`
                w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors
                ${item.disabled
                    ? 'text-gray-600 cursor-not-allowed'
                    : item.danger
                        ? 'text-red-400 hover:bg-red-500/20'
                        : 'text-gray-300 hover:bg-white/5'
                }
                ${isSubmenuOpen ? 'bg-white/5' : ''}
            `}
        >
            {/* Icon or checkbox */}
            <span className="w-4 flex-shrink-0">
                {item.checked !== undefined ? (
                    item.radio ? (
                        item.checked ? (
                            <Circle className="w-3 h-3 fill-purple-400 text-purple-400" />
                        ) : (
                            <Circle className="w-3 h-3 text-gray-600" />
                        )
                    ) : (
                        item.checked && <Check className="w-4 h-4 text-purple-400" />
                    )
                ) : (
                    item.icon
                )}
            </span>

            {/* Label */}
            <span className="flex-1">{item.label}</span>

            {/* Shortcut or submenu arrow */}
            {hasSubmenu ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : item.shortcut ? (
                <span className="text-xs text-gray-600">{item.shortcut}</span>
            ) : null}
        </button>
    )
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

interface ContextMenuProps {
    items: ContextMenuItem[]
    position: Position
    onClose: () => void
    className?: string
}

export function ContextMenu({ items, position, onClose, className = '' }: ContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)
    const [submenuPosition, setSubmenuPosition] = useState<Position>({ x: 0, y: 0 })

    // Get the submenu items
    const getSubmenuItems = (id: string): ContextMenuItem[] => {
        const item = items.find(i => i.id === id)
        return item?.items || []
    }

    // Handle submenu open
    const handleSubmenuOpen = useCallback((id: string, pos: Position) => {
        setOpenSubmenuId(id)
        setSubmenuPosition(pos)
    }, [])

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    // Adjust position to stay in viewport
    const adjustedPosition = { ...position }
    if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect()
        if (position.x + rect.width > window.innerWidth) {
            adjustedPosition.x = position.x - rect.width
        }
        if (position.y + rect.height > window.innerHeight) {
            adjustedPosition.y = position.y - rect.height
        }
    }

    return (
        <div
            ref={menuRef}
            className={`fixed z-50 ${className}`}
            style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
        >
            <div className="min-w-48 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl">
                {items.map(item => (
                    <MenuItem
                        key={item.id}
                        item={item}
                        onSelect={onClose}
                        onSubmenuOpen={handleSubmenuOpen}
                        isSubmenuOpen={openSubmenuId === item.id}
                    />
                ))}
            </div>

            {/* Submenu */}
            {openSubmenuId && getSubmenuItems(openSubmenuId).length > 0 && (
                <ContextMenu
                    items={getSubmenuItems(openSubmenuId)}
                    position={submenuPosition}
                    onClose={onClose}
                />
            )}
        </div>
    )
}

// ============================================================================
// USE CONTEXT MENU HOOK
// ============================================================================

interface UseContextMenuReturn {
    isOpen: boolean
    position: Position
    openMenu: (e: React.MouseEvent) => void
    closeMenu: () => void
}

export function useContextMenu(): UseContextMenuReturn {
    const [isOpen, setIsOpen] = useState(false)
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 })

    const openMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setPosition({ x: e.clientX, y: e.clientY })
        setIsOpen(true)
    }, [])

    const closeMenu = useCallback(() => {
        setIsOpen(false)
    }, [])

    return { isOpen, position, openMenu, closeMenu }
}

// ============================================================================
// CONTEXT MENU PROVIDER
// ============================================================================

interface ContextMenuTriggerProps {
    items: ContextMenuItem[]
    children: React.ReactNode
    disabled?: boolean
}

export function ContextMenuTrigger({ items, children, disabled }: ContextMenuTriggerProps) {
    const { isOpen, position, openMenu, closeMenu } = useContextMenu()

    return (
        <>
            <div
                onContextMenu={disabled ? undefined : openMenu}
                className="contents"
            >
                {children}
            </div>

            {isOpen && (
                <ContextMenu
                    items={items}
                    position={position}
                    onClose={closeMenu}
                />
            )}
        </>
    )
}

// ============================================================================
// DEMO CONTEXT MENU ITEMS
// ============================================================================

export const fileContextMenuItems: ContextMenuItem[] = [
    { id: 'new-file', label: 'New File', shortcut: '⌘N' },
    { id: 'new-folder', label: 'New Folder', shortcut: '⇧⌘N' },
    { id: 'sep1', label: '', separator: true },
    { id: 'cut', label: 'Cut', shortcut: '⌘X' },
    { id: 'copy', label: 'Copy', shortcut: '⌘C' },
    { id: 'paste', label: 'Paste', shortcut: '⌘V' },
    { id: 'sep2', label: '', separator: true },
    { id: 'rename', label: 'Rename', shortcut: 'F2' },
    { id: 'delete', label: 'Delete', shortcut: '⌘⌫', danger: true },
    { id: 'sep3', label: '', separator: true },
    {
        id: 'copy-submenu', label: 'Copy As', items: [
            { id: 'copy-path', label: 'Copy Path' },
            { id: 'copy-relative-path', label: 'Copy Relative Path' },
            { id: 'copy-name', label: 'Copy Name' },
        ]
    },
    { id: 'reveal', label: 'Reveal in Finder' },
]

export const editorContextMenuItems: ContextMenuItem[] = [
    { id: 'go-to-definition', label: 'Go to Definition', shortcut: 'F12' },
    { id: 'go-to-type', label: 'Go to Type Definition' },
    { id: 'go-to-refs', label: 'Go to References', shortcut: '⇧F12' },
    { id: 'sep1', label: '', separator: true },
    { id: 'peek-definition', label: 'Peek Definition', shortcut: '⌥F12' },
    { id: 'peek-refs', label: 'Peek References' },
    { id: 'sep2', label: '', separator: true },
    { id: 'rename-symbol', label: 'Rename Symbol', shortcut: 'F2' },
    { id: 'refactor', label: 'Refactor...', shortcut: '⌃⇧R' },
    { id: 'sep3', label: '', separator: true },
    { id: 'cut', label: 'Cut', shortcut: '⌘X' },
    { id: 'copy', label: 'Copy', shortcut: '⌘C' },
    { id: 'paste', label: 'Paste', shortcut: '⌘V' },
    { id: 'sep4', label: '', separator: true },
    { id: 'format', label: 'Format Document', shortcut: '⇧⌥F' },
    { id: 'format-selection', label: 'Format Selection', shortcut: '⌘K ⌘F' },
]
