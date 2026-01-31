/**
 * SprintLoop Modal Dialog System
 * 
 * Phase 2501-2550: Modal dialogs
 * - Confirm dialogs
 * - Alert dialogs
 * - Input dialogs
 * - Side sheet
 * - Full-screen modal
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
    X,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    Info,
    Loader2
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type DialogType = 'info' | 'success' | 'warning' | 'error'
type DialogSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

interface DialogProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    description?: string
    size?: DialogSize
    closeOnOverlay?: boolean
    closeOnEscape?: boolean
    showClose?: boolean
    children?: React.ReactNode
    className?: string
}

interface ConfirmDialogProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void | Promise<void>
    title: string
    description?: string
    type?: DialogType
    confirmText?: string
    cancelText?: string
    destructive?: boolean
    loading?: boolean
}

interface AlertDialogProps {
    isOpen: boolean
    onClose: () => void
    title: string
    message: string
    type?: DialogType
    buttonText?: string
}

interface InputDialogProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (value: string) => void
    title: string
    description?: string
    placeholder?: string
    defaultValue?: string
    submitText?: string
    cancelText?: string
    validation?: (value: string) => string | null
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const sizeClasses: Record<DialogSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    full: 'max-w-full m-4',
}

// ============================================================================
// TYPE ICONS
// ============================================================================

function TypeIcon({ type }: { type: DialogType }) {
    switch (type) {
        case 'success':
            return <CheckCircle className="w-6 h-6 text-green-400" />
        case 'warning':
            return <AlertTriangle className="w-6 h-6 text-yellow-400" />
        case 'error':
            return <AlertCircle className="w-6 h-6 text-red-400" />
        default:
            return <Info className="w-6 h-6 text-blue-400" />
    }
}

// ============================================================================
// BASE DIALOG
// ============================================================================

export function Dialog({
    isOpen,
    onClose,
    title,
    description,
    size = 'md',
    closeOnOverlay = true,
    closeOnEscape = true,
    showClose = true,
    children,
    className = '',
}: DialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null)

    // Focus trap
    useEffect(() => {
        if (!isOpen) return

        const dialog = dialogRef.current
        if (!dialog) return

        const focusableElements = dialog.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        firstElement?.focus()

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault()
                    lastElement?.focus()
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault()
                    firstElement?.focus()
                }
            }
        }

        document.addEventListener('keydown', handleTabKey)
        return () => document.removeEventListener('keydown', handleTabKey)
    }, [isOpen])

    // Escape key
    useEffect(() => {
        if (!isOpen || !closeOnEscape) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
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

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'dialog-title' : undefined}
            aria-describedby={description ? 'dialog-description' : undefined}
        >
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200"
                onClick={closeOnOverlay ? onClose : undefined}
            />

            {/* Dialog */}
            <div
                ref={dialogRef}
                className={`
                    relative w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl
                    animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200
                    ${sizeClasses[size]}
                    ${className}
                `}
            >
                {/* Header */}
                {(title || showClose) && (
                    <div className="flex items-start justify-between p-4 border-b border-white/5">
                        <div>
                            {title && (
                                <h2 id="dialog-title" className="text-lg font-semibold text-white">
                                    {title}
                                </h2>
                            )}
                            {description && (
                                <p id="dialog-description" className="mt-1 text-sm text-gray-400">
                                    {description}
                                </p>
                            )}
                        </div>
                        {showClose && (
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
    loading = false,
}: ConfirmDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = async () => {
        setIsSubmitting(true)
        try {
            await onConfirm()
            onClose()
        } finally {
            setIsSubmitting(false)
        }
    }

    const isLoading = loading || isSubmitting

    return (
        <Dialog isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <TypeIcon type={type} />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    {description && (
                        <p className="mt-2 text-sm text-gray-400">{description}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                    {cancelText}
                </button>
                <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className={`
                        px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50
                        flex items-center gap-2
                        ${destructive
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-purple-500 text-white hover:bg-purple-600'
                        }
                    `}
                >
                    {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {confirmText}
                </button>
            </div>
        </Dialog>
    )
}

// ============================================================================
// ALERT DIALOG
// ============================================================================

export function AlertDialog({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    buttonText = 'OK',
}: AlertDialogProps) {
    return (
        <Dialog isOpen={isOpen} onClose={onClose} size="sm" showClose={false}>
            <div className="flex gap-4">
                <div className="flex-shrink-0">
                    <TypeIcon type={type} />
                </div>
                <div className="flex-1">
                    <h3 className="text-base font-semibold text-white">{title}</h3>
                    <p className="mt-2 text-sm text-gray-400">{message}</p>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                    {buttonText}
                </button>
            </div>
        </Dialog>
    )
}

// ============================================================================
// INPUT DIALOG
// ============================================================================

export function InputDialog({
    isOpen,
    onClose,
    onSubmit,
    title,
    description,
    placeholder,
    defaultValue = '',
    submitText = 'Submit',
    cancelText = 'Cancel',
    validation,
}: InputDialogProps) {
    const [value, setValue] = useState(defaultValue)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setValue(defaultValue)
            setError(null)
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [isOpen, defaultValue])

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault()

        if (validation) {
            const validationError = validation(value)
            if (validationError) {
                setError(validationError)
                return
            }
        }

        onSubmit(value)
        onClose()
    }, [value, validation, onSubmit, onClose])

    return (
        <Dialog isOpen={isOpen} onClose={onClose} size="sm" title={title} description={description}>
            <form onSubmit={handleSubmit}>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => {
                        setValue(e.target.value)
                        setError(null)
                    }}
                    placeholder={placeholder}
                    className={`
                        w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-500
                        focus:outline-none focus:border-purple-500 transition-colors
                        ${error ? 'border-red-500' : 'border-white/10'}
                    `}
                />
                {error && (
                    <p className="mt-1 text-xs text-red-400">{error}</p>
                )}

                <div className="flex justify-end gap-3 mt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 text-sm font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                        {submitText}
                    </button>
                </div>
            </form>
        </Dialog>
    )
}

// ============================================================================
// SIDE SHEET
// ============================================================================

interface SideSheetProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    position?: 'left' | 'right'
    width?: string
    children?: React.ReactNode
}

export function SideSheet({
    isOpen,
    onClose,
    title,
    position = 'right',
    width = '400px',
    children,
}: SideSheetProps) {
    // Escape key
    useEffect(() => {
        if (!isOpen) return

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }

        document.addEventListener('keydown', handleEscape)
        return () => document.removeEventListener('keydown', handleEscape)
    }, [isOpen, onClose])

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-50">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 animate-in fade-in-0 duration-200"
                onClick={onClose}
            />

            {/* Sheet */}
            <div
                className={`
                    absolute top-0 bottom-0 bg-slate-900 border-white/10 shadow-2xl flex flex-col
                    ${position === 'right' ? 'right-0 border-l animate-in slide-in-from-right' : 'left-0 border-r animate-in slide-in-from-left'}
                    duration-300
                `}
                style={{ width }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    {title && (
                        <h2 className="text-lg font-semibold text-white">{title}</h2>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}
