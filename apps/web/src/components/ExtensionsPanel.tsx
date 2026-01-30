/**
 * Extensions Panel Component
 * 
 * Browse and manage extensions.
 */

import React, { useState, useEffect } from 'react';
import { useExtensions, type Extension, type ExtensionCategory } from '../lib/extensions/extensions';

interface ExtensionsPanelProps {
    className?: string;
}

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ className }) => {
    const {
        extensions,
        marketplace,
        isLoading,
        install,
        uninstall,
        enable,
        disable,
        loadMarketplace,
    } = useExtensions();

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'installed' | 'marketplace'>('installed');
    const [categoryFilter, setCategoryFilter] = useState<ExtensionCategory | 'all'>('all');

    useEffect(() => {
        if (marketplace.length === 0) {
            loadMarketplace();
        }
    }, [marketplace.length, loadMarketplace]);

    const installedExtensions = Array.from(extensions.values()).filter(e => e.installed);

    const filteredExtensions = (activeTab === 'installed' ? installedExtensions : marketplace)
        .filter(e => {
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return e.name.toLowerCase().includes(q) ||
                    e.displayName.toLowerCase().includes(q) ||
                    e.description.toLowerCase().includes(q);
            }
            return true;
        })
        .filter(e => {
            if (categoryFilter === 'all') return true;
            return e.categories.includes(categoryFilter);
        });

    return (
        <div className={`extensions-panel ${className || ''}`}>
            {/* Header */}
            <div className="extensions-panel__header">
                <span className="extensions-panel__title">EXTENSIONS</span>
            </div>

            {/* Search */}
            <div className="extensions-panel__search">
                <input
                    type="text"
                    placeholder="Search extensions..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Tabs */}
            <div className="extensions-panel__tabs">
                <button
                    className={`extensions-panel__tab ${activeTab === 'installed' ? 'active' : ''}`}
                    onClick={() => setActiveTab('installed')}
                >
                    Installed ({installedExtensions.length})
                </button>
                <button
                    className={`extensions-panel__tab ${activeTab === 'marketplace' ? 'active' : ''}`}
                    onClick={() => setActiveTab('marketplace')}
                >
                    Marketplace
                </button>
            </div>

            {/* Category Filter */}
            <div className="extensions-panel__filters">
                <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value as ExtensionCategory | 'all')}
                >
                    <option value="all">All Categories</option>
                    <option value="themes">Themes</option>
                    <option value="languages">Languages</option>
                    <option value="linters">Linters</option>
                    <option value="formatters">Formatters</option>
                    <option value="ai">AI</option>
                    <option value="other">Other</option>
                </select>
            </div>

            {/* Extensions List */}
            <div className="extensions-panel__list">
                {isLoading && (
                    <div className="extensions-panel__loading">Loading...</div>
                )}
                {!isLoading && filteredExtensions.length === 0 && (
                    <div className="extensions-panel__empty">
                        {activeTab === 'installed' ? 'No extensions installed' : 'No extensions found'}
                    </div>
                )}
                {filteredExtensions.map(ext => (
                    <ExtensionCard
                        key={ext.id}
                        extension={ext}
                        isInstalled={extensions.has(ext.id)}
                        onInstall={() => install(ext.id)}
                        onUninstall={() => uninstall(ext.id)}
                        onEnable={() => enable(ext.id)}
                        onDisable={() => disable(ext.id)}
                    />
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// EXTENSION CARD COMPONENT
// =============================================================================

interface ExtensionCardProps {
    extension: Extension;
    isInstalled: boolean;
    onInstall: () => void;
    onUninstall: () => void;
    onEnable: () => void;
    onDisable: () => void;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({
    extension,
    isInstalled,
    onInstall,
    onUninstall,
    onEnable,
    onDisable,
}) => {
    return (
        <div className={`extension-card ${!extension.enabled ? 'extension-card--disabled' : ''}`}>
            <div className="extension-card__icon">
                {extension.icon || '📦'}
            </div>
            <div className="extension-card__content">
                <div className="extension-card__name">{extension.displayName}</div>
                <div className="extension-card__description">{extension.description}</div>
                <div className="extension-card__meta">
                    <span className="extension-card__author">{extension.author}</span>
                    <span className="extension-card__version">v{extension.version}</span>
                </div>
            </div>
            <div className="extension-card__actions">
                {isInstalled ? (
                    <>
                        <button
                            className="extension-card__action"
                            onClick={extension.enabled ? onDisable : onEnable}
                        >
                            {extension.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                            className="extension-card__action extension-card__action--danger"
                            onClick={onUninstall}
                        >
                            Uninstall
                        </button>
                    </>
                ) : (
                    <button className="extension-card__action extension-card__action--primary" onClick={onInstall}>
                        Install
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExtensionsPanel;
