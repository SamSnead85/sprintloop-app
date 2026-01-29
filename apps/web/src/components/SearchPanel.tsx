/**
 * Search Panel Component
 * 
 * Global search and replace UI.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearch, type SearchResult, type SearchMatch } from '../lib/search/search-service';

interface SearchPanelProps {
    className?: string;
    onOpenFile?: (path: string, line: number) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ className, onOpenFile }) => {
    const {
        query,
        replaceText,
        options,
        results,
        totalMatches,
        isSearching,
        selectedMatch,
        setQuery,
        setReplaceText,
        setOptions,
        search,
        replaceMatch,
        replaceAll,
        replaceInFile,
        toggleCollapse,
        selectMatch,
        clearResults,
    } = useSearch();

    const [showReplace, setShowReplace] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            search();
        }
    };

    const handleMatchClick = (match: SearchMatch) => {
        selectMatch(match.filePath, match.line);
        onOpenFile?.(match.filePath, match.line);
    };

    return (
        <div className={`search-panel ${className || ''}`}>
            {/* Search Input */}
            <div className="search-panel__input-group">
                <div className="search-panel__row">
                    <button
                        className="search-panel__toggle"
                        onClick={() => setShowReplace(!showReplace)}
                        title={showReplace ? 'Hide replace' : 'Show replace'}
                    >
                        {showReplace ? '▾' : '▸'}
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-panel__input"
                        placeholder="Search..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="search-panel__options">
                        <button
                            className={`search-panel__option ${options.caseSensitive ? 'active' : ''}`}
                            onClick={() => setOptions({ caseSensitive: !options.caseSensitive })}
                            title="Match Case"
                        >
                            Aa
                        </button>
                        <button
                            className={`search-panel__option ${options.wholeWord ? 'active' : ''}`}
                            onClick={() => setOptions({ wholeWord: !options.wholeWord })}
                            title="Whole Word"
                        >
                            ab
                        </button>
                        <button
                            className={`search-panel__option ${options.useRegex ? 'active' : ''}`}
                            onClick={() => setOptions({ useRegex: !options.useRegex })}
                            title="Use Regex"
                        >
                            .*
                        </button>
                    </div>
                </div>

                {showReplace && (
                    <div className="search-panel__row">
                        <div className="search-panel__spacer" />
                        <input
                            type="text"
                            className="search-panel__input"
                            placeholder="Replace..."
                            value={replaceText}
                            onChange={e => setReplaceText(e.target.value)}
                        />
                        <div className="search-panel__replace-actions">
                            <button
                                className="search-panel__btn"
                                onClick={replaceAll}
                                disabled={totalMatches === 0}
                                title="Replace All"
                            >
                                ⟳ All
                            </button>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="search-panel__filters">
                    <input
                        type="text"
                        className="search-panel__filter"
                        placeholder="Files to include (e.g., *.ts, src/**/*)"
                        value={options.includePattern}
                        onChange={e => setOptions({ includePattern: e.target.value })}
                    />
                    <input
                        type="text"
                        className="search-panel__filter"
                        placeholder="Files to exclude"
                        value={options.excludePattern}
                        onChange={e => setOptions({ excludePattern: e.target.value })}
                    />
                </div>
            </div>

            {/* Results Header */}
            <div className="search-panel__header">
                <span className="search-panel__count">
                    {isSearching ? 'Searching...' : `${totalMatches} results in ${results.length} files`}
                </span>
                {totalMatches > 0 && (
                    <button className="search-panel__clear" onClick={clearResults}>
                        Clear
                    </button>
                )}
            </div>

            {/* Results */}
            <div className="search-panel__results">
                {results.map(result => (
                    <FileResult
                        key={result.filePath}
                        result={result}
                        showReplace={showReplace}
                        selectedMatch={selectedMatch}
                        onToggle={() => toggleCollapse(result.filePath)}
                        onMatchClick={handleMatchClick}
                        onReplaceMatch={(line) => replaceMatch(result.filePath, line)}
                        onReplaceFile={() => replaceInFile(result.filePath)}
                    />
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// FILE RESULT COMPONENT
// =============================================================================

interface FileResultProps {
    result: SearchResult;
    showReplace: boolean;
    selectedMatch: { filePath: string; line: number } | null;
    onToggle: () => void;
    onMatchClick: (match: SearchMatch) => void;
    onReplaceMatch: (line: number) => void;
    onReplaceFile: () => void;
}

const FileResult: React.FC<FileResultProps> = ({
    result,
    showReplace,
    selectedMatch,
    onToggle,
    onMatchClick,
    onReplaceMatch,
    onReplaceFile,
}) => {
    return (
        <div className="search-result">
            <div className="search-result__header" onClick={onToggle}>
                <span className="search-result__chevron">
                    {result.collapsed ? '▸' : '▾'}
                </span>
                <span className="search-result__icon">📄</span>
                <span className="search-result__name">{result.fileName}</span>
                <span className="search-result__path">{result.filePath}</span>
                <span className="search-result__count">{result.matches.length}</span>
                {showReplace && (
                    <button
                        className="search-result__replace-file"
                        onClick={(e) => { e.stopPropagation(); onReplaceFile(); }}
                        title="Replace all in file"
                    >
                        ⟳
                    </button>
                )}
            </div>

            {!result.collapsed && (
                <div className="search-result__matches">
                    {result.matches.map((match, i) => (
                        <MatchLine
                            key={i}
                            match={match}
                            isSelected={
                                selectedMatch?.filePath === match.filePath &&
                                selectedMatch?.line === match.line
                            }
                            showReplace={showReplace}
                            onClick={() => onMatchClick(match)}
                            onReplace={() => onReplaceMatch(match.line)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// MATCH LINE COMPONENT
// =============================================================================

interface MatchLineProps {
    match: SearchMatch;
    isSelected: boolean;
    showReplace: boolean;
    onClick: () => void;
    onReplace: () => void;
}

const MatchLine: React.FC<MatchLineProps> = ({
    match,
    isSelected,
    showReplace,
    onClick,
    onReplace,
}) => {
    return (
        <div
            className={`search-match ${isSelected ? 'selected' : ''}`}
            onClick={onClick}
        >
            <span className="search-match__line">{match.line}</span>
            <span className="search-match__content">
                <span className="search-match__before">{match.beforeMatch}</span>
                <mark className="search-match__highlight">{match.matchText}</mark>
                <span className="search-match__after">{match.afterMatch}</span>
            </span>
            {showReplace && (
                <button
                    className="search-match__replace"
                    onClick={(e) => { e.stopPropagation(); onReplace(); }}
                    title="Replace"
                >
                    ↻
                </button>
            )}
        </div>
    );
};

export default SearchPanel;
