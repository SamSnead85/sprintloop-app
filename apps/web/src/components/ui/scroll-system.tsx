/**
 * SprintLoop Scrollable Area & Virtualized List
 * 
 * Phase 2951-3000: Scrolling and virtualization
 * - Custom scrollbar
 * - Scroll area
 * - Virtualized list
 * - Infinite scroll
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Loader2 } from 'lucide-react'

// ============================================================================
// SCROLL AREA
// ============================================================================

interface ScrollAreaProps {
    children: React.ReactNode
    className?: string
    maxHeight?: string | number
    hideScrollbar?: boolean
    onScrollEnd?: () => void
    scrollEndThreshold?: number
}

export function ScrollArea({
    children,
    className = '',
    maxHeight,
    hideScrollbar = false,
    onScrollEnd,
    scrollEndThreshold = 50,
}: ScrollAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    const handleScroll = useCallback(() => {
        if (!scrollRef.current || !onScrollEnd) return

        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        if (scrollHeight - scrollTop - clientHeight < scrollEndThreshold) {
            onScrollEnd()
        }
    }, [onScrollEnd, scrollEndThreshold])

    return (
        <div
            ref={scrollRef}
            onScroll={handleScroll}
            className={`
                overflow-auto
                ${hideScrollbar ? 'scrollbar-hide' : 'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20'}
                ${className}
            `}
            style={{
                maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
            }}
        >
            {children}
        </div>
    )
}

// ============================================================================
// VIRTUALIZED LIST
// ============================================================================

interface VirtualizedListProps<T> {
    items: T[]
    itemHeight: number
    renderItem: (item: T, index: number) => React.ReactNode
    keyExtractor: (item: T, index: number) => string
    overscan?: number
    className?: string
    height?: number | string
}

export function VirtualizedList<T>({
    items,
    itemHeight,
    renderItem,
    keyExtractor,
    overscan = 5,
    className = '',
    height = 400,
}: VirtualizedListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(0)

    // Calculate visible range
    const totalHeight = items.length * itemHeight
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
        items.length - 1,
        Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const visibleItems = useMemo(() => {
        const visible: { item: T; index: number }[] = []
        for (let i = startIndex; i <= endIndex; i++) {
            if (items[i]) {
                visible.push({ item: items[i], index: i })
            }
        }
        return visible
    }, [items, startIndex, endIndex])

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
    }, [])

    // Update container height on resize
    useEffect(() => {
        if (!containerRef.current) return

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height)
            }
        })

        observer.observe(containerRef.current)
        setContainerHeight(containerRef.current.clientHeight)

        return () => observer.disconnect()
    }, [])

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 ${className}`}
            style={{ height: typeof height === 'number' ? `${height}px` : height }}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                {visibleItems.map(({ item, index }) => (
                    <div
                        key={keyExtractor(item, index)}
                        style={{
                            position: 'absolute',
                            top: index * itemHeight,
                            left: 0,
                            right: 0,
                            height: itemHeight,
                        }}
                    >
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    )
}

// ============================================================================
// INFINITE SCROLL
// ============================================================================

interface InfiniteScrollProps {
    children: React.ReactNode
    hasMore: boolean
    loadMore: () => void | Promise<void>
    loading?: boolean
    loader?: React.ReactNode
    endMessage?: React.ReactNode
    threshold?: number
    className?: string
}

export function InfiniteScroll({
    children,
    hasMore,
    loadMore,
    loading = false,
    loader,
    endMessage,
    threshold = 100,
    className = '',
}: InfiniteScrollProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const loadingRef = useRef(false)

    const handleScroll = useCallback(() => {
        if (!containerRef.current || loading || loadingRef.current || !hasMore) return

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current
        if (scrollHeight - scrollTop - clientHeight < threshold) {
            loadingRef.current = true
            Promise.resolve(loadMore()).finally(() => {
                loadingRef.current = false
            })
        }
    }, [hasMore, loading, loadMore, threshold])

    return (
        <div
            ref={containerRef}
            onScroll={handleScroll}
            className={`overflow-auto ${className}`}
        >
            {children}

            {loading && (
                <div className="py-4 flex justify-center">
                    {loader || <Loader2 className="w-6 h-6 animate-spin text-gray-500" />}
                </div>
            )}

            {!hasMore && !loading && endMessage && (
                <div className="py-4 text-center text-sm text-gray-500">
                    {endMessage}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SCROLL TO TOP BUTTON
// ============================================================================

interface ScrollToTopProps {
    scrollRef: React.RefObject<HTMLElement>
    threshold?: number
    className?: string
}

export function ScrollToTop({
    scrollRef,
    threshold = 200,
    className = '',
}: ScrollToTopProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const element = scrollRef.current
        if (!element) return

        const handleScroll = () => {
            setIsVisible(element.scrollTop > threshold)
        }

        element.addEventListener('scroll', handleScroll)
        return () => element.removeEventListener('scroll', handleScroll)
    }, [scrollRef, threshold])

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth',
        })
    }

    if (!isVisible) return null

    return (
        <button
            onClick={scrollToTop}
            className={`
                fixed bottom-6 right-6 w-10 h-10 bg-purple-500 text-white rounded-full shadow-lg
                flex items-center justify-center transition-all hover:bg-purple-600
                animate-in fade-in-0 zoom-in-95 duration-200
                ${className}
            `}
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
        </button>
    )
}

// ============================================================================
// HORIZONTAL SCROLL
// ============================================================================

interface HorizontalScrollProps {
    children: React.ReactNode
    showScrollButtons?: boolean
    className?: string
}

export function HorizontalScroll({
    children,
    showScrollButtons = true,
    className = '',
}: HorizontalScrollProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const checkScroll = useCallback(() => {
        if (!scrollRef.current) return

        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }, [])

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [checkScroll])

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollRef.current) return

        const scrollAmount = scrollRef.current.clientWidth * 0.8
        scrollRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className={`relative group ${className}`}>
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex overflow-x-auto scrollbar-hide gap-2"
            >
                {children}
            </div>

            {showScrollButtons && canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800/90 border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {showScrollButtons && canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800/90 border border-white/10 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}
        </div>
    )
}
