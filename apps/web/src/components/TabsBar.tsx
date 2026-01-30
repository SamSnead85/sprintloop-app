/**
 * Tabs Bar Component
 * 
 * Open files tabs with drag and drop support.
 */

import React, { useState } from 'react';

interface TabsBarProps {
    tabs: EditorTab[];
    activeTabId: string | null;
    onTabClick: (tabId: string) => void;
    onTabClose: (tabId: string) => void;
    onTabsReorder?: (fromIndex: number, toIndex: number) => void;
    className?: string;
}

export interface EditorTab {
    id: string;
    filePath: string;
    fileName: string;
    isDirty: boolean;
    isPinned?: boolean;
    isPreview?: boolean;
}

export const TabsBar: React.FC<TabsBarProps> = ({
    tabs,
    activeTabId,
    onTabClick,
    onTabClose,
    onTabsReorder,
    className,
}) => {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        setDragOverIndex(index);
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) {
            onTabsReorder?.(dragIndex, index);
        }
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
        setDragOverIndex(null);
    };

    if (tabs.length === 0) {
        return null;
    }

    return (
        <div className={`tabs-bar ${className || ''}`}>
            <div className="tabs-bar__scroll">
                {tabs.map((tab, index) => (
                    <div
                        key={tab.id}
                        className={`tab ${activeTabId === tab.id ? 'tab--active' : ''} ${tab.isDirty ? 'tab--dirty' : ''} ${tab.isPreview ? 'tab--preview' : ''} ${dragOverIndex === index ? 'tab--drag-over' : ''}`}
                        onClick={() => onTabClick(tab.id)}
                        draggable
                        onDragStart={e => handleDragStart(e, index)}
                        onDragOver={e => handleDragOver(e, index)}
                        onDrop={e => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                    >
                        <span className="tab__icon">{getFileIcon(tab.fileName)}</span>
                        <span className={`tab__name ${tab.isPreview ? 'tab__name--italic' : ''}`}>
                            {tab.fileName}
                        </span>
                        <button
                            className={`tab__close ${tab.isDirty ? 'tab__close--dirty' : ''}`}
                            onClick={e => {
                                e.stopPropagation();
                                onTabClose(tab.id);
                            }}
                        >
                            {tab.isDirty ? '●' : '×'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

function getFileIcon(fileName: string): string {
    const ext = fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
    const icons: Record<string, string> = {
        '.ts': '🔷',
        '.tsx': '⚛️',
        '.js': '🟨',
        '.jsx': '⚛️',
        '.json': '📋',
        '.md': '📝',
        '.css': '🎨',
        '.scss': '🎨',
        '.html': '🌐',
        '.py': '🐍',
        '.rs': '🦀',
        '.go': '🐹',
    };
    return icons[ext] || '📄';
}

export default TabsBar;
