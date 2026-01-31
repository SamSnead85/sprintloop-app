/**
 * SprintLoop Navigation Components
 * 
 * Phase 2851-2900: Navigation
 * - Tabs component
 * - Breadcrumbs
 * - Pagination
 * - Bottom navigation
 */

import React, { useState, useRef, useEffect } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Home
} from 'lucide-react'

// ============================================================================
// TABS
// ============================================================================

interface Tab {
    id: string
    label: React.ReactNode
    icon?: React.ReactNode
    disabled?: boolean
    badge?: React.ReactNode
}

interface TabsProps {
    tabs: Tab[]
    activeTab: string
    onChange: (tabId: string) => void
    variant?: 'default' | 'pills' | 'underline' | 'boxed'
    size?: 'sm' | 'md' | 'lg'
    fullWidth?: boolean
    className?: string
}

export function Tabs({
    tabs,
    activeTab,
    onChange,
    variant = 'default',
    size = 'md',
    fullWidth = false,
    className = '',
}: TabsProps) {
    const tabsRef = useRef<HTMLDivElement>(null)
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

    // Update underline indicator position
    useEffect(() => {
        if (variant !== 'underline') return

        const tabsContainer = tabsRef.current
        if (!tabsContainer) return

        const activeElement = tabsContainer.querySelector(`[data-tab-id="${activeTab}"]`) as HTMLElement
        if (activeElement) {
            setIndicatorStyle({
                left: activeElement.offsetLeft,
                width: activeElement.offsetWidth,
            })
        }
    }, [activeTab, variant])

    const sizeStyles = {
        sm: 'text-xs h-8 px-3',
        md: 'text-sm h-10 px-4',
        lg: 'text-base h-12 px-5',
    }

    const variantStyles = {
        default: {
            container: 'bg-white/5 p-1 rounded-lg',
            tab: 'rounded-md',
            active: 'bg-white/10 text-white',
            inactive: 'text-gray-400 hover:text-white',
        },
        pills: {
            container: 'gap-2',
            tab: 'rounded-full',
            active: 'bg-purple-500 text-white',
            inactive: 'text-gray-400 hover:text-white hover:bg-white/5',
        },
        underline: {
            container: 'border-b border-white/10',
            tab: '',
            active: 'text-white',
            inactive: 'text-gray-400 hover:text-white',
        },
        boxed: {
            container: 'border border-white/10 rounded-lg',
            tab: '',
            active: 'bg-purple-500/10 text-purple-400 border-b-2 border-purple-500',
            inactive: 'text-gray-400 hover:text-white border-b-2 border-transparent',
        },
    }

    const styles = variantStyles[variant]

    return (
        <div
            ref={tabsRef}
            className={`relative flex ${styles.container} ${fullWidth ? 'w-full' : 'inline-flex'} ${className}`}
        >
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    data-tab-id={tab.id}
                    onClick={() => !tab.disabled && onChange(tab.id)}
                    disabled={tab.disabled}
                    className={`
                        ${fullWidth ? 'flex-1' : ''}
                        inline-flex items-center justify-center gap-2 font-medium transition-colors
                        ${sizeStyles[size]}
                        ${styles.tab}
                        ${activeTab === tab.id ? styles.active : styles.inactive}
                        ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.badge}
                </button>
            ))}

            {/* Underline indicator */}
            {variant === 'underline' && (
                <div
                    className="absolute bottom-0 h-0.5 bg-purple-500 transition-all"
                    style={indicatorStyle}
                />
            )}
        </div>
    )
}

// ============================================================================
// TAB PANELS
// ============================================================================

interface TabPanelProps {
    children: React.ReactNode
    tabId: string
    activeTab: string
    className?: string
}

export function TabPanel({
    children,
    tabId,
    activeTab,
    className = '',
}: TabPanelProps) {
    if (tabId !== activeTab) return null

    return (
        <div className={className} role="tabpanel">
            {children}
        </div>
    )
}

// ============================================================================
// BREADCRUMBS
// ============================================================================

interface BreadcrumbItem {
    label: React.ReactNode
    href?: string
    icon?: React.ReactNode
    onClick?: () => void
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
    separator?: React.ReactNode
    maxItems?: number
    className?: string
}

export function Breadcrumbs({
    items,
    separator = <ChevronRight className="w-4 h-4" />,
    maxItems = 0,
    className = '',
}: BreadcrumbsProps) {
    const [showAll, setShowAll] = useState(false)

    const displayItems = maxItems > 0 && !showAll && items.length > maxItems
        ? [items[0], { label: '...', onClick: () => setShowAll(true) }, ...items.slice(-2)]
        : items

    return (
        <nav aria-label="Breadcrumb" className={className}>
            <ol className="flex items-center gap-1 text-sm">
                {displayItems.map((item, index) => {
                    const isLast = index === displayItems.length - 1
                    const isEllipsis = item.label === '...'

                    return (
                        <li key={index} className="flex items-center gap-1">
                            {isEllipsis ? (
                                <button
                                    onClick={item.onClick}
                                    className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            ) : item.href ? (
                                <a
                                    href={item.href}
                                    className={`flex items-center gap-1.5 transition-colors ${isLast ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </a>
                            ) : item.onClick ? (
                                <button
                                    onClick={item.onClick}
                                    className={`flex items-center gap-1.5 transition-colors ${isLast ? 'text-white font-medium' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ) : (
                                <span className={`flex items-center gap-1.5 ${isLast ? 'text-white font-medium' : 'text-gray-400'
                                    }`}>
                                    {item.icon}
                                    {item.label}
                                </span>
                            )}

                            {!isLast && (
                                <span className="text-gray-600 ml-1">{separator}</span>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}

// ============================================================================
// PAGINATION
// ============================================================================

interface PaginationProps {
    currentPage: number
    totalPages: number
    onChange: (page: number) => void
    siblingCount?: number
    showFirstLast?: boolean
    size?: 'sm' | 'md' | 'lg'
    className?: string
}

export function Pagination({
    currentPage,
    totalPages,
    onChange,
    siblingCount = 1,
    showFirstLast = true,
    size = 'md',
    className = '',
}: PaginationProps) {
    const sizeStyles = {
        sm: 'h-7 min-w-7 text-xs',
        md: 'h-9 min-w-9 text-sm',
        lg: 'h-11 min-w-11 text-base',
    }

    // Generate page numbers
    const getPageNumbers = () => {
        const pages: (number | '...')[] = []
        const leftSibling = Math.max(currentPage - siblingCount, 1)
        const rightSibling = Math.min(currentPage + siblingCount, totalPages)

        const shouldShowLeftDots = leftSibling > 2
        const shouldShowRightDots = rightSibling < totalPages - 1

        if (!shouldShowLeftDots && shouldShowRightDots) {
            for (let i = 1; i <= 3 + 2 * siblingCount; i++) {
                if (i <= totalPages) pages.push(i)
            }
            pages.push('...')
            pages.push(totalPages)
        } else if (shouldShowLeftDots && !shouldShowRightDots) {
            pages.push(1)
            pages.push('...')
            for (let i = totalPages - (2 + 2 * siblingCount); i <= totalPages; i++) {
                if (i > 0) pages.push(i)
            }
        } else if (shouldShowLeftDots && shouldShowRightDots) {
            pages.push(1)
            pages.push('...')
            for (let i = leftSibling; i <= rightSibling; i++) {
                pages.push(i)
            }
            pages.push('...')
            pages.push(totalPages)
        } else {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        }

        return pages
    }

    const pages = getPageNumbers()

    return (
        <nav className={`flex items-center gap-1 ${className}`}>
            {showFirstLast && (
                <button
                    onClick={() => onChange(1)}
                    disabled={currentPage === 1}
                    className={`
                        flex items-center justify-center rounded-lg transition-colors
                        ${sizeStyles[size]}
                        ${currentPage === 1
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    <Home className="w-4 h-4" />
                </button>
            )}

            <button
                onClick={() => onChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`
                    flex items-center justify-center rounded-lg transition-colors
                    ${sizeStyles[size]}
                    ${currentPage === 1
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                `}
            >
                <ChevronLeft className="w-4 h-4" />
            </button>

            {pages.map((page, index) => (
                <button
                    key={index}
                    onClick={() => typeof page === 'number' && onChange(page)}
                    disabled={page === '...'}
                    className={`
                        flex items-center justify-center rounded-lg font-medium transition-colors
                        ${sizeStyles[size]}
                        ${page === currentPage
                            ? 'bg-purple-500 text-white'
                            : page === '...'
                                ? 'text-gray-600 cursor-default'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    {page}
                </button>
            ))}

            <button
                onClick={() => onChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`
                    flex items-center justify-center rounded-lg transition-colors
                    ${sizeStyles[size]}
                    ${currentPage === totalPages
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }
                `}
            >
                <ChevronRight className="w-4 h-4" />
            </button>

            {showFirstLast && (
                <button
                    onClick={() => onChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className={`
                        flex items-center justify-center rounded-lg transition-colors
                        ${sizeStyles[size]}
                        ${currentPage === totalPages
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    <span className="text-xs">Last</span>
                </button>
            )}
        </nav>
    )
}

// ============================================================================
// BOTTOM NAVIGATION
// ============================================================================

interface BottomNavItem {
    id: string
    label: string
    icon: React.ReactNode
    badge?: number
}

interface BottomNavigationProps {
    items: BottomNavItem[]
    activeItem: string
    onChange: (itemId: string) => void
    className?: string
}

export function BottomNavigation({
    items,
    activeItem,
    onChange,
    className = '',
}: BottomNavigationProps) {
    return (
        <nav className={`flex items-center bg-slate-900 border-t border-white/5 ${className}`}>
            {items.map(item => {
                const isActive = item.id === activeItem

                return (
                    <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={`
                            flex-1 flex flex-col items-center gap-1 py-2 transition-colors
                            ${isActive ? 'text-purple-400' : 'text-gray-500 hover:text-white'}
                        `}
                    >
                        <div className="relative">
                            {item.icon}
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {item.badge > 99 ? '99+' : item.badge}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}
