/**
 * SprintLoop Advanced Context Menu
 * 
 * Phase 3301-3350: Context Menu
 * - Right-click menus
 * - Nested submenus
 * - Keyboard shortcuts
 * - Separators and grouping
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, Check } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface ContextMenuItem {
    id: string
    label: string
    icon?: React.ReactNode
    shortcut?: string[]
    disabled?: boolean
    danger?: boolean
    checked?: boolean
    onSelect?: () => void
    submenu?: ContextMenuItem[]
}

interface ContextMenuSeparator {
    type: 'separator'
}

interface ContextMenuGroup {
    type: 'group'
    label: string
    items: ContextMenuItem[]
}

type ContextMenuContent = ContextMenuItem | ContextMenuSeparator | ContextMenuGroup

interface ContextMenuProps {
    children: React.ReactElement
    items: ContextMenuContent[]
    disabled?: boolean
}

interface ContextMenuState {
    isOpen: boolean
    x: number
    y: number
    submenuState: Map<string, { x: number; y: number }>
}

// ============================================================================
// CONTEXT MENU
// ============================================================================

export function ContextMenu({
    children,
    items,
    disabled = false,
}: ContextMenuProps) {
    const [state, setState] = useState<ContextMenuState>({
        isOpen: false,
        x: 0,
        y: 0,
        submenuState: new Map(),
    })

    const menuRef = useRef<HTMLDivElement>(null)

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        if (disabled) return

        e.preventDefault()
        e.stopPropagation()

        // Calculate position (keep menu in viewport)
        const x = Math.min(e.clientX, window.innerWidth - 220)
        const y = Math.min(e.clientY, window.innerHeight - 300)

        setState({
            isOpen: true,
            x,
            y,
            submenuState: new Map(),
        })
    }, [disabled])

    const handleClose = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false, submenuState: new Map() }))
    }, [])

    // Close on click outside or escape
    useEffect(() => {
        if (!state.isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                handleClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') handleClose()
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [state.isOpen, handleClose])

    const handleItemClick = useCallback((item: ContextMenuItem, e: React.MouseEvent) => {
        e.stopPropagation()

        if (item.disabled) return
        if (item.submenu) return // Submenus handled separately

        item.onSelect?.()
        handleClose()
    }, [handleClose])

    const handleSubmenuEnter = useCallback((itemId: string, e: React.MouseEvent) => {
        const target = e.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()

        setState(prev => {
            const newSubmenuState = new Map(prev.submenuState)
            newSubmenuState.set(itemId, {
                x: rect.right,
                y: rect.top,
            })
            return { ...prev, submenuState: newSubmenuState }
        })
    }, [])

    const handleSubmenuLeave = useCallback((itemId: string) => {
        setState(prev => {
            const newSubmenuState = new Map(prev.submenuState)
            newSubmenuState.delete(itemId)
            return { ...prev, submenuState: newSubmenuState }
        })
    }, [])

    const childWithHandler = React.cloneElement(children, {
        onContextMenu: handleContextMenu,
    })

    return (
        <>
            {childWithHandler}

            {state.isOpen && createPortal(
                <div ref={menuRef}>
                    <ContextMenuList
                        items={items}
                        x={state.x}
                        y={state.y}
                        submenuState={state.submenuState}
                        onItemClick={handleItemClick}
                        onSubmenuEnter={handleSubmenuEnter}
                        onSubmenuLeave={handleSubmenuLeave}
                        onClose={handleClose}
                    />
                </div>,
                document.body
            )}
        </>
    )
}

// ============================================================================
// CONTEXT MENU LIST
// ============================================================================

interface ContextMenuListProps {
    items: ContextMenuContent[]
    x: number
    y: number
    submenuState: Map<string, { x: number; y: number }>
    onItemClick: (item: ContextMenuItem, e: React.MouseEvent) => void
    onSubmenuEnter: (itemId: string, e: React.MouseEvent) => void
    onSubmenuLeave: (itemId: string) => void
    onClose: () => void
}

function ContextMenuList({
    items,
    x,
    y,
    submenuState,
    onItemClick,
    onSubmenuEnter,
    onSubmenuLeave,
    onClose,
}: ContextMenuListProps) {
    return (
        <div
            className="fixed z-[100] min-w-[180px] bg-slate-800 border border-white/10 rounded-lg shadow-xl py-1 animate-in fade-in-0 zoom-in-95 duration-100"
            style={{ left: x, top: y }}
        >
            {items.map((item, index) => {
                if ('type' in item && item.type === 'separator') {
                    return <div key={index} className="my-1 border-t border-white/5" />
                }

                if ('type' in item && item.type === 'group') {
                    return (
                        <div key={index}>
                            <div className="px-3 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                                {item.label}
                            </div>
                            {item.items.map(subItem => (
                                <ContextMenuItemComponent
                                    key={subItem.id}
                                    item={subItem}
                                    submenuState={submenuState}
                                    onItemClick={onItemClick}
                                    onSubmenuEnter={onSubmenuEnter}
                                    onSubmenuLeave={onSubmenuLeave}
                                    onClose={onClose}
                                />
                            ))}
                        </div>
                    )
                }

                return (
                    <ContextMenuItemComponent
                        key={item.id}
                        item={item}
                        submenuState={submenuState}
                        onItemClick={onItemClick}
                        onSubmenuEnter={onSubmenuEnter}
                        onSubmenuLeave={onSubmenuLeave}
                        onClose={onClose}
                    />
                )
            })}
        </div>
    )
}

// ============================================================================
// CONTEXT MENU ITEM
// ============================================================================

interface ContextMenuItemComponentProps {
    item: ContextMenuItem
    submenuState: Map<string, { x: number; y: number }>
    onItemClick: (item: ContextMenuItem, e: React.MouseEvent) => void
    onSubmenuEnter: (itemId: string, e: React.MouseEvent) => void
    onSubmenuLeave: (itemId: string) => void
    onClose: () => void
}

function ContextMenuItemComponent({
    item,
    submenuState,
    onItemClick,
    onSubmenuEnter,
    onSubmenuLeave,
    onClose,
}: ContextMenuItemComponentProps) {
    const hasSubmenu = !!item.submenu
    const isSubmenuOpen = submenuState.has(item.id)
    const submenuPos = submenuState.get(item.id)

    return (
        <div className="relative">
            <button
                onClick={(e) => onItemClick(item, e)}
                onMouseEnter={(e) => hasSubmenu && onSubmenuEnter(item.id, e)}
                onMouseLeave={() => hasSubmenu && onSubmenuLeave(item.id)}
                disabled={item.disabled}
                className={`
                    w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left transition-colors
                    ${item.disabled
                        ? 'text-gray-600 cursor-not-allowed'
                        : item.danger
                            ? 'text-red-400 hover:bg-red-500/10'
                            : 'text-gray-300 hover:bg-white/5'
                    }
                `}
            >
                {/* Icon or check */}
                <span className="w-4 flex items-center justify-center">
                    {item.checked !== undefined ? (
                        item.checked && <Check className="w-3 h-3" />
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
                    <span className="flex items-center gap-0.5">
                        {item.shortcut.map((key, i) => (
                            <kbd
                                key={i}
                                className="px-1 py-0.5 text-[10px] text-gray-500 bg-white/5 rounded font-mono"
                            >
                                {key}
                            </kbd>
                        ))}
                    </span>
                ) : null}
            </button>

            {/* Submenu */}
            {hasSubmenu && isSubmenuOpen && submenuPos && (
                <ContextMenuList
                    items={item.submenu!}
                    x={submenuPos.x}
                    y={submenuPos.y}
                    submenuState={submenuState}
                    onItemClick={onItemClick}
                    onSubmenuEnter={onSubmenuEnter}
                    onSubmenuLeave={onSubmenuLeave}
                    onClose={onClose}
                />
            )}
        </div>
    )
}

