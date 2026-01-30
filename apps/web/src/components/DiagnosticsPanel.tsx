/**
 * Diagnostics Panel Component
 * 
 * Shows errors, warnings, and hints from LSP.
 */

import React, { useState, useMemo } from 'react';
import {
    useLSP,
    getDiagnosticCounts,
    getSeverityIcon,
    type Diagnostic,
    type DiagnosticSeverity,
} from '../lib/lsp/lsp-client';

interface DiagnosticsPanelProps {
    className?: string;
    onNavigate?: (filePath: string, line: number, column: number) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ className, onNavigate }) => {
    const { diagnostics } = useLSP();
    const [filter, setFilter] = useState<DiagnosticSeverity | 'all'>('all');
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

    const counts = useMemo(() => getDiagnosticCounts(), [diagnostics]);
    const totalCount = counts.error + counts.warning + counts.info + counts.hint;

    const filteredDiagnostics = useMemo(() => {
        const result = new Map<string, Diagnostic[]>();

        for (const [filePath, fileDiagnostics] of diagnostics) {
            const filtered = filter === 'all'
                ? fileDiagnostics
                : fileDiagnostics.filter(d => d.severity === filter);

            if (filtered.length > 0) {
                result.set(filePath, filtered);
            }
        }

        return result;
    }, [diagnostics, filter]);

    const toggleCollapse = (filePath: string) => {
        setCollapsed(prev => {
            const next = new Set(prev);
            if (next.has(filePath)) {
                next.delete(filePath);
            } else {
                next.add(filePath);
            }
            return next;
        });
    };

    return (
        <div className={`diagnostics-panel ${className || ''}`}>
            {/* Header */}
            <div className="diagnostics-panel__header">
                <span className="diagnostics-panel__title">Problems</span>
                <div className="diagnostics-panel__counts">
                    <button
                        className={`diagnostics-panel__count diagnostics-panel__count--error ${filter === 'error' ? 'active' : ''}`}
                        onClick={() => setFilter(filter === 'error' ? 'all' : 'error')}
                    >
                        ❌ {counts.error}
                    </button>
                    <button
                        className={`diagnostics-panel__count diagnostics-panel__count--warning ${filter === 'warning' ? 'active' : ''}`}
                        onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')}
                    >
                        ⚠️ {counts.warning}
                    </button>
                    <button
                        className={`diagnostics-panel__count diagnostics-panel__count--info ${filter === 'info' ? 'active' : ''}`}
                        onClick={() => setFilter(filter === 'info' ? 'all' : 'info')}
                    >
                        ℹ️ {counts.info}
                    </button>
                </div>
            </div>

            {/* Content */}
            {totalCount === 0 ? (
                <div className="diagnostics-panel__empty">
                    <span>✅</span>
                    <p>No problems detected</p>
                </div>
            ) : (
                <div className="diagnostics-panel__content">
                    {Array.from(filteredDiagnostics.entries()).map(([filePath, items]) => (
                        <div key={filePath} className="diagnostics-file">
                            <button
                                className="diagnostics-file__header"
                                onClick={() => toggleCollapse(filePath)}
                            >
                                <span className="diagnostics-file__chevron">
                                    {collapsed.has(filePath) ? '▸' : '▾'}
                                </span>
                                <span className="diagnostics-file__icon">📄</span>
                                <span className="diagnostics-file__name">
                                    {filePath.split('/').pop()}
                                </span>
                                <span className="diagnostics-file__path">{filePath}</span>
                                <span className="diagnostics-file__count">{items.length}</span>
                            </button>

                            {!collapsed.has(filePath) && (
                                <div className="diagnostics-file__items">
                                    {items.map((diagnostic, i) => (
                                        <DiagnosticItem
                                            key={i}
                                            diagnostic={diagnostic}
                                            onNavigate={onNavigate}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// DIAGNOSTIC ITEM
// =============================================================================

interface DiagnosticItemProps {
    diagnostic: Diagnostic;
    onNavigate?: (filePath: string, line: number, column: number) => void;
}

const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ diagnostic, onNavigate }) => {
    const { range, severity, message, code, source } = diagnostic;

    return (
        <button
            className={`diagnostic-item diagnostic-item--${severity}`}
            onClick={() => onNavigate?.(diagnostic.filePath, range.startLine, range.startColumn)}
        >
            <span className="diagnostic-item__icon">{getSeverityIcon(severity)}</span>
            <span className="diagnostic-item__message">{message}</span>
            <span className="diagnostic-item__location">
                [{range.startLine}:{range.startColumn}]
            </span>
            {source && <span className="diagnostic-item__source">{source}</span>}
            {code && <span className="diagnostic-item__code">{code}</span>}
        </button>
    );
};

export default DiagnosticsPanel;
