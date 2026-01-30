/**
 * Terminal Panel Component
 * 
 * Multi-terminal interface with tabs and output display.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTerminalService, Terminal } from '../lib/terminal/terminal-service';

interface TerminalPanelProps {
    className?: string;
}

export const TerminalPanel: React.FC<TerminalPanelProps> = ({ className }) => {
    const {
        terminals,
        activeTerminalId,
        createTerminal,
        closeTerminal,
        setActiveTerminal,
        sendInput,
        killProcess,
        getPreviousCommand,
        getNextCommand,
    } = useTerminalService();

    const [inputValue, setInputValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    const terminalList = Array.from(terminals.values());
    const activeTerminal = activeTerminalId ? terminals.get(activeTerminalId) : null;

    // Auto-scroll to bottom
    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [activeTerminal?.output]);

    // Focus input when terminal changes
    useEffect(() => {
        inputRef.current?.focus();
    }, [activeTerminalId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeTerminalId || !inputValue.trim()) return;

        await sendInput(activeTerminalId, inputValue);
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = getPreviousCommand();
            if (prev) setInputValue(prev);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const next = getNextCommand();
            setInputValue(next || '');
        } else if (e.key === 'c' && e.ctrlKey) {
            e.preventDefault();
            if (activeTerminalId) {
                killProcess(activeTerminalId);
            }
        }
    };

    const handleNewTerminal = () => {
        createTerminal();
    };

    return (
        <div className={`terminal-panel ${className || ''}`}>
            {/* Terminal Tabs */}
            <div className="terminal-panel__tabs">
                <div className="terminal-panel__tab-list">
                    {terminalList.map(terminal => (
                        <TerminalTab
                            key={terminal.id}
                            terminal={terminal}
                            isActive={terminal.id === activeTerminalId}
                            onSelect={() => setActiveTerminal(terminal.id)}
                            onClose={() => closeTerminal(terminal.id)}
                        />
                    ))}
                </div>
                <button
                    className="terminal-panel__new-btn"
                    onClick={handleNewTerminal}
                    title="New Terminal"
                >
                    +
                </button>
            </div>

            {/* Terminal Output */}
            {activeTerminal ? (
                <div className="terminal-panel__body">
                    <div className="terminal-panel__output" ref={outputRef}>
                        {activeTerminal.output.map(line => (
                            <TerminalLine key={line.id} line={line} />
                        ))}
                    </div>

                    {/* Input */}
                    <form className="terminal-panel__input-form" onSubmit={handleSubmit}>
                        <span className="terminal-panel__prompt">$</span>
                        <input
                            ref={inputRef}
                            type="text"
                            className="terminal-panel__input"
                            value={inputValue}
                            onChange={e => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter command..."
                            spellCheck={false}
                            autoComplete="off"
                        />
                    </form>
                </div>
            ) : (
                <div className="terminal-panel__empty">
                    <p>No terminal open</p>
                    <button onClick={handleNewTerminal}>Create Terminal</button>
                </div>
            )}
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface TerminalTabProps {
    terminal: Terminal;
    isActive: boolean;
    onSelect: () => void;
    onClose: () => void;
}

const TerminalTab: React.FC<TerminalTabProps> = ({
    terminal,
    isActive,
    onSelect,
    onClose,
}) => (
    <div
        className={`terminal-panel__tab ${isActive ? 'terminal-panel__tab--active' : ''}`}
        onClick={onSelect}
    >
        <span className="terminal-panel__tab-icon">
            {getShellIcon(terminal.shellType)}
        </span>
        <span className="terminal-panel__tab-name">{terminal.name}</span>
        <button
            className="terminal-panel__tab-close"
            onClick={e => {
                e.stopPropagation();
                onClose();
            }}
        >
            ×
        </button>
    </div>
);

interface TerminalLineProps {
    line: {
        id: number;
        type: 'input' | 'output' | 'error' | 'system';
        content: string;
        timestamp: number;
    };
}

const TerminalLine: React.FC<TerminalLineProps> = ({ line }) => {
    const className = `terminal-panel__line terminal-panel__line--${line.type}`;

    return (
        <div className={className}>
            <pre>{line.content}</pre>
        </div>
    );
};

function getShellIcon(shellType: string): string {
    const icons: Record<string, string> = {
        bash: '🐚',
        zsh: '⚡',
        fish: '🐟',
        powershell: '💠',
        cmd: '📦',
        sh: '📜',
    };
    return icons[shellType] || '💻';
}

export default TerminalPanel;