// ============================================================================
// USE CONTEXT MENU HOOK
// ============================================================================

export function useContextMenu(items: ContextMenuContent[]) {
    const [state, setState] = useState<{ isOpen: boolean; x: number; y: number }>({
        isOpen: false,
        x: 0,
        y: 0,
    })

    const open = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setState({
            isOpen: true,
            x: Math.min(e.clientX, window.innerWidth - 220),
            y: Math.min(e.clientY, window.innerHeight - 300),
        })
    }, [])

    const close = useCallback(() => {
        setState(prev => ({ ...prev, isOpen: false }))
    }, [])

    const contextMenuProps = {
        onContextMenu: open,
    }

    const contextMenuElement = state.isOpen ? (
        <ContextMenuPortal
            items={items}
            x={state.x}
            y={state.y}
            onClose={close}
        />
    ) : null

    return { contextMenuProps, contextMenuElement, open, close, isOpen: state.isOpen }
}

// ============================================================================
// CONTEXT MENU PORTAL
// ============================================================================

interface ContextMenuPortalProps {
    items: ContextMenuContent[]
    x: number
    y: number
    onClose: () => void
}

function ContextMenuPortal({ items, x, y, onClose }: ContextMenuPortalProps) {
    const menuRef = useRef<HTMLDivElement>(null)
    const [submenuState, setSubmenuState] = useState<Map<string, { x: number; y: number }>>(new Map())

    // Close handlers
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [onClose])

    const handleItemClick = useCallback((item: ContextMenuItem, e: React.MouseEvent) => {
        e.stopPropagation()
        if (item.disabled || item.submenu) return
        item.onSelect?.()
        onClose()
    }, [onClose])

    const handleSubmenuEnter = useCallback((itemId: string, e: React.MouseEvent) => {
        const target = e.currentTarget as HTMLElement
        const rect = target.getBoundingClientRect()
        setSubmenuState(prev => {
            const next = new Map(prev)
            next.set(itemId, { x: rect.right, y: rect.top })
            return next
        })
    }, [])

    const handleSubmenuLeave = useCallback((itemId: string) => {
        setSubmenuState(prev => {
            const next = new Map(prev)
            next.delete(itemId)
            return next
        })
    }, [])

    return createPortal(
        <div ref={menuRef}>
            <ContextMenuList
                items={items}
                x={x}
                y={y}
                submenuState={submenuState}
                onItemClick={handleItemClick}
                onSubmenuEnter={handleSubmenuEnter}
                onSubmenuLeave={handleSubmenuLeave}
                onClose={onClose}
            />
        </div>,
        document.body
    )
}
