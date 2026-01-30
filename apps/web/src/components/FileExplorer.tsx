/**
 * File Explorer Component
 * 
 * Tree view for project files with context menus.
 */

import React, { useState, useCallback } from 'react';
import { useFileSystem, type FileTreeNode } from '../lib/filesystem/file-system';

interface FileExplorerProps {
    className?: string;
    onOpenFile?: (path: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ className, onOpenFile }) => {
    const {
        rootPath,
        tree,
        isLoading,
        toggleExpand,
        openFile,
        setRootPath,
        createFile,
        createDirectory,
        deleteItem,
        renameItem,
    } = useFileSystem();

    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        node: FileTreeNode;
    } | null>(null);

    const [renaming, setRenaming] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    const handleNodeClick = useCallback((node: FileTreeNode) => {
        if (node.type === 'directory') {
            toggleExpand(node.path);
        } else {
            openFile(node.path);
            onOpenFile?.(node.path);
        }
    }, [toggleExpand, openFile, onOpenFile]);

    const handleContextMenu = useCallback((e: React.MouseEvent, node: FileTreeNode) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.clientX, y: e.clientY, node });
    }, []);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleNewFile = useCallback(async () => {
        if (!contextMenu) return;
        const basePath = contextMenu.node.type === 'directory'
            ? contextMenu.node.path
            : contextMenu.node.path.slice(0, contextMenu.node.path.lastIndexOf('/'));

        const name = prompt('File name:');
        if (name) {
            await createFile(`${basePath}/${name}`);
        }
        closeContextMenu();
    }, [contextMenu, createFile, closeContextMenu]);

    const handleNewFolder = useCallback(async () => {
        if (!contextMenu) return;
        const basePath = contextMenu.node.type === 'directory'
            ? contextMenu.node.path
            : contextMenu.node.path.slice(0, contextMenu.node.path.lastIndexOf('/'));

        const name = prompt('Folder name:');
        if (name) {
            await createDirectory(`${basePath}/${name}`);
        }
        closeContextMenu();
    }, [contextMenu, createDirectory, closeContextMenu]);

    const handleDelete = useCallback(async () => {
        if (!contextMenu) return;
        if (confirm(`Delete "${contextMenu.node.name}"?`)) {
            await deleteItem(contextMenu.node.path);
        }
        closeContextMenu();
    }, [contextMenu, deleteItem, closeContextMenu]);

    const handleRename = useCallback(() => {
        if (!contextMenu) return;
        setRenaming(contextMenu.node.path);
        setRenameValue(contextMenu.node.name);
        closeContextMenu();
    }, [contextMenu, closeContextMenu]);

    const handleRenameSubmit = useCallback(async (oldPath: string) => {
        const dir = oldPath.slice(0, oldPath.lastIndexOf('/'));
        const newPath = `${dir}/${renameValue}`;
        await renameItem(oldPath, newPath);
        setRenaming(null);
        setRenameValue('');
    }, [renameValue, renameItem]);

    if (!rootPath) {
        return (
            <div className={`file-explorer file-explorer--empty ${className || ''}`}>
                <div className="file-explorer__placeholder">
                    <span className="file-explorer__icon">📁</span>
                    <p>No folder open</p>
                    <button
                        className="file-explorer__open-btn"
                        onClick={() => {
                            const path = prompt('Enter project path:');
                            if (path) setRootPath(path);
                        }}
                    >
                        Open Folder
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`file-explorer ${className || ''}`} onClick={closeContextMenu}>
            <div className="file-explorer__header">
                <span className="file-explorer__title">EXPLORER</span>
                <div className="file-explorer__actions">
                    <button title="New File" onClick={() => {
                        const name = prompt('File name:');
                        if (name) createFile(`${rootPath}/${name}`);
                    }}>📄</button>
                    <button title="New Folder" onClick={() => {
                        const name = prompt('Folder name:');
                        if (name) createDirectory(`${rootPath}/${name}`);
                    }}>📁</button>
                    <button title="Refresh" onClick={() => setRootPath(rootPath)}>🔄</button>
                </div>
            </div>

            {isLoading ? (
                <div className="file-explorer__loading">Loading...</div>
            ) : (
                <div className="file-explorer__tree">
                    {tree.map(node => (
                        <TreeNode
                            key={node.path}
                            node={node}
                            depth={0}
                            renaming={renaming}
                            renameValue={renameValue}
                            onRenameChange={setRenameValue}
                            onRenameSubmit={handleRenameSubmit}
                            onClick={handleNodeClick}
                            onContextMenu={handleContextMenu}
                        />
                    ))}
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="file-explorer__context-backdrop" onClick={closeContextMenu} />
                    <div
                        className="file-explorer__context-menu"
                        style={{ left: contextMenu.x, top: contextMenu.y }}
                    >
                        <button onClick={handleNewFile}>📄 New File</button>
                        <button onClick={handleNewFolder}>📁 New Folder</button>
                        <div className="file-explorer__context-divider" />
                        <button onClick={handleRename}>✏️ Rename</button>
                        <button onClick={handleDelete} className="file-explorer__context-danger">
                            🗑️ Delete
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

// =============================================================================
// TREE NODE COMPONENT
// =============================================================================

interface TreeNodeProps {
    node: FileTreeNode;
    depth: number;
    renaming: string | null;
    renameValue: string;
    onRenameChange: (value: string) => void;
    onRenameSubmit: (oldPath: string) => void;
    onClick: (node: FileTreeNode) => void;
    onContextMenu: (e: React.MouseEvent, node: FileTreeNode) => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
    node,
    depth,
    renaming,
    renameValue,
    onRenameChange,
    onRenameSubmit,
    onClick,
    onContextMenu,
}) => {
    const isRenaming = renaming === node.path;

    return (
        <div className="tree-node">
            <div
                className={`tree-node__row ${node.loading ? 'tree-node__row--loading' : ''}`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
                onClick={() => onClick(node)}
                onContextMenu={e => onContextMenu(e, node)}
            >
                {node.type === 'directory' && (
                    <span className="tree-node__chevron">
                        {node.expanded ? '▾' : '▸'}
                    </span>
                )}
                <span className="tree-node__icon">
                    {getFileIcon(node)}
                </span>
                {isRenaming ? (
                    <input
                        type="text"
                        className="tree-node__rename-input"
                        value={renameValue}
                        onChange={e => onRenameChange(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') onRenameSubmit(node.path);
                            if (e.key === 'Escape') onRenameChange('');
                        }}
                        onClick={e => e.stopPropagation()}
                        autoFocus
                    />
                ) : (
                    <span className="tree-node__name">{node.name}</span>
                )}
            </div>

            {node.type === 'directory' && node.expanded && node.children && (
                <div className="tree-node__children">
                    {node.children.map(child => (
                        <TreeNode
                            key={child.path}
                            node={child}
                            depth={depth + 1}
                            renaming={renaming}
                            renameValue={renameValue}
                            onRenameChange={onRenameChange}
                            onRenameSubmit={onRenameSubmit}
                            onClick={onClick}
                            onContextMenu={onContextMenu}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// FILE ICONS
// =============================================================================

function getFileIcon(node: FileTreeNode): string {
    if (node.type === 'directory') {
        return node.expanded ? '📂' : '📁';
    }

    const ext = node.name.slice(node.name.lastIndexOf('.')).toLowerCase();
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
        '.java': '☕',
        '.c': '©️',
        '.cpp': '➕',
        '.sql': '🗄️',
        '.yaml': '📄',
        '.yml': '📄',
        '.env': '🔐',
        '.gitignore': '🙈',
    };

    return icons[ext] || '📄';
}

export default FileExplorer;
