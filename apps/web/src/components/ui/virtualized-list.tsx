/**
 * SprintLoop Virtualized Lists
 * 
 * Phase 601-620: Performance-optimized lists
 * - Virtual scrolling for 100k+ items
 * - Dynamic item heights
 * - Smooth scrolling
 * - Memory efficient
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface VirtualListProps<T> {
    items: T[]
    itemHeight: number | ((index: number) => number)
    renderItem: (item: T, index: number) => React.ReactNode
    overscan?: number
    className?: string
    onScroll?: (scrollTop: number) => void
    scrollToIndex?: number
}

interface VirtualGridProps<T> {
    items: T[]
    columns: number
    rowHeight: number
    renderItem: (item: T, index: number) => React.ReactNode
    gap?: number
    overscan?: number
    className?: string
}

// ============================================================================
// VIRTUAL LIST
// ============================================================================

export function VirtualList<T>({
    items,
    itemHeight,
    renderItem,
    overscan = 5,
    className = '',
    onScroll,
    scrollToIndex,
}: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    // Calculate heights
    const getItemHeight = useCallback((index: number) => {
        return typeof itemHeight === 'function' ? itemHeight(index) : itemHeight
    }, [itemHeight])

    // Calculate total height and item positions
    const { totalHeight, itemPositions } = useMemo(() => {
        const positions: number[] = []
        let total = 0

        for (let i = 0; i < items.length; i++) {
            positions.push(total)
            total += getItemHeight(i)
        }

        return { totalHeight: total, itemPositions: positions }
    }, [items.length, getItemHeight])

    // Find visible range
    const { startIndex, endIndex } = useMemo(() => {
        if (!containerHeight) return { startIndex: 0, endIndex: 0 }

        // Binary search for start index
        let start = 0
        let end = items.length - 1

        while (start < end) {
            const mid = Math.floor((start + end) / 2)
            if (itemPositions[mid] + getItemHeight(mid) < scrollTop) {
                start = mid + 1
            } else {
                end = mid
            }
        }

        const startIdx = Math.max(0, start - overscan)

        // Find end index
        let endIdx = start
        let accumulatedHeight = itemPositions[start] - scrollTop

        while (endIdx < items.length && accumulatedHeight < containerHeight) {
            accumulatedHeight += getItemHeight(endIdx)
            endIdx++
        }

        return {
            startIndex: startIdx,
            endIndex: Math.min(items.length - 1, endIdx + overscan),
        }
    }, [scrollTop, containerHeight, items.length, itemPositions, getItemHeight, overscan])

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget
        setScrollTop(target.scrollTop)
        onScroll?.(target.scrollTop)
    }, [onScroll])

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height)
            }
        })

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // Scroll to index
    useEffect(() => {
        if (scrollToIndex !== undefined && containerRef.current && itemPositions[scrollToIndex] !== undefined) {
            containerRef.current.scrollTop = itemPositions[scrollToIndex]
        }
    }, [scrollToIndex, itemPositions])

    // Render visible items
    const visibleItems = useMemo(() => {
        const result: React.ReactNode[] = []

        for (let i = startIndex; i <= endIndex; i++) {
            result.push(
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: itemPositions[i],
                        left: 0,
                        right: 0,
                        height: getItemHeight(i),
                    }}
                >
                    {renderItem(items[i], i)}
                </div>
            )
        }

        return result
    }, [startIndex, endIndex, items, itemPositions, getItemHeight, renderItem])

    return (
        <div
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            onScroll={handleScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems}
            </div>
        </div>
    )
}

// ============================================================================
// VIRTUAL GRID
// ============================================================================

export function VirtualGrid<T>({
    items,
    columns,
    rowHeight,
    renderItem,
    gap = 8,
    overscan = 2,
    className = '',
}: VirtualGridProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    const rowCount = Math.ceil(items.length / columns)
    const totalHeight = rowCount * (rowHeight + gap) - gap

    // Calculate visible rows
    const { startRow, endRow } = useMemo(() => {
        const rowWithGap = rowHeight + gap
        const start = Math.max(0, Math.floor(scrollTop / rowWithGap) - overscan)
        const visibleRows = Math.ceil(containerHeight / rowWithGap)
        const end = Math.min(rowCount - 1, start + visibleRows + overscan * 2)

        return { startRow: start, endRow: end }
    }, [scrollTop, containerHeight, rowHeight, gap, rowCount, overscan])

    // Resize observer
    useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height)
            }
        })

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    // Render visible items
    const visibleItems = useMemo(() => {
        const result: React.ReactNode[] = []

        for (let row = startRow; row <= endRow; row++) {
            for (let col = 0; col < columns; col++) {
                const index = row * columns + col
                if (index >= items.length) break

                result.push(
                    <div
                        key={index}
                        style={{
                            position: 'absolute',
                            top: row * (rowHeight + gap),
                            left: col * (100 / columns) + '%',
                            width: `calc(${100 / columns}% - ${gap}px)`,
                            height: rowHeight,
                        }}
                    >
                        {renderItem(items[index], index)}
                    </div>
                )
            }
        }

        return result
    }, [startRow, endRow, columns, items, rowHeight, gap, renderItem])

    return (
        <div
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems}
            </div>
        </div>
    )
}

// ============================================================================
// INFINITE SCROLL LIST
// ============================================================================

interface InfiniteListProps<T> {
    items: T[]
    itemHeight: number
    renderItem: (item: T, index: number) => React.ReactNode
    loadMore: () => Promise<void>
    hasMore: boolean
    isLoading?: boolean
    loader?: React.ReactNode
    threshold?: number
    className?: string
}

export function InfiniteList<T>({
    items,
    itemHeight,
    renderItem,
    loadMore,
    hasMore,
    isLoading = false,
    loader,
    threshold = 200,
    className = '',
}: InfiniteListProps<T>) {
    const loadingRef = useRef(false)

    const handleScroll = useCallback(async (scrollTop: number) => {
        const containerRef = document.getElementById('infinite-list-container')
        if (!containerRef) return

        const scrollHeight = containerRef.scrollHeight
        const clientHeight = containerRef.clientHeight
        const scrollBottom = scrollHeight - scrollTop - clientHeight

        if (scrollBottom < threshold && hasMore && !loadingRef.current && !isLoading) {
            loadingRef.current = true
            await loadMore()
            loadingRef.current = false
        }
    }, [hasMore, loadMore, isLoading, threshold])

    return (
        <div id="infinite-list-container" className={className}>
            <VirtualList
                items={items}
                itemHeight={itemHeight}
                renderItem={renderItem}
                onScroll={handleScroll}
            />
            {isLoading && (
                loader || (
                    <div className="flex justify-center py-4">
                        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )
            )}
        </div>
    )
}

// ============================================================================
// GROUPED VIRTUAL LIST
// ============================================================================

interface GroupedItem<T> {
    type: 'header' | 'item'
    data: T | string
    originalIndex?: number
}

interface GroupedVirtualListProps<T> {
    groups: { title: string; items: T[] }[]
    itemHeight: number
    headerHeight: number
    renderItem: (item: T, index: number) => React.ReactNode
    renderHeader: (title: string) => React.ReactNode
    stickyHeaders?: boolean
    className?: string
}

export function GroupedVirtualList<T>({
    groups,
    itemHeight,
    headerHeight,
    renderItem,
    renderHeader,
    stickyHeaders = true,
    className = '',
}: GroupedVirtualListProps<T>) {
    // Flatten groups into a single array
    const flatItems = useMemo(() => {
        const result: GroupedItem<T>[] = []

        groups.forEach((group, groupIndex) => {
            result.push({ type: 'header', data: group.title })
            group.items.forEach((item, itemIndex) => {
                result.push({
                    type: 'item',
                    data: item,
                    originalIndex: itemIndex,
                })
            })
        })

        return result
    }, [groups])

    const getHeight = useCallback((index: number) => {
        return flatItems[index].type === 'header' ? headerHeight : itemHeight
    }, [flatItems, headerHeight, itemHeight])

    const renderFlatItem = useCallback((item: GroupedItem<T>, index: number) => {
        if (item.type === 'header') {
            return (
                <div
                    className={stickyHeaders ? 'sticky top-0 z-10 bg-slate-900' : ''}
                    style={{ height: headerHeight }}
                >
                    {renderHeader(item.data as string)}
                </div>
            )
        }

        return renderItem(item.data as T, item.originalIndex!)
    }, [renderHeader, renderItem, stickyHeaders, headerHeight])

    return (
        <VirtualList
            items={flatItems}
            itemHeight={getHeight}
            renderItem={renderFlatItem}
            className={className}
        />
    )
}

// ============================================================================
// USE VIRTUAL SCROLL HOOK
// ============================================================================

interface UseVirtualScrollOptions {
    itemCount: number
    itemHeight: number
    overscan?: number
}

export function useVirtualScroll({
    itemCount,
    itemHeight,
    overscan = 5,
}: UseVirtualScrollOptions) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    const totalHeight = itemCount * itemHeight

    const { startIndex, endIndex, offsetY } = useMemo(() => {
        const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
        const visibleCount = Math.ceil(containerHeight / itemHeight)
        const end = Math.min(itemCount - 1, start + visibleCount + overscan * 2)

        return {
            startIndex: start,
            endIndex: end,
            offsetY: start * itemHeight,
        }
    }, [scrollTop, containerHeight, itemHeight, itemCount, overscan])

    useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height)
            }
        })

        observer.observe(containerRef.current)
        return () => observer.disconnect()
    }, [])

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }, [])

    const scrollToIndex = useCallback((index: number, behavior: ScrollBehavior = 'auto') => {
        containerRef.current?.scrollTo({
            top: index * itemHeight,
            behavior,
        })
    }, [itemHeight])

    return {
        containerRef,
        handleScroll,
        startIndex,
        endIndex,
        offsetY,
        totalHeight,
        scrollToIndex,
        visibleCount: endIndex - startIndex + 1,
    }
}
