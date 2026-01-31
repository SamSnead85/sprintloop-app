/**
 * SprintLoop Popover & Calendar Components
 * 
 * Phase 2901-2950: Popovers and Date Picker
 * - Popover component
 * - Date picker
 * - Time picker
 * - Date range picker
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
    Calendar,
    Clock,
    ChevronLeft,
    ChevronRight,
    X
} from 'lucide-react'

// ============================================================================
// POPOVER
// ============================================================================

interface PopoverProps {
    trigger: React.ReactElement
    content: React.ReactNode
    isOpen?: boolean
    onOpenChange?: (isOpen: boolean) => void
    position?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
    className?: string
}

export function Popover({
    trigger,
    content,
    isOpen: controlledIsOpen,
    onOpenChange,
    position = 'bottom',
    align = 'start',
    className = '',
}: PopoverProps) {
    const [internalIsOpen, setInternalIsOpen] = useState(false)
    const isOpen = controlledIsOpen ?? internalIsOpen
    const setIsOpen = onOpenChange ?? setInternalIsOpen

    const triggerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const [contentPosition, setContentPosition] = useState({ top: 0, left: 0 })

    // Calculate position
    useEffect(() => {
        if (!isOpen || !triggerRef.current || !contentRef.current) return

        const triggerRect = triggerRef.current.getBoundingClientRect()
        const contentRect = contentRef.current.getBoundingClientRect()
        const gap = 8

        let top = 0
        let left = 0

        switch (position) {
            case 'top':
                top = triggerRect.top - contentRect.height - gap
                break
            case 'bottom':
                top = triggerRect.bottom + gap
                break
            case 'left':
                left = triggerRect.left - contentRect.width - gap
                top = triggerRect.top
                break
            case 'right':
                left = triggerRect.right + gap
                top = triggerRect.top
                break
        }

        if (position === 'top' || position === 'bottom') {
            switch (align) {
                case 'start':
                    left = triggerRect.left
                    break
                case 'center':
                    left = triggerRect.left + (triggerRect.width - contentRect.width) / 2
                    break
                case 'end':
                    left = triggerRect.right - contentRect.width
                    break
            }
        }

        // Keep in viewport
        if (left < 8) left = 8
        if (left + contentRect.width > window.innerWidth - 8) {
            left = window.innerWidth - contentRect.width - 8
        }
        if (top < 8) top = 8
        if (top + contentRect.height > window.innerHeight - 8) {
            top = window.innerHeight - contentRect.height - 8
        }

        setContentPosition({ top, left })
    }, [isOpen, position, align])

    // Close on outside click
    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current?.contains(e.target as Node) ||
                contentRef.current?.contains(e.target as Node)
            ) return
            setIsOpen(false)
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, setIsOpen])

    // Close on escape
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, setIsOpen])

    const triggerElement = React.cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
            trigger.props.onClick?.(e)
            setIsOpen(!isOpen)
        },
    })

    return (
        <>
            <div ref={triggerRef} className="inline-block">
                {triggerElement}
            </div>

            {isOpen && createPortal(
                <div
                    ref={contentRef}
                    className={`
                        fixed z-50 bg-slate-800 border border-white/10 rounded-lg shadow-xl
                        animate-in fade-in-0 zoom-in-95 duration-150
                        ${className}
                    `}
                    style={contentPosition}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    )
}

// ============================================================================
// DATE PICKER
// ============================================================================

interface DatePickerProps {
    value?: Date | null
    onChange?: (date: Date | null) => void
    placeholder?: string
    min?: Date
    max?: Date
    disabled?: boolean
    className?: string
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export function DatePicker({
    value,
    onChange,
    placeholder = 'Select date',
    min,
    max,
    disabled = false,
    className = '',
}: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [viewDate, setViewDate] = useState(value || new Date())

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    // Get days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    // Generate calendar grid
    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const handlePrevMonth = () => {
        setViewDate(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        setViewDate(new Date(year, month + 1, 1))
    }

    const handleSelectDate = (day: number) => {
        const newDate = new Date(year, month, day)
        onChange?.(newDate)
        setIsOpen(false)
    }

    const isDateDisabled = (day: number) => {
        const date = new Date(year, month, day)
        if (min && date < min) return true
        if (max && date > max) return true
        return false
    }

    const isSelected = (day: number) => {
        if (!value) return false
        return (
            value.getDate() === day &&
            value.getMonth() === month &&
            value.getFullYear() === year
        )
    }

    const isToday = (day: number) => {
        const today = new Date()
        return (
            today.getDate() === day &&
            today.getMonth() === month &&
            today.getFullYear() === year
        )
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    return (
        <Popover
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            trigger={
                <button
                    type="button"
                    disabled={disabled}
                    className={`
                        flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm
                        transition-colors hover:border-white/20 focus:outline-none focus:border-purple-500
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `}
                >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={value ? 'text-white' : 'text-gray-500'}>
                        {value ? formatDate(value) : placeholder}
                    </span>
                </button>
            }
            content={
                <div className="p-3 w-64">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-white">
                            {MONTHS[month]} {year}
                        </span>
                        <button
                            onClick={handleNextMonth}
                            className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAYS.map(day => (
                            <div key={day} className="h-8 flex items-center justify-center text-xs text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => (
                            <div key={index} className="aspect-square">
                                {day && (
                                    <button
                                        onClick={() => handleSelectDate(day)}
                                        disabled={isDateDisabled(day)}
                                        className={`
                                            w-full h-full flex items-center justify-center text-sm rounded transition-colors
                                            ${isSelected(day)
                                                ? 'bg-purple-500 text-white'
                                                : isToday(day)
                                                    ? 'border border-purple-500 text-purple-400'
                                                    : isDateDisabled(day)
                                                        ? 'text-gray-600 cursor-not-allowed'
                                                        : 'text-gray-300 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {day}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Clear button */}
                    {value && (
                        <button
                            onClick={() => {
                                onChange?.(null)
                                setIsOpen(false)
                            }}
                            className="w-full mt-2 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Clear
                        </button>
                    )}
                </div>
            }
        />
    )
}

