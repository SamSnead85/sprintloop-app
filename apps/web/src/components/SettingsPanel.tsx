/**
 * Settings Panel Component
 * 
 * UI for editing IDE settings.
 */

import React, { useState } from 'react';
import {
    useSettings,
    EDITOR_SCHEMA,
    AI_SCHEMA,
    type SettingSchema,
} from '../lib/settings/settings';

interface SettingsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

type SettingsTab = 'editor' | 'ai' | 'terminal' | 'appearance' | 'keybindings';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, className }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('editor');
    const [searchQuery, setSearchQuery] = useState('');

    const {
        editor,
        ai,
        terminal,
        appearance,
        keybindings,
        updateEditor,
        updateAI,
        updateTerminal,
        updateAppearance,
        resetToDefaults,
        exportSettings,
        importSettings,
    } = useSettings();

    if (!isOpen) return null;

    const handleExport = () => {
        const json = exportSettings();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sprintloop-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const json = await file.text();
                importSettings(json);
            }
        };
        input.click();
    };

    return (
        <>
            <div className="settings-backdrop" onClick={onClose} />
            <div className={`settings-panel ${className || ''}`}>
                {/* Header */}
                <div className="settings-panel__header">
                    <h2>Settings</h2>
                    <div className="settings-panel__actions">
                        <button onClick={handleExport} title="Export Settings">📤</button>
                        <button onClick={handleImport} title="Import Settings">📥</button>
                        <button onClick={resetToDefaults} title="Reset to Defaults">🔄</button>
                        <button onClick={onClose}>✕</button>
                    </div>
                </div>

                {/* Search */}
                <div className="settings-panel__search">
                    <input
                        type="text"
                        placeholder="Search settings..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="settings-panel__body">
                    {/* Tabs */}
                    <div className="settings-panel__tabs">
                        {(['editor', 'ai', 'terminal', 'appearance', 'keybindings'] as SettingsTab[]).map(tab => (
                            <button
                                key={tab}
                                className={`settings-panel__tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {getTabIcon(tab)} {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="settings-panel__content">
                        {activeTab === 'editor' && (
                            <SettingsSection
                                title="Editor"
                                schema={EDITOR_SCHEMA}
                                values={editor as unknown as Record<string, unknown>}
                                onChange={(v) => updateEditor(v as Partial<typeof editor>)}
                                searchQuery={searchQuery}
                            />
                        )}

                        {activeTab === 'ai' && (
                            <SettingsSection
                                title="AI"
                                schema={AI_SCHEMA}
                                values={ai as unknown as Record<string, unknown>}
                                onChange={(v) => updateAI(v as Partial<typeof ai>)}
                                searchQuery={searchQuery}
                            />
                        )}

                        {activeTab === 'terminal' && (
                            <div className="settings-section">
                                <h3>Terminal</h3>
                                <SettingField
                                    schema={{ key: 'fontSize', label: 'Font Size', type: 'number', min: 8, max: 24 }}
                                    value={terminal.fontSize}
                                    onChange={v => updateTerminal({ fontSize: v as number })}
                                />
                                <SettingField
                                    schema={{ key: 'fontFamily', label: 'Font Family', type: 'string' }}
                                    value={terminal.fontFamily}
                                    onChange={v => updateTerminal({ fontFamily: v as string })}
                                />
                                <SettingField
                                    schema={{ key: 'shell', label: 'Shell', type: 'string' }}
                                    value={terminal.shell}
                                    onChange={v => updateTerminal({ shell: v as string })}
                                />
                                <SettingField
                                    schema={{ key: 'cursorBlink', label: 'Cursor Blink', type: 'boolean' }}
                                    value={terminal.cursorBlink}
                                    onChange={v => updateTerminal({ cursorBlink: v as boolean })}
                                />
                                <SettingField
                                    schema={{ key: 'scrollback', label: 'Scrollback Lines', type: 'number', min: 100, max: 10000 }}
                                    value={terminal.scrollback}
                                    onChange={v => updateTerminal({ scrollback: v as number })}
                                />
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="settings-section">
                                <h3>Appearance</h3>
                                <SettingField
                                    schema={{
                                        key: 'theme',
                                        label: 'Theme',
                                        type: 'select',
                                        options: [
                                            { value: 'dark', label: 'Dark' },
                                            { value: 'light', label: 'Light' },
                                            { value: 'monokai', label: 'Monokai Pro' },
                                            { value: 'nord', label: 'Nord' },
                                        ],
                                    }}
                                    value={appearance.theme}
                                    onChange={v => updateAppearance({ theme: v as string })}
                                />
                                <SettingField
                                    schema={{
                                        key: 'sidebarPosition',
                                        label: 'Sidebar Position',
                                        type: 'select',
                                        options: [
                                            { value: 'left', label: 'Left' },
                                            { value: 'right', label: 'Right' },
                                        ],
                                    }}
                                    value={appearance.sidebarPosition}
                                    onChange={v => updateAppearance({ sidebarPosition: v as 'left' | 'right' })}
                                />
                                <SettingField
                                    schema={{ key: 'activityBarVisible', label: 'Activity Bar', type: 'boolean' }}
                                    value={appearance.activityBarVisible}
                                    onChange={v => updateAppearance({ activityBarVisible: v as boolean })}
                                />
                                <SettingField
                                    schema={{ key: 'statusBarVisible', label: 'Status Bar', type: 'boolean' }}
                                    value={appearance.statusBarVisible}
                                    onChange={v => updateAppearance({ statusBarVisible: v as boolean })}
                                />
                                <SettingField
                                    schema={{ key: 'tabsVisible', label: 'Tabs', type: 'boolean' }}
                                    value={appearance.tabsVisible}
                                    onChange={v => updateAppearance({ tabsVisible: v as boolean })}
                                />
                                <SettingField
                                    schema={{ key: 'breadcrumbsVisible', label: 'Breadcrumbs', type: 'boolean' }}
                                    value={appearance.breadcrumbsVisible}
                                    onChange={v => updateAppearance({ breadcrumbsVisible: v as boolean })}
                                />
                            </div>
                        )}

                        {activeTab === 'keybindings' && (
                            <div className="settings-section">
                                <h3>Keybindings</h3>
                                <SettingField
                                    schema={{
                                        key: 'scheme',
                                        label: 'Keybinding Scheme',
                                        type: 'select',
                                        options: [
                                            { value: 'default', label: 'Default' },
                                            { value: 'vim', label: 'Vim' },
                                            { value: 'emacs', label: 'Emacs' },
                                        ],
                                    }}
                                    value={keybindings.scheme}
                                    onChange={() => { }}
                                />
                                <p className="settings-section__note">
                                    Custom keybindings can be configured in keybindings.json
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

// =============================================================================
// SETTINGS SECTION COMPONENT
// =============================================================================

interface SettingsSectionProps {
    title: string;
    schema: SettingSchema[];
    values: Record<string, unknown>;
    onChange: (values: Record<string, unknown>) => void;
    searchQuery: string;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
    title,
    schema,
    values,
    onChange,
    searchQuery,
}) => {
    const filteredSchema = schema.filter(s =>
        !searchQuery ||
        s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.key.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="settings-section">
            <h3>{title}</h3>
            {filteredSchema.map(setting => (
                <SettingField
                    key={setting.key}
                    schema={setting}
                    value={values[setting.key]}
                    onChange={value => onChange({ [setting.key]: value })}
                />
            ))}
        </div>
    );
};

// =============================================================================
// SETTING FIELD COMPONENT
// =============================================================================

interface SettingFieldProps {
    schema: SettingSchema;
    value: unknown;
    onChange: (value: unknown) => void;
}

const SettingField: React.FC<SettingFieldProps> = ({ schema, value, onChange }) => {
    const { key, label, description, type, options, min, max, step } = schema;

    return (
        <div className="setting-field">
            <div className="setting-field__header">
                <label htmlFor={key} className="setting-field__label">{label}</label>
                {description && <span className="setting-field__description">{description}</span>}
            </div>
            <div className="setting-field__input">
                {type === 'boolean' && (
                    <input
                        id={key}
                        type="checkbox"
                        checked={value as boolean}
                        onChange={e => onChange(e.target.checked)}
                    />
                )}
                {type === 'number' && (
                    <input
                        id={key}
                        type="number"
                        value={value as number}
                        onChange={e => onChange(parseFloat(e.target.value))}
                        min={min}
                        max={max}
                        step={step}
                    />
                )}
                {type === 'string' && (
                    <input
                        id={key}
                        type="text"
                        value={value as string}
                        onChange={e => onChange(e.target.value)}
                    />
                )}
                {type === 'select' && (
                    <select
                        id={key}
                        value={value as string}
                        onChange={e => onChange(e.target.value)}
                    >
                        {options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}
            </div>
        </div>
    );
};

function getTabIcon(tab: SettingsTab): string {
    switch (tab) {
        case 'editor': return '📝';
        case 'ai': return '🤖';
        case 'terminal': return '💻';
        case 'appearance': return '🎨';
        case 'keybindings': return '⌨️';
    }
}

export default SettingsPanel;
