/**
 * SprintLoop Accessibility System
 * 
 * WCAG 2.1 AA compliant components and utilities:
 * - Focus management
 * - Screen reader announcements
 * - Keyboard navigation
 * - Reduced motion support
 * - High contrast mode
 */

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

// ============================================================================
// ACCESSIBILITY CONTEXT
// ============================================================================

interface AccessibilitySettings {
    reducedMotion: boolean
    highContrast: boolean
    fontSize: 'small' | 'normal' | 'large' | 'extra-large'
    screenReaderAnnouncements: boolean
}

interface AccessibilityContextValue {
    settings: AccessibilitySettings
    updateSettings: (updates: Partial<AccessibilitySettings>) => void
    announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

export function useAccessibility() {
    const context = useContext(AccessibilityContext)
    if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider')
    return context
}

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AccessibilitySettings>({
        reducedMotion: false,
        highContrast: false,
        fontSize: 'normal',
        screenReaderAnnouncements: true,
    })

    const [announcement, setAnnouncement] = useState<{ message: string; priority: 'polite' | 'assertive' }>({ message: '', priority: 'polite' })

    // Detect system preferences
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)')

        setSettings(prev => ({
            ...prev,
            reducedMotion: prefersReducedMotion.matches,
            highContrast: prefersHighContrast.matches,
        }))

        const handleMotionChange = (e: MediaQueryListEvent) => {
            setSettings(prev => ({ ...prev, reducedMotion: e.matches }))
        }

        const handleContrastChange = (e: MediaQueryListEvent) => {
            setSettings(prev => ({ ...prev, highContrast: e.matches }))
        }

        prefersReducedMotion.addEventListener('change', handleMotionChange)
        prefersHighContrast.addEventListener('change', handleContrastChange)

        return () => {
            prefersReducedMotion.removeEventListener('change', handleMotionChange)
            prefersHighContrast.removeEventListener('change', handleContrastChange)
        }
    }, [])

    const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
        setSettings(prev => ({ ...prev, ...updates }))
    }, [])

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        if (!settings.screenReaderAnnouncements) return
        setAnnouncement({ message: '', priority }) // Reset first
        setTimeout(() => setAnnouncement({ message, priority }), 50)
    }, [settings.screenReaderAnnouncements])

    return (
        <AccessibilityContext.Provider value={{ settings, updateSettings, announce }}>
            {children}
            {/* Screen reader announcements */}
            <div
                role="status"
                aria-live={announcement.priority}
                aria-atomic="true"
                className="sr-only"
            >
                {announcement.message}
            </div>
        </AccessibilityContext.Provider>
    )
}

// ============================================================================
// FOCUS TRAP
// ============================================================================

interface FocusTrapProps {
    children: React.ReactNode
    active?: boolean
    restoreFocus?: boolean
    initialFocus?: React.RefObject<HTMLElement>
}

export function FocusTrap({
    children,
    active = true,
    restoreFocus = true,
    initialFocus
}: FocusTrapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<Element | null>(null)

    useEffect(() => {
        if (!active) return

        previousActiveElement.current = document.activeElement

        // Focus initial element or first focusable
        if (initialFocus?.current) {
            initialFocus.current.focus()
        } else {
            const firstFocusable = getFocusableElements(containerRef.current)?.[0]
            firstFocusable?.focus()
        }

        return () => {
            if (restoreFocus && previousActiveElement.current instanceof HTMLElement) {
                previousActiveElement.current.focus()
            }
        }
    }, [active, restoreFocus, initialFocus])

    useEffect(() => {
        if (!active) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return

            const focusable = getFocusableElements(containerRef.current)
            if (!focusable || focusable.length === 0) return

            const first = focusable[0]
            const last = focusable[focusable.length - 1]

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [active])

    return (
        <div ref={containerRef}>
            {children}
        </div>
    )
}

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
    if (!container) return []

    const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors))
}

// ============================================================================
// SKIP LINKS
// ============================================================================

interface SkipLink {
    id: string
    label: string
    targetId: string
}

interface SkipLinksProps {
    links?: SkipLink[]
}

export function SkipLinks({
    links = [
        { id: 'skip-to-main', label: 'Skip to main content', targetId: 'main-content' },
        { id: 'skip-to-nav', label: 'Skip to navigation', targetId: 'main-navigation' },
    ]
}: SkipLinksProps) {
    return (
        <div className="sr-only focus-within:not-sr-only fixed top-0 left-0 z-[9999] p-2 space-y-2 bg-slate-900">
            {links.map(link => (
                <a
                    key={link.id}
                    href={`#${link.targetId}`}
                    className="block px-4 py-2 text-white bg-purple-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    {link.label}
                </a>
            ))}
        </div>
    )
}

// ============================================================================
// FOCUS RING
// ============================================================================

interface FocusRingProps {
    children: React.ReactElement
    offset?: number
    color?: string
}

