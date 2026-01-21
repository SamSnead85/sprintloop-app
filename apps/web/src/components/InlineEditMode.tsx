/**
 * InlineEditMode Component
 * Cmd+K triggered inline code editing with AI assistance
 * Inspired by Cursor's inline edit feature
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Loader2, Sparkles } from 'lucide-react'
import { InlineDiff } from './InlineDiff'

interface InlineEditModeProps {
    /** The currently selected code to edit */
    selectedCode: string
    /** The filename for context */
    filename: string
    /** Line range of selection */
    lineRange: { start: number; end: number }
    /** Called when edit is accepted */
    onAccept: (newCode: string) => void
    /** Called when edit is cancelled */
    onCancel: () => void
    /** Whether the edit mode is visible */
    isOpen: boolean
}

export function InlineEditMode({
    selectedCode,
    filename,
    lineRange,
    onAccept,
    onCancel,
    isOpen
}: InlineEditModeProps) {
    const [instruction, setInstruction] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedCode, setGeneratedCode] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setInstruction('')
            setGeneratedCode(null)
            setError(null)
            setIsGenerating(false)
        }
    }, [isOpen])

    const handleSubmit = useCallback(async () => {
        if (!instruction.trim() || isGenerating) return

        setIsGenerating(true)
        setError(null)

        try {
            // TODO: In a real implementation, this would call the AI provider with:
            // - selectedCode: the code to modify
            // - instruction: what changes to make
            // For now, simulate AI response
            console.log('Generating edit for:', { instruction, codeLength: selectedCode.length })

            await new Promise(resolve => setTimeout(resolve, 1500))

            // For demo, just add a comment
            const modified = `// AI: ${instruction}\n${selectedCode}`
            setGeneratedCode(modified)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate edit')
        } finally {
            setIsGenerating(false)
        }
    }, [instruction, isGenerating, selectedCode])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
        if (e.key === 'Escape') {
            onCancel()
        }
    }

    const handleAccept = () => {
        if (generatedCode) {
            onAccept(generatedCode)
        }
    }

    const handleReject = () => {
        setGeneratedCode(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Edit Code</span>
                        <span className="text-xs text-gray-500">
                            {filename}:{lineRange.start}-{lineRange.end}
                        </span>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Selected code preview */}
                <div className="max-h-32 overflow-y-auto bg-slate-950/50 border-b border-white/5">
                    <pre className="p-3 text-xs font-mono text-gray-400 whitespace-pre-wrap">
                        {selectedCode.length > 500
                            ? selectedCode.slice(0, 500) + '\n... (truncated)'
                            : selectedCode
                        }
                    </pre>
                </div>

                {/* Instruction input */}
                <div className="p-3 border-b border-white/5">
                    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 focus-within:ring-1 focus-within:ring-purple-500/50">
                        <input
                            ref={inputRef}
                            type="text"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Describe the change... (e.g., 'add error handling', 'refactor to async')"
                            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                            disabled={isGenerating}
                        />
                        <button
                            onClick={handleSubmit}
                            disabled={!instruction.trim() || isGenerating}
                            className="text-purple-400 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed transition-colors"
                        >
                            {isGenerating ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                        <span>Enter to generate</span>
                        <span>Esc to cancel</span>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="px-4 py-2 bg-red-500/10 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Generated diff */}
                {generatedCode && (
                    <div className="p-3">
                        <InlineDiff
                            originalCode={selectedCode}
                            modifiedCode={generatedCode}
                            filename={filename}
                            onAccept={handleAccept}
                            onReject={handleReject}
                        />
                    </div>
                )}

                {/* Generating indicator */}
                {isGenerating && (
                    <div className="px-4 py-6 text-center">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-400">Generating edit...</span>
                    </div>
                )}
            </div>
        </div>
    )
}

/**
 * Hook to manage inline edit mode
 */
export function useInlineEditMode() {
    const [isOpen, setIsOpen] = useState(false)
    const [selection, setSelection] = useState<{
        code: string
        filename: string
        lineRange: { start: number; end: number }
    } | null>(null)

    const openEditMode = useCallback((
        code: string,
        filename: string,
        lineRange: { start: number; end: number }
    ) => {
        setSelection({ code, filename, lineRange })
        setIsOpen(true)
    }, [])

    const closeEditMode = useCallback(() => {
        setIsOpen(false)
        setSelection(null)
    }, [])

    // Global Cmd+K handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                // Only trigger if there's a selection
                const selectedText = window.getSelection()?.toString()
                if (selectedText && selectedText.trim()) {
                    e.preventDefault()
                    openEditMode(selectedText, 'selected-code.txt', { start: 1, end: 1 })
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [openEditMode])

    return {
        isOpen,
        selection,
        openEditMode,
        closeEditMode
    }
}
