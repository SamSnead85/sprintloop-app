/**
 * Search Panel Component
 * 
 * Workspace-wide search with replace functionality.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    useSearchPanel,
    SearchResult,
    SearchMatch,
    highlightMatches
} from '../lib/search/search-panel';

interface SearchPanelComponentProps {
    className?: string;
    onOpenFile?: (path: string, line: number, column: number) => void;
}

export const SearchPanelComponent: React.FC<SearchPanelComponentProps> = ({
    className,
    onOpenFile,
}) => {
    const {
        query,
        replacement,
        options,
        results,
        totalMatches,
        isSearching,
        currentMatchIndex,
        setQuery,
        setReplacement,
        search,
        clearSearch,
        toggleOption,
        updateOptions,
        goToNextMatch,
        goToPreviousMatch,
        replaceMatch,
        replaceAll,
        toggleResultCollapse,
        collapseAll,
        expandAll,
    } = useSearchPanel();

    const [showReplace, setShowReplace] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Focus search input on mount
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Debounced search
    const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);

        // Debounce search
        const timeout = setTimeout(() => {
            if (value.length >= 2) {
                search(value);
            } else if (value.length === 0) {
                clearSearch();
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [setQuery, search, clearSearch]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                goToPreviousMatch();
            } else {
                if (query.length >= 2) {
                    search();
                }
            }
        } else if (e.key === 'Escape') {
            clearSearch();
        }
    };

    return (
        <div className={`search-panel ${className || ''}`}>
            {/* Search Header */}
            <div className="search-panel__header">
                {/* Search Input */}
                <div className="search-panel__input-row">
                    <div className="search-panel__input-wrap">
                        <input
                            ref={searchInputRef}
                            type="text"
                            className="search-panel__input"
                            placeholder="Search"
                            value={query}
                            onChange={handleQueryChange}
                            onKeyDown={handleKeyDown}
                        />
                        <div className="search-panel__input-actions">
                            <OptionButton
                                title="Match Case"
                                active={options.isCaseSensitive}
                                onClick={() => toggleOption('isCaseSensitive')}
                            >
                                Aa
                            </OptionButton>
                            <OptionButton
                                title="Match Whole Word"
                                active={options.isWholeWord}
                                onClick={() => toggleOption('isWholeWord')}
                            >
                                Ab
                            </OptionButton>
                            <OptionButton
                                title="Use Regular Expression"
                                active={options.isRegex}
                                onClick={() => toggleOption('isRegex')}
                            >
                                .*
                            </OptionButton>
                        </div>
                    </div>
                    <button
                        className="search-panel__toggle"
                        onClick={() => setShowReplace(!showReplace)}
                        title="Toggle Replace"
                    >
                        {showReplace ? '▼' : '▶'}
                    </button>
                </div>

                {/* Replace Input */}
                {showReplace && (
                    <div className="search-panel__input-row">
                        <div className="search-panel__input-wrap">
                            <input
                                type="text"
                                className="search-panel__input"
                                placeholder="Replace"
                                value={replacement}
                                onChange={(e) => setReplacement(e.target.value)}
                            />
                            <div className="search-panel__input-actions">
                                <button
                                    className="search-panel__replace-btn"
                                    onClick={replaceMatch}
                                    disabled={!replacement || totalMatches === 0}
                                    title="Replace"
                                >
                                    ⟳
                                </button>
                                <button
                                    className="search-panel__replace-btn"
                                    onClick={replaceAll}
                                    disabled={!replacement || totalMatches === 0}
                                    title="Replace All"
                                >
                                    ⟳⟳
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Toggle */}
                <button
                    className="search-panel__filter-toggle"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? '▼' : '▶'} files to include/exclude
                </button>

                {/* Filters */}
                {showFilters && (
                    <div className="search-panel__filters">
                        <input
                            type="text"
                            className="search-panel__filter-input"
                            placeholder="files to include (e.g. *.ts, src/)"
                            value={options.includePattern}
                            onChange={(e) => updateOptions({ includePattern: e.target.value })}
                        />
                        <input
                            type="text"
                            className="search-panel__filter-input"
                            placeholder="files to exclude"
                            value={options.excludePattern}
                            onChange={(e) => updateOptions({ excludePattern: e.target.value })}
                        />
                    </div>
                )}
            </div>

            {/* Results Header */}
            {query && (
                <div className="search-panel__results-header">
                    <span>
                        {isSearching ? 'Searching...' :
                            `${totalMatches} result${totalMatches !== 1 ? 's' : ''} in ${results.length} file${results.length !== 1 ? 's' : ''}`}
                    </span>
                    <div className="search-panel__results-actions">
                        <button onClick={collapseAll} title="Collapse All">⊟</button>
                        <button onClick={expandAll} title="Expand All">⊞</button>
                        <button onClick={clearSearch} title="Clear">✕</button>
                    </div>
                </div>
            )}

            {/* Navigation */}
            {totalMatches > 0 && (
                <div className="search-panel__nav">
                    <button onClick={goToPreviousMatch} title="Previous Match (Shift+Enter)">↑</button>
                    <span>{currentMatchIndex + 1} of {totalMatches}</span>
                    <button onClick={goToNextMatch} title="Next Match (Enter)">↓</button>
                </div>
            )}

            {/* Results */}
            <div className="search-panel__results">
                {results.map((result) => (
                    <SearchResultItem
                        key={result.filePath}
                        result={result}
                        query={query}
                        options={options}
                        onToggle={() => toggleResultCollapse(result.filePath)}
                        onMatchClick={(match) => onOpenFile?.(match.filePath, match.line, match.column)}
                    />
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const OptionButton: React.FC<{
    title: string;
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ title, active, onClick, children }) => (
    <button
        className={`search-panel__option ${active ? 'search-panel__option--active' : ''}`}
        title={title}
        onClick={onClick}
    >
        {children}
    </button>
);

interface SearchResultItemProps {
    result: SearchResult;
    query: string;
    options: { isRegex: boolean; isCaseSensitive: boolean; isWholeWord: boolean };
    onToggle: () => void;
    onMatchClick: (match: SearchMatch) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
    result,
    query,
    options,
    onToggle,
    onMatchClick,
}) => {
    const fileName = result.filePath.split('/').pop() || result.filePath;
    const directory = result.filePath.includes('/')
        ? result.filePath.substring(0, result.filePath.lastIndexOf('/'))
        : '';

    return (
        <div className="search-panel__result">
            <button className="search-panel__result-header" onClick={onToggle}>
                <span className="search-panel__result-toggle">
                    {result.collapsed ? '▶' : '▼'}
                </span>
                <span className="search-panel__result-icon">📄</span>
                <span className="search-panel__result-name">{fileName}</span>
                <span className="search-panel__result-path">{directory}</span>
                <span className="search-panel__result-count">{result.matches.length}</span>
            </button>

            {!result.collapsed && (
                <div className="search-panel__matches">
                    {result.matches.map((match, idx) => (
                        <button
                            key={`${match.line}-${match.column}-${idx}`}
                            className="search-panel__match"
                            onClick={() => onMatchClick(match)}
                        >
                            <span className="search-panel__match-line">{match.line}</span>
                            <span className="search-panel__match-preview">
                                <HighlightedText
                                    text={match.preview}
                                    query={query}
                                    options={options}
                                />
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const HighlightedText: React.FC<{
    text: string;
    query: string;
    options: { isRegex: boolean; isCaseSensitive: boolean; isWholeWord: boolean };
}> = ({ text, query, options }) => {
    const parts = highlightMatches(text, query, options);

    return (
        <>
            {parts.map((part, i) =>
                part.isMatch ? (
                    <mark key={i} className="search-panel__highlight">{part.text}</mark>
                ) : (
                    <span key={i}>{part.text}</span>
                )
            )}
        </>
    );
};

export default SearchPanelComponent;
