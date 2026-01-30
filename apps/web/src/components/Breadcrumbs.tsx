/**
 * Breadcrumbs Component
 * 
 * File path navigation showing current location in file tree.
 */

import React from 'react';

interface BreadcrumbsProps {
    filePath?: string;
    symbols?: BreadcrumbSymbol[];
    className?: string;
    onNavigate?: (path: string) => void;
    onSymbolClick?: (symbol: BreadcrumbSymbol) => void;
}

export interface BreadcrumbSymbol {
    name: string;
    kind: 'file' | 'class' | 'function' | 'method' | 'property' | 'variable';
    range?: { startLine: number; endLine: number };
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
    filePath,
    symbols = [],
    className,
    onNavigate,
    onSymbolClick,
}) => {
    if (!filePath) return null;

    const segments = filePath.split('/').filter(Boolean);
    const fileName = segments.pop() || '';

    return (
        <div className={`breadcrumbs ${className || ''}`}>
            {/* Path segments */}
            {segments.map((segment, i) => {
                const path = '/' + segments.slice(0, i + 1).join('/');
                return (
                    <React.Fragment key={i}>
                        <button
                            className="breadcrumbs__segment"
                            onClick={() => onNavigate?.(path)}
                        >
                            {i === 0 ? '📁' : ''} {segment}
                        </button>
                        <span className="breadcrumbs__separator">/</span>
                    </React.Fragment>
                );
            })}

            {/* File name */}
            <span className="breadcrumbs__file">
                {getFileIcon(fileName)} {fileName}
            </span>

            {/* Symbol path */}
            {symbols.map((symbol, i) => (
                <React.Fragment key={i}>
                    <span className="breadcrumbs__separator">›</span>
                    <button
                        className="breadcrumbs__symbol"
                        onClick={() => onSymbolClick?.(symbol)}
                    >
                        {getSymbolIcon(symbol.kind)} {symbol.name}
                    </button>
                </React.Fragment>
            ))}
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
        '.html': '🌐',
        '.py': '🐍',
        '.rs': '🦀',
    };
    return icons[ext] || '📄';
}

function getSymbolIcon(kind: BreadcrumbSymbol['kind']): string {
    const icons: Record<BreadcrumbSymbol['kind'], string> = {
        file: '📄',
        class: '🔶',
        function: '🟣',
        method: '🔵',
        property: '🔹',
        variable: '📦',
    };
    return icons[kind];
}

export default Breadcrumbs;
