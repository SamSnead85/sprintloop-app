/**
 * Split Pane Layout
 * 
 * Phase 21: Split pane views with resizable panels
 * VS Code-style editor splits
 */

import { create } from 'zustand';

export type SplitDirection = 'horizontal' | 'vertical';

export interface PaneNode {
    id: string;
    type: 'pane' | 'split';
    // If type === 'pane'
    groupId?: string;
    // If type === 'split'
    direction?: SplitDirection;
    first?: PaneNode;
    second?: PaneNode;
    splitRatio?: number; // 0-100
}

interface SplitPaneState {
    root: PaneNode;
    focusedPaneId: string;

    // Actions
    split: (paneId: string, direction: SplitDirection) => void;
    closePane: (paneId: string) => void;
    setFocusedPane: (paneId: string) => void;
    setSplitRatio: (splitId: string, ratio: number) => void;
    resetLayout: () => void;
}

const DEFAULT_ROOT: PaneNode = {
    id: 'root-pane',
    type: 'pane',
    groupId: 'main',
};

export const useSplitPaneStore = create<SplitPaneState>((set, _get) => ({
    root: DEFAULT_ROOT,
    focusedPaneId: 'root-pane',

    split: (paneId, direction) => {
        const createSplit = (node: PaneNode): PaneNode => {
            if (node.id === paneId && node.type === 'pane') {
                const newPaneId = `pane-${Date.now()}`;
                return {
                    id: `split-${Date.now()}`,
                    type: 'split',
                    direction,
                    splitRatio: 50,
                    first: { ...node },
                    second: {
                        id: newPaneId,
                        type: 'pane',
                        groupId: `group-${Date.now()}`,
                    },
                };
            }

            if (node.type === 'split' && node.first && node.second) {
                return {
                    ...node,
                    first: createSplit(node.first),
                    second: createSplit(node.second),
                };
            }

            return node;
        };

        set((state) => ({ root: createSplit(state.root) }));
    },

    closePane: (paneId) => {
        const removePane = (node: PaneNode, _parent?: PaneNode, _isFirst?: boolean): PaneNode | null => {
            if (node.id === paneId) {
                return null;
            }

            if (node.type === 'split' && node.first && node.second) {
                const newFirst = removePane(node.first, node, true);
                const newSecond = removePane(node.second, node, false);

                // If one child was removed, replace split with remaining child
                if (newFirst === null) return newSecond;
                if (newSecond === null) return newFirst;

                return {
                    ...node,
                    first: newFirst,
                    second: newSecond,
                };
            }

            return node;
        };

        set((state) => {
            const newRoot = removePane(state.root);
            return { root: newRoot || DEFAULT_ROOT };
        });
    },

    setFocusedPane: (paneId) => {
        set({ focusedPaneId: paneId });
    },

    setSplitRatio: (splitId, ratio) => {
        const updateRatio = (node: PaneNode): PaneNode => {
            if (node.id === splitId && node.type === 'split') {
                return { ...node, splitRatio: Math.max(10, Math.min(90, ratio)) };
            }

            if (node.type === 'split' && node.first && node.second) {
                return {
                    ...node,
                    first: updateRatio(node.first),
                    second: updateRatio(node.second),
                };
            }

            return node;
        };

        set((state) => ({ root: updateRatio(state.root) }));
    },

    resetLayout: () => {
        set({ root: DEFAULT_ROOT, focusedPaneId: 'root-pane' });
    },
}));

/**
 * Get all pane IDs from the tree
 */
export function getAllPaneIds(node: PaneNode): string[] {
    if (node.type === 'pane') {
        return [node.id];
    }

    const ids: string[] = [];
    if (node.first) ids.push(...getAllPaneIds(node.first));
    if (node.second) ids.push(...getAllPaneIds(node.second));
    return ids;
}

/**
 * Find a pane by ID
 */
export function findPane(node: PaneNode, paneId: string): PaneNode | null {
    if (node.id === paneId) return node;

    if (node.type === 'split') {
        if (node.first) {
            const found = findPane(node.first, paneId);
            if (found) return found;
        }
        if (node.second) {
            const found = findPane(node.second, paneId);
            if (found) return found;
        }
    }

    return null;
}
