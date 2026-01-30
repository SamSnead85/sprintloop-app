/**
 * Keybindings Editor Component
 * 
 * UI for viewing and customizing keyboard shortcuts.
 */

import { useState, useEffect } from 'react';
import {
    Search, RotateCcw, Keyboard, X, Edit2
} from 'lucide-react';
import {
    useKeybindingsService,
    CATEGORY_LABELS,
    formatKeybinding,
    Keybinding,
    KeybindingCategory
} from '../lib/keybindings/keybindings-service';

const CATEGORIES: KeybindingCategory[] = [
    'file', 'editor', 'view', 'navigation', 'search', 'git', 'debug', 'terminal', 'ai'
];

export function KeybindingsEditor() {
    const {
        userOverrides,
        searchQuery,
        selectedCategory,
        recordingFor,
        setKeybinding,
        resetKeybinding,
        resetAll,
        setSearchQuery,
        setSelectedCategory,
        getFilteredKeybindings,
        startRecording,
        stopRecording,
    } = useKeybindingsService();

    const [recordedKeys, setRecordedKeys] = useState('');
    const filteredKeybindings = getFilteredKeybindings();
    const hasOverrides = Object.keys(userOverrides).length > 0;

    // Handle key recording
    useEffect(() => {
        if (!recordingFor) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();

            const parts: string[] = [];
            if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
            if (e.altKey) parts.push('Alt');
            if (e.shiftKey) parts.push('Shift');

            const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
            if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                parts.push(key);
            }

            if (parts.length > 0) {
                const binding = parts.join('+');
                setRecordedKeys(binding);

                if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                    setKeybinding(recordingFor, binding);
                    setRecordedKeys('');
                }
            }
        };

        const handleKeyUp = () => {
            if (recordedKeys && !recordedKeys.includes('+')) {
                setRecordedKeys('');
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        window.addEventListener('keyup', handleKeyUp, true);

        return () => {
            window.removeEventListener('keydown', handleKeyDown, true);
            window.removeEventListener('keyup', handleKeyUp, true);
        };
    }, [recordingFor, recordedKeys, setKeybinding]);

    return (
        <div className="keybindings-editor">
            {/* Header */}
            <div className="keybindings-header">
                <h2><Keyboard size={20} /> Keyboard Shortcuts</h2>
                {hasOverrides && (
                    <button className="reset-all-btn" onClick={resetAll}>
                        <RotateCcw size={14} /> Reset All
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="keybindings-search">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search keybindings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                        <X size={14} />
                    </button>
                )}
            </div>

            {/* Categories */}
            <div className="keybindings-categories">
                <button
                    className={!selectedCategory ? 'active' : ''}
                    onClick={() => setSelectedCategory(null)}
                >
                    All
                </button>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        className={selectedCategory === cat ? 'active' : ''}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {CATEGORY_LABELS[cat]}
                    </button>
                ))}
            </div>

            {/* Recording Overlay */}
            {recordingFor && (
                <div className="recording-overlay" onClick={stopRecording}>
                    <div className="recording-dialog">
                        <h3>Press keys...</h3>
                        <div className="recorded-keys">
                            {recordedKeys || 'Waiting for input...'}
                        </div>
                        <p>Press Escape to cancel</p>
                    </div>
                </div>
            )}

            {/* Keybindings List */}
            <div className="keybindings-list">
                <div className="keybindings-list-header">
                    <span>Command</span>
                    <span>Keybinding</span>
                    <span>Source</span>
                    <span></span>
                </div>
                {filteredKeybindings.length === 0 ? (
                    <div className="no-results">No keybindings found</div>
                ) : (
                    filteredKeybindings.map(kb => (
                        <KeybindingRow
                            key={kb.id}
                            keybinding={kb}
                            isModified={kb.source === 'user'}
                            onEdit={() => startRecording(kb.id)}
                            onReset={() => resetKeybinding(kb.id)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

interface KeybindingRowProps {
    keybinding: Keybinding;
    isModified: boolean;
    onEdit: () => void;
    onReset: () => void;
}

function KeybindingRow({ keybinding, isModified, onEdit, onReset }: KeybindingRowProps) {
    return (
        <div className={`keybinding-row ${isModified ? 'modified' : ''}`}>
            <div className="keybinding-command">
                <span className="command-title">{keybinding.title}</span>
                <span className="command-id">{keybinding.command}</span>
                {keybinding.when && (
                    <span className="command-when">when: {keybinding.when}</span>
                )}
            </div>
            <div className="keybinding-keys" onClick={onEdit}>
                <kbd>{formatKeybinding(keybinding.keybinding)}</kbd>
                <Edit2 size={12} className="edit-icon" />
            </div>
            <div className="keybinding-source">
                <span className={`source-badge ${keybinding.source}`}>
                    {keybinding.source}
                </span>
            </div>
            <div className="keybinding-actions">
                {isModified && (
                    <button onClick={onReset} title="Reset to default">
                        <RotateCcw size={12} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default KeybindingsEditor;
