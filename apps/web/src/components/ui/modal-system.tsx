/**
 * SprintLoop Modal & Dialog System
 * 
 * Accessible, animated modals and dialogs:
 * - Focus trapping
 * - Escape to close
 * - Click outside to close
 * - Multiple sizes
 * - Confirmation dialogs
 */

import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react'

// ============================================================================
// MODAL CONTEXT
// ============================================================================

interface ModalContextValue {
    isOpen: boolean
    close: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useModalContext() {
    const context = useContext(ModalContext)
    if (!context) throw new Error('Modal components must be used within Modal')
    return context
}

// ============================================================================
// MODAL COMPONENT
// ============================================================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    size?: ModalSize
    closeOnOverlayClick?: boolean
    closeOnEscape?: boolean
    showCloseButton?: boolean
    children: React.ReactNode
}

const sizeClasses: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
}

export function Modal({
    isOpen,
    onClose,
    size = 'md',
    closeOnOverlayClick = true,
    closeOnEscape = true,
    showCloseButton = true,
    children,
}: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const previousActiveElement = useRef<Element | null>(null)

    // Store previous focus and trap focus
    useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement

            // Focus first focusable element
            const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            focusable?.[0]?.focus()
        } else {
            // Restore focus
            if (previousActiveElement.current instanceof HTMLElement) {
                previousActiveElement.current.focus()
            }
        }
    }, [isOpen])

    // Handle escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, closeOnEscape, onClose])

    // Prevent body scroll
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (closeOnOverlayClick && e.target === overlayRef.current) {
            onClose()
        }
    }

    return createPortal(
        <ModalContext.Provider value={{ isOpen, close: onClose }}>
            <div
                ref={overlayRef}
                onClick={handleOverlayClick}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
                role="dialog"
                aria-modal="true"
            >
                <div
                    ref={contentRef}
                    className={`
                        relative w-full ${sizeClasses[size]}
                        bg-slate-900 border border-white/10 rounded-xl shadow-2xl
                        animate-scale-in
                    `}
                >
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                    {children}
                </div>
            </div>
        </ModalContext.Provider>,
        document.body
    )
}

// ============================================================================
// MODAL SUBCOMPONENTS
// ============================================================================

interface ModalHeaderProps {
    children: React.ReactNode
    className?: string
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
    return (
        <div className={`px-6 pt-6 pb-4 border-b border-white/5 ${className || ''}`}>
            {typeof children === 'string' ? (
                <h2 className="text-xl font-semibold text-white">{children}</h2>
            ) : (
                children
            )}
        </div>
    )
}

interface ModalBodyProps {
    children: React.ReactNode
    className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
    return (
        <div className={`px-6 py-4 ${className || ''}`}>
            {children}
        </div>
    )
}

interface ModalFooterProps {
    children: React.ReactNode
    className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <div className={`px-6 py-4 border-t border-white/5 flex items-center justify-end gap-3 ${className || ''}`}>
            {children}
        </div>
    )
}

// ============================================================================
// CONFIRMATION DIALOG
// ============================================================================

type DialogVariant = 'info' | 'warning' | 'danger' | 'success'

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    message: string
    variant?: DialogVariant
    confirmLabel?: string
    cancelLabel?: string
    isLoading?: boolean
}

const variantIcons: Record<DialogVariant, React.ReactNode> = {
    info: <Info className="w-6 h-6 text-blue-400" />,
    warning: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
    danger: <AlertTriangle className="w-6 h-6 text-red-400" />,
    success: <CheckCircle className="w-6 h-6 text-green-400" />,
}

const variantButtonStyles: Record<DialogVariant, string> = {
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
}

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    variant = 'info',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isLoading = false,
}: ConfirmDialogProps) {
    const handleConfirm = async () => {
        await onConfirm()
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="sm">
            <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
                    {variantIcons[variant]}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-gray-400 mb-6">{message}</p>
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={`
                            px-4 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50
                            flex items-center gap-2
                            ${variantButtonStyles[variant]}
                        `}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    )
}

// ============================================================================
// DRAWER COMPONENT
// ============================================================================

type DrawerPosition = 'left' | 'right' | 'top' | 'bottom'

interface DrawerProps {
    isOpen: boolean
    onClose: () => void
    position?: DrawerPosition
    size?: 'sm' | 'md' | 'lg'
    children: React.ReactNode
}

const drawerPositionClasses: Record<DrawerPosition, { container: string; panel: string; animation: string }> = {
    left: {
        container: 'items-stretch justify-start',
        panel: 'h-full',
        animation: 'animate-slide-in-left',
    },
    right: {
        container: 'items-stretch justify-end',
        panel: 'h-full',
        animation: 'animate-slide-in-right',
    },
    top: {
        container: 'items-start justify-center',
        panel: 'w-full',
        animation: 'animate-slide-in-top',
    },
    bottom: {
        container: 'items-end justify-center',
        panel: 'w-full',
        animation: 'animate-slide-in-bottom',
    },
}

