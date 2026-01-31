/**
 * SprintLoop Card & List System
 * 
 * Phase 2801-2850: Cards and lists
 * - Card component
 * - List items
 * - Data table
 * - Empty states
 */

import React, { useState } from 'react'
import {
    ChevronDown,
    ChevronUp,
    ChevronRight,
    MoreHorizontal,
    FileQuestion
} from 'lucide-react'

// ============================================================================
// CARD
// ============================================================================

interface CardProps {
    children: React.ReactNode
    variant?: 'default' | 'outlined' | 'filled' | 'elevated'
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hoverable?: boolean
    clickable?: boolean
    onClick?: () => void
    className?: string
}

export function Card({
    children,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    clickable = false,
    onClick,
    className = '',
}: CardProps) {
    const variantStyles = {
        default: 'bg-slate-800/50 border border-white/5',
        outlined: 'bg-transparent border border-white/10',
        filled: 'bg-slate-800',
        elevated: 'bg-slate-800 shadow-xl',
    }

    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    }

    const Component = clickable || onClick ? 'button' : 'div'

    return (
        <Component
            onClick={onClick}
            className={`
                rounded-xl transition-all
                ${variantStyles[variant]}
                ${paddingStyles[padding]}
                ${hoverable ? 'hover:bg-slate-700/50' : ''}
                ${clickable || onClick ? 'cursor-pointer text-left w-full focus:outline-none focus:ring-2 focus:ring-purple-500' : ''}
                ${className}
            `}
        >
            {children}
        </Component>
    )
}

// ============================================================================
// CARD HEADER
// ============================================================================

interface CardHeaderProps {
    title: React.ReactNode
    subtitle?: React.ReactNode
    icon?: React.ReactNode
    action?: React.ReactNode
    className?: string
}

export function CardHeader({
    title,
    subtitle,
    icon,
    action,
    className = '',
}: CardHeaderProps) {
    return (
        <div className={`flex items-start justify-between gap-4 ${className}`}>
            <div className="flex items-start gap-3">
                {icon && (
                    <div className="flex-shrink-0 mt-0.5">{icon}</div>
                )}
                <div>
                    <div className="font-medium text-white">{title}</div>
                    {subtitle && (
                        <div className="text-sm text-gray-500 mt-0.5">{subtitle}</div>
                    )}
                </div>
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
        </div>
    )
}

// ============================================================================
// CARD FOOTER
// ============================================================================

interface CardFooterProps {
    children: React.ReactNode
    bordered?: boolean
    className?: string
}

export function CardFooter({
    children,
    bordered = true,
    className = '',
}: CardFooterProps) {
    return (
        <div className={`mt-4 pt-4 ${bordered ? 'border-t border-white/5' : ''} ${className}`}>
            {children}
        </div>
    )
}

// ============================================================================
// LIST
// ============================================================================

interface ListProps {
    children: React.ReactNode
    divided?: boolean
    className?: string
}

export function List({
    children,
    divided = true,
    className = '',
}: ListProps) {
    return (
        <div
            className={`
                ${divided ? 'divide-y divide-white/5' : ''}
                ${className}
            `}
        >
            {children}
        </div>
    )
}

// ============================================================================
// LIST ITEM
// ============================================================================

interface ListItemProps {
    children?: React.ReactNode
    title?: React.ReactNode
    subtitle?: React.ReactNode
    leading?: React.ReactNode
    trailing?: React.ReactNode
    onClick?: () => void
    href?: string
    selected?: boolean
    disabled?: boolean
    className?: string
}

