/**
 * Minimap Service
 * 
 * Document overview minimap with viewport tracking and navigation.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface MinimapRegion {
    type: 'highlight' | 'decoration' | 'selection' | 'search' | 'error' | 'warning' | 'diff-add' | 'diff-delete';
    startLine: number;
    endLine: number;
    color?: string;
}

export interface MinimapConfig {
    enabled: boolean;
    side: 'left' | 'right';
    scale: number; // 1-3
    showSlider: 'always' | 'mouseover';
    renderCharacters: boolean;
    maxColumn: number;
}

export interface MinimapState {
    config: MinimapConfig;
    viewportStart: number;
    viewportEnd: number;
    totalLines: number;
    regions: Map<string, MinimapRegion[]>;
    cursorLine: number;

    // Configuration
    updateConfig: (updates: Partial<MinimapConfig>) => void;

    // Viewport
    setViewport: (start: number, end: number, total: number) => void;
    setCursorLine: (line: number) => void;

    // Regions
    setRegions: (filePath: string, regions: MinimapRegion[]) => void;
    addRegion: (filePath: string, region: MinimapRegion) => void;
    clearRegions: (filePath?: string) => void;
    getRegions: (filePath: string) => MinimapRegion[];

    // Navigation
    scrollToLine: (line: number) => void;
    scrollToPercentage: (percentage: number) => void;

    // Rendering
    getMinimapData: (filePath: string, content: string) => MinimapRenderData;
}

export interface MinimapRenderData {
    lines: MinimapLine[];
    viewportStart: number;
    viewportEnd: number;
    height: number;
    regions: MinimapRegion[];
}

export interface MinimapLine {
    lineNumber: number;
    tokens: MinimapToken[];
}

export interface MinimapToken {
    column: number;
    length: number;
    type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'identifier' | 'whitespace';
}

// =============================================================================
// MINIMAP STORE
// =============================================================================

export const useMinimapService = create<MinimapState>((set, get) => ({
    config: {
        enabled: true,
        side: 'right',
        scale: 1,
        showSlider: 'mouseover',
        renderCharacters: true,
        maxColumn: 120,
    },
    viewportStart: 1,
    viewportEnd: 50,
    totalLines: 100,
    regions: new Map(),
    cursorLine: 1,

    updateConfig: (updates) => {
        set(state => ({
            config: { ...state.config, ...updates },
        }));
    },

    setViewport: (start, end, total) => {
        set({ viewportStart: start, viewportEnd: end, totalLines: total });
    },

    setCursorLine: (line) => {
        set({ cursorLine: line });
    },

    setRegions: (filePath, regions) => {
        set(state => {
            const newRegions = new Map(state.regions);
            newRegions.set(filePath, regions);
            return { regions: newRegions };
        });
    },

    addRegion: (filePath, region) => {
        set(state => {
            const newRegions = new Map(state.regions);
            const existing = newRegions.get(filePath) || [];
            newRegions.set(filePath, [...existing, region]);
            return { regions: newRegions };
        });
    },

    clearRegions: (filePath) => {
        set(state => {
            const newRegions = new Map(state.regions);
            if (filePath) {
                newRegions.delete(filePath);
            } else {
                newRegions.clear();
            }
            return { regions: newRegions };
        });
    },

    getRegions: (filePath) => {
        return get().regions.get(filePath) || [];
    },

    scrollToLine: (line) => {
        // In real implementation, dispatch to editor
        console.log('[Minimap] Scroll to line:', line);
    },

    scrollToPercentage: (percentage) => {
        const { totalLines } = get();
        const line = Math.round(totalLines * percentage);
        get().scrollToLine(line);
    },

    getMinimapData: (filePath, content) => {
        const { viewportStart, viewportEnd, config } = get();
        const lines = content.split('\n');
        const regions = get().getRegions(filePath);

        const minimapLines: MinimapLine[] = lines.slice(0, 500).map((line, index) => ({
            lineNumber: index + 1,
            tokens: tokenizeLine(line, config.maxColumn),
        }));

        return {
            lines: minimapLines,
            viewportStart,
            viewportEnd,
            height: Math.min(lines.length * 2, 400),
            regions,
        };
    },
}));

// =============================================================================
// TOKENIZER
// =============================================================================

function tokenizeLine(line: string, maxColumn: number): MinimapToken[] {
    const tokens: MinimapToken[] = [];
    const truncated = line.slice(0, maxColumn);

    // Simple tokenization for minimap rendering
    let i = 0;
    while (i < truncated.length) {
        const char = truncated[i];

        // Whitespace
        if (/\s/.test(char)) {
            let length = 1;
            while (i + length < truncated.length && /\s/.test(truncated[i + length])) {
                length++;
            }
            tokens.push({ column: i, length, type: 'whitespace' });
            i += length;
            continue;
        }

        // String
        if (char === '"' || char === "'" || char === '`') {
            let length = 1;
            const quote = char;
            while (i + length < truncated.length && truncated[i + length] !== quote) {
                if (truncated[i + length] === '\\') length++;
                length++;
            }
            if (i + length < truncated.length) length++;
            tokens.push({ column: i, length, type: 'string' });
            i += length;
            continue;
        }

        // Comment
        if (truncated.slice(i, i + 2) === '//') {
            tokens.push({ column: i, length: truncated.length - i, type: 'comment' });
            break;
        }

        // Number
        if (/\d/.test(char)) {
            let length = 1;
            while (i + length < truncated.length && /[\d.xXa-fA-F]/.test(truncated[i + length])) {
                length++;
            }
            tokens.push({ column: i, length, type: 'number' });
            i += length;
            continue;
        }

        // Keyword or identifier
        if (/[a-zA-Z_$]/.test(char)) {
            let length = 1;
            while (i + length < truncated.length && /[a-zA-Z0-9_$]/.test(truncated[i + length])) {
                length++;
            }
            const word = truncated.slice(i, i + length);
            const isKeyword = KEYWORDS.has(word);
            tokens.push({ column: i, length, type: isKeyword ? 'keyword' : 'identifier' });
            i += length;
            continue;
        }

        // Operator
        tokens.push({ column: i, length: 1, type: 'operator' });
        i++;
    }

    return tokens;
}

const KEYWORDS = new Set([
    'const', 'let', 'var', 'function', 'class', 'interface', 'type',
    'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
    'break', 'continue', 'return', 'throw', 'try', 'catch', 'finally',
    'import', 'export', 'from', 'as', 'async', 'await', 'new', 'this',
    'true', 'false', 'null', 'undefined', 'typeof', 'instanceof',
    'public', 'private', 'protected', 'static', 'readonly', 'extends', 'implements',
]);

// =============================================================================
// HELPERS
// =============================================================================

export function calculateMinimapHeight(
    containerHeight: number,
    totalLines: number,
    scale: number
): { minimapHeight: number; lineHeight: number } {
    const baseLineHeight = 2 * scale;
    const minimapHeight = Math.min(containerHeight, totalLines * baseLineHeight);
    return { minimapHeight, lineHeight: baseLineHeight };
}

export function getSliderPosition(
    viewportStart: number,
    viewportEnd: number,
    totalLines: number,
    minimapHeight: number
): { top: number; height: number } {
    const visibleLines = viewportEnd - viewportStart;
    const percentage = viewportStart / totalLines;
    const heightPercentage = visibleLines / totalLines;

    return {
        top: percentage * minimapHeight,
        height: Math.max(20, heightPercentage * minimapHeight),
    };
}
