/**
 * SprintLoop Sidebar System
 * 
 * Phase 3351-3400: Sidebar
 * - Collapsible sidebar
 * - Sidebar navigation
 * - Sidebar groups
 * - Mini sidebar
 */

import React, { useState, useCallback, createContext, useContext } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Menu,
    X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface SidebarContextValue {
    isCollapsed: boolean
    setIsCollapsed: (collapsed: boolean) => void
    isMobileOpen: boolean
    setIsMobileOpen: (open: boolean) => void
}

interface SidebarNavItem {
    id: string
    label: string
    icon?: React.ReactNode
    href?: string
    onClick?: () => void
    badge?: React.ReactNode
    active?: boolean
    disabled?: boolean
    children?: SidebarNavItem[]
}

// ============================================================================
// CONTEXT
// ============================================================================

const SidebarContext = createContext<SidebarContextValue | null>(null)

function useSidebar() {
    const context = useContext(SidebarContext)
    if (!context) {
        throw new Error('useSidebar must be used within SidebarProvider')
    }
    return context
}

// ============================================================================
// SIDEBAR PROVIDER
// ============================================================================

interface SidebarProviderProps {
    children: React.ReactNode
    defaultCollapsed?: boolean
}

export function SidebarProvider({
    children,
    defaultCollapsed = false,
}: SidebarProviderProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    return (
        <SidebarContext.Provider
            value={{ isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }}
        >
            {children}
        </SidebarContext.Provider>
    )
}

// ============================================================================
// SIDEBAR
// ============================================================================

interface SidebarProps {
    children: React.ReactNode
    side?: 'left' | 'right'
    width?: number
    collapsedWidth?: number
    className?: string
}

export function Sidebar({
    children,
    side = 'left',
    width = 256,
    collapsedWidth = 64,
    className = '',
}: SidebarProps) {
    const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar()

    return (
        <>
            {/* Mobile backdrop */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:relative inset-y-0 z-50 flex flex-col
                    bg-slate-900 border-r border-white/5
                    transition-all duration-300 ease-in-out
                    ${side === 'left' ? 'left-0' : 'right-0'}
                    ${isMobileOpen ? 'translate-x-0' : side === 'left' ? '-translate-x-full lg:translate-x-0' : 'translate-x-full lg:translate-x-0'}
                    ${className}
                `}
                style={{
                    width: isCollapsed ? collapsedWidth : width,
                }}
            >
                {/* Mobile close button */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="lg:hidden absolute top-4 right-4 p-1 text-gray-500 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>

                {children}
            </aside>
        </>
    )
}

// ============================================================================
// SIDEBAR HEADER
// ============================================================================

interface SidebarHeaderProps {
    children?: React.ReactNode
    logo?: React.ReactNode
    title?: string
    className?: string
}

export function SidebarHeader({
    children,
    logo,
    title,
    className = '',
}: SidebarHeaderProps) {
    const { isCollapsed } = useSidebar()

    return (
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-white/5 ${className}`}>
            {logo && <div className="flex-shrink-0">{logo}</div>}
            {!isCollapsed && (
                <>
                    {title && <span className="font-semibold text-white truncate">{title}</span>}
                    {children}
                </>
            )}
        </div>
    )
}

// ============================================================================
// SIDEBAR CONTENT
// ============================================================================

interface SidebarContentProps {
    children: React.ReactNode
    className?: string
}

export function SidebarContent({
    children,
    className = '',
}: SidebarContentProps) {
    return (
        <div className={`flex-1 overflow-y-auto py-2 ${className}`}>
            {children}
        </div>
    )
}

// ============================================================================
// SIDEBAR FOOTER
// ============================================================================

interface SidebarFooterProps {
    children: React.ReactNode
    className?: string
}

export function SidebarFooter({
    children,
    className = '',
}: SidebarFooterProps) {
    return (
        <div className={`border-t border-white/5 p-4 ${className}`}>
            {children}
        </div>
    )
}

// ============================================================================
// SIDEBAR GROUP
// ============================================================================

