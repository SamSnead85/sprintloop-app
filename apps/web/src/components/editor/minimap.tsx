/**
 * SprintLoop Minimap System
 * 
 * Phase 1501-1550: Code minimap
 * - Zoomed out code view
 * - Viewport indicator
 * - Scroll sync
 * - Syntax highlighting
 * - Decorations
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'

// ============================================================================
// TYPES
// ============================================================================

interface MinimapLine {
    content: string
    decorations?: MinimapDecoration[]
}

interface MinimapDecoration {
    type: 'error' | 'warning' | 'info' | 'search' | 'change' | 'selection'
    startColumn?: number
    endColumn?: number
}

interface MinimapHighlight {
    startLine: number
    endLine: number
    type: 'search' | 'selection' | 'error' | 'warning'
}

// ============================================================================
// MINIMAP CANVAS
// ============================================================================

interface MinimapCanvasProps {
    lines: MinimapLine[]
    width: number
    lineHeight: number
    charWidth: number
    maxChars: number
    highlights?: MinimapHighlight[]
}

function MinimapCanvas({
    lines,
    width,
    lineHeight,
    charWidth,
    maxChars,
    highlights = [],
}: MinimapCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const height = lines.length * lineHeight
        canvas.width = width * 2 // Retina
        canvas.height = height * 2
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.scale(2, 2)

        // Clear
        ctx.clearRect(0, 0, width, height)

        // Draw highlights first (background)
        highlights.forEach(h => {
            const y = h.startLine * lineHeight
            const hHeight = (h.endLine - h.startLine + 1) * lineHeight

            switch (h.type) {
                case 'search':
                    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)'
                    break
                case 'selection':
                    ctx.fillStyle = 'rgba(147, 51, 234, 0.3)'
                    break
                case 'error':
                    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)'
                    break
                case 'warning':
                    ctx.fillStyle = 'rgba(234, 179, 8, 0.3)'
                    break
            }

            ctx.fillRect(0, y, width, hHeight)
        })

        // Draw lines
        lines.forEach((line, i) => {
            const y = i * lineHeight + lineHeight * 0.5
            const chars = Math.min(line.content.length, maxChars)

            // Draw each character as a small rectangle
            for (let j = 0; j < chars; j++) {
                const char = line.content[j]
                if (char === ' ' || char === '\t') continue

                const x = j * charWidth

                // Syntax coloring (simplified)
                if (/[a-zA-Z]/.test(char)) {
                    ctx.fillStyle = 'rgba(156, 163, 175, 0.6)' // Gray for identifiers
                } else if (/[0-9]/.test(char)) {
                    ctx.fillStyle = 'rgba(250, 204, 21, 0.6)' // Yellow for numbers
                } else if (/[{}()\[\]]/.test(char)) {
                    ctx.fillStyle = 'rgba(147, 51, 234, 0.6)' // Purple for brackets
                } else if (/[=<>!&|]/.test(char)) {
                    ctx.fillStyle = 'rgba(96, 165, 250, 0.6)' // Blue for operators
                } else {
                    ctx.fillStyle = 'rgba(156, 163, 175, 0.4)' // Light gray default
                }

                ctx.fillRect(x, y - lineHeight * 0.3, charWidth * 0.8, lineHeight * 0.6)
            }

            // Draw decorations
            line.decorations?.forEach(dec => {
                const x = (dec.startColumn || 0) * charWidth
                const w = dec.endColumn ? (dec.endColumn - (dec.startColumn || 0)) * charWidth : width - x

                switch (dec.type) {
                    case 'error':
                        ctx.fillStyle = 'rgba(239, 68, 68, 0.8)'
                        break
                    case 'warning':
                        ctx.fillStyle = 'rgba(234, 179, 8, 0.8)'
                        break
                    case 'search':
                        ctx.fillStyle = 'rgba(250, 204, 21, 0.8)'
                        break
                    case 'change':
                        ctx.fillStyle = 'rgba(34, 197, 94, 0.8)'
                        break
                }

                ctx.fillRect(x, y - lineHeight * 0.3, Math.max(w, 4), lineHeight * 0.6)
            })
        })
    }, [lines, width, lineHeight, charWidth, maxChars, highlights])

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0"
        />
    )
}

// ============================================================================
// VIEWPORT SLIDER
// ============================================================================

interface ViewportSliderProps {
    totalLines: number
    visibleStartLine: number
    visibleEndLine: number
    lineHeight: number
    onScroll: (line: number) => void
}

function ViewportSlider({
    totalLines,
    visibleStartLine,
    visibleEndLine,
    lineHeight,
    onScroll,
}: ViewportSliderProps) {
    const [isDragging, setIsDragging] = useState(false)
    const sliderRef = useRef<HTMLDivElement>(null)

    const visibleLines = visibleEndLine - visibleStartLine
    const sliderTop = visibleStartLine * lineHeight
    const sliderHeight = Math.max(visibleLines * lineHeight, 20)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    useEffect(() => {
        if (!isDragging) return

        const handleMouseMove = (e: MouseEvent) => {
            if (!sliderRef.current?.parentElement) return
            const rect = sliderRef.current.parentElement.getBoundingClientRect()
            const y = e.clientY - rect.top
            const line = Math.floor(y / lineHeight)
            onScroll(Math.max(0, Math.min(line, totalLines - visibleLines)))
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging, lineHeight, totalLines, visibleLines, onScroll])

    return (
        <div
            ref={sliderRef}
            className={`absolute left-0 right-0 bg-white/10 border border-white/20 rounded cursor-pointer transition-colors ${isDragging ? 'bg-white/20' : 'hover:bg-white/15'
                }`}
            style={{
                top: sliderTop,
                height: sliderHeight,
            }}
            onMouseDown={handleMouseDown}
        />
    )
}

// ============================================================================
// MINIMAP
// ============================================================================

interface MinimapProps {
    lines: string[]
    visibleStartLine: number
    visibleEndLine: number
    onScrollToLine: (line: number) => void
    width?: number
    highlights?: MinimapHighlight[]
    showSlider?: boolean
    className?: string
}

export function Minimap({
    lines,
    visibleStartLine,
    visibleEndLine,
    onScrollToLine,
    width = 80,
    highlights = [],
    showSlider = true,
    className = '',
}: MinimapProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isHovered, setIsHovered] = useState(false)

    const LINE_HEIGHT = 3
    const CHAR_WIDTH = 1
    const MAX_CHARS = width / CHAR_WIDTH

    const minimapLines: MinimapLine[] = useMemo(() => {
        return lines.map(content => ({ content }))
    }, [lines])

    const handleClick = (e: React.MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const y = e.clientY - rect.top
        const line = Math.floor(y / LINE_HEIGHT)
        const visibleLines = visibleEndLine - visibleStartLine
        onScrollToLine(Math.max(0, line - Math.floor(visibleLines / 2)))
    }

    const totalHeight = lines.length * LINE_HEIGHT

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden bg-slate-900/50 cursor-pointer ${className}`}
            style={{ width, height: Math.min(totalHeight, 400) }}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                style={{ height: totalHeight }}
                className="relative"
            >
                <MinimapCanvas
                    lines={minimapLines}
                    width={width}
                    lineHeight={LINE_HEIGHT}
                    charWidth={CHAR_WIDTH}
                    maxChars={MAX_CHARS}
                    highlights={highlights}
                />

                {showSlider && (
                    <ViewportSlider
                        totalLines={lines.length}
                        visibleStartLine={visibleStartLine}
                        visibleEndLine={visibleEndLine}
                        lineHeight={LINE_HEIGHT}
                        onScroll={onScrollToLine}
                    />
                )}
            </div>

            {/* Hover preview line indicator */}
            {isHovered && (
                <div
                    className="absolute left-0 right-0 h-0.5 bg-purple-500/50 pointer-events-none"
                    style={{ top: visibleStartLine * LINE_HEIGHT }}
                />
            )}
        </div>
    )
}