export function ListItem({
    children,
    title,
    subtitle,
    leading,
    trailing,
    onClick,
    href,
    selected = false,
    disabled = false,
    className = '',
}: ListItemProps) {
    const content = (
        <>
            {leading && <div className="flex-shrink-0">{leading}</div>}
            <div className="flex-1 min-w-0">
                {children || (
                    <>
                        <div className={`font-medium ${disabled ? 'text-gray-500' : 'text-white'}`}>
                            {title}
                        </div>
                        {subtitle && (
                            <div className="text-sm text-gray-500 truncate">{subtitle}</div>
                        )}
                    </>
                )}
            </div>
            {trailing && <div className="flex-shrink-0">{trailing}</div>}
        </>
    )

    const baseStyles = `
        flex items-center gap-3 px-3 py-2.5 transition-colors
        ${selected ? 'bg-purple-500/10' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5 cursor-pointer'}
        ${className}
    `

    if (href) {
        return (
            <a href={href} className={baseStyles}>
                {content}
            </a>
        )
    }

    if (onClick) {
        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full text-left ${baseStyles}`}
            >
                {content}
            </button>
        )
    }

    return (
        <div className={baseStyles}>
            {content}
        </div>
    )
}

// ============================================================================
// ACCORDION
// ============================================================================

interface AccordionProps {
    items: Array<{
        id: string
        title: React.ReactNode
        content: React.ReactNode
        icon?: React.ReactNode
        disabled?: boolean
    }>
    defaultOpen?: string[]
    allowMultiple?: boolean
    className?: string
}

export function Accordion({
    items,
    defaultOpen = [],
    allowMultiple = true,
    className = '',
}: AccordionProps) {
    const [openItems, setOpenItems] = useState<string[]>(defaultOpen)

    const toggleItem = (id: string) => {
        if (openItems.includes(id)) {
            setOpenItems(openItems.filter(i => i !== id))
        } else {
            setOpenItems(allowMultiple ? [...openItems, id] : [id])
        }
    }

    return (
        <div className={`divide-y divide-white/5 ${className}`}>
            {items.map(item => {
                const isOpen = openItems.includes(item.id)

                return (
                    <div key={item.id}>
                        <button
                            onClick={() => !item.disabled && toggleItem(item.id)}
                            disabled={item.disabled}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                                ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'}
                            `}
                        >
                            {item.icon && <span className="text-gray-500">{item.icon}</span>}
                            <span className="flex-1 font-medium text-white">{item.title}</span>
                            <ChevronDown
                                className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {isOpen && (
                            <div className="px-4 pb-4 text-gray-400">
                                {item.content}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
            <div className="w-16 h-16 mb-4 rounded-full bg-white/5 flex items-center justify-center">
                {icon || <FileQuestion className="w-8 h-8 text-gray-600" />}
            </div>
            <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
            )}
            {action}
        </div>
    )
}

// ============================================================================
// DATA TABLE
// ============================================================================

interface Column<T> {
    key: string
    header: React.ReactNode
    render?: (item: T, index: number) => React.ReactNode
    sortable?: boolean
    width?: string
}

interface DataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    keyExtractor: (item: T) => string
    sortable?: boolean
    loading?: boolean
    emptyState?: React.ReactNode
    onRowClick?: (item: T) => void
    className?: string
}

export function DataTable<T extends Record<string, unknown>>({
    columns,
    data,
    keyExtractor,
    sortable = false,
    loading = false,
    emptyState,
    onRowClick,
    className = '',
}: DataTableProps<T>) {
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const handleSort = (key: string) => {
        if (!sortable) return
        if (sortColumn === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
        } else {
            setSortColumn(key)
            setSortDirection('asc')
        }
    }

    const sortedData = sortColumn
        ? [...data].sort((a, b) => {
            const aVal = a[sortColumn]
            const bVal = b[sortColumn]
            const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            return sortDirection === 'asc' ? cmp : -cmp
        })
        : data

    if (loading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-10 bg-white/5 rounded mb-2" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-white/5 rounded mb-1" />
                ))}
            </div>
        )
    }

    if (data.length === 0) {
        return (
            <div className={className}>
                {emptyState || (
                    <EmptyState
                        title="No data"
                        description="There's nothing to show here yet."
                    />
                )}
            </div>
        )
    }

    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="w-full">
                <thead>
                    <tr className="border-b border-white/5">
                        {columns.map(column => (
                            <th
                                key={column.key}
                                onClick={() => column.sortable !== false && handleSort(column.key)}
                                className={`
                                    px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                                    ${column.sortable !== false && sortable ? 'cursor-pointer hover:text-white' : ''}
                                `}
                                style={{ width: column.width }}
                            >
                                <div className="flex items-center gap-1">
                                    {column.header}
                                    {sortable && sortColumn === column.key && (
                                        sortDirection === 'asc' ? (
                                            <ChevronUp className="w-3 h-3" />
                                        ) : (
                                            <ChevronDown className="w-3 h-3" />
                                        )
                                    )}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {sortedData.map((item, index) => (
                        <tr
                            key={keyExtractor(item)}
                            onClick={() => onRowClick?.(item)}
                            className={`
                                transition-colors
                                ${onRowClick ? 'cursor-pointer hover:bg-white/5' : ''}
                            `}
                        >
                            {columns.map(column => (
                                <td key={column.key} className="px-4 py-3 text-sm text-gray-300">
                                    {column.render
                                        ? column.render(item, index)
                                        : String(item[column.key] ?? '')
                                    }
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