// ============================================================================
// TIME PICKER
// ============================================================================

interface TimePickerProps {
    value?: string // HH:mm format
    onChange?: (time: string) => void
    placeholder?: string
    min?: string
    max?: string
    step?: number // minutes
    disabled?: boolean
    className?: string
}

export function TimePicker({
    value,
    onChange,
    placeholder = 'Select time',
    step = 30,
    disabled = false,
    className = '',
}: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Generate time options
    const times: string[] = []
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += step) {
            const hour = h.toString().padStart(2, '0')
            const minute = m.toString().padStart(2, '0')
            times.push(`${hour}:${minute}`)
        }
    }

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        const period = hours >= 12 ? 'PM' : 'AM'
        const hour12 = hours % 12 || 12
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
    }

    return (
        <Popover
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            trigger={
                <button
                    type="button"
                    disabled={disabled}
                    className={`
                        flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm
                        transition-colors hover:border-white/20 focus:outline-none focus:border-purple-500
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `}
                >
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className={value ? 'text-white' : 'text-gray-500'}>
                        {value ? formatTime(value) : placeholder}
                    </span>
                </button>
            }
            content={
                <div className="py-2 max-h-64 overflow-auto w-40">
                    {times.map(time => (
                        <button
                            key={time}
                            onClick={() => {
                                onChange?.(time)
                                setIsOpen(false)
                            }}
                            className={`
                                w-full px-3 py-1.5 text-sm text-left transition-colors
                                ${value === time
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
                            `}
                        >
                            {formatTime(time)}
                        </button>
                    ))}
                </div>
            }
        />
    )
}

// ============================================================================
// DATE RANGE PICKER
// ============================================================================

interface DateRange {
    start: Date | null
    end: Date | null
}

interface DateRangePickerProps {
    value?: DateRange
    onChange?: (range: DateRange) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function DateRangePicker({
    value = { start: null, end: null },
    onChange,
    placeholder = 'Select dates',
    disabled = false,
    className = '',
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectingEnd, setSelectingEnd] = useState(false)
    const [viewDate, setViewDate] = useState(value.start || new Date())

    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    const days: (number | null)[] = []
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i)
    }

    const handleSelectDate = (day: number) => {
        const selectedDate = new Date(year, month, day)

        if (!selectingEnd || !value.start) {
            onChange?.({ start: selectedDate, end: null })
            setSelectingEnd(true)
        } else {
            if (selectedDate < value.start) {
                onChange?.({ start: selectedDate, end: value.start })
            } else {
                onChange?.({ start: value.start, end: selectedDate })
            }
            setSelectingEnd(false)
            setIsOpen(false)
        }
    }

    const isInRange = (day: number) => {
        if (!value.start || !value.end) return false
        const date = new Date(year, month, day)
        return date > value.start && date < value.end
    }

    const isRangeStart = (day: number) => {
        if (!value.start) return false
        return (
            value.start.getDate() === day &&
            value.start.getMonth() === month &&
            value.start.getFullYear() === year
        )
    }

    const isRangeEnd = (day: number) => {
        if (!value.end) return false
        return (
            value.end.getDate() === day &&
            value.end.getMonth() === month &&
            value.end.getFullYear() === year
        )
    }

    const formatRange = () => {
        if (!value.start) return placeholder
        const start = value.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (!value.end) return `${start} - ...`
        const end = value.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${start} - ${end}`
    }

    return (
        <Popover
            isOpen={isOpen}
            onOpenChange={setIsOpen}
            trigger={
                <button
                    type="button"
                    disabled={disabled}
                    className={`
                        flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm
                        transition-colors hover:border-white/20 focus:outline-none focus:border-purple-500
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                        ${className}
                    `}
                >
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className={value.start ? 'text-white' : 'text-gray-500'}>
                        {formatRange()}
                    </span>
                </button>
            }
            content={
                <div className="p-3 w-64">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <button
                            onClick={() => setViewDate(new Date(year, month - 1, 1))}
                            className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-white">
                            {MONTHS[month]} {year}
                        </span>
                        <button
                            onClick={() => setViewDate(new Date(year, month + 1, 1))}
                            className="p-1 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAYS.map(day => (
                            <div key={day} className="h-8 flex items-center justify-center text-xs text-gray-500">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => (
                            <div key={index} className="aspect-square">
                                {day && (
                                    <button
                                        onClick={() => handleSelectDate(day)}
                                        className={`
                                            w-full h-full flex items-center justify-center text-sm rounded transition-colors
                                            ${isRangeStart(day) || isRangeEnd(day)
                                                ? 'bg-purple-500 text-white'
                                                : isInRange(day)
                                                    ? 'bg-purple-500/20 text-purple-400'
                                                    : 'text-gray-300 hover:bg-white/5'
                                            }
                                        `}
                                    >
                                        {day}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Instructions */}
                    <p className="mt-3 text-xs text-gray-500 text-center">
                        {selectingEnd ? 'Select end date' : 'Select start date'}
                    </p>
                </div>
            }
        />
    )
}
