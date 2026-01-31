/**
 * SprintLoop Advanced Accessibility System
 * 
 * Phase 201-300: WCAG 2.1 AAA Compliance
 * - Advanced focus indicators
 * - Screen reader optimization
 * - High contrast mode
 * - Reduced motion support
 * - Voice navigation ready
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

// ============================================================================
// ACCESSIBILITY CONTEXT
// ============================================================================

interface AccessibilitySettings {
    reducedMotion: boolean
    highContrast: boolean
    largeText: boolean
    screenReaderMode: boolean
    focusIndicatorSize: 'normal' | 'large' | 'extra-large'
    cursorSize: 'normal' | 'large'
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}

interface AccessibilityContextValue {
    settings: AccessibilitySettings
    updateSettings: (updates: Partial<AccessibilitySettings>) => void
    announce: (message: string, priority?: 'polite' | 'assertive') => void
    focusFirst: (container: HTMLElement | null) => void
    focusLast: (container: HTMLElement | null) => void
    trapFocus: (container: HTMLElement | null) => () => void
}

const defaultSettings: AccessibilitySettings = {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderMode: false,
    focusIndicatorSize: 'normal',
    cursorSize: 'normal',
    colorBlindMode: 'none',
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null)

export function useAccessibility() {
    const context = useContext(AccessibilityContext)
    if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider')
    return context
}

// ============================================================================
// ACCESSIBILITY PROVIDER
// ============================================================================

interface AccessibilityProviderProps {
    children: React.ReactNode
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
    const [settings, setSettings] = useState<AccessibilitySettings>(() => {
        if (typeof window === 'undefined') return defaultSettings

        return {
            ...defaultSettings,
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            highContrast: window.matchMedia('(prefers-contrast: more)').matches,
        }
    })

    const [announcement, setAnnouncement] = useState<{ message: string; priority: 'polite' | 'assertive' }>({
        message: '',
        priority: 'polite',
    })

    // Listen for system preference changes
    useEffect(() => {
        if (typeof window === 'undefined') return

        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        const contrastQuery = window.matchMedia('(prefers-contrast: more)')

        const handleMotionChange = (e: MediaQueryListEvent) => {
            setSettings(prev => ({ ...prev, reducedMotion: e.matches }))
        }

        const handleContrastChange = (e: MediaQueryListEvent) => {
            setSettings(prev => ({ ...prev, highContrast: e.matches }))
        }

        motionQuery.addEventListener('change', handleMotionChange)
        contrastQuery.addEventListener('change', handleContrastChange)

        return () => {
            motionQuery.removeEventListener('change', handleMotionChange)
            contrastQuery.removeEventListener('change', handleContrastChange)
        }
    }, [])

    // Apply settings to document
    useEffect(() => {
        const root = document.documentElement

        root.classList.toggle('reduce-motion', settings.reducedMotion)
        root.classList.toggle('high-contrast', settings.highContrast)
        root.classList.toggle('large-text', settings.largeText)
        root.classList.toggle(`focus-${settings.focusIndicatorSize}`, true)
        root.classList.toggle(`cursor-${settings.cursorSize}`, true)

        if (settings.colorBlindMode !== 'none') {
            root.setAttribute('data-color-blind-mode', settings.colorBlindMode)
        } else {
            root.removeAttribute('data-color-blind-mode')
        }
    }, [settings])

    const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
        setSettings(prev => ({ ...prev, ...updates }))
    }, [])

    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        setAnnouncement({ message: '', priority })
        setTimeout(() => setAnnouncement({ message, priority }), 50)
    }, [])

    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
        const elements = container.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        return Array.from(elements)
    }

    const focusFirst = useCallback((container: HTMLElement | null) => {
        if (!container) return
        const elements = getFocusableElements(container)
        elements[0]?.focus()
    }, [])

    const focusLast = useCallback((container: HTMLElement | null) => {
        if (!container) return
        const elements = getFocusableElements(container)
        elements[elements.length - 1]?.focus()
    }, [])

    const trapFocus = useCallback((container: HTMLElement | null) => {
        if (!container) return () => { }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return

            const elements = getFocusableElements(container)
            const first = elements[0]
            const last = elements[elements.length - 1]

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault()
                last?.focus()
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault()
                first?.focus()
            }
        }

        container.addEventListener('keydown', handleKeyDown)
        return () => container.removeEventListener('keydown', handleKeyDown)
    }, [])

    return (
        <AccessibilityContext.Provider
            value={{
                settings,
                updateSettings,
                announce,
                focusFirst,
                focusLast,
                trapFocus,
            }}
        >
            {children}
            {/* Live regions for announcements */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement.priority === 'polite' && announcement.message}
            </div>
            <div className="sr-only" aria-live="assertive" aria-atomic="true">
                {announcement.priority === 'assertive' && announcement.message}
            </div>
        </AccessibilityContext.Provider>
    )
}

