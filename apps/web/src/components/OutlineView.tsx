/**
 * Outline View Component
 * 
 * Document symbol tree with navigation and filtering.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSymbolOutline, DocumentSymbol, SymbolKind } from '../lib/symbols/symbol-outline';

interface OutlineViewProps {
    filePath: string;
    className?: string;
    onNavigate?: (line: number, column: number) => void;
}

export const OutlineView: React.FC<OutlineViewProps> = ({
    filePath,
    className,
    onNavigate,
}) => {
    const {
        getSymbols,
        expandedNodes,
        selectedSymbol,
        filter,
        sortBy,
        toggleExpanded,
        expandAll,
        collapseAll,
        setFilter,
        setSortBy,
        selectSymbol,
        getSymbolIcon,
        getSymbolColor,
        isLoading,
    } = useSymbolOutline();

    const [symbols, setSymbols] = useState<DocumentSymbol[]>([]);

    useEffect(() => {
        if (filePath) {
            getSymbols(filePath).then(setSymbols);
        }
    }, [filePath, getSymbols]);

    // Filter symbols
    const filteredSymbols = useMemo(() => {
        if (!filter) return symbols;

        const filterSymbols = (items: DocumentSymbol[]): DocumentSymbol[] => {
            return items.reduce<DocumentSymbol[]>((acc, symbol) => {
                const matches = symbol.name.toLowerCase().includes(filter.toLowerCase());
                const filteredChildren = filterSymbols(symbol.children);

                if (matches || filteredChildren.length > 0) {
                    acc.push({
                        ...symbol,
                        children: filteredChildren,
                    });
                }
                return acc;
            }, []);
        };

        return filterSymbols(symbols);
    }, [symbols, filter]);

    // Sort symbols
    const sortedSymbols = useMemo(() => {
        const sortFn = (a: DocumentSymbol, b: DocumentSymbol): number => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'kind':
                    return a.kind.localeCompare(b.kind);
                case 'position':
                default:
                    return a.range.startLine - b.range.startLine;
            }
        };

        const sortRecursive = (items: DocumentSymbol[]): DocumentSymbol[] => {
            return [...items]
                .sort(sortFn)
                .map(item => ({
                    ...item,
                    children: sortRecursive(item.children),
                }));
        };

        return sortRecursive(filteredSymbols);
    }, [filteredSymbols, sortBy]);

    const handleSymbolClick = (symbol: DocumentSymbol) => {
        selectSymbol(symbol.name);
        onNavigate?.(symbol.selectionRange.startLine, symbol.selectionRange.startColumn);
    };

    return (
        <div className={`outline-view ${className || ''}`}>
            {/* Header */}
            <div className="outline-view__header">
                <span className="outline-view__title">Outline</span>
                <div className="outline-view__actions">
                    <button
                        className="outline-view__action"
                        onClick={collapseAll}
                        title="Collapse All"
                    >
                        ⊟
                    </button>
                    <button
                        className="outline-view__action"
                        onClick={expandAll}
                        title="Expand All"
                    >
                        ⊞
                    </button>
                </div>
            </div>

            {/* Filter & Sort */}
            <div className="outline-view__toolbar">
                <input
                    type="text"
                    className="outline-view__filter"
                    placeholder="Filter symbols..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
                <select
                    className="outline-view__sort"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'position' | 'name' | 'kind')}
                >
                    <option value="position">By Position</option>
                    <option value="name">By Name</option>
                    <option value="kind">By Type</option>
                </select>
            </div>

            {/* Symbol Tree */}
            <div className="outline-view__content">
                {isLoading ? (
                    <div className="outline-view__loading">Loading symbols...</div>
                ) : sortedSymbols.length === 0 ? (
                    <div className="outline-view__empty">No symbols found</div>
                ) : (
                    <SymbolTree
                        symbols={sortedSymbols}
                        expandedNodes={expandedNodes}
                        selectedSymbol={selectedSymbol}
                        onToggle={toggleExpanded}
                        onSelect={handleSymbolClick}
                        getIcon={getSymbolIcon}
                        getColor={getSymbolColor}
                        prefix=""
                    />
                )}
            </div>
        </div>
    );
};

// =============================================================================
// SYMBOL TREE
// =============================================================================

interface SymbolTreeProps {
    symbols: DocumentSymbol[];
    expandedNodes: Set<string>;
    selectedSymbol: string | null;
    onToggle: (id: string) => void;
    onSelect: (symbol: DocumentSymbol) => void;
    getIcon: (kind: SymbolKind) => string;
    getColor: (kind: SymbolKind) => string;
    prefix: string;
}

const SymbolTree: React.FC<SymbolTreeProps> = ({
    symbols,
    expandedNodes,
    selectedSymbol,
    onToggle,
    onSelect,
    getIcon,
    getColor,
    prefix,
}) => {
    return (
        <>
            {symbols.map((symbol, index) => {
                const nodeId = `${prefix}${index}`;
                const isExpanded = expandedNodes.has(nodeId);
                const hasChildren = symbol.children.length > 0;
                const isSelected = selectedSymbol === symbol.name;

                return (
                    <React.Fragment key={nodeId}>
                        <div
                            className={`outline-view__item ${isSelected ? 'outline-view__item--selected' : ''}`}
                            style={{ paddingLeft: `${prefix.split('-').length * 12}px` }}
                            onClick={() => onSelect(symbol)}
                        >
                            {hasChildren ? (
                                <button
                                    className="outline-view__toggle"
                                    onClick={e => {
                                        e.stopPropagation();
                                        onToggle(nodeId);
                                    }}
                                >
                                    {isExpanded ? '▼' : '▶'}
                                </button>
                            ) : (
                                <span className="outline-view__toggle-spacer" />
                            )}
                            <span
                                className="outline-view__icon"
                                style={{ color: getColor(symbol.kind) }}
                            >
                                {getIcon(symbol.kind)}
                            </span>
                            <span className="outline-view__name">{symbol.name}</span>
                            {symbol.detail && (
                                <span className="outline-view__detail">{symbol.detail}</span>
                            )}
                            <span className="outline-view__line">:{symbol.range.startLine}</span>
                        </div>
                        {hasChildren && isExpanded && (
                            <SymbolTree
                                symbols={symbol.children}
                                expandedNodes={expandedNodes}
                                selectedSymbol={selectedSymbol}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                getIcon={getIcon}
                                getColor={getColor}
                                prefix={`${nodeId}-`}
                            />
                        )}
                    </React.Fragment>
                );
            })}
        </>
    );
};

export default OutlineView;
