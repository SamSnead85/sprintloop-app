/**
 * Quick Input Dialog
 * 
 * VS Code-style quick input for prompts and selections.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface QuickInputItem {
    label: string;
    description?: string;
    detail?: string;
    icon?: string;
    value: string;
    alwaysShow?: boolean;
}

export interface QuickInputOptions {
    title?: string;
    placeholder?: string;
    value?: string;
    items?: QuickInputItem[];
    canSelectMany?: boolean;
    matchOnDescription?: boolean;
    matchOnDetail?: boolean;
    ignoreFocusOut?: boolean;
}

export interface QuickInputState {
    isOpen: boolean;
    options: QuickInputOptions;
    query: string;
    selectedIndex: number;
    selectedItems: Set<string>;
    resolve: ((value: string | string[] | null) => void) | null;

    // Actions
    showInput: (options?: QuickInputOptions) => Promise<string | null>;
    showPicker: (items: QuickInputItem[], options?: Omit<QuickInputOptions, 'items'>) => Promise<string | null>;
    showMultiPicker: (items: QuickInputItem[], options?: Omit<QuickInputOptions, 'items'>) => Promise<string[]>;

    setQuery: (query: string) => void;
    selectNext: () => void;
    selectPrevious: () => void;
    toggleSelection: (value: string) => void;
    confirm: () => void;
    cancel: () => void;
    getFilteredItems: () => QuickInputItem[];
}

// =============================================================================
// QUICK INPUT STORE
// =============================================================================

export const useQuickInput = create<QuickInputState>((set, get) => ({
    isOpen: false,
    options: {},
    query: '',
    selectedIndex: 0,
    selectedItems: new Set(),
    resolve: null,

    showInput: (options = {}) => {
        return new Promise<string | null>((resolve) => {
            set({
                isOpen: true,
                options,
                query: options.value || '',
                selectedIndex: 0,
                selectedItems: new Set(),
                resolve: (value) => resolve(value as string | null),
            });
        });
    },

    showPicker: (items, options = {}) => {
        return new Promise<string | null>((resolve) => {
            set({
                isOpen: true,
                options: { ...options, items, canSelectMany: false },
                query: '',
                selectedIndex: 0,
                selectedItems: new Set(),
                resolve: (value) => resolve(value as string | null),
            });
        });
    },

    showMultiPicker: (items, options = {}) => {
        return new Promise<string[]>((resolve) => {
            set({
                isOpen: true,
                options: { ...options, items, canSelectMany: true },
                query: '',
                selectedIndex: 0,
                selectedItems: new Set(),
                resolve: (value) => resolve((value as string[]) || []),
            });
        });
    },

    setQuery: (query) => {
        set({ query, selectedIndex: 0 });
    },

    selectNext: () => {
        const items = get().getFilteredItems();
        set(state => ({
            selectedIndex: (state.selectedIndex + 1) % items.length,
        }));
    },

    selectPrevious: () => {
        const items = get().getFilteredItems();
        set(state => ({
            selectedIndex: (state.selectedIndex - 1 + items.length) % items.length,
        }));
    },

    toggleSelection: (value) => {
        set(state => {
            const selectedItems = new Set(state.selectedItems);
            if (selectedItems.has(value)) {
                selectedItems.delete(value);
            } else {
                selectedItems.add(value);
            }
            return { selectedItems };
        });
    },

    confirm: () => {
        const { options, query, selectedIndex, selectedItems, resolve } = get();

        if (!resolve) return;

        if (options.items) {
            // Picker mode
            if (options.canSelectMany) {
                resolve(Array.from(selectedItems));
            } else {
                const items = get().getFilteredItems();
                const selected = items[selectedIndex];
                resolve(selected?.value || null);
            }
        } else {
            // Input mode
            resolve(query || null);
        }

        set({ isOpen: false, resolve: null });
    },

    cancel: () => {
        const { resolve } = get();
        if (resolve) {
            resolve(null);
        }
        set({ isOpen: false, resolve: null });
    },

    getFilteredItems: () => {
        const { options, query } = get();
        if (!options.items) return [];

        const lowerQuery = query.toLowerCase();

        return options.items.filter(item => {
            if (item.alwaysShow) return true;
            if (!query) return true;

            const matchLabel = item.label.toLowerCase().includes(lowerQuery);
            const matchDescription = options.matchOnDescription &&
                item.description?.toLowerCase().includes(lowerQuery);
            const matchDetail = options.matchOnDetail &&
                item.detail?.toLowerCase().includes(lowerQuery);

            return matchLabel || matchDescription || matchDetail;
        });
    },
}));
