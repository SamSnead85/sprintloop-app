/**
 * Editor Tabs Component
 * 
 * Tab bar for multi-file editing with drag-and-drop, context menu, and dirty indicators.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Circle, Pin, MoreHorizontal } from 'lucide-react';
import { useFileTabsService, type FileTab } from '../lib/editor/file-tabs-service';

interface EditorTabsProps {
    className?: string;
}

export function EditorTabs({ className = '' }: EditorTabsProps) {
    const {
        tabs,
        activeTabId,
        setActiveTab,
        closeTab,
        closeOtherTabs,
        closeTabsToTheRight,
        closeSavedTabs,
        closeAllTabs,
        pinTab,
        unpinTab,
        moveTab,
    } = useFileTabsService();

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(null);
    const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
    const tabsRef = useRef<HTMLDivElement>(null);

    const handleTabClick = useCallback((tabId: string) => {
        setActiveTab(tabId);
    }, [setActiveTab]);

    const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        closeTab(tabId);
    }, [closeTab]);

    const handleContextMenu = useCallback((e: React.MouseEvent, tabId: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, tabId });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Drag and drop handlers
    const handleDragStart = useCallback((e: React.DragEvent, tab: FileTab) => {
        setDraggedTabId(tab.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', tab.id);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
        e.preventDefault();
        if (!draggedTabId) return;

        const sourceIndex = tabs.findIndex(t => t.id === draggedTabId);
        if (sourceIndex !== -1 && sourceIndex !== targetIndex) {
            moveTab(sourceIndex, targetIndex);
        }
        setDraggedTabId(null);
    }, [draggedTabId, tabs, moveTab]);

    const handleDragEnd = useCallback(() => {
        setDraggedTabId(null);
    }, []);

    // Close context menu on click outside
    useEffect(() => {
        const handleClickOutside = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [contextMenu]);

    if (tabs.length === 0) {
        return (
            <div className={`editor-tabs-empty ${className}`}>
                <span className="text-gray-500 text-sm">No open files</span>
            </div>
        );
    }

    return (
        <>
            <div
                ref={tabsRef}
                className={`editor-tabs ${className}`}
                role="tablist"
            >
                {tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        className={`editor-tab ${activeTabId === tab.id ? 'active' : ''} ${tab.isPinned ? 'pinned' : ''} ${tab.isPreview ? 'preview' : ''} ${draggedTabId === tab.id ? 'dragging' : ''}`}
                        role="tab"
                        aria-selected={activeTabId === tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        onContextMenu={(e) => handleContextMenu(e, tab.id)}
                        draggable={!tab.isPinned}
                        onDragStart={(e) => handleDragStart(e, tab)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                    >
                        {/* File Icon */}
                        <span className="editor-tab-icon">{tab.icon}</span>

                        {/* File Name */}
                        <span className={`editor-tab-name ${tab.isPreview ? 'italic' : ''}`}>
                            {tab.name}
                        </span>

                        {/* Pin indicator */}
                        {tab.isPinned && (
                            <Pin className="editor-tab-pin" size={12} />
                        )}

                        {/* Dirty indicator or close button */}
                        <button
                            className="editor-tab-close"
                            onClick={(e) => handleTabClose(e, tab.id)}
                            title={tab.isDirty ? 'Unsaved changes' : 'Close'}
                        >
                            {tab.isDirty ? (
                                <Circle className="dirty-indicator" size={8} fill="currentColor" />
                            ) : (
                                <X size={14} />
                            )}
                        </button>
                    </div>
                ))}

                {/* More tabs dropdown (if needed) */}
                {tabs.length > 10 && (
                    <button className="editor-tabs-more" title="More tabs">
                        <MoreHorizontal size={16} />
                    </button>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <TabContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    tabId={contextMenu.tabId}
                    tab={tabs.find(t => t.id === contextMenu.tabId)}
                    onClose={handleCloseContextMenu}
                    onCloseTab={closeTab}
                    onCloseOthers={closeOtherTabs}
                    onCloseRight={closeTabsToTheRight}
                    onCloseSaved={closeSavedTabs}
                    onCloseAll={closeAllTabs}
                    onPin={pinTab}
                    onUnpin={unpinTab}
                />
            )}
        </>
    );
}

// =============================================================================
// CONTEXT MENU
// =============================================================================

interface TabContextMenuProps {
    x: number;
    y: number;
    tabId: string;
    tab?: FileTab;
    onClose: () => void;
    onCloseTab: (id: string) => void;
    onCloseOthers: (id: string) => void;
    onCloseRight: (id: string) => void;
    onCloseSaved: () => void;
    onCloseAll: () => void;
    onPin: (id: string) => void;
    onUnpin: (id: string) => void;
}

function TabContextMenu({
    x,
    y,
    tabId,
    tab,
    onClose,
    onCloseTab,
    onCloseOthers,
    onCloseRight,
    onCloseSaved,
    onCloseAll,
    onPin,
    onUnpin,
}: TabContextMenuProps) {
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div
            className="tab-context-menu"
            style={{ left: x, top: y }}
            onClick={(e) => e.stopPropagation()}
        >
            <button onClick={() => handleAction(() => onCloseTab(tabId))}>
                Close
            </button>
            <button onClick={() => handleAction(() => onCloseOthers(tabId))}>
                Close Others
            </button>
            <button onClick={() => handleAction(() => onCloseRight(tabId))}>
                Close to the Right
            </button>
            <button onClick={() => handleAction(onCloseSaved)}>
                Close Saved
            </button>
            <button onClick={() => handleAction(onCloseAll)}>
                Close All
            </button>
            <div className="context-menu-separator" />
            {tab?.isPinned ? (
                <button onClick={() => handleAction(() => onUnpin(tabId))}>
                    Unpin Tab
                </button>
            ) : (
                <button onClick={() => handleAction(() => onPin(tabId))}>
                    Pin Tab
                </button>
            )}
            <div className="context-menu-separator" />
            <button onClick={() => {
                navigator.clipboard.writeText(tab?.path || '');
                onClose();
            }}>
                Copy Path
            </button>
            <button onClick={() => {
                navigator.clipboard.writeText(tab?.name || '');
                onClose();
            }}>
                Copy Filename
            </button>
        </div>
    );
}

export default EditorTabs;
