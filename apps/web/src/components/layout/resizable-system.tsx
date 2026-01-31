/**
 * SprintLoop Resizable Components
 * 
 * Phase 3051-3100: Resizable
 * - Resizable box
 * - Resizable panels
 * - Resize handles
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'

// ============================================================================
// TYPES
// ============================================================================

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface Size {
    width: number
    height: number
}

interface ResizableProps {
    children: React.ReactNode
    defaultSize?: Size
    minSize?: Partial<Size>
    maxSize?: Partial<Size>
    directions?: ResizeDirection[]
    onResize?: (size: Size) => void
    onResizeEnd?: (size: Size) => void
    className?: string
}

interface ResizablePanelsProps {
    children: [React.ReactNode, React.ReactNode]
    direction?: 'horizontal' | 'vertical'
    defaultSize?: number // percentage for first panel
    minSize?: number // minimum percentage
    maxSize?: number // maximum percentage
    onResize?: (size: number) => void
    className?: string
}

// ============================================================================
// RESIZE HANDLE
// ============================================================================

interface ResizeHandleProps {
    direction: ResizeDirection
    onResizeStart: () => void
    className?: string
}

function ResizeHandle({ direction, onResizeStart, className = '' }: ResizeHandleProps) {
    const positionStyles: Record<ResizeDirection, string> = {
        n: 'top-0 left-0 right-0 h-2 cursor-ns-resize',
        s: 'bottom-0 left-0 right-0 h-2 cursor-ns-resize',
        e: 'right-0 top-0 bottom-0 w-2 cursor-ew-resize',
        w: 'left-0 top-0 bottom-0 w-2 cursor-ew-resize',
        ne: 'top-0 right-0 w-4 h-4 cursor-nesw-resize',
        nw: 'top-0 left-0 w-4 h-4 cursor-nwse-resize',
        se: 'bottom-0 right-0 w-4 h-4 cursor-nwse-resize',
        sw: 'bottom-0 left-0 w-4 h-4 cursor-nesw-resize',
    }

    return (
        <div
            className={`absolute z-10 hover:bg-purple-500/30 ${positionStyles[direction]} ${className}`}
            onMouseDown={(e) => {
                e.preventDefault()
                onResizeStart()
            }}
        />
    )
}

// ============================================================================
// RESIZABLE BOX
// ============================================================================

export function Resizable({
    children,
    defaultSize = { width: 300, height: 200 },
    minSize = { width: 100, height: 100 },
    maxSize = {},
    directions = ['se'],
    onResize,
    onResizeEnd,
    className = '',
}: ResizableProps) {
    const [size, setSize] = useState(defaultSize)
    const [isResizing, setIsResizing] = useState(false)
    const [activeDirection, setActiveDirection] = useState<ResizeDirection | null>(null)
    const startPosRef = useRef({ x: 0, y: 0 })
    const startSizeRef = useRef(defaultSize)

    const handleResizeStart = useCallback((direction: ResizeDirection) => {
        setIsResizing(true)
        setActiveDirection(direction)
        startSizeRef.current = size
    }, [size])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !activeDirection) return

        const deltaX = e.clientX - startPosRef.current.x
        const deltaY = e.clientY - startPosRef.current.y

        let newWidth = startSizeRef.current.width
        let newHeight = startSizeRef.current.height

        if (activeDirection.includes('e')) {
            newWidth = startSizeRef.current.width + deltaX
        }
        if (activeDirection.includes('w')) {
            newWidth = startSizeRef.current.width - deltaX
        }
        if (activeDirection.includes('s')) {
            newHeight = startSizeRef.current.height + deltaY
        }
        if (activeDirection.includes('n')) {
            newHeight = startSizeRef.current.height - deltaY
        }

        // Apply constraints
        if (minSize.width) newWidth = Math.max(minSize.width, newWidth)
        if (minSize.height) newHeight = Math.max(minSize.height, newHeight)
        if (maxSize.width) newWidth = Math.min(maxSize.width, newWidth)
        if (maxSize.height) newHeight = Math.min(maxSize.height, newHeight)

        const newSize = { width: newWidth, height: newHeight }
        setSize(newSize)
        onResize?.(newSize)
    }, [isResizing, activeDirection, minSize, maxSize, onResize])

    const handleMouseUp = useCallback(() => {
        if (isResizing) {
            onResizeEnd?.(size)
        }
        setIsResizing(false)
        setActiveDirection(null)
    }, [isResizing, size, onResizeEnd])

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            startPosRef.current = { x: e.clientX, y: e.clientY }
        }

        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [handleMouseMove, handleMouseUp])

    return (
        <div
            className={`relative ${className}`}
            style={{ width: size.width, height: size.height }}
        >
            {children}

            {directions.map(direction => (
                <ResizeHandle
                    key={direction}
                    direction={direction}
                    onResizeStart={() => handleResizeStart(direction)}
                />
            ))}
        </div>
    )
}

// ============================================================================
// RESIZABLE PANELS
// ============================================================================

export function ResizablePanels({
    children,
    direction = 'horizontal',
    defaultSize = 50,
    minSize = 20,
    maxSize = 80,
    onResize,
    className = '',
}: ResizablePanelsProps) {
    const [size, setSize] = useState(defaultSize)
    const [isResizing, setIsResizing] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const startPosRef = useRef(0)
    const startSizeRef = useRef(defaultSize)

    const isHorizontal = direction === 'horizontal'

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
        startPosRef.current = isHorizontal ? e.clientX : e.clientY
        startSizeRef.current = size
    }, [isHorizontal, size])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing || !containerRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()
        const containerSize = isHorizontal ? containerRect.width : containerRect.height
        const currentPos = isHorizontal ? e.clientX : e.clientY
        const containerStart = isHorizontal ? containerRect.left : containerRect.top

        const newSizePixels = currentPos - containerStart
        let newSizePercent = (newSizePixels / containerSize) * 100

        // Apply constraints
        newSizePercent = Math.max(minSize, Math.min(maxSize, newSizePercent))

        setSize(newSizePercent)
        onResize?.(newSizePercent)
    }, [isResizing, isHorizontal, minSize, maxSize, onResize])

    const handleMouseUp = useCallback(() => {
        setIsResizing(false)
    }, [])

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)

            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isResizing, handleMouseMove, handleMouseUp])

    return (
        <div
            ref={containerRef}
            className={`
                flex overflow-hidden
                ${isHorizontal ? 'flex-row' : 'flex-col'}
                ${className}
            `}
        >
            {/* First panel */}
            <div
                className="overflow-auto"
                style={isHorizontal ? { width: `${size}%` } : { height: `${size}%` }}
            >
                {children[0]}
            </div>

            {/* Resize handle */}
            <div
                onMouseDown={handleMouseDown}
                className={`
                    flex-shrink-0 bg-white/5 hover:bg-purple-500/30 transition-colors
                    ${isHorizontal
                        ? 'w-1 cursor-ew-resize'
                        : 'h-1 cursor-ns-resize'
                    }
                    ${isResizing ? 'bg-purple-500/50' : ''}
                `}
            />

            {/* Second panel */}
            <div
                className="overflow-auto flex-1"
            >
                {children[1]}
            </div>
        </div>
    )
}

