/**
 * SprintLoop Context Menu System
 * 
 * Right-click context menus with:
 * - Nested submenus
 * - Keyboard navigation
 * - Icons and shortcuts
 * - Disabled states
 * - Separators
 */

import React, { useState, useRef, useEffect, createContext, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Check } from 'lucide-react'

// ============================================================================
// CONTEXT MENU TYPES
// ============================================================================

export interface ContextMenuItem {
    id: string
    type?: 'item' | 'separator' | 'submenu' | 'checkbox' | 'radio'
    label?: string
    icon?: React.ReactNode
    shortcut?: string
    disabled?: boolean
    checked?: boolean
    danger?: boolean
    items?: ContextMenuItem[] // For submenus
    onClick?: () => void
}

interface ContextMenuState {
    x: number
    y: number
    items: ContextMenuItem[]
}

// ============================================================================
// CONTEXT MENU CONTEXT
// ============================================================================

interface ContextMenuContextValue {
    show: (x: number, y: number, items: ContextMenuItem[]) => void
    hide: () => void
}

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null)

export function useContextMenu() {
    const context = useContext(ContextMenuContext)
    if (!context) {
        throw new Error('useContextMenu must be used within ContextMenuProvider')
    }
    return context
}

// ============================================================================
// MENU ITEM COMPONENT
// ============================================================================

interface MenuItemProps {
    item: ContextMenuItem
    onClose: () => void
    onSubmenuOpen: (id: string) => void
    openSubmenuId: string | null
}

function MenuItem({ item, onClose, onSubmenuOpen, openSubmenuId }: MenuItemProps) {
    const itemRef = useRef<HTMLDivElement>(null)
    const [submenuPosition, setSubmenuPosition] = useState<{ x: number; y: number } | null>(null)

    const hasSubmenu = item.type === 'submenu' && item.items && item.items.length > 0
    const isSubmenuOpen = openSubmenuId === item.id

    useEffect(() => {
        if (hasSubmenu && isSubmenuOpen && itemRef.current) {
            const rect = itemRef.current.getBoundingClientRect()
            setSubmenuPosition({
                x: rect.right,
                y: rect.top,
            })
        } else {
            setSubmenuPosition(null)
        }
    }, [hasSubmenu, isSubmenuOpen])

    if (item.type === 'separator') {
        return <div className="my-1 border-t border-white/5" role="separator" />
    }

    const handleClick = () => {
        if (item.disabled) return

        if (hasSubmenu) {
            onSubmenuOpen(isSubmenuOpen ? '' : item.id)
        } else {
            item.onClick?.()
            onClose()
        }
    }

    const handleMouseEnter = () => {
        if (hasSubmenu) {
            onSubmenuOpen(item.id)
        }
    }

    return (
        <div ref={itemRef} className="relative">
            <button
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                disabled={item.disabled}
                className={`
                    w-full flex items-center gap-3 px-3 py-1.5 text-sm text-left
                    transition-colors rounded-md
                    ${item.danger
                        ? 'text-red-400 hover:bg-red-500/20'
                        : item.disabled
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-300 hover:bg-white/5'
                    }
                `}
                role="menuitem"
                aria-disabled={item.disabled}
            >
                {/* Icon or checkbox indicator */}
                <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                    {item.type === 'checkbox' ? (
                        item.checked && <Check className="w-4 h-4 text-purple-400" />
                    ) : item.type === 'radio' ? (
                        item.checked && (
                            <span className="w-2 h-2 rounded-full bg-purple-400" />
                        )
                    ) : (
                        item.icon
                    )}
                </span>

                {/* Label */}
                <span className="flex-1">{item.label}</span>

                {/* Shortcut or submenu arrow */}
                {hasSubmenu ? (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                ) : item.shortcut ? (
                    <span className="text-xs text-gray-600">{item.shortcut}</span>
                ) : null}
            </button>

            {/* Submenu */}
            {hasSubmenu && submenuPosition && isSubmenuOpen && item.items && (
                <ContextMenuPanel
                    x={submenuPosition.x}
                    y={submenuPosition.y}
                    items={item.items}
                    onClose={onClose}
                    isSubmenu
                />
            )}
        </div>
    )
}

// ============================================================================
// CONTEXT MENU PANEL
// ============================================================================

interface ContextMenuPanelProps {
    x: number
    y: number
    items: ContextMenuItem[]
    onClose: () => void
    isSubmenu?: boolean
}

