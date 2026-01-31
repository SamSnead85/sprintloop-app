/**
 * SprintLoop Drag and Drop System
 * 
 * Phase 3001-3050: Drag and Drop
 * - Draggable items
 * - Drop zones
 * - Sortable lists
 * - File drop zone
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, GripVertical, X } from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface DragItem {
    id: string
    type: string
    data: unknown
}

interface DragDropContextValue {
    draggedItem: DragItem | null
    setDraggedItem: (item: DragItem | null) => void
}

// ============================================================================
// CONTEXT
// ============================================================================

const DragDropContext = React.createContext<DragDropContextValue | null>(null)

export function DragDropProvider({ children }: { children: React.ReactNode }) {
    const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)

    return (
        <DragDropContext.Provider value={{ draggedItem, setDraggedItem }}>
            {children}
        </DragDropContext.Provider>
    )
}

function useDragDrop() {
    const context = React.useContext(DragDropContext)
    if (!context) {
        throw new Error('useDragDrop must be used within DragDropProvider')
    }
    return context
}

// ============================================================================
// DRAGGABLE
// ============================================================================

interface DraggableProps {
    id: string
    type: string
    data?: unknown
    disabled?: boolean
    children: React.ReactNode
    className?: string
    dragHandle?: boolean
}

export function Draggable({
    id,
    type,
    data,
    disabled = false,
    children,
    className = '',
    dragHandle = false,
}: DraggableProps) {
    const { setDraggedItem } = useDragDrop()
    const [isDragging, setIsDragging] = useState(false)
    const elementRef = useRef<HTMLDivElement>(null)

    const handleDragStart = useCallback((e: React.DragEvent) => {
        if (disabled) {
            e.preventDefault()
            return
        }

        setIsDragging(true)
        setDraggedItem({ id, type, data })

        // Set drag image
        if (elementRef.current) {
            const rect = elementRef.current.getBoundingClientRect()
            e.dataTransfer.setDragImage(
                elementRef.current,
                e.clientX - rect.left,
                e.clientY - rect.top
            )
        }

        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', id)
    }, [id, type, data, disabled, setDraggedItem])

    const handleDragEnd = useCallback(() => {
        setIsDragging(false)
        setDraggedItem(null)
    }, [setDraggedItem])

    return (
        <div
            ref={elementRef}
            draggable={!disabled && !dragHandle}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
                ${isDragging ? 'opacity-50' : ''}
                ${disabled ? 'cursor-not-allowed' : 'cursor-grab'}
                ${className}
            `}
        >
            {dragHandle ? (
                <div className="flex items-center gap-2">
                    <div
                        draggable
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab text-gray-500 hover:text-white"
                    >
                        <GripVertical className="w-4 h-4" />
                    </div>
                    <div className="flex-1">{children}</div>
                </div>
            ) : (
                children
            )}
        </div>
    )
}

// ============================================================================
// DROPPABLE
// ============================================================================

interface DroppableProps {
    accept: string | string[]
    onDrop: (item: DragItem) => void
    disabled?: boolean
    children: React.ReactNode
    className?: string
    activeClassName?: string
}

export function Droppable({
    accept,
    onDrop,
    disabled = false,
    children,
    className = '',
    activeClassName = 'ring-2 ring-purple-500 bg-purple-500/10',
}: DroppableProps) {
    const { draggedItem } = useDragDrop()
    const [isOver, setIsOver] = useState(false)

    const acceptTypes = Array.isArray(accept) ? accept : [accept]
    const canDrop = draggedItem && acceptTypes.includes(draggedItem.type) && !disabled

    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (!canDrop) return

        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setIsOver(true)
    }, [canDrop])

    const handleDragLeave = useCallback(() => {
        setIsOver(false)
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsOver(false)

        if (draggedItem && canDrop) {
            onDrop(draggedItem)
        }
    }, [draggedItem, canDrop, onDrop])

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                transition-all
                ${className}
                ${isOver && canDrop ? activeClassName : ''}
            `}
        >
            {children}
        </div>
    )
}

// ============================================================================
// SORTABLE LIST
// ============================================================================

interface SortableListProps<T> {
    items: T[]
    keyExtractor: (item: T) => string
    renderItem: (item: T, index: number) => React.ReactNode
    onReorder: (items: T[]) => void
    type?: string
    className?: string
    itemClassName?: string
}

export function SortableList<T>({
    items,
    keyExtractor,
    renderItem,
    onReorder,
    type = 'sortable-item',
    className = '',
    itemClassName = '',
}: SortableListProps<T>) {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [overIndex, setOverIndex] = useState<number | null>(null)

    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedIndex !== null && draggedIndex !== index) {
            setOverIndex(index)
        }
    }

    const handleDragEnd = () => {
        if (draggedIndex !== null && overIndex !== null && draggedIndex !== overIndex) {
            const newItems = [...items]
            const [removed] = newItems.splice(draggedIndex, 1)
            newItems.splice(overIndex, 0, removed)
            onReorder(newItems)
        }
        setDraggedIndex(null)
        setOverIndex(null)
    }

    return (
        <DragDropProvider>
            <div className={className}>
                {items.map((item, index) => (
                    <div
                        key={keyExtractor(item)}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`
                            cursor-grab
                            ${draggedIndex === index ? 'opacity-50' : ''}
                            ${overIndex === index ? 'border-t-2 border-purple-500' : ''}
                            ${itemClassName}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            <GripVertical className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1">{renderItem(item, index)}</div>
                        </div>
                    </div>
                ))}
            </div>
        </DragDropProvider>
    )
}

// ============================================================================
// FILE DROP ZONE
// ============================================================================

interface FileDropZoneProps {
    onFiles: (files: File[]) => void
    accept?: string[]
    multiple?: boolean
    maxSize?: number // in bytes
    disabled?: boolean
    children?: React.ReactNode
    className?: string
}

export function FileDropZone({
    onFiles,
    accept,
    multiple = true,
    maxSize,
    disabled = false,
    children,
    className = '',
}: FileDropZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const validateFiles = useCallback((files: File[]): File[] => {
        let validated = files

        // Filter by accepted types
        if (accept?.length) {
            validated = validated.filter(file => {
                return accept.some(type => {
                    if (type.startsWith('.')) {
                        return file.name.toLowerCase().endsWith(type.toLowerCase())
                    }
                    return file.type.match(type)
                })
            })
        }

        // Filter by max size
        if (maxSize) {
            validated = validated.filter(file => file.size <= maxSize)
        }

        // Apply multiple constraint
        if (!multiple && validated.length > 1) {
            validated = [validated[0]]
        }

        return validated
    }, [accept, maxSize, multiple])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)

        if (disabled) return

        const files = Array.from(e.dataTransfer.files)
        const validated = validateFiles(files)

        if (validated.length === 0 && files.length > 0) {
            setError('Invalid file type or size')
            return
        }

        setError(null)
        onFiles(validated)
    }, [disabled, validateFiles, onFiles])

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return

        const files = Array.from(e.target.files)
        const validated = validateFiles(files)

        if (validated.length === 0 && files.length > 0) {
            setError('Invalid file type or size')
            return
        }

        setError(null)
        onFiles(validated)

        // Reset input
        if (inputRef.current) {
            inputRef.current.value = ''
        }
    }, [validateFiles, onFiles])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        if (!disabled) {
            setIsDragOver(true)
        }
    }, [disabled])

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false)
    }, [])

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !disabled && inputRef.current?.click()}
            className={`
                relative border-2 border-dashed rounded-xl p-6 text-center transition-all
                ${isDragOver
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 hover:border-white/20'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${className}
            `}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept?.join(',')}
                multiple={multiple}
                onChange={handleChange}
                disabled={disabled}
                className="hidden"
            />

            {children || (
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                        <Upload className="w-6 h-6 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-white font-medium">
                            {isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {accept?.join(', ') || 'Any file type'}
                            {maxSize && ` up to ${Math.round(maxSize / 1024 / 1024)}MB`}
                        </p>
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
        </div>
    )
}

// ============================================================================
// FILE LIST
// ============================================================================

interface FileItem {
    id: string
    name: string
    size: number
    type: string
    progress?: number
}

interface FileListProps {
    files: FileItem[]
    onRemove?: (id: string) => void
    className?: string
}

export function FileList({
    files,
    onRemove,
    className = '',
}: FileListProps) {
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }

    if (files.length === 0) return null

    return (
        <div className={`space-y-2 ${className}`}>
            {files.map(file => (
                <div
                    key={file.id}
                    className="flex items-center gap-3 p-2 bg-white/5 rounded-lg"
                >
                    <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-gray-400 uppercase">
                            {file.name.split('.').pop()?.slice(0, 3)}
                        </span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                        {file.progress !== undefined && file.progress < 100 && (
                            <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all"
                                    style={{ width: `${file.progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                    {onRemove && (
                        <button
                            onClick={() => onRemove(file.id)}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ))}
        </div>
    )
}