// ============================================================================
// SPLIT VIEW
// ============================================================================

interface SplitViewProps {
    children: React.ReactNode[]
    direction?: 'horizontal' | 'vertical'
    sizes?: number[]
    minSizes?: number[]
    onSizesChange?: (sizes: number[]) => void
    className?: string
}

export function SplitView({
    children,
    direction = 'horizontal',
    sizes: controlledSizes,
    minSizes = [],
    onSizesChange,
    className = '',
}: SplitViewProps) {
    const childArray = React.Children.toArray(children)
    const count = childArray.length

    const defaultSizes = Array(count).fill(100 / count)
    const [internalSizes, setInternalSizes] = useState(controlledSizes || defaultSizes)
    const sizes = controlledSizes || internalSizes

    const containerRef = useRef<HTMLDivElement>(null)
    const [resizingIndex, setResizingIndex] = useState<number | null>(null)
    const startPosRef = useRef(0)
    const startSizesRef = useRef(sizes)

    const isHorizontal = direction === 'horizontal'

    const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
        e.preventDefault()
        setResizingIndex(index)
        startPosRef.current = isHorizontal ? e.clientX : e.clientY
        startSizesRef.current = [...sizes]
    }, [isHorizontal, sizes])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (resizingIndex === null || !containerRef.current) return

        const containerRect = containerRef.current.getBoundingClientRect()
        const containerSize = isHorizontal ? containerRect.width : containerRect.height
        const delta = (isHorizontal ? e.clientX : e.clientY) - startPosRef.current
        const deltaPercent = (delta / containerSize) * 100

        const newSizes = [...startSizesRef.current]
        newSizes[resizingIndex] = startSizesRef.current[resizingIndex] + deltaPercent
        newSizes[resizingIndex + 1] = startSizesRef.current[resizingIndex + 1] - deltaPercent

        // Apply min constraints
        const minA = minSizes[resizingIndex] || 10
        const minB = minSizes[resizingIndex + 1] || 10

        if (newSizes[resizingIndex] < minA) {
            const diff = minA - newSizes[resizingIndex]
            newSizes[resizingIndex] = minA
            newSizes[resizingIndex + 1] -= diff
        }

        if (newSizes[resizingIndex + 1] < minB) {
            const diff = minB - newSizes[resizingIndex + 1]
            newSizes[resizingIndex + 1] = minB
            newSizes[resizingIndex] -= diff
        }

        setInternalSizes(newSizes)
        onSizesChange?.(newSizes)
    }, [resizingIndex, isHorizontal, minSizes, onSizesChange])

    const handleMouseUp = useCallback(() => {
        setResizingIndex(null)
    }, [])

    useEffect(() => {
        if (resizingIndex !== null) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)

            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [resizingIndex, handleMouseMove, handleMouseUp])

    return (
        <div
            ref={containerRef}
            className={`
                flex overflow-hidden
                ${isHorizontal ? 'flex-row' : 'flex-col'}
                ${className}
            `}
        >
            {childArray.map((child, index) => (
                <React.Fragment key={index}>
                    <div
                        className="overflow-auto"
                        style={isHorizontal
                            ? { width: `${sizes[index]}%` }
                            : { height: `${sizes[index]}%` }
                        }
                    >
                        {child}
                    </div>

                    {index < count - 1 && (
                        <div
                            onMouseDown={(e) => handleMouseDown(e, index)}
                            className={`
                                flex-shrink-0 bg-white/5 hover:bg-purple-500/30 transition-colors
                                ${isHorizontal
                                    ? 'w-1 cursor-ew-resize'
                                    : 'h-1 cursor-ns-resize'
                                }
                                ${resizingIndex === index ? 'bg-purple-500/50' : ''}
                            `}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    )
}
