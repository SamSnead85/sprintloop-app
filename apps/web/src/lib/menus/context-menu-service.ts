/**
 * Context Menu Service
 * 
 * Centralized context menu management for IDE.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type MenuItemType = 'action' | 'separator' | 'submenu' | 'checkbox' | 'radio';

export interface MenuItem {
    id: string;
    type: MenuItemType;
    label?: string;
    icon?: string;
    shortcut?: string;
    disabled?: boolean;
    checked?: boolean;
    group?: string;
    action?: () => void;
    submenu?: MenuItem[];
}

export interface ContextMenuPosition {
    x: number;
    y: number;
}

export interface ContextMenuState {
    isOpen: boolean;
    position: ContextMenuPosition;
    items: MenuItem[];
    context: string;
    contextData?: unknown;

    // Menu operations
    open: (position: ContextMenuPosition, items: MenuItem[], context: string, data?: unknown) => void;
    close: () => void;
    executeItem: (itemId: string) => void;

    // Default menus
    getEditorContextMenu: (selection?: string) => MenuItem[];
    getFileExplorerContextMenu: (isFolder: boolean, path: string) => MenuItem[];
    getTabContextMenu: (tabId: string) => MenuItem[];
}

// =============================================================================
// CONTEXT MENU STORE
// =============================================================================

export const useContextMenuService = create<ContextMenuState>((set, get) => ({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
    context: '',
    contextData: undefined,

    open: (position, items, context, data) => {
        set({
            isOpen: true,
            position,
            items,
            context,
            contextData: data,
        });
    },

    close: () => {
        set({
            isOpen: false,
            items: [],
            context: '',
            contextData: undefined,
        });
    },

    executeItem: (itemId) => {
        const findAndExecute = (items: MenuItem[]): boolean => {
            for (const item of items) {
                if (item.id === itemId && item.action) {
                    item.action();
                    get().close();
                    return true;
                }
                if (item.submenu && findAndExecute(item.submenu)) {
                    return true;
                }
            }
            return false;
        };

        findAndExecute(get().items);
    },

    getEditorContextMenu: (selection) => {
        const items: MenuItem[] = [];

        // Cut/Copy/Paste
        items.push(
            { id: 'cut', type: 'action', label: 'Cut', shortcut: '⌘X', action: () => document.execCommand('cut') },
            { id: 'copy', type: 'action', label: 'Copy', shortcut: '⌘C', action: () => document.execCommand('copy') },
            { id: 'paste', type: 'action', label: 'Paste', shortcut: '⌘V', action: () => document.execCommand('paste') },
            { id: 'sep1', type: 'separator' },
        );

        // Selection commands
        if (selection) {
            items.push(
                { id: 'format-selection', type: 'action', label: 'Format Selection', shortcut: '⌘K ⌘F', action: () => console.log('Format selection') },
                { id: 'sep2', type: 'separator' },
            );
        }

        // Refactoring
        items.push({
            id: 'refactor',
            type: 'submenu',
            label: 'Refactor',
            submenu: [
                { id: 'rename', type: 'action', label: 'Rename Symbol', shortcut: 'F2', action: () => console.log('Rename') },
                { id: 'extract-variable', type: 'action', label: 'Extract Variable', action: () => console.log('Extract variable') },
                { id: 'extract-function', type: 'action', label: 'Extract Function', action: () => console.log('Extract function') },
                { id: 'extract-constant', type: 'action', label: 'Extract Constant', action: () => console.log('Extract constant') },
                { id: 'inline', type: 'action', label: 'Inline Variable', action: () => console.log('Inline') },
            ],
        });

        // Source Actions
        items.push({
            id: 'source',
            type: 'submenu',
            label: 'Source Action',
            submenu: [
                { id: 'organize-imports', type: 'action', label: 'Organize Imports', action: () => console.log('Organize imports') },
                { id: 'sort-imports', type: 'action', label: 'Sort Imports', action: () => console.log('Sort imports') },
                { id: 'remove-unused', type: 'action', label: 'Remove Unused Imports', action: () => console.log('Remove unused') },
                { id: 'sep-source', type: 'separator' },
                { id: 'generate-getter', type: 'action', label: 'Generate Getter/Setter', action: () => console.log('Generate getter') },
                { id: 'generate-constructor', type: 'action', label: 'Generate Constructor', action: () => console.log('Generate constructor') },
            ],
        });

        items.push({ id: 'sep3', type: 'separator' });

        // Go to commands
        items.push(
            { id: 'go-to-definition', type: 'action', label: 'Go to Definition', shortcut: 'F12', action: () => console.log('Go to definition') },
            { id: 'go-to-type', type: 'action', label: 'Go to Type Definition', action: () => console.log('Go to type') },
            { id: 'go-to-implementation', type: 'action', label: 'Go to Implementation', action: () => console.log('Go to implementation') },
            { id: 'find-references', type: 'action', label: 'Find All References', shortcut: '⇧F12', action: () => console.log('Find references') },
            { id: 'sep4', type: 'separator' },
        );

        // Peek
        items.push({
            id: 'peek',
            type: 'submenu',
            label: 'Peek',
            submenu: [
                { id: 'peek-definition', type: 'action', label: 'Peek Definition', shortcut: '⌥F12', action: () => console.log('Peek definition') },
                { id: 'peek-references', type: 'action', label: 'Peek References', action: () => console.log('Peek references') },
                { id: 'peek-type', type: 'action', label: 'Peek Type Definition', action: () => console.log('Peek type') },
            ],
        });

        items.push({ id: 'sep5', type: 'separator' });

        // Command Palette
        items.push(
            { id: 'command-palette', type: 'action', label: 'Command Palette...', shortcut: '⌘⇧P', action: () => console.log('Command palette') },
        );

        return items;
    },

    getFileExplorerContextMenu: (isFolder, path) => {
        const items: MenuItem[] = [];

        // New file/folder
        items.push(
            { id: 'new-file', type: 'action', label: 'New File', icon: '📄', action: () => console.log('New file in', path) },
            { id: 'new-folder', type: 'action', label: 'New Folder', icon: '📁', action: () => console.log('New folder in', path) },
            { id: 'sep1', type: 'separator' },
        );

        if (!isFolder) {
            items.push(
                { id: 'open', type: 'action', label: 'Open', action: () => console.log('Open', path) },
                { id: 'open-to-side', type: 'action', label: 'Open to the Side', action: () => console.log('Open to side', path) },
                { id: 'sep2', type: 'separator' },
            );
        }

        // Edit commands
        items.push(
            { id: 'cut', type: 'action', label: 'Cut', shortcut: '⌘X', action: () => console.log('Cut', path) },
            { id: 'copy', type: 'action', label: 'Copy', shortcut: '⌘C', action: () => console.log('Copy', path) },
            { id: 'paste', type: 'action', label: 'Paste', shortcut: '⌘V', action: () => console.log('Paste in', path) },
            { id: 'sep3', type: 'separator' },
        );

        // Path commands
        items.push(
            { id: 'copy-path', type: 'action', label: 'Copy Path', action: () => navigator.clipboard.writeText(path) },
            { id: 'copy-relative-path', type: 'action', label: 'Copy Relative Path', action: () => console.log('Copy relative', path) },
            { id: 'sep4', type: 'separator' },
        );

        // Rename/Delete
        items.push(
            { id: 'rename', type: 'action', label: 'Rename', shortcut: 'Enter', action: () => console.log('Rename', path) },
            { id: 'delete', type: 'action', label: 'Delete', shortcut: '⌘⌫', action: () => console.log('Delete', path) },
            { id: 'sep5', type: 'separator' },
        );

        // Reveal
        items.push(
            { id: 'reveal-in-finder', type: 'action', label: 'Reveal in Finder', action: () => console.log('Reveal', path) },
            { id: 'open-in-terminal', type: 'action', label: 'Open in Integrated Terminal', action: () => console.log('Open terminal', path) },
        );

        return items;
    },

    getTabContextMenu: (tabId) => {
        return [
            { id: 'close', type: 'action', label: 'Close', shortcut: '⌘W', action: () => console.log('Close tab', tabId) },
            { id: 'close-others', type: 'action', label: 'Close Others', action: () => console.log('Close others') },
            { id: 'close-right', type: 'action', label: 'Close to the Right', action: () => console.log('Close right') },
            { id: 'close-saved', type: 'action', label: 'Close Saved', action: () => console.log('Close saved') },
            { id: 'close-all', type: 'action', label: 'Close All', action: () => console.log('Close all') },
            { id: 'sep1', type: 'separator' },
            { id: 'pin', type: 'action', label: 'Pin Tab', action: () => console.log('Pin', tabId) },
            { id: 'sep2', type: 'separator' },
            { id: 'copy-path', type: 'action', label: 'Copy Path', action: () => console.log('Copy path', tabId) },
            { id: 'reveal', type: 'action', label: 'Reveal in Explorer', action: () => console.log('Reveal', tabId) },
        ];
    },
}));
