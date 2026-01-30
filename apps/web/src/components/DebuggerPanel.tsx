/**
 * Debugger Panel Component
 * 
 * UI for debugging with breakpoints, call stack, variables, and controls.
 */

import { useState } from 'react';
import {
    Play, Pause, Square, SkipForward, ArrowDown, ArrowUp,
    RotateCcw, X, Plus, ChevronRight, ChevronDown, Bug
} from 'lucide-react';
import {
    useDebugService,
    getStateIcon,
    getBreakpointIcon,
    Breakpoint,
    Variable,
    StackFrame
} from '../lib/debug/debug-adapter-service';

export function DebuggerPanel() {
    const {
        breakpoints,
        watchExpressions,
        exceptionBreakpoints,
        startSession,
        stopSession,
        pauseSession,
        continueSession,
        stepOver,
        stepInto,
        stepOut,
        restart,
        removeBreakpoint,
        toggleBreakpoint,
        addWatch,
        removeWatch,
        selectStackFrame,
        setExceptionBreakpoints,
        getActiveSession,
    } = useDebugService();

    const session = getActiveSession();
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
        new Set(['variables', 'callStack', 'breakpoints', 'watch'])
    );
    const [newWatchExpr, setNewWatchExpr] = useState('');

    const toggleSection = (section: string) => {
        const newSet = new Set(expandedSections);
        if (newSet.has(section)) {
            newSet.delete(section);
        } else {
            newSet.add(section);
        }
        setExpandedSections(newSet);
    };

    const handleAddWatch = () => {
        if (newWatchExpr.trim()) {
            addWatch(newWatchExpr);
            setNewWatchExpr('');
        }
    };

    return (
        <div className="debugger-panel">
            {/* Header with Controls */}
            <div className="debug-header">
                <div className="debug-title">
                    <Bug size={16} />
                    Debug
                </div>
                <div className="debug-controls">
                    {!session || session.state === 'stopped' ? (
                        <button
                            className="control-btn start"
                            onClick={() => startSession('Node.js', 'node')}
                            title="Start Debugging"
                        >
                            <Play size={14} />
                        </button>
                    ) : (
                        <>
                            {session.state === 'paused' ? (
                                <button
                                    className="control-btn"
                                    onClick={() => continueSession(session.id)}
                                    title="Continue"
                                >
                                    <Play size={14} />
                                </button>
                            ) : (
                                <button
                                    className="control-btn"
                                    onClick={() => pauseSession(session.id)}
                                    title="Pause"
                                >
                                    <Pause size={14} />
                                </button>
                            )}
                            <button
                                className="control-btn"
                                onClick={() => stepOver(session.id)}
                                title="Step Over"
                                disabled={session.state !== 'paused'}
                            >
                                <SkipForward size={14} />
                            </button>
                            <button
                                className="control-btn"
                                onClick={() => stepInto(session.id)}
                                title="Step Into"
                                disabled={session.state !== 'paused'}
                            >
                                <ArrowDown size={14} />
                            </button>
                            <button
                                className="control-btn"
                                onClick={() => stepOut(session.id)}
                                title="Step Out"
                                disabled={session.state !== 'paused'}
                            >
                                <ArrowUp size={14} />
                            </button>
                            <button
                                className="control-btn"
                                onClick={() => restart(session.id)}
                                title="Restart"
                            >
                                <RotateCcw size={14} />
                            </button>
                            <button
                                className="control-btn stop"
                                onClick={() => stopSession(session.id)}
                                title="Stop"
                            >
                                <Square size={14} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Session Status */}
            {session && (
                <div className="debug-status">
                    <span className="status-icon">{getStateIcon(session.state)}</span>
                    <span className="status-text">
                        {session.name} - {session.state}
                    </span>
                </div>
            )}

            {/* Sections */}
            <div className="debug-sections">
                {/* Variables */}
                <CollapsibleSection
                    title="Variables"
                    id="variables"
                    expanded={expandedSections.has('variables')}
                    onToggle={() => toggleSection('variables')}
                >
                    {session?.scopes.map((scope, i) => (
                        <div key={i} className="scope-group">
                            <div className="scope-name">{scope.name}</div>
                            {scope.variables.map((v, j) => (
                                <VariableItem key={j} variable={v} depth={0} />
                            ))}
                        </div>
                    ))}
                    {(!session || session.scopes.length === 0) && (
                        <div className="empty-section">Not paused</div>
                    )}
                </CollapsibleSection>

                {/* Call Stack */}
                <CollapsibleSection
                    title="Call Stack"
                    id="callStack"
                    expanded={expandedSections.has('callStack')}
                    onToggle={() => toggleSection('callStack')}
                >
                    {session?.stackFrames.map(frame => (
                        <StackFrameItem
                            key={frame.id}
                            frame={frame}
                            isActive={frame.id === session.currentFrameId}
                            onSelect={() => selectStackFrame(session.id, frame.id)}
                        />
                    ))}
                    {(!session || session.stackFrames.length === 0) && (
                        <div className="empty-section">No call stack</div>
                    )}
                </CollapsibleSection>

                {/* Breakpoints */}
                <CollapsibleSection
                    title={`Breakpoints (${breakpoints.length})`}
                    id="breakpoints"
                    expanded={expandedSections.has('breakpoints')}
                    onToggle={() => toggleSection('breakpoints')}
                >
                    <div className="exception-breakpoints">
                        <label>
                            <input
                                type="checkbox"
                                checked={exceptionBreakpoints.uncaught}
                                onChange={(e) => setExceptionBreakpoints(
                                    exceptionBreakpoints.caught,
                                    e.target.checked
                                )}
                            />
                            Uncaught Exceptions
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                checked={exceptionBreakpoints.caught}
                                onChange={(e) => setExceptionBreakpoints(
                                    e.target.checked,
                                    exceptionBreakpoints.uncaught
                                )}
                            />
                            All Exceptions
                        </label>
                    </div>
                    {breakpoints.map(bp => (
                        <BreakpointItem
                            key={bp.id}
                            breakpoint={bp}
                            onToggle={() => toggleBreakpoint(bp.id)}
                            onRemove={() => removeBreakpoint(bp.id)}
                        />
                    ))}
                    {breakpoints.length === 0 && (
                        <div className="empty-section">No breakpoints</div>
                    )}
                </CollapsibleSection>

                {/* Watch */}
                <CollapsibleSection
                    title="Watch"
                    id="watch"
                    expanded={expandedSections.has('watch')}
                    onToggle={() => toggleSection('watch')}
                >
                    <div className="add-watch">
                        <input
                            type="text"
                            placeholder="Add expression..."
                            value={newWatchExpr}
                            onChange={(e) => setNewWatchExpr(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWatch()}
                        />
                        <button onClick={handleAddWatch}>
                            <Plus size={12} />
                        </button>
                    </div>
                    {watchExpressions.map(watch => (
                        <div key={watch.id} className="watch-item">
                            <span className="watch-expr">{watch.expression}</span>
                            <span className="watch-value">{watch.value || 'undefined'}</span>
                            <button onClick={() => removeWatch(watch.id)}>
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </CollapsibleSection>
            </div>
        </div>
    );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface CollapsibleSectionProps {
    title: string;
    id: string;
    expanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

function CollapsibleSection({ title, expanded, onToggle, children }: CollapsibleSectionProps) {
    return (
        <div className="debug-section">
            <button className="section-header" onClick={onToggle}>
                {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{title}</span>
            </button>
            {expanded && <div className="section-content">{children}</div>}
        </div>
    );
}

interface VariableItemProps {
    variable: Variable;
    depth: number;
}

function VariableItem({ variable, depth }: VariableItemProps) {
    const [expanded, setExpanded] = useState(false);
    const hasChildren = variable.variablesReference > 0;

    return (
        <div className="variable-item" style={{ paddingLeft: depth * 16 + 8 }}>
            <div className="variable-row" onClick={() => hasChildren && setExpanded(!expanded)}>
                {hasChildren && (
                    <span className="expand-icon">
                        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </span>
                )}
                <span className="var-name">{variable.name}</span>
                <span className="var-value">{variable.value}</span>
            </div>
            {expanded && variable.children?.map((child, i) => (
                <VariableItem key={i} variable={child} depth={depth + 1} />
            ))}
        </div>
    );
}

interface StackFrameItemProps {
    frame: StackFrame;
    isActive: boolean;
    onSelect: () => void;
}

function StackFrameItem({ frame, isActive, onSelect }: StackFrameItemProps) {
    return (
        <button
            className={`stack-frame ${isActive ? 'active' : ''}`}
            onClick={onSelect}
        >
            <span className="frame-name">{frame.name}</span>
            <span className="frame-location">
                {frame.file.split('/').pop()}:{frame.line}
            </span>
        </button>
    );
}

interface BreakpointItemProps {
    breakpoint: Breakpoint;
    onToggle: () => void;
    onRemove: () => void;
}

function BreakpointItem({ breakpoint, onToggle, onRemove }: BreakpointItemProps) {
    return (
        <div className={`breakpoint-item ${!breakpoint.enabled ? 'disabled' : ''}`}>
            <button className="bp-toggle" onClick={onToggle}>
                {getBreakpointIcon(breakpoint)}
            </button>
            <span className="bp-location">
                {breakpoint.file.split('/').pop()}:{breakpoint.line}
            </span>
            {breakpoint.condition && (
                <span className="bp-condition">{breakpoint.condition}</span>
            )}
            <button className="bp-remove" onClick={onRemove}>
                <X size={12} />
            </button>
        </div>
    );
}

export default DebuggerPanel;