function ContextMenuPanel({ x, y, items, onClose, isSubmenu }: ContextMenuPanelProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [openSubmenuId, setOpenSubmenuId] = useState<string | null>(null)
    const [position, setPosition] = useState({ x, y })
    const [focusedIndex, setFocusedIndex] = useState(0)

    // Adjust position to fit in viewport
    useEffect(() => {
        if (!menuRef.current) return

        const rect = menuRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight

        let newX = x
        let newY = y

        // Flip horizontally if overflowing right
        if (x + rect.width > viewportWidth) {
            newX = isSubmenu ? x - rect.width - 4 : x - rect.width
        }

        // Flip vertically if overflowing bottom
        if (y + rect.height > viewportHeight) {
            newY = viewportHeight - rect.height - 8
        }

        if (newX !== x || newY !== y) {
            setPosition({ x: newX, y: newY })
        }
    }, [x, y, isSubmenu])

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setFocusedIndex(i => {
                        let next = (i + 1) % items.length
                        while (items[next].type === 'separator' && next !== i) {
                            next = (next + 1) % items.length
                        }
                        return next
                    })
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setFocusedIndex(i => {
                        let next = (i - 1 + items.length) % items.length
                        while (items[next].type === 'separator' && next !== i) {
                            next = (next - 1 + items.length) % items.length
                        }
                        return next
                    })
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    if (items[focusedIndex].type === 'submenu') {
                        setOpenSubmenuId(items[focusedIndex].id)
                    }
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    if (isSubmenu) {
                        onClose()
                    }
                    break
                case 'Enter':
                case ' ':
                    e.preventDefault()
                    const item = items[focusedIndex]
                    if (!item.disabled && item.type !== 'separator') {
                        if (item.type === 'submenu') {
                            setOpenSubmenuId(item.id)
                        } else {
                            item.onClick?.()
                            onClose()
                        }
                    }
                    break
                case 'Escape':
                    onClose()
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [items, focusedIndex, isSubmenu, onClose])

    return (
        <div
            ref={menuRef}
            className={`
                fixed z-[100] min-w-[200px] py-1 px-1
                bg-slate-900/95 backdrop-blur-xl
                border border-white/10 rounded-lg shadow-2xl
                animate-scale-in origin-top-left
            `}
            style={{
                left: position.x,
                top: position.y,
            }}
            role="menu"
        >
            {items.map((item) => (
                <MenuItem
                    key={item.id}
                    item={item}
                    onClose={onClose}
                    onSubmenuOpen={setOpenSubmenuId}
                    openSubmenuId={openSubmenuId}
                />
            ))}
        </div>
    )
}

// ============================================================================
// CONTEXT MENU PROVIDER
// ============================================================================

interface ContextMenuProviderProps {
    children: React.ReactNode
}

export function ContextMenuProvider({ children }: ContextMenuProviderProps) {
    const [menu, setMenu] = useState<ContextMenuState | null>(null)

    const show = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
        setMenu({ x, y, items })
    }, [])

    const hide = useCallback(() => {
        setMenu(null)
    }, [])

    // Close on click outside
    useEffect(() => {
        if (!menu) return

        const handleClick = () => hide()
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            hide()
        }

        document.addEventListener('click', handleClick)
        document.addEventListener('contextmenu', handleContextMenu)

        return () => {
            document.removeEventListener('click', handleClick)
            document.removeEventListener('contextmenu', handleContextMenu)
        }
    }, [menu, hide])

    return (
        <ContextMenuContext.Provider value={{ show, hide }}>
            {children}
            {menu && createPortal(
                <ContextMenuPanel
                    x={menu.x}
                    y={menu.y}
                    items={menu.items}
                    onClose={hide}
                />,
                document.body
            )}
        </ContextMenuContext.Provider>
    )
}

// ============================================================================
// CONTEXT MENU TRIGGER
// ============================================================================

interface ContextMenuTriggerProps {
    items: ContextMenuItem[]
    children: React.ReactNode
    disabled?: boolean
}

export function ContextMenuTrigger({ items, children, disabled }: ContextMenuTriggerProps) {
    const { show } = useContextMenu()

    const handleContextMenu = (e: React.MouseEvent) => {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()
        show(e.clientX, e.clientY, items)
    }

    return (
        <div onContextMenu={handleContextMenu}>
            {children}
        </div>
    )
}

// ============================================================================
// PRESET MENU ITEM BUILDERS
// ============================================================================

export function createMenuItem(
    id: string,
    label: string,
    onClick: () => void,
    options?: Partial<ContextMenuItem>
): ContextMenuItem {
    return {
        id,
        type: 'item',
        label,
        onClick,
        ...options,
    }
}

export function createSeparator(id: string): ContextMenuItem {
    return {
        id,
        type: 'separator',
    }
}

export function createSubmenu(
    id: string,
    label: string,
    items: ContextMenuItem[],
    options?: Partial<ContextMenuItem>
): ContextMenuItem {
    return {
        id,
        type: 'submenu',
        label,
        items,
        ...options,
    }
}

export function createCheckboxItem(
    id: string,
    label: string,
    checked: boolean,
    onClick: () => void,
    options?: Partial<ContextMenuItem>
): ContextMenuItem {
    return {
        id,
        type: 'checkbox',
        label,
        checked,
        onClick,
        ...options,
    }
}
