/**
 * Terminal Tabs Component
 * 
 * Enhanced terminal UI with tabs, split views, and profile selection.
 */

import { useState } from 'react';
import {
    Plus, X, ChevronDown, Maximize2, Minimize2,
    Split, RotateCcw, Trash2, Terminal as TerminalIcon,
    Square
} from 'lucide-react';
import {
    useEnhancedTerminalService,
    getShellIcon,
    getShellColor,
    TerminalInstance
} from '../lib/terminal/enhanced-terminal-service';

export function TerminalTabs() {
    const {
        terminals,
        profiles,
        activeTerminalId,
        splitLayout,
        isPanelMaximized,
        createTerminal,
        closeTerminal,
        setActiveTerminal,
        renameTerminal,
        executeCommand,
        clearTerminal,
        killProcess,
        setSplitLayout,
        toggleMaximize,
    } = useEnhancedTerminalService();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [commandInput, setCommandInput] = useState('');
    const activeTerminal = terminals.find(t => t.id === activeTerminalId);

    const handleNewTerminal = (profileId?: string) => {
        createTerminal(profileId);
        setShowProfileMenu(false);
    };

    const handleCommand = (terminalId: string) => {
        if (!commandInput.trim()) return;
        executeCommand(terminalId, commandInput);
        setCommandInput('');
    };

    return (
        <div className={`terminal-tabs-panel ${isPanelMaximized ? 'maximized' : ''}`}>
            {/* Header */}
            <div className="terminal-header">
                <div className="terminal-tab-bar">
                    {terminals.map(terminal => (
                        <TerminalTab
                            key={terminal.id}
                            terminal={terminal}
                            isActive={terminal.id === activeTerminalId}
                            onSelect={() => setActiveTerminal(terminal.id)}
                            onClose={() => closeTerminal(terminal.id)}
                            onRename={(name) => renameTerminal(terminal.id, name)}
                        />
                    ))}

                    {/* New Terminal Button */}
                    <div className="new-terminal-wrapper">
                        <button
                            className="new-terminal-btn"
                            onClick={() => handleNewTerminal()}
                            title="New Terminal"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            className="new-terminal-dropdown"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                        >
                            <ChevronDown size={12} />
                        </button>

                        {/* Profile Menu */}
                        {showProfileMenu && (
                            <div className="profile-menu">
                                {profiles.map(profile => (
                                    <button
                                        key={profile.id}
                                        className="profile-item"
                                        onClick={() => handleNewTerminal(profile.id)}
                                    >
                                        <span className="profile-icon">
                                            {getShellIcon(profile.shell)}
                                        </span>
                                        <span className="profile-name">{profile.name}</span>
                                        {profile.isDefault && (
                                            <span className="default-badge">Default</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="terminal-actions">
                    <button
                        className={`action-btn ${splitLayout === 'horizontal' ? 'active' : ''}`}
                        onClick={() => setSplitLayout(splitLayout === 'horizontal' ? 'none' : 'horizontal')}
                        title="Split Horizontal"
                    >
                        <Split size={14} />
                    </button>
                    <button
                        className="action-btn"
                        onClick={toggleMaximize}
                        title={isPanelMaximized ? 'Restore' : 'Maximize'}
                    >
                        {isPanelMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className={`terminal-content ${splitLayout !== 'none' ? `split-${splitLayout}` : ''}`}>
                {terminals.length === 0 ? (
                    <div className="no-terminals">
                        <TerminalIcon size={32} />
                        <p>No active terminals</p>
                        <button onClick={() => handleNewTerminal()}>
                            <Plus size={14} />
                            New Terminal
                        </button>
                    </div>
                ) : activeTerminal ? (
                    <TerminalView
                        terminal={activeTerminal}
                        commandInput={commandInput}
                        onCommandChange={setCommandInput}
                        onCommandSubmit={() => handleCommand(activeTerminal.id)}
                        onClear={() => clearTerminal(activeTerminal.id)}
                        onKill={() => killProcess(activeTerminal.id)}
                    />
                ) : null}
            </div>
        </div>
    );
}

// =============================================================================
// TERMINAL TAB
// =============================================================================

interface TerminalTabProps {
    terminal: TerminalInstance;
    isActive: boolean;
    onSelect: () => void;
    onClose: () => void;
    onRename: (name: string) => void;
}

function TerminalTab({ terminal, isActive, onSelect, onClose }: TerminalTabProps) {
    const { getProfile } = useEnhancedTerminalService();
    const profile = getProfile(terminal.profileId);

    return (
        <div
            className={`terminal-tab ${isActive ? 'active' : ''}`}
            onClick={onSelect}
        >
            <span
                className="tab-indicator"
                style={{ backgroundColor: profile ? getShellColor(profile.shell) : '#6b7280' }}
            />
            <span className="tab-icon">
                {profile ? getShellIcon(profile.shell) : '💻'}
            </span>
            <span className="tab-title">{terminal.title}</span>
            {!terminal.isRunning && (
                <span className="exit-code">
                    Exit: {terminal.exitCode}
                </span>
            )}
            <button
                className="tab-close"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
            >
                <X size={12} />
            </button>
        </div>
    );
}

// =============================================================================
// TERMINAL VIEW
// =============================================================================

interface TerminalViewProps {
    terminal: TerminalInstance;
    commandInput: string;
    onCommandChange: (value: string) => void;
    onCommandSubmit: () => void;
    onClear: () => void;
    onKill: () => void;
}

function TerminalView({
    terminal,
    commandInput,
    onCommandChange,
    onCommandSubmit,
    onClear,
    onKill
}: TerminalViewProps) {
    return (
        <div className="terminal-view">
            {/* Toolbar */}
            <div className="terminal-toolbar">
                <span className="terminal-cwd">{terminal.cwd}</span>
                <div className="toolbar-actions">
                    {terminal.isRunning ? (
                        <button onClick={onKill} title="Kill Process">
                            <Square size={12} />
                        </button>
                    ) : (
                        <button onClick={() => { }} title="Restart">
                            <RotateCcw size={12} />
                        </button>
                    )}
                    <button onClick={onClear} title="Clear">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Output */}
            <div className="terminal-output">
                {terminal.output.map((line, i) => (
                    <div key={i} className="output-line">
                        {line}
                    </div>
                ))}
            </div>

            {/* Input */}
            {terminal.isRunning && (
                <div className="terminal-input">
                    <input
                        type="text"
                        value={commandInput}
                        onChange={(e) => onCommandChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onCommandSubmit();
                            }
                        }}
                        placeholder="Enter command..."
                        autoFocus
                    />
                </div>
            )}
        </div>
    );
}

export default TerminalTabs;
