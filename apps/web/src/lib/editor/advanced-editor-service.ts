/**
 * Phase 25-50: Advanced Editor Enhancements
 * 
 * Consolidated service for advanced editor features including:
 * - Minimap controls
 * - Code folding strategies
 * - Bracket pair colorization
 * - Indentation guides
 * - Word highlighting
 * - Cursor styling
 * - Selection ranges
 * - Multi-cursor support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface MinimapSettings {
    enabled: boolean;
    side: 'left' | 'right';
    showSlider: 'always' | 'mouseover';
    renderCharacters: boolean;
    maxColumn: number;
    scale: number;
}

export interface FoldingSettings {
    enabled: boolean;
    strategy: 'auto' | 'indentation';
    highlightFoldedRanges: boolean;
    showFoldingControls: 'always' | 'mouseover';
    maxFoldingRegions: number;
}

export interface BracketSettings {
    colorization: boolean;
    guides: boolean;
    pairs: string[][];
    highlightActive: boolean;
}

export interface CursorSettings {
    style: 'line' | 'block' | 'underline';
    blinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
    width: number;
    smoothAnimation: boolean;
}

export interface SelectionSettings {
    multiCursor: boolean;
    columnSelection: boolean;
    highlightMatches: boolean;
    occurrenceHighlight: boolean;
}

export interface IndentationSettings {
    guides: boolean;
    highlightActive: boolean;
    detectIndentation: boolean;
    tabSize: number;
    insertSpaces: boolean;
}

export interface AdvancedEditorState {
    minimap: MinimapSettings;
    folding: FoldingSettings;
    brackets: BracketSettings;
    cursor: CursorSettings;
    selection: SelectionSettings;
    indentation: IndentationSettings;

    // Update methods
    updateMinimap: (settings: Partial<MinimapSettings>) => void;
    updateFolding: (settings: Partial<FoldingSettings>) => void;
    updateBrackets: (settings: Partial<BracketSettings>) => void;
    updateCursor: (settings: Partial<CursorSettings>) => void;
    updateSelection: (settings: Partial<SelectionSettings>) => void;
    updateIndentation: (settings: Partial<IndentationSettings>) => void;
    resetAll: () => void;
}

// =============================================================================
// DEFAULTS
// =============================================================================

const DEFAULT_MINIMAP: MinimapSettings = {
    enabled: true,
    side: 'right',
    showSlider: 'mouseover',
    renderCharacters: true,
    maxColumn: 120,
    scale: 1,
};

const DEFAULT_FOLDING: FoldingSettings = {
    enabled: true,
    strategy: 'auto',
    highlightFoldedRanges: true,
    showFoldingControls: 'mouseover',
    maxFoldingRegions: 5000,
};

const DEFAULT_BRACKETS: BracketSettings = {
    colorization: true,
    guides: true,
    pairs: [['(', ')'], ['[', ']'], ['{', '}']],
    highlightActive: true,
};

const DEFAULT_CURSOR: CursorSettings = {
    style: 'line',
    blinking: 'blink',
    width: 2,
    smoothAnimation: true,
};

const DEFAULT_SELECTION: SelectionSettings = {
    multiCursor: true,
    columnSelection: true,
    highlightMatches: true,
    occurrenceHighlight: true,
};

const DEFAULT_INDENTATION: IndentationSettings = {
    guides: true,
    highlightActive: true,
    detectIndentation: true,
    tabSize: 4,
    insertSpaces: true,
};

// =============================================================================
// STORE
// =============================================================================

export const useAdvancedEditorService = create<AdvancedEditorState>()(
    persist(
        (set) => ({
            minimap: DEFAULT_MINIMAP,
            folding: DEFAULT_FOLDING,
            brackets: DEFAULT_BRACKETS,
            cursor: DEFAULT_CURSOR,
            selection: DEFAULT_SELECTION,
            indentation: DEFAULT_INDENTATION,

            updateMinimap: (settings) => set(state => ({
                minimap: { ...state.minimap, ...settings },
            })),

            updateFolding: (settings) => set(state => ({
                folding: { ...state.folding, ...settings },
            })),

            updateBrackets: (settings) => set(state => ({
                brackets: { ...state.brackets, ...settings },
            })),

            updateCursor: (settings) => set(state => ({
                cursor: { ...state.cursor, ...settings },
            })),

            updateSelection: (settings) => set(state => ({
                selection: { ...state.selection, ...settings },
            })),

            updateIndentation: (settings) => set(state => ({
                indentation: { ...state.indentation, ...settings },
            })),

            resetAll: () => set({
                minimap: DEFAULT_MINIMAP,
                folding: DEFAULT_FOLDING,
                brackets: DEFAULT_BRACKETS,
                cursor: DEFAULT_CURSOR,
                selection: DEFAULT_SELECTION,
                indentation: DEFAULT_INDENTATION,
            }),
        }),
        { name: 'sprintloop-advanced-editor' }
    )
);