interface SidebarGroupProps {
    label?: string
    children: React.ReactNode
    collapsible?: boolean
    defaultOpen?: boolean
    className?: string
}

export function SidebarGroup({
    label,
    children,
    collapsible = false,
    defaultOpen = true,
    className = '',
}: SidebarGroupProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)
    const { isCollapsed } = useSidebar()

    if (isCollapsed && label) {
        return <div className={`py-2 ${className}`}>{children}</div>
    }

    return (
        <div className={`py-2 ${className}`}>
            {label && (
                collapsible ? (
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="w-full flex items-center justify-between px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-white transition-colors"
                    >
                        {label}
                        <ChevronDown
                            className={`w-3 h-3 transition-transform ${isOpen ? '' : '-rotate-90'}`}
                        />
                    </button>
                ) : (
                    <div className="px-4 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {label}
                    </div>
                )
            )}
            {(!collapsible || isOpen) && children}
        </div>
    )
}

// ============================================================================
// SIDEBAR NAV
// ============================================================================

interface SidebarNavProps {
    items: SidebarNavItem[]
    className?: string
}

export function SidebarNav({
    items,
    className = '',
}: SidebarNavProps) {
    return (
        <nav className={className}>
            {items.map(item => (
                <SidebarNavItemComponent key={item.id} item={item} />
            ))}
        </nav>
    )
}

// ============================================================================
// SIDEBAR NAV ITEM
// ============================================================================

interface SidebarNavItemComponentProps {
    item: SidebarNavItem
    depth?: number
}

function SidebarNavItemComponent({
    item,
    depth = 0,
}: SidebarNavItemComponentProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const { isCollapsed } = useSidebar()
    const hasChildren = item.children && item.children.length > 0

    const handleClick = useCallback(() => {
        if (item.disabled) return

        if (hasChildren) {
            setIsExpanded(!isExpanded)
        } else {
            item.onClick?.()
        }
    }, [item, hasChildren, isExpanded])

    const Component = item.href ? 'a' : 'button'
    const componentProps = item.href ? { href: item.href } : { onClick: handleClick }

    return (
        <div>
            <Component
                {...componentProps}
                disabled={item.disabled}
                className={`
                    w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors
                    ${item.active
                        ? 'bg-purple-500/10 text-purple-400 border-r-2 border-purple-500'
                        : item.disabled
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                `}
                style={{ paddingLeft: isCollapsed ? 16 : 16 + depth * 12 }}
            >
                {item.icon && (
                    <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {item.icon}
                    </span>
                )}
                {!isCollapsed && (
                    <>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {item.badge && <span className="flex-shrink-0">{item.badge}</span>}
                        {hasChildren && (
                            <ChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? '' : '-rotate-90'}`}
                            />
                        )}
                    </>
                )}
            </Component>

            {/* Children */}
            {hasChildren && isExpanded && !isCollapsed && (
                <div>
                    {item.children!.map(child => (
                        <SidebarNavItemComponent
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SIDEBAR TOGGLE
// ============================================================================

interface SidebarToggleProps {
    className?: string
}

export function SidebarToggle({ className = '' }: SidebarToggleProps) {
    const { isCollapsed, setIsCollapsed } = useSidebar()

    return (
        <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`
                hidden lg:flex items-center justify-center w-6 h-6
                bg-slate-800 border border-white/10 rounded-full
                text-gray-500 hover:text-white transition-colors
                ${className}
            `}
        >
            {isCollapsed ? (
                <ChevronRight className="w-3 h-3" />
            ) : (
                <ChevronLeft className="w-3 h-3" />
            )}
        </button>
    )
}

// ============================================================================
// MOBILE SIDEBAR TRIGGER
// ============================================================================

interface MobileSidebarTriggerProps {
    className?: string
}

export function MobileSidebarTrigger({ className = '' }: MobileSidebarTriggerProps) {
    const { setIsMobileOpen } = useSidebar()

    return (
        <button
            onClick={() => setIsMobileOpen(true)}
            className={`lg:hidden p-2 text-gray-400 hover:text-white ${className}`}
        >
            <Menu className="w-5 h-5" />
        </button>
    )
}