// ============================================================================
// SKIP LINKS
// ============================================================================

interface SkipLink {
    id: string
    label: string
    target: string
}

interface SkipLinksProps {
    links?: SkipLink[]
}

const defaultSkipLinks: SkipLink[] = [
    { id: 'main', label: 'Skip to main content', target: '#main-content' },
    { id: 'nav', label: 'Skip to navigation', target: '#main-nav' },
    { id: 'search', label: 'Skip to search', target: '#search-input' },
]

export function SkipLinks({ links = defaultSkipLinks }: SkipLinksProps) {
    return (
        <nav className="sr-only focus-within:not-sr-only fixed top-0 left-0 z-[9999] flex flex-col gap-2 p-4 bg-slate-900">
            {links.map(link => (
                <a
                    key={link.id}
                    href={link.target}
                    className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300"
                >
                    {link.label}
                </a>
            ))}
        </nav>
    )
}

// ============================================================================
// FOCUS TRAP
// ============================================================================

interface FocusTrapProps {
    children: React.ReactNode
    enabled?: boolean
    returnFocusOnDeactivate?: boolean
    initialFocus?: React.RefObject<HTMLElement>
}

export function FocusTrap({
    children,
    enabled = true,
    returnFocusOnDeactivate = true,
    initialFocus,
}: FocusTrapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const previousFocusRef = useRef<HTMLElement | null>(null)
    const { trapFocus, focusFirst } = useAccessibility()

    useEffect(() => {
        if (!enabled) return

        previousFocusRef.current = document.activeElement as HTMLElement

        if (initialFocus?.current) {
            initialFocus.current.focus()
        } else if (containerRef.current) {
            focusFirst(containerRef.current)
        }

        const cleanup = trapFocus(containerRef.current)

        return () => {
            cleanup()
            if (returnFocusOnDeactivate && previousFocusRef.current) {
                previousFocusRef.current.focus()
            }
        }
    }, [enabled, initialFocus, trapFocus, focusFirst, returnFocusOnDeactivate])

    return (
        <div ref={containerRef}>
            {children}
        </div>
    )
}

// ============================================================================
// VISUALLY HIDDEN
// ============================================================================

interface VisuallyHiddenProps {
    children: React.ReactNode
    focusable?: boolean
}

export function VisuallyHidden({ children, focusable = false }: VisuallyHiddenProps) {
    return (
        <span
            className={focusable ? 'sr-only focus:not-sr-only' : 'sr-only'}
        >
            {children}
        </span>
    )
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
    relevant = 'additions',
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
// ACCESSIBLE ICON
// ============================================================================

interface AccessibleIconProps {
    label: string
    children: React.ReactNode
}

export function AccessibleIcon({ label, children }: AccessibleIconProps) {
    return (
        <span role="img" aria-label={label}>
            {children}
        </span>
    )
}

// ============================================================================
// KEYBOARD ONLY FOCUS
// ============================================================================

export function useKeyboardFocus() {
    const [isKeyboardUser, setIsKeyboardUser] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                setIsKeyboardUser(true)
            }
        }

        const handleMouseDown = () => {
            setIsKeyboardUser(false)
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('mousedown', handleMouseDown)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('mousedown', handleMouseDown)
        }
    }, [])

    return isKeyboardUser
}

