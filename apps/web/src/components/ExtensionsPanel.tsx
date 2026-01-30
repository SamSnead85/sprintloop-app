/**
 * Extensions Panel Component
 * 
 * UI for browsing and managing extensions.
 */

import React, { useMemo, useState } from 'react';
import {
    useExtensionsService,
    Extension,
    ExtensionCategory,
} from '../lib/extensions/extensions-service';

// =============================================================================
// CATEGORY INFO
// =============================================================================

const EXTENSION_CATEGORY_INFO: Record<ExtensionCategory, { label: string; icon: string }> = {
    themes: { label: 'Themes', icon: '🎨' },
    languages: { label: 'Languages', icon: '📝' },
    snippets: { label: 'Snippets', icon: '✂️' },
    formatters: { label: 'Formatters', icon: '✨' },
    linters: { label: 'Linters', icon: '🔍' },
    debuggers: { label: 'Debuggers', icon: '🐛' },
    keymaps: { label: 'Keymaps', icon: '⌨️' },
    other: { label: 'Other', icon: '📦' },
};

type TabType = 'installed' | 'recommended' | 'all';

interface ExtensionsPanelProps {
    className?: string;
}

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ className }) => {
    const {
        installed,
        marketplace,
        isLoading,
        searchQuery,
        selectedCategory,
        searchMarketplace,
        filterByCategory,
        getExtensionsByCategory,
    } = useExtensionsService();

    const [activeTab, setActiveTab] = useState<TabType>('installed');

    const handleSearch = (query: string) => {
        searchMarketplace(query);
    };

    const handleCategoryClick = (category: ExtensionCategory | null) => {
        filterByCategory(category);
        setActiveTab('all');
    };

    const handleTabClick = (tab: TabType) => {
        setActiveTab(tab);
        if (tab !== 'all') {
            filterByCategory(null);
        }
    };

    const filteredExtensions = useMemo((): Extension[] => {
        const query = searchQuery.toLowerCase();
        let baseList: Extension[];

        switch (activeTab) {
            case 'installed':
                baseList = installed;
                break;
            case 'recommended':
                baseList = marketplace.filter(e => !e.installed && e.rating >= 4.5);
                break;
            case 'all':
                baseList = selectedCategory ? getExtensionsByCategory(selectedCategory) : marketplace;
                break;
            default:
                baseList = marketplace;
        }

        if (query) {
            return baseList.filter(e =>
                e.displayName.toLowerCase().includes(query) ||
                e.description.toLowerCase().includes(query) ||
                e.publisher.toLowerCase().includes(query)
            );
        }
        return baseList;
    }, [activeTab, installed, marketplace, searchQuery, selectedCategory, getExtensionsByCategory]);

    const categories = Object.keys(EXTENSION_CATEGORY_INFO) as ExtensionCategory[];

    return (
        <div className={`extensions-panel ${className || ''}`}>
            {/* Search */}
            <div className="extensions-panel__search">
                <input
                    type="text"
                    placeholder="Search extensions in marketplace..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
            </div>

            {/* Category Tabs */}
            <div className="extensions-panel__tabs">
                <button
                    className={activeTab === 'installed' ? 'active' : ''}
                    onClick={() => handleTabClick('installed')}
                >
                    Installed ({installed.length})
                </button>
                <button
                    className={activeTab === 'recommended' ? 'active' : ''}
                    onClick={() => handleTabClick('recommended')}
                >
                    Recommended
                </button>
                <button
                    className={activeTab === 'all' ? 'active' : ''}
                    onClick={() => handleTabClick('all')}
                >
                    All
                </button>
            </div>

            {/* Categories Filter */}
            <div className="extensions-panel__categories">
                {categories.map(category => {
                    const info = EXTENSION_CATEGORY_INFO[category];
                    return (
                        <button
                            key={category}
                            className={`extensions-panel__category-btn ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => handleCategoryClick(category)}
                            title={info.label}
                        >
                            {info.icon}
                        </button>
                    );
                })}
            </div>

            {/* Extensions List */}
            <div className="extensions-panel__list">
                {isLoading ? (
                    <div className="extensions-panel__loading">Loading...</div>
                ) : filteredExtensions.length === 0 ? (
                    <div className="extensions-panel__empty">
                        {searchQuery
                            ? `No extensions found for "${searchQuery}"`
                            : activeTab === 'installed'
                                ? 'No extensions installed'
                                : 'No extensions available'}
                    </div>
                ) : (
                    filteredExtensions.map(ext => (
                        <ExtensionCard
                            key={ext.id}
                            extension={ext}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

// =============================================================================
// EXTENSION CARD
// =============================================================================

interface ExtensionCardProps {
    extension: Extension;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension }) => {
    const { install, uninstall, isLoading } = useExtensionsService();

    const handleInstall = async () => {
        await install(extension.id);
    };

    const handleUninstall = () => {
        uninstall(extension.id);
    };

    const formatDownloads = (count: number): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
        return String(count);
    };

    return (
        <div className="extension-card">
            <div className="extension-card__icon">
                {extension.icon || '📦'}
            </div>

            <div className="extension-card__info">
                <div className="extension-card__header">
                    <span className="extension-card__name">{extension.displayName}</span>
                    <span className="extension-card__version">v{extension.version}</span>
                </div>

                <div className="extension-card__publisher">
                    {extension.publisher}
                </div>

                <p className="extension-card__description">
                    {extension.description}
                </p>

                <div className="extension-card__meta">
                    <span className="extension-card__rating">
                        ⭐ {extension.rating.toFixed(1)}
                    </span>
                    <span className="extension-card__downloads">
                        ⬇️ {formatDownloads(extension.downloads)}
                    </span>
                    <div className="extension-card__tags">
                        {extension.categories.slice(0, 2).map(cat => (
                            <span key={cat} className="extension-card__tag">{cat}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="extension-card__actions">
                {extension.installed ? (
                    <button
                        className="extension-card__btn extension-card__btn--uninstall"
                        onClick={handleUninstall}
                        disabled={isLoading}
                    >
                        Uninstall
                    </button>
                ) : (
                    <button
                        className="extension-card__btn extension-card__btn--install"
                        onClick={handleInstall}
                        disabled={isLoading}
                    >
                        Install
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExtensionsPanel;
