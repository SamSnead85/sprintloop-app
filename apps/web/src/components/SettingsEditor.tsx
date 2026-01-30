/**
 * Settings Editor Component
 * 
 * UI for viewing and editing IDE settings with categories and search.
 */

import { useState } from 'react';
import {
    Search, X, RotateCcw, Download, Upload,
    ChevronRight, Settings
} from 'lucide-react';
import {
    usePreferencesService,
    getCategoryIcon,
    getCategoryLabel,
    SettingDefinition,
    SettingCategory
} from '../lib/settings/preferences-service';

const CATEGORIES: SettingCategory[] = [
    'editor', 'workbench', 'terminal', 'files', 'search', 'git', 'extensions', 'ai'
];

export function SettingsEditor() {
    const {
        searchQuery,
        activeCategory,
        showModified,
        setSearchQuery,
        setActiveCategory,
        toggleShowModified,
        getFilteredSettings,
        getModifiedCount,
        resetAll,
        exportSettings,
        importSettings,
    } = usePreferencesService();

    const [showExport, setShowExport] = useState(false);
    const [exportJson, setExportJson] = useState('');
    const filteredSettings = getFilteredSettings();
    const modifiedCount = getModifiedCount();

    const handleExport = () => {
        setExportJson(exportSettings());
        setShowExport(true);
    };

    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result as string;
                    importSettings(content);
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    return (
        <div className="settings-editor">
            {/* Header */}
            <div className="settings-header">
                <div className="settings-title">
                    <Settings size={18} />
                    Settings
                </div>
                <div className="settings-actions">
                    <button onClick={handleExport} title="Export Settings">
                        <Download size={14} />
                    </button>
                    <button onClick={handleImport} title="Import Settings">
                        <Upload size={14} />
                    </button>
                    <button onClick={resetAll} title="Reset All Settings">
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="settings-search">
                <Search size={14} />
                <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button onClick={() => setSearchQuery('')}>
                        <X size={12} />
                    </button>
                )}
            </div>

            {/* Filter Bar */}
            <div className="settings-filters">
                <button
                    className={`filter-btn ${showModified ? 'active' : ''}`}
                    onClick={toggleShowModified}
                >
                    Modified ({modifiedCount})
                </button>
            </div>

            {/* Main Content */}
            <div className="settings-content">
                {/* Categories Sidebar */}
                <div className="settings-sidebar">
                    <button
                        className={`category-btn ${!activeCategory ? 'active' : ''}`}
                        onClick={() => setActiveCategory(null)}
                    >
                        <span className="category-icon">📋</span>
                        All Settings
                    </button>
                    {CATEGORIES.map(category => (
                        <button
                            key={category}
                            className={`category-btn ${activeCategory === category ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category)}
                        >
                            <span className="category-icon">{getCategoryIcon(category)}</span>
                            {getCategoryLabel(category)}
                        </button>
                    ))}
                </div>

                {/* Settings List */}
                <div className="settings-list">
                    {filteredSettings.length === 0 ? (
                        <div className="no-settings">
                            No settings match your search
                        </div>
                    ) : (
                        filteredSettings.map(setting => (
                            <SettingItem key={setting.key} setting={setting} />
                        ))
                    )}
                </div>
            </div>

            {/* Export Modal */}
            {showExport && (
                <div className="settings-modal-overlay" onClick={() => setShowExport(false)}>
                    <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Export Settings</h3>
                            <button onClick={() => setShowExport(false)}>
                                <X size={16} />
                            </button>
                        </div>
                        <textarea
                            value={exportJson}
                            readOnly
                            rows={15}
                        />
                        <div className="modal-actions">
                            <button onClick={() => {
                                navigator.clipboard.writeText(exportJson);
                            }}>
                                Copy to Clipboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// =============================================================================
// SETTING ITEM
// =============================================================================

interface SettingItemProps {
    setting: SettingDefinition;
}

function SettingItem({ setting }: SettingItemProps) {
    const { getSetting, setSetting, resetSetting, isModified } = usePreferencesService();
    const value = getSetting(setting.key);
    const modified = isModified(setting.key);

    return (
        <div className={`setting-item ${modified ? 'modified' : ''}`}>
            <div className="setting-info">
                <div className="setting-header">
                    <span className="setting-key">{setting.key}</span>
                    {modified && (
                        <button
                            className="reset-btn"
                            onClick={() => resetSetting(setting.key)}
                            title="Reset to default"
                        >
                            <RotateCcw size={12} />
                        </button>
                    )}
                </div>
                <div className="setting-label">{setting.label}</div>
                <div className="setting-description">{setting.description}</div>
            </div>
            <div className="setting-control">
                <SettingControl
                    setting={setting}
                    value={value}
                    onChange={(v) => setSetting(setting.key, v)}
                />
            </div>
        </div>
    );
}

// =============================================================================
// SETTING CONTROL
// =============================================================================

interface SettingControlProps {
    setting: SettingDefinition;
    value: unknown;
    onChange: (value: unknown) => void;
}

function SettingControl({ setting, value, onChange }: SettingControlProps) {
    switch (setting.type) {
        case 'boolean':
            return (
                <button
                    className={`toggle-switch ${value ? 'on' : 'off'}`}
                    onClick={() => onChange(!value)}
                >
                    <span className="toggle-track">
                        <span className="toggle-thumb" />
                    </span>
                    <span className="toggle-label">{value ? 'On' : 'Off'}</span>
                </button>
            );

        case 'number':
            return (
                <input
                    type="number"
                    className="number-input"
                    value={value as number}
                    min={setting.min}
                    max={setting.max}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            );

        case 'string':
            return (
                <input
                    type="text"
                    className="text-input"
                    value={value as string}
                    onChange={(e) => onChange(e.target.value)}
                />
            );

        case 'select':
            return (
                <select
                    className="select-input"
                    value={value as string}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {setting.options?.map(opt => (
                        <option key={String(opt.value)} value={String(opt.value)}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );

        case 'color':
            return (
                <input
                    type="color"
                    className="color-input"
                    value={value as string}
                    onChange={(e) => onChange(e.target.value)}
                />
            );

        case 'array':
            return (
                <div className="array-preview">
                    {(value as string[]).length} items
                    <ChevronRight size={12} />
                </div>
            );

        default:
            return <span>Unsupported type</span>;
    }
}

export default SettingsEditor;
