/**
 * SprintLoop Breadcrumb Navigation
 * 
 * Phase 1351-1400: Navigation components
 * - File path breadcrumbs
 * - Symbol breadcrumbs
 * - Dropdown navigation
 * - Quick navigation
 */

import React, { useState, useRef, useEffect } from 'react'
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    Hash,
    Code,
    Braces,
    Type,
    AtSign,
    Box,
    Circle,
    MoreHorizontal
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface BreadcrumbItem {
    id: string
    label: string
    path: string
    type: 'folder' | 'file' | 'symbol'
    symbolType?: 'function' | 'class' | 'interface' | 'variable' | 'constant' | 'method'
    children?: BreadcrumbItem[]
}

// ============================================================================
// SYMBOL ICON
// ============================================================================

function SymbolIcon({ type, className = '' }: { type?: string; className?: string }) {
    const icons: Record<string, React.ReactNode> = {
        function: <Braces className={className} />,
        class: <Box className={className} />,
        interface: <Type className={className} />,
        variable: <AtSign className={className} />,
        constant: <Hash className={className} />,
        method: <Code className={className} />,
    }
    return <>{type ? icons[type] || <Circle className={className} /> : <Circle className={className} />}</>
}

// ============================================================================
// BREADCRUMB DROPDOWN
// ============================================================================

interface BreadcrumbDropdownProps {
    items: BreadcrumbItem[]
    trigger: React.ReactNode
    onSelect: (item: BreadcrumbItem) => void
    className?: string
}

function BreadcrumbDropdown({ items, trigger, onSelect, className = '' }: BreadcrumbDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [filter, setFilter] = useState('')
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
            >
                {trigger}
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-2 border-b border-white/5">
                        <input
                            type="text"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                            autoFocus
                        />
                    </div>

                    {/* Items */}
                    <div className="max-h-64 overflow-y-auto">
                        {filteredItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onSelect(item)
                                    setIsOpen(false)
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors"
                            >
                                {item.type === 'folder' ? (
                                    <Folder className="w-4 h-4 text-yellow-400" />
                                ) : item.type === 'file' ? (
                                    <File className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <SymbolIcon type={item.symbolType} className="w-4 h-4 text-purple-400" />
                                )}
                                <span className="truncate">{item.label}</span>
                            </button>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                No items found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// BREADCRUMB ITEM
// ============================================================================

interface BreadcrumbItemDisplayProps {
    item: BreadcrumbItem
    isLast: boolean
    siblings?: BreadcrumbItem[]
    onNavigate: (item: BreadcrumbItem) => void
}

function BreadcrumbItemDisplay({
    item,
    isLast,
    siblings,
    onNavigate,
}: BreadcrumbItemDisplayProps) {
    const getIcon = () => {
        if (item.type === 'folder') {
            return <Folder className="w-4 h-4 text-yellow-400" />
        }
        if (item.type === 'file') {
            return <File className="w-4 h-4 text-blue-400" />
        }
        return <SymbolIcon type={item.symbolType} className="w-4 h-4 text-purple-400" />
    }

    return (
        <div className="flex items-center">
            {siblings && siblings.length > 1 ? (
                <BreadcrumbDropdown
                    items={siblings}
                    onSelect={onNavigate}
                    trigger={
                        <span className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/5">
                            {getIcon()}
                            <span className={`text-sm ${isLast ? 'text-white font-medium' : 'text-gray-400'}`}>
                                {item.label}
                            </span>
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                        </span>
                    }
                />
            ) : (
                <button
                    onClick={() => onNavigate(item)}
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                >
                    {getIcon()}
                    <span className={`text-sm ${isLast ? 'text-white font-medium' : 'text-gray-400 hover:text-white'}`}>
                        {item.label}
                    </span>
                </button>
            )}

            {!isLast && (
                <ChevronRight className="w-4 h-4 text-gray-600 mx-0.5" />
            )}
        </div>
    )
}

// ============================================================================
// BREADCRUMB NAVIGATION
// ============================================================================

interface BreadcrumbNavigationProps {
    items: BreadcrumbItem[]
    onNavigate: (item: BreadcrumbItem) => void
    maxVisible?: number
    className?: string
}

export function BreadcrumbNavigation({
    items,
    onNavigate,
    maxVisible = 5,
    className = '',
}: BreadcrumbNavigationProps) {
    const shouldCollapse = items.length > maxVisible

    // Build sibling map (for dropdown navigation)
    const getSiblings = (index: number): BreadcrumbItem[] | undefined => {
        if (index === 0) return undefined
        const parent = items[index - 1]
        return parent.children
    }

    if (items.length === 0) {
        return null
    }

    // Collapse middle items
    const displayItems = shouldCollapse
        ? [
            items[0],
            { id: 'collapsed', label: '...', path: '', type: 'folder' as const, children: items.slice(1, -2) },
            ...items.slice(-2),
        ]
        : items

    return (
        <div className={`flex items-center gap-0.5 ${className}`}>
            {displayItems.map((item, index) => (
                item.id === 'collapsed' ? (
                    <div key={item.id} className="flex items-center">
                        <BreadcrumbDropdown
                            items={item.children || []}
                            onSelect={onNavigate}
                            trigger={
                                <span className="flex items-center px-1.5 py-0.5 rounded hover:bg-white/5">
                                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                                </span>
                            }
                        />
                        <ChevronRight className="w-4 h-4 text-gray-600 mx-0.5" />
                    </div>
                ) : (
                    <BreadcrumbItemDisplay
                        key={item.id}
                        item={item}
                        isLast={index === displayItems.length - 1}
                        siblings={getSiblings(index)}
                        onNavigate={onNavigate}
                    />
                )
            ))}
        </div>
    )
}

// ============================================================================
// SYMBOL BREADCRUMBS
// ============================================================================

interface SymbolBreadcrumbsProps {
    symbols: BreadcrumbItem[]
    onNavigate: (item: BreadcrumbItem) => void
    className?: string
}

export function SymbolBreadcrumbs({
    symbols,
    onNavigate,
    className = '',
}: SymbolBreadcrumbsProps) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            {symbols.map((symbol, index) => (
                <div key={symbol.id} className="flex items-center">
                    <button
                        onClick={() => onNavigate(symbol)}
                        className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white/5 transition-colors"
                    >
                        <SymbolIcon type={symbol.symbolType} className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-300 hover:text-white">
                            {symbol.label}
                        </span>
                    </button>

                    {index < symbols.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                    )}
                </div>
            ))}
        </div>
    )
}

