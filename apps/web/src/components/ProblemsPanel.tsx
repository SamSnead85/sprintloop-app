/**
 * Problems Panel Component
 * 
 * Displays diagnostics from linters, compilers, and language servers.
 */

import { useState } from 'react';
import {
    AlertCircle, AlertTriangle, Info, Lightbulb,
    ChevronDown, ChevronRight, Filter, Search,
    RefreshCw, FileCode, X
} from 'lucide-react';
import {
    useProblemsService,
    Problem,
    ProblemSeverity,
    getSeverityColor,
    getSourceLabel,
    formatProblemLocation
} from '../lib/problems/problems-service';

export function ProblemsPanel() {
    const {
        selectedProblem,
        isAutoRefresh,
        setFilter,
        getFilteredProblems,
        getGroupedProblems,
        selectProblem,
        goToNextProblem,
        goToPreviousProblem,
        getErrorCount,
        getWarningCount,
        getInfoCount,
        toggleAutoRefresh,
    } = useProblemsService();

    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

    const problems = getFilteredProblems();
    const groups = getGroupedProblems();
    const errorCount = getErrorCount();
    const warningCount = getWarningCount();
    const infoCount = getInfoCount();

    const toggleFileCollapse = (file: string) => {
        const newCollapsed = new Set(collapsedFiles);
        if (newCollapsed.has(file)) {
            newCollapsed.delete(file);
        } else {
            newCollapsed.add(file);
        }
        setCollapsedFiles(newCollapsed);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setFilter({ searchQuery: query });
    };

    return (
        <div className="problems-panel">
            {/* Header */}
            <div className="problems-header">
                <div className="problems-title">
                    <span>Problems</span>
                    <span className="problems-count">{problems.length}</span>
                </div>

                {/* Stats */}
                <div className="problems-stats">
                    <span className="stat error">
                        <AlertCircle size={12} />
                        {errorCount}
                    </span>
                    <span className="stat warning">
                        <AlertTriangle size={12} />
                        {warningCount}
                    </span>
                    <span className="stat info">
                        <Info size={12} />
                        {infoCount}
                    </span>
                </div>

                {/* Actions */}
                <div className="problems-actions">
                    <button
                        className={`action-btn ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                        title="Filter"
                    >
                        <Filter size={14} />
                    </button>
                    <button
                        className={`action-btn ${isAutoRefresh ? 'active' : ''}`}
                        onClick={toggleAutoRefresh}
                        title="Auto Refresh"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="problems-toolbar">
                <div className="search-input">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Filter problems..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => handleSearch('')}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="problems-filters">
                        <SeverityFilter />
                    </div>
                )}
            </div>

            {/* Problem List */}
            <div className="problems-list">
                {groups.length === 0 ? (
                    <div className="no-problems">
                        <AlertCircle size={24} />
                        <span>No problems detected</span>
                    </div>
                ) : (
                    groups.map(group => (
                        <div key={group.file} className="problem-group">
                            {/* File Header */}
                            <button
                                className="problem-group-header"
                                onClick={() => toggleFileCollapse(group.file)}
                            >
                                {collapsedFiles.has(group.file) ? (
                                    <ChevronRight size={14} />
                                ) : (
                                    <ChevronDown size={14} />
                                )}
                                <FileCode size={14} />
                                <span className="file-path">{group.file}</span>
                                <span className="group-count">
                                    {group.errorCount > 0 && (
                                        <span className="error">{group.errorCount}</span>
                                    )}
                                    {group.warningCount > 0 && (
                                        <span className="warning">{group.warningCount}</span>
                                    )}
                                </span>
                            </button>

                            {/* Problems */}
                            {!collapsedFiles.has(group.file) && (
                                <div className="problem-items">
                                    {group.problems.map(problem => (
                                        <ProblemItem
                                            key={problem.id}
                                            problem={problem}
                                            isSelected={selectedProblem === problem.id}
                                            onSelect={() => selectProblem(problem.id)}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Navigation */}
            {problems.length > 0 && (
                <div className="problems-footer">
                    <button onClick={goToPreviousProblem} title="Previous Problem (F7)">
                        ← Previous
                    </button>
                    <button onClick={goToNextProblem} title="Next Problem (F8)">
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// PROBLEM ITEM
// =============================================================================

interface ProblemItemProps {
    problem: Problem;
    isSelected: boolean;
    onSelect: () => void;
}

function ProblemItem({ problem, isSelected, onSelect }: ProblemItemProps) {

    return (
        <button
            className={`problem-item ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
            onDoubleClick={() => {
                // Navigate to file location
                console.log('Navigate to:', problem.file, problem.line, problem.column);
            }}
        >
            <SeverityIcon severity={problem.severity} />
            <div className="problem-content">
                <span className="problem-message">{problem.message}</span>
                <div className="problem-meta">
                    <span className="problem-source">{getSourceLabel(problem.source)}</span>
                    {problem.code && (
                        <span className="problem-code">{problem.code}</span>
                    )}
                    <span className="problem-location">
                        {formatProblemLocation(problem)}
                    </span>
                </div>
            </div>
        </button>
    );
}

// =============================================================================
// SEVERITY ICON
// =============================================================================

function SeverityIcon({ severity }: { severity: ProblemSeverity }) {
    const color = getSeverityColor(severity);

    switch (severity) {
        case 'error':
            return <AlertCircle size={14} style={{ color }} />;
        case 'warning':
            return <AlertTriangle size={14} style={{ color }} />;
        case 'info':
            return <Info size={14} style={{ color }} />;
        case 'hint':
            return <Lightbulb size={14} style={{ color }} />;
    }
}

// =============================================================================
// SEVERITY FILTER
// =============================================================================

function SeverityFilter() {
    const { filter, setFilter } = useProblemsService();

    const severities: ProblemSeverity[] = ['error', 'warning', 'info', 'hint'];

    const toggleSeverity = (severity: ProblemSeverity) => {
        const current = filter.severity || severities;
        if (current.includes(severity)) {
            setFilter({ severity: current.filter(s => s !== severity) });
        } else {
            setFilter({ severity: [...current, severity] });
        }
    };

    return (
        <div className="severity-filter">
            {severities.map(severity => (
                <button
                    key={severity}
                    className={`filter-btn ${!filter.severity || filter.severity.includes(severity) ? 'active' : ''}`}
                    onClick={() => toggleSeverity(severity)}
                >
                    <SeverityIcon severity={severity} />
                    <span>{severity}</span>
                </button>
            ))}
        </div>
    );
}

export default ProblemsPanel;