export function FocusRing({ children, offset = 2, color = 'rgb(147 51 234)' }: FocusRingProps) {
    return (
        <div
            className="focus-within:ring-2 focus-within:ring-offset-2 rounded-md"
            style={{
                '--tw-ring-color': color,
                '--tw-ring-offset-width': `${offset}px`,
            } as React.CSSProperties}
        >
            {children}
        </div>
    )
}

// ============================================================================
// VISUALLY HIDDEN
// ============================================================================

export function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span className="sr-only">
            {children}
        </span>
    )
}

// ============================================================================
// KEYBOARD NAVIGATION HOOK
// ============================================================================

interface KeyboardNavigationConfig {
    onArrowUp?: () => void
    onArrowDown?: () => void
    onArrowLeft?: () => void
    onArrowRight?: () => void
    onEnter?: () => void
    onEscape?: () => void
    onSpace?: () => void
    onHome?: () => void
    onEnd?: () => void
    onTab?: (shiftKey: boolean) => void
}

export function useKeyboardNavigation(config: KeyboardNavigationConfig) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowUp':
                    config.onArrowUp?.()
                    break
                case 'ArrowDown':
                    config.onArrowDown?.()
                    break
                case 'ArrowLeft':
                    config.onArrowLeft?.()
                    break
                case 'ArrowRight':
                    config.onArrowRight?.()
                    break
                case 'Enter':
                    config.onEnter?.()
                    break
                case 'Escape':
                    config.onEscape?.()
                    break
                case ' ':
                    config.onSpace?.()
                    break
                case 'Home':
                    config.onHome?.()
                    break
                case 'End':
                    config.onEnd?.()
                    break
                case 'Tab':
                    config.onTab?.(e.shiftKey)
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [config])
}

// ============================================================================
// ROVING TAB INDEX
// ============================================================================

interface RovingTabIndexConfig {
    items: HTMLElement[]
    orientation?: 'horizontal' | 'vertical' | 'both'
    loop?: boolean
}

export function useRovingTabIndex({ items, orientation = 'both', loop = true }: RovingTabIndexConfig) {
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        items.forEach((item, index) => {
            item.setAttribute('tabindex', index === activeIndex ? '0' : '-1')
        })
    }, [items, activeIndex])

    const moveFocus = useCallback((direction: 'next' | 'prev') => {
        setActiveIndex(current => {
            let next: number
            if (direction === 'next') {
                next = current + 1
                if (next >= items.length) next = loop ? 0 : items.length - 1
            } else {
                next = current - 1
                if (next < 0) next = loop ? items.length - 1 : 0
            }
            items[next]?.focus()
            return next
        })
    }, [items, loop])

    useKeyboardNavigation({
        onArrowDown: orientation !== 'horizontal' ? () => moveFocus('next') : undefined,
        onArrowUp: orientation !== 'horizontal' ? () => moveFocus('prev') : undefined,
        onArrowRight: orientation !== 'vertical' ? () => moveFocus('next') : undefined,
        onArrowLeft: orientation !== 'vertical' ? () => moveFocus('prev') : undefined,
        onHome: () => {
            setActiveIndex(0)
            items[0]?.focus()
        },
        onEnd: () => {
            const lastIndex = items.length - 1
            setActiveIndex(lastIndex)
            items[lastIndex]?.focus()
        },
    })

    return { activeIndex, setActiveIndex, moveFocus }
}

// ============================================================================
// LIVE REGION
// ============================================================================

interface LiveRegionProps {
    children: React.ReactNode
    priority?: 'polite' | 'assertive'
    atomic?: boolean
    relevant?: 'additions' | 'removals' | 'text' | 'all'
}

export function LiveRegion({
    children,
    priority = 'polite',
    atomic = true,
    relevant = 'additions'
}: LiveRegionProps) {
    return (
        <div
            role="status"
            aria-live={priority}
            aria-atomic={atomic}
            aria-relevant={relevant}
            className="sr-only"
        >
            {children}
        </div>
    )
}

// ============================================================================
// REDUCED MOTION WRAPPER
// ============================================================================

interface ReducedMotionProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

export function ReducedMotion({ children, fallback }: ReducedMotionProps) {
    const { settings } = useAccessibility()

    if (settings.reducedMotion && fallback) {
        return <>{fallback}</>
    }

    return <>{children}</>
}

// ============================================================================
// ARIA HELPERS
// ============================================================================

export function generateAriaDescribedBy(...ids: (string | undefined | null)[]): string | undefined {
    const validIds = ids.filter(Boolean)
    return validIds.length > 0 ? validIds.join(' ') : undefined
}

export function generateAriaLabelledBy(...ids: (string | undefined | null)[]): string | undefined {
    const validIds = ids.filter(Boolean)
    return validIds.length > 0 ? validIds.join(' ') : undefined
}

// ============================================================================
// COLOR CONTRAST HELPERS
// ============================================================================

export function getContrastRatio(color1: string, color2: string): number {
    const lum1 = getLuminance(color1)
    const lum2 = getLuminance(color2)
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)
}

function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex)
    if (!rgb) return 0

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(v => {
        v /= 255
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })

    return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    } : null
}

export function meetsContrastRatio(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = getContrastRatio(foreground, background)
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7
}