// ============================================================================
// EDITOR BREADCRUMBS
// ============================================================================

interface EditorBreadcrumbsProps {
    filePath: string
    symbols?: BreadcrumbItem[]
    onNavigateToPath: (path: string) => void
    onNavigateToSymbol?: (symbol: BreadcrumbItem) => void
    className?: string
}

export function EditorBreadcrumbs({
    filePath,
    symbols = [],
    onNavigateToPath,
    onNavigateToSymbol,
    className = '',
}: EditorBreadcrumbsProps) {
    // Parse file path into breadcrumb items
    const pathParts = filePath.split('/').filter(Boolean)
    const pathItems: BreadcrumbItem[] = pathParts.map((part, index) => {
        const path = pathParts.slice(0, index + 1).join('/')
        const isFile = index === pathParts.length - 1

        return {
            id: path,
            label: part,
            path,
            type: isFile ? 'file' : 'folder',
        }
    })

    const handleNavigate = (item: BreadcrumbItem) => {
        if (item.type === 'symbol' && onNavigateToSymbol) {
            onNavigateToSymbol(item)
        } else {
            onNavigateToPath(item.path)
        }
    }

    return (
        <div className={`flex items-center gap-1 px-4 py-1.5 bg-slate-800/50 border-b border-white/5 ${className}`}>
            {/* File path breadcrumbs */}
            <BreadcrumbNavigation
                items={pathItems}
                onNavigate={handleNavigate}
            />

            {/* Symbol breadcrumbs */}
            {symbols.length > 0 && (
                <>
                    <div className="w-px h-4 bg-white/10 mx-2" />
                    <SymbolBreadcrumbs
                        symbols={symbols}
                        onNavigate={handleNavigate}
                    />
                </>
            )}
        </div>
    )
}

// ============================================================================
// QUICK NAVIGATION BAR
// ============================================================================

interface QuickNavItem {
    id: string
    label: string
    path: string
    icon?: React.ReactNode
    shortcut?: string
}

interface QuickNavigationBarProps {
    items: QuickNavItem[]
    activeItem?: string
    onSelect: (item: QuickNavItem) => void
    className?: string
}

export function QuickNavigationBar({
    items,
    activeItem,
    onSelect,
    className = '',
}: QuickNavigationBarProps) {
    return (
        <div className={`flex items-center gap-1 px-2 py-1 bg-slate-800/30 ${className}`}>
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors
                        ${activeItem === item.id
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                    `}
                >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.shortcut && (
                        <span className="text-xs text-gray-600 ml-2">{item.shortcut}</span>
                    )}
                </button>
            ))}
        </div>
    )
}