// ============================================================================
// ROVING TAB INDEX
// ============================================================================

interface UseRovingTabIndexOptions {
    orientation?: 'horizontal' | 'vertical' | 'grid'
    loop?: boolean
    gridColumns?: number
}

export function useRovingTabIndex({
    orientation = 'horizontal',
    loop = true,
    gridColumns = 1,
}: UseRovingTabIndexOptions = {}) {
    const [focusedIndex, setFocusedIndex] = useState(0)
    const itemsRef = useRef<HTMLElement[]>([])

    const registerItem = useCallback((element: HTMLElement | null, index: number) => {
        if (element) {
            itemsRef.current[index] = element
        }
    }, [])

    const handleKeyDown = useCallback((e: React.KeyboardEvent, currentIndex: number) => {
        const items = itemsRef.current.filter(Boolean)
        const count = items.length

        let nextIndex = currentIndex

        switch (e.key) {
            case 'ArrowRight':
                if (orientation !== 'vertical') {
                    e.preventDefault()
                    nextIndex = loop
                        ? (currentIndex + 1) % count
                        : Math.min(currentIndex + 1, count - 1)
                }
                break
            case 'ArrowLeft':
                if (orientation !== 'vertical') {
                    e.preventDefault()
                    nextIndex = loop
                        ? (currentIndex - 1 + count) % count
                        : Math.max(currentIndex - 1, 0)
                }
                break
            case 'ArrowDown':
                if (orientation !== 'horizontal') {
                    e.preventDefault()
                    if (orientation === 'grid') {
                        nextIndex = loop
                            ? (currentIndex + gridColumns) % count
                            : Math.min(currentIndex + gridColumns, count - 1)
                    } else {
                        nextIndex = loop
                            ? (currentIndex + 1) % count
                            : Math.min(currentIndex + 1, count - 1)
                    }
                }
                break
            case 'ArrowUp':
                if (orientation !== 'horizontal') {
                    e.preventDefault()
                    if (orientation === 'grid') {
                        nextIndex = loop
                            ? (currentIndex - gridColumns + count) % count
                            : Math.max(currentIndex - gridColumns, 0)
                    } else {
                        nextIndex = loop
                            ? (currentIndex - 1 + count) % count
                            : Math.max(currentIndex - 1, 0)
                    }
                }
                break
            case 'Home':
                e.preventDefault()
                nextIndex = 0
                break
            case 'End':
                e.preventDefault()
                nextIndex = count - 1
                break
        }

        if (nextIndex !== currentIndex) {
            setFocusedIndex(nextIndex)
            items[nextIndex]?.focus()
        }
    }, [orientation, loop, gridColumns])

    const getItemProps = useCallback((index: number) => ({
        tabIndex: index === focusedIndex ? 0 : -1,
        ref: (el: HTMLElement | null) => registerItem(el, index),
        onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
        onFocus: () => setFocusedIndex(index),
    }), [focusedIndex, registerItem, handleKeyDown])

    return { focusedIndex, getItemProps }
}

// ============================================================================
// ANNOUNCE HOOK
// ============================================================================

export function useAnnounce() {
    const { announce } = useAccessibility()
    return announce
}

// ============================================================================
// HIGH CONTRAST WRAPPER
// ============================================================================

interface HighContrastProps {
    children: React.ReactNode
    forceHighContrast?: boolean
}

export function HighContrast({ children, forceHighContrast }: HighContrastProps) {
    const { settings } = useAccessibility()
    const isHighContrast = forceHighContrast ?? settings.highContrast

    return (
        <div className={isHighContrast ? 'high-contrast-mode' : ''}>
            {children}
        </div>
    )
}

