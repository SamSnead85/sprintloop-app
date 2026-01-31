/**
 * SprintLoop Dropdown Menu System
 * 
 * Phase 2451-2500: Dropdown menus
 * - Select dropdown
 * - Multi-select
 * - Searchable
 * - Grouped options
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
    ChevronDown,
    Check,
    Search,
    X
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface DropdownOption {
    value: string
    label: string
    icon?: React.ReactNode
    description?: string
    disabled?: boolean
    group?: string
}

interface DropdownProps {
    options: DropdownOption[]
    value?: string
    onChange?: (value: string) => void
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
    clearable?: boolean
    className?: string
}

interface MultiSelectProps {
    options: DropdownOption[]
    value?: string[]
    onChange?: (values: string[]) => void
    placeholder?: string
    disabled?: boolean
    searchable?: boolean
    maxItems?: number
    className?: string
}

// ============================================================================
// DROPDOWN
// ============================================================================

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    disabled = false,
    searchable = false,
    clearable = false,
    className = '',
}: DropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(0)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Selected option
    const selectedOption = options.find(o => o.value === value)

    // Filtered options
    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options
        const query = searchQuery.toLowerCase()
        return options.filter(o =>
            o.label.toLowerCase().includes(query) ||
            o.description?.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    // Group options if any have groups
    const groupedOptions = useMemo(() => {
        const groups: Record<string, DropdownOption[]> = {}
        const ungrouped: DropdownOption[] = []

        filteredOptions.forEach(option => {
            if (option.group) {
                if (!groups[option.group]) {
                    groups[option.group] = []
                }
                groups[option.group].push(option)
            } else {
                ungrouped.push(option)
            }
        })

        return { groups, ungrouped }
    }, [filteredOptions])

    const hasGroups = Object.keys(groupedOptions.groups).length > 0

    // Handle select
    const handleSelect = useCallback((optionValue: string) => {
        onChange?.(optionValue)
        setIsOpen(false)
        setSearchQuery('')
    }, [onChange])

    // Handle clear
    const handleClear = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.('')
        setSearchQuery('')
    }, [onChange])

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                if (!isOpen) {
                    setIsOpen(true)
                } else {
                    setHighlightedIndex(prev =>
                        prev < filteredOptions.length - 1 ? prev + 1 : 0
                    )
                }
                break
            case 'ArrowUp':
                e.preventDefault()
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1
                )
                break
            case 'Enter':
                e.preventDefault()
                if (isOpen && filteredOptions[highlightedIndex]) {
                    handleSelect(filteredOptions[highlightedIndex].value)
                } else {
                    setIsOpen(true)
                }
                break
            case 'Escape':
                setIsOpen(false)
                setSearchQuery('')
                break
        }
    }, [isOpen, filteredOptions, highlightedIndex, handleSelect])

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setSearchQuery('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (isOpen && searchable && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen, searchable])

    // Reset highlighted index when options change
    useEffect(() => {
        setHighlightedIndex(0)
    }, [filteredOptions.length])

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
                    w-full flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-left
                    transition-colors focus:outline-none focus:border-purple-500
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20 cursor-pointer'}
                    ${isOpen ? 'border-purple-500' : ''}
                `}
            >
                {selectedOption?.icon}
                <span className={`flex-1 truncate ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
                    {selectedOption?.label || placeholder}
                </span>
                {clearable && value && (
                    <button
                        onClick={handleClear}
                        className="p-0.5 hover:bg-white/10 rounded transition-colors"
                    >
                        <X className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                )}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-64 overflow-auto">
                    {/* Search */}
                    {searchable && (
                        <div className="px-2 pb-2 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    {hasGroups ? (
                        <>
                            {groupedOptions.ungrouped.map((option, index) => (
                                <OptionItem
                                    key={option.value}
                                    option={option}
                                    isSelected={option.value === value}
                                    isHighlighted={index === highlightedIndex}
                                    onSelect={() => handleSelect(option.value)}
                                    onMouseEnter={() => setHighlightedIndex(index)}
                                />
                            ))}
                            {Object.entries(groupedOptions.groups).map(([group, groupOptions]) => (
                                <div key={group}>
                                    <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">
                                        {group}
                                    </div>
                                    {groupOptions.map((option, groupIndex) => {
                                        const flatIndex = groupedOptions.ungrouped.length +
                                            Object.entries(groupedOptions.groups)
                                                .slice(0, Object.keys(groupedOptions.groups).indexOf(group))
                                                .reduce((sum, [, opts]) => sum + opts.length, 0) + groupIndex
                                        return (
                                            <OptionItem
                                                key={option.value}
                                                option={option}
                                                isSelected={option.value === value}
                                                isHighlighted={flatIndex === highlightedIndex}
                                                onSelect={() => handleSelect(option.value)}
                                                onMouseEnter={() => setHighlightedIndex(flatIndex)}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </>
                    ) : (
                        filteredOptions.map((option, index) => (
                            <OptionItem
                                key={option.value}
                                option={option}
                                isSelected={option.value === value}
                                isHighlighted={index === highlightedIndex}
                                onSelect={() => handleSelect(option.value)}
                                onMouseEnter={() => setHighlightedIndex(index)}
                            />
                        ))
                    )}

                    {filteredOptions.length === 0 && (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                            No options found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// OPTION ITEM
// ============================================================================

interface OptionItemProps {
    option: DropdownOption
    isSelected: boolean
    isHighlighted: boolean
    onSelect: () => void
    onMouseEnter: () => void
}

function OptionItem({ option, isSelected, isHighlighted, onSelect, onMouseEnter }: OptionItemProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            onMouseEnter={onMouseEnter}
            disabled={option.disabled}
            className={`
                w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                ${option.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isHighlighted
                        ? 'bg-purple-500/20 text-white'
                        : 'text-gray-300 hover:bg-white/5'
                }
            `}
        >
            {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
            <div className="flex-1 min-w-0">
                <div className="truncate">{option.label}</div>
                {option.description && (
                    <div className="text-xs text-gray-500 truncate">{option.description}</div>
                )}
            </div>
            {isSelected && <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />}
        </button>
    )
}

// ============================================================================
// MULTI-SELECT DROPDOWN
// ============================================================================

export function MultiSelect({
    options,
    value = [],
    onChange,
    placeholder = 'Select...',
    disabled = false,
    searchable = false,
    maxItems,
    className = '',
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    // Filtered options
    const filteredOptions = useMemo(() => {
        if (!searchQuery) return options
        const query = searchQuery.toLowerCase()
        return options.filter(o =>
            o.label.toLowerCase().includes(query) ||
            o.description?.toLowerCase().includes(query)
        )
    }, [options, searchQuery])

    // Handle toggle
    const handleToggle = useCallback((optionValue: string) => {
        const isSelected = value.includes(optionValue)
        if (isSelected) {
            onChange?.(value.filter(v => v !== optionValue))
        } else {
            if (maxItems && value.length >= maxItems) return
            onChange?.([...value, optionValue])
        }
    }, [value, onChange, maxItems])

    // Handle remove tag
    const handleRemove = useCallback((optionValue: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange?.(value.filter(v => v !== optionValue))
    }, [value, onChange])

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
                setSearchQuery('')
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Get selected options
    const selectedOptions = options.filter(o => value.includes(o.value))

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex flex-wrap items-center gap-1 min-h-10 px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-left
                    transition-colors focus:outline-none focus:border-purple-500
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-white/20 cursor-pointer'}
                    ${isOpen ? 'border-purple-500' : ''}
                `}
            >
                {selectedOptions.length > 0 ? (
                    selectedOptions.map(option => (
                        <span
                            key={option.value}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs"
                        >
                            {option.label}
                            <button
                                onClick={(e) => handleRemove(option.value, e)}
                                className="hover:text-white transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))
                ) : (
                    <span className="text-gray-500 px-1">{placeholder}</span>
                )}
                <ChevronDown className={`ml-auto w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 py-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl max-h-64 overflow-auto">
                    {/* Search */}
                    {searchable && (
                        <div className="px-2 pb-2 border-b border-white/5">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    {filteredOptions.map(option => {
                        const isSelected = value.includes(option.value)
                        const isDisabled = option.disabled || (!isSelected && maxItems && value.length >= maxItems)

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleToggle(option.value)}
                                disabled={isDisabled}
                                className={`
                                    w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors
                                    ${isDisabled
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'hover:bg-white/5'
                                    }
                                    ${isSelected ? 'text-white' : 'text-gray-300'}
                                `}
                            >
                                <div className={`
                                    w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                    ${isSelected ? 'bg-purple-500 border-purple-500' : 'border-white/20'}
                                `}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                </div>
                                {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                                <div className="flex-1 min-w-0">
                                    <div className="truncate">{option.label}</div>
                                    {option.description && (
                                        <div className="text-xs text-gray-500 truncate">{option.description}</div>
                                    )}
                                </div>
                            </button>
                        )
                    })}

                    {filteredOptions.length === 0 && (
                        <div className="px-3 py-4 text-sm text-gray-500 text-center">
                            No options found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