const drawerSizeClasses: Record<DrawerPosition, Record<'sm' | 'md' | 'lg', string>> = {
    left: { sm: 'w-64', md: 'w-80', lg: 'w-96' },
    right: { sm: 'w-64', md: 'w-80', lg: 'w-96' },
    top: { sm: 'h-48', md: 'h-64', lg: 'h-96' },
    bottom: { sm: 'h-48', md: 'h-64', lg: 'h-96' },
}

export function Drawer({
    isOpen,
    onClose,
    position = 'right',
    size = 'md',
    children,
}: DrawerProps) {
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, onClose])

    if (!isOpen) return null

    const { container, panel, animation } = drawerPositionClasses[position]
    const sizeClass = drawerSizeClasses[position][size]

    return createPortal(
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Panel */}
            <div className={`absolute inset-0 flex ${container}`}>
                <div
                    className={`
                        relative ${sizeClass} ${panel}
                        bg-slate-900 border-white/10 shadow-2xl
                        ${animation}
                        ${position === 'left' ? 'border-r' : ''}
                        ${position === 'right' ? 'border-l' : ''}
                        ${position === 'top' ? 'border-b' : ''}
                        ${position === 'bottom' ? 'border-t' : ''}
                    `}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                        aria-label="Close drawer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

// ============================================================================
// POPOVER COMPONENT
// ============================================================================

interface PopoverProps {
    trigger: React.ReactNode
    content: React.ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
    align?: 'start' | 'center' | 'end'
}

export function Popover({ trigger, content, position = 'bottom', align = 'center' }: PopoverProps) {
    const [isOpen, setIsOpen] = useState(false)
    const triggerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
                contentRef.current && !contentRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const positionClasses = {
        top: 'bottom-full mb-2',
        bottom: 'top-full mt-2',
        left: 'right-full mr-2',
        right: 'left-full ml-2',
    }

    const alignClasses = {
        start: position === 'top' || position === 'bottom' ? 'left-0' : 'top-0',
        center: position === 'top' || position === 'bottom' ? 'left-1/2 -translate-x-1/2' : 'top-1/2 -translate-y-1/2',
        end: position === 'top' || position === 'bottom' ? 'right-0' : 'bottom-0',
    }

    return (
        <div className="relative inline-block">
            <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    ref={contentRef}
                    className={`
                        absolute z-50 min-w-[200px]
                        bg-slate-900 border border-white/10 rounded-xl shadow-xl
                        animate-scale-in
                        ${positionClasses[position]}
                        ${alignClasses[align]}
                    `}
                >
                    {content}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// DROPDOWN MENU
// ============================================================================

interface DropdownItem {
    id: string
    label: string
    icon?: React.ReactNode
    shortcut?: string
    onClick?: () => void
    disabled?: boolean
    danger?: boolean
}

interface DropdownMenuProps {
    trigger: React.ReactNode
    items: DropdownItem[]
    align?: 'start' | 'end'
}

export function DropdownMenu({ trigger, items, align = 'start' }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
        <div ref={menuRef} className="relative inline-block">
            <div onClick={() => setIsOpen(!isOpen)}>
                {trigger}
            </div>

            {isOpen && (
                <div
                    className={`
                        absolute z-50 mt-1 min-w-[180px] py-1
                        bg-slate-900 border border-white/10 rounded-lg shadow-xl
                        animate-scale-in origin-top-left
                        ${align === 'end' ? 'right-0' : 'left-0'}
                    `}
                    role="menu"
                >
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                item.onClick?.()
                                setIsOpen(false)
                            }}
                            disabled={item.disabled}
                            className={`
                                w-full flex items-center gap-3 px-3 py-2 text-sm text-left
                                transition-colors
                                ${item.danger
                                    ? 'text-red-400 hover:bg-red-500/20'
                                    : 'text-gray-300 hover:bg-white/5'
                                }
                                ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            role="menuitem"
                        >
                            {item.icon && <span className="w-4">{item.icon}</span>}
                            <span className="flex-1">{item.label}</span>
                            {item.shortcut && (
                                <span className="text-xs text-gray-600">{item.shortcut}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SHEET COMPONENT (Bottom Sheet for Mobile)
// ============================================================================

interface SheetProps {
    isOpen: boolean
    onClose: () => void
    children: React.ReactNode
}

export function Sheet({ isOpen, onClose, children }: SheetProps) {
    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="absolute inset-x-0 bottom-0 animate-slide-in-bottom">
                <div className="bg-slate-900 border-t border-white/10 rounded-t-2xl shadow-2xl max-h-[80vh] overflow-auto">
                    {/* Handle */}
                    <div className="flex justify-center py-2">
                        <div className="w-10 h-1 bg-white/20 rounded-full" />
                    </div>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

// ============================================================================
// TOOLTIP HOOK
// ============================================================================

export function useModal() {
    const [isOpen, setIsOpen] = useState(false)

    const open = useCallback(() => setIsOpen(true), [])
    const close = useCallback(() => setIsOpen(false), [])
    const toggle = useCallback(() => setIsOpen(prev => !prev), [])

    return { isOpen, open, close, toggle }
}
