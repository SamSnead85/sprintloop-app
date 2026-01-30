/**
 * Debug Panel Component
 * 
 * Debug controls with call stack, variables, and watch expressions.
 */

import React, { useState, useEffect } from 'react';
import {
    useDebugService,
    DebugState,
    StackFrame,
    Variable,
    WatchExpression,
    Breakpoint
} from '../lib/debug/debug-service';

interface DebugPanelProps {
    className?: string;
    onNavigateToSource?: (path: string, line: number) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
    className,
    onNavigateToSource,
}) => {
    const {
        state,
        callStack,
        currentFrame,
        watchExpressions,
        breakpoints,
        continue: continueExec,
        pause,
        stepOver,
        stepInto,
        stepOut,
        restart,
        stopSession,
        setCurrentFrame,
        addWatch,
        removeWatch,
        getVariables,
    } = useDebugService();

    const [activeTab, setActiveTab] = useState<'variables' | 'watch' | 'callstack' | 'breakpoints'>('variables');
    const [variables, setVariables] = useState<Variable[]>([]);
    const [newWatchExpr, setNewWatchExpr] = useState('');

    // Load variables when frame changes
    useEffect(() => {
        if (currentFrame !== null && callStack.length > 0) {
            const frame = callStack.find(f => f.id === currentFrame);
            if (frame && frame.scopes.length > 0) {
                getVariables(frame.scopes[0].variablesReference).then(setVariables);
            }
        } else {
            setVariables([]);
        }
    }, [currentFrame, callStack, getVariables]);

    const handleAddWatch = () => {
        if (newWatchExpr.trim()) {
            addWatch(newWatchExpr.trim());
            setNewWatchExpr('');
        }
    };

    const allBreakpoints = Array.from(breakpoints.values()).flat();

    return (
        <div className={`debug-panel ${className || ''}`}>
            {/* Debug Controls */}
            <div className="debug-panel__controls">
                <DebugButton
                    icon="▶️"
                    title="Continue (F5)"
                    onClick={continueExec}
                    disabled={state !== 'paused'}
                />
                <DebugButton
                    icon="⏸️"
                    title="Pause (F6)"
                    onClick={pause}
                    disabled={state !== 'running'}
                />
                <DebugButton
                    icon="⏭️"
                    title="Step Over (F10)"
                    onClick={stepOver}
                    disabled={state !== 'paused'}
                />
                <DebugButton
                    icon="⬇️"
                    title="Step Into (F11)"
                    onClick={stepInto}
                    disabled={state !== 'paused'}
                />
                <DebugButton
                    icon="⬆️"
                    title="Step Out (Shift+F11)"
                    onClick={stepOut}
                    disabled={state !== 'paused'}
                />
                <DebugButton
                    icon="🔄"
                    title="Restart (Ctrl+Shift+F5)"
                    onClick={restart}
                    disabled={state === 'inactive'}
                />
                <DebugButton
                    icon="⏹️"
                    title="Stop (Shift+F5)"
                    onClick={stopSession}
                    disabled={state === 'inactive'}
                />
                <div className="debug-panel__state">
                    <StateIndicator state={state} />
                </div>
            </div>

            {/* Tabs */}
            <div className="debug-panel__tabs">
                {(['variables', 'watch', 'callstack', 'breakpoints'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`debug-panel__tab ${activeTab === tab ? 'debug-panel__tab--active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="debug-panel__content">
                {activeTab === 'variables' && (
                    <VariablesView
                        variables={variables}
                        getVariables={getVariables}
                    />
                )}
                {activeTab === 'watch' && (
                    <WatchView
                        expressions={watchExpressions}
                        onRemove={removeWatch}
                        newExpression={newWatchExpr}
                        onExpressionChange={setNewWatchExpr}
                        onAdd={handleAddWatch}
                    />
                )}
                {activeTab === 'callstack' && (
                    <CallStackView
                        frames={callStack}
                        currentFrame={currentFrame}
                        onSelectFrame={setCurrentFrame}
                        onNavigate={onNavigateToSource}
                    />
                )}
                {activeTab === 'breakpoints' && (
                    <BreakpointsView
                        breakpoints={allBreakpoints}
                        onNavigate={onNavigateToSource}
                    />
                )}
            </div>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const DebugButton: React.FC<{
    icon: string;
    title: string;
    onClick: () => void;
    disabled?: boolean;
}> = ({ icon, title, onClick, disabled }) => (
    <button
        className="debug-panel__btn"
        title={title}
        onClick={onClick}
        disabled={disabled}
    >
        {icon}
    </button>
);

const StateIndicator: React.FC<{ state: DebugState }> = ({ state }) => {
    const colors: Record<DebugState, string> = {
        inactive: '#6B7280',
        running: '#10B981',
        paused: '#F59E0B',
        stopped: '#EF4444',
    };

    return (
        <span style={{ color: colors[state] }}>
            {state.charAt(0).toUpperCase() + state.slice(1)}
        </span>
    );
};

const VariablesView: React.FC<{
    variables: Variable[];
    getVariables: (ref: number) => Promise<Variable[]>;
}> = ({ variables, getVariables }) => {
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [childVars, setChildVars] = useState<Map<number, Variable[]>>(new Map());

    const toggleExpand = async (variable: Variable) => {
        const key = variable.name;
        const newExpanded = new Set(expanded);

        if (newExpanded.has(key)) {
            newExpanded.delete(key);
        } else {
            newExpanded.add(key);
            if (variable.variablesReference > 0 && !childVars.has(variable.variablesReference)) {
                const children = await getVariables(variable.variablesReference);
                setChildVars(new Map(childVars).set(variable.variablesReference, children));
            }
        }
        setExpanded(newExpanded);
    };

    if (variables.length === 0) {
        return <div className="debug-panel__empty">No variables</div>;
    }

    return (
        <div className="debug-panel__variables">
            {variables.map(v => (
                <VariableItem
                    key={v.name}
                    variable={v}
                    expanded={expanded.has(v.name)}
                    children={childVars.get(v.variablesReference) || []}
                    onToggle={() => toggleExpand(v)}
                    depth={0}
                />
            ))}
        </div>
    );
};

const VariableItem: React.FC<{
    variable: Variable;
    expanded: boolean;
    children: Variable[];
    onToggle: () => void;
    depth: number;
}> = ({ variable, expanded, children, onToggle, depth }) => {
    const hasChildren = variable.variablesReference > 0;

    return (
        <>
            <div
                className="debug-panel__variable"
                style={{ paddingLeft: `${depth * 16 + 8}px` }}
            >
                {hasChildren && (
                    <button className="debug-panel__expand" onClick={onToggle}>
                        {expanded ? '▼' : '▶'}
                    </button>
                )}
                {!hasChildren && <span className="debug-panel__expand-spacer" />}
                <span className="debug-panel__var-name">{variable.name}</span>
                <span className="debug-panel__var-value">{variable.value}</span>
                {variable.type && (
                    <span className="debug-panel__var-type">{variable.type}</span>
                )}
            </div>
            {expanded && children.map(child => (
                <VariableItem
                    key={child.name}
                    variable={child}
                    expanded={false}
                    children={[]}
                    onToggle={() => { }}
                    depth={depth + 1}
                />
            ))}
        </>
    );
};

const WatchView: React.FC<{
    expressions: WatchExpression[];
    onRemove: (id: string) => void;
    newExpression: string;
    onExpressionChange: (value: string) => void;
    onAdd: () => void;
}> = ({ expressions, onRemove, newExpression, onExpressionChange, onAdd }) => (
    <div className="debug-panel__watch">
        <div className="debug-panel__watch-input">
            <input
                type="text"
                placeholder="Add expression..."
                value={newExpression}
                onChange={e => onExpressionChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onAdd()}
            />
            <button onClick={onAdd}>+</button>
        </div>
        {expressions.map(expr => (
            <div key={expr.id} className="debug-panel__watch-item">
                <span className="debug-panel__watch-expr">{expr.expression}</span>
                {expr.error ? (
                    <span className="debug-panel__watch-error">{expr.error}</span>
                ) : (
                    <span className="debug-panel__watch-value">{expr.value || 'undefined'}</span>
                )}
                <button
                    className="debug-panel__watch-remove"
                    onClick={() => onRemove(expr.id)}
                >
                    ×
                </button>
            </div>
        ))}
    </div>
);

const CallStackView: React.FC<{
    frames: StackFrame[];
    currentFrame: number | null;
    onSelectFrame: (id: number) => void;
    onNavigate?: (path: string, line: number) => void;
}> = ({ frames, currentFrame, onSelectFrame, onNavigate }) => {
    if (frames.length === 0) {
        return <div className="debug-panel__empty">No call stack</div>;
    }

    return (
        <div className="debug-panel__callstack">
            {frames.map(frame => (
                <div
                    key={frame.id}
                    className={`debug-panel__frame ${frame.id === currentFrame ? 'debug-panel__frame--active' : ''}`}
                    onClick={() => onSelectFrame(frame.id)}
                    onDoubleClick={() => onNavigate?.(frame.source.path, frame.source.line)}
                >
                    <span className="debug-panel__frame-name">{frame.name}</span>
                    <span className="debug-panel__frame-location">
                        {frame.source.path.split('/').pop()}:{frame.source.line}
                    </span>
                </div>
            ))}
        </div>
    );
};

const BreakpointsView: React.FC<{
    breakpoints: Breakpoint[];
    onNavigate?: (path: string, line: number) => void;
}> = ({ breakpoints, onNavigate }) => {
    const { toggleBreakpoint, updateBreakpoint } = useDebugService();

    if (breakpoints.length === 0) {
        return <div className="debug-panel__empty">No breakpoints</div>;
    }

    return (
        <div className="debug-panel__breakpoints">
            {breakpoints.map(bp => (
                <div key={bp.id} className="debug-panel__breakpoint">
                    <input
                        type="checkbox"
                        checked={bp.enabled}
                        onChange={() => updateBreakpoint(bp.id, { enabled: !bp.enabled })}
                    />
                    <button
                        className="debug-panel__bp-location"
                        onClick={() => onNavigate?.(bp.filePath, bp.line)}
                    >
                        {bp.filePath.split('/').pop()}:{bp.line}
                    </button>
                    {bp.condition && (
                        <span className="debug-panel__bp-condition">{bp.condition}</span>
                    )}
                    <button
                        className="debug-panel__bp-remove"
                        onClick={() => toggleBreakpoint(bp.filePath, bp.line)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
};

export default DebugPanel;
