/**
 * Settings Panel Component
 * 
 * UI for viewing and modifying IDE settings.
 */

import React, { useState } from 'react';
import {
    useSettingsService,
    SettingDefinition,
    SettingCategory,
    CATEGORY_INFO
} from '../lib/settings/settings-service';

interface SettingsPanelProps {
    className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ className }) => {
    const {
        searchQuery,
        activeScope,
        modifiedOnly,
        definitions,
        setSearchQuery,
        setActiveScope,
        setModifiedOnly,
        searchDefinitions,
        getDefinitionsByCategory,
        isModified,
    } = useSettingsService();

    const [activeCategory, setActiveCategory] = useState<SettingCategory | null>(null);

    const categories = Object.keys(CATEGORY_INFO) as SettingCategory[];

    const filteredDefinitions = searchQuery
        ? searchDefinitions(searchQuery)
        : activeCategory
            ? getDefinitionsByCategory(activeCategory)
            : [];

    const visibleDefinitions = modifiedOnly
        ? filteredDefinitions.filter(d => isModified(d.key))
        : filteredDefinitions;

    return (
        <div className={`settings-panel ${className || ''}`}>
            {/* Header */}
            <div className="settings-panel__header">
                <h2>Settings</h2>
                <div className="settings-panel__scope-tabs">
                    <button
                        className={activeScope === 'user' ? 'active' : ''}
                        onClick={() => setActiveScope('user')}
                    >
                        User
                    </button>
                    <button
                        className={activeScope === 'workspace' ? 'active' : ''}
                        onClick={() => setActiveScope('workspace')}
                    >
                        Workspace
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="settings-panel__search">
                <input
                    type="text"
                    placeholder="Search settings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <label className="settings-panel__filter">
                    <input
                        type="checkbox"
                        checked={modifiedOnly}
                        onChange={(e) => setModifiedOnly(e.target.checked)}
                    />
                    Modified only
                </label>
            </div>

            {/* Content */}
            <div className="settings-panel__content">
                {/* Categories Sidebar */}
                <div className="settings-panel__sidebar">
                    {categories.map(category => {
                        const info = CATEGORY_INFO[category];
                        const count = definitions.filter(d => d.category === category).length;

                        return (
                            <button
                                key={category}
                                className={`settings-panel__category ${activeCategory === category ? 'active' : ''}`}
                                onClick={() => setActiveCategory(category)}
                            >
                                <span className="settings-panel__category-icon">{info.icon}</span>
                                <span className="settings-panel__category-label">{info.label}</span>
                                <span className="settings-panel__category-count">{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Settings List */}
                <div className="settings-panel__list">
                    {activeCategory && (
                        <div className="settings-panel__category-header">
                            <span>{CATEGORY_INFO[activeCategory].icon}</span>
                            <span>{CATEGORY_INFO[activeCategory].label}</span>
                            <span className="settings-panel__category-desc">
                                {CATEGORY_INFO[activeCategory].description}
                            </span>
                        </div>
                    )}

                    {visibleDefinitions.length === 0 ? (
                        <div className="settings-panel__empty">
                            {searchQuery
                                ? `No settings found for "${searchQuery}"`
                                : 'Select a category to view settings'}
                        </div>
                    ) : (
                        visibleDefinitions.map(def => (
                            <SettingItem key={def.key} definition={def} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// SETTING ITEM
// =============================================================================

interface SettingItemProps {
    definition: SettingDefinition;
}

const SettingItem: React.FC<SettingItemProps> = ({ definition }) => {
    const { getSetting, setSetting, resetSetting, isModified } = useSettingsService();

    const value = getSetting(definition.key);
    const modified = isModified(definition.key);

    const handleChange = (newValue: unknown) => {
        setSetting(definition.key, newValue);
    };

    return (
        <div className={`setting-item ${modified ? 'setting-item--modified' : ''}`}>
            <div className="setting-item__header">
                <span className="setting-item__key">{definition.key}</span>
                {modified && (
                    <button
                        className="setting-item__reset"
                        onClick={() => resetSetting(definition.key)}
                        title="Reset to default"
                    >
                        ↺
                    </button>
                )}
            </div>
            <p className="setting-item__description">{definition.description}</p>

            <div className="setting-item__control">
                {renderControl(definition, value, handleChange)}
            </div>
        </div>
    );
};

function renderControl(
    definition: SettingDefinition,
    value: unknown,
    onChange: (value: unknown) => void
): React.ReactNode {
    switch (definition.type) {
        case 'boolean':
            return (
                <label className="setting-control__checkbox">
                    <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                    <span className="setting-control__toggle"></span>
                </label>
            );

        case 'number':
            return (
                <input
                    type="number"
                    className="setting-control__number"
                    value={Number(value) || 0}
                    onChange={(e) => onChange(Number(e.target.value))}
                />
            );

        case 'string':
            return (
                <input
                    type="text"
                    className="setting-control__text"
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                />
            );

        case 'enum':
            return (
                <select
                    className="setting-control__select"
                    value={String(value || '')}
                    onChange={(e) => onChange(e.target.value)}
                >
                    {definition.enumValues?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );

        default:
            return (
                <textarea
                    className="setting-control__json"
                    value={JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                        try {
                            onChange(JSON.parse(e.target.value));
                        } catch {
                            // Invalid JSON, ignore
                        }
                    }}
                />
            );
    }
}

export default SettingsPanel;