// ============================================================================
// EDITOR GUTTER
// ============================================================================

interface GutterDecoration {
    line: number
    type: 'breakpoint' | 'error' | 'warning' | 'fold' | 'change'
}

interface EditorGutterProps {
    lineCount: number
    visibleStartLine: number
    visibleEndLine: number
    lineHeight: number
    currentLine?: number
    decorations?: GutterDecoration[]
    onLineClick?: (line: number) => void
    onDecorationClick?: (line: number, type: string) => void
    showLineNumbers?: boolean
    showFolding?: boolean
    className?: string
}

export function EditorGutter({
    lineCount,
    visibleStartLine,
    visibleEndLine,
    lineHeight,
    currentLine,
    decorations = [],
    onLineClick,
    onDecorationClick,
    showLineNumbers = true,
    showFolding = true,
    className = '',
}: EditorGutterProps) {
    const visibleLines = Array.from(
        { length: visibleEndLine - visibleStartLine },
        (_, i) => visibleStartLine + i + 1
    )

    const getDecoration = (line: number) => {
        return decorations.find(d => d.line === line)
    }

    return (
        <div className={`flex flex-col select-none ${className}`}>
            {visibleLines.map(line => {
                const decoration = getDecoration(line)
                const isCurrent = line === currentLine

                return (
                    <div
                        key={line}
                        className={`flex items-center ${isCurrent ? 'bg-white/5' : ''}`}
                        style={{ height: lineHeight }}
                        onClick={() => onLineClick?.(line)}
                    >
                        {/* Decoration gutter */}
                        <div className="w-4 flex items-center justify-center">
                            {decoration?.type === 'breakpoint' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onDecorationClick?.(line, 'breakpoint')
                                    }}
                                    className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors"
                                />
                            )}
                            {decoration?.type === 'error' && (
                                <div className="w-3 h-3 bg-red-500/20 text-red-500 text-[8px] flex items-center justify-center rounded">
                                    ●
                                </div>
                            )}
                            {decoration?.type === 'warning' && (
                                <div className="w-3 h-3 bg-yellow-500/20 text-yellow-500 text-[8px] flex items-center justify-center rounded">
                                    ●
                                </div>
                            )}
                            {decoration?.type === 'change' && (
                                <div className="w-0.5 h-full bg-green-500" />
                            )}
                        </div>

                        {/* Line number */}
                        {showLineNumbers && (
                            <div
                                className={`w-10 pr-2 text-right text-xs font-mono ${isCurrent ? 'text-white' : 'text-gray-600'
                                    }`}
                            >
                                {line}
                            </div>
                        )}

                        {/* Folding indicator */}
                        {showFolding && (
                            <div className="w-4 flex items-center justify-center text-gray-600 hover:text-white">
                                {/* Would show fold icon for foldable lines */}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