// ============================================================================
// REDUCED MOTION WRAPPER
// ============================================================================

interface ReducedMotionProps {
    children: React.ReactNode
    reducedMotionChildren?: React.ReactNode
}

export function ReducedMotion({ children, reducedMotionChildren }: ReducedMotionProps) {
    const { settings } = useAccessibility()

    if (settings.reducedMotion && reducedMotionChildren) {
        return <>{reducedMotionChildren}</>
    }

    return <>{children}</>
}

// ============================================================================
// ACCESSIBLE HEADING
// ============================================================================

interface AccessibleHeadingProps {
    level: 1 | 2 | 3 | 4 | 5 | 6
    children: React.ReactNode
    visuallyHidden?: boolean
    id?: string
    className?: string
}

export function AccessibleHeading({
    level,
    children,
    visuallyHidden = false,
    id,
    className = '',
}: AccessibleHeadingProps) {
    const Tag = `h${level}` as keyof JSX.IntrinsicElements

    return (
        <Tag
            id={id}
            className={visuallyHidden ? 'sr-only' : className}
        >
            {children}
        </Tag>
    )
}

// ============================================================================
// ACCESSIBLE DESCRIPTION
// ============================================================================

interface DescribedByProps {
    id: string
    description: string
    children: React.ReactNode
}

export function DescribedBy({ id, description, children }: DescribedByProps) {
    return (
        <>
            {React.cloneElement(children as React.ReactElement, {
                'aria-describedby': id,
            })}
            <span id={id} className="sr-only">
                {description}
            </span>
        </>
    )
}

// ============================================================================
// ACCESSIBLE LABEL
// ============================================================================

interface LabelledByProps {
    id: string
    label: string
    visuallyHidden?: boolean
    children: React.ReactNode
}

export function LabelledBy({ id, label, visuallyHidden = false, children }: LabelledByProps) {
    return (
        <>
            <span
                id={id}
                className={visuallyHidden ? 'sr-only' : ''}
            >
                {label}
            </span>
            {React.cloneElement(children as React.ReactElement, {
                'aria-labelledby': id,
            })}
        </>
    )
}

// ============================================================================
// CSS STYLES (add to global CSS)
// ============================================================================

export const accessibilityStyles = `
/* Reduced Motion */
.reduce-motion,
.reduce-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
}

/* High Contrast Mode */
.high-contrast {
    --bg-primary: #000;
    --bg-secondary: #1a1a1a;
    --text-primary: #fff;
    --text-secondary: #e0e0e0;
    --border-color: #fff;
    --focus-ring: #fff;
}

.high-contrast-mode {
    filter: contrast(1.5);
}

/* Large Text */
.large-text {
    font-size: 120%;
}

/* Focus Indicators */
.focus-normal:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
}

.focus-large:focus-visible {
    outline: 3px solid currentColor;
    outline-offset: 3px;
}

.focus-extra-large:focus-visible {
    outline: 4px solid currentColor;
    outline-offset: 4px;
}

/* Large Cursor */
.cursor-large * {
    cursor: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><circle cx="16" cy="16" r="8" fill="white" stroke="black" stroke-width="2"/></svg>') 16 16, auto;
}

/* Color Blind Filters */
[data-color-blind-mode="protanopia"] {
    filter: url('#protanopia');
}

[data-color-blind-mode="deuteranopia"] {
    filter: url('#deuteranopia');
}

[data-color-blind-mode="tritanopia"] {
    filter: url('#tritanopia');
}

/* Screen reader only */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

.sr-only.focus:focus,
.focus\\:not-sr-only:focus {
    position: static;
    width: auto;
    height: auto;
    padding: initial;
    margin: initial;
    overflow: visible;
    clip: auto;
    white-space: normal;
}
`
