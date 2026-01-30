/**
 * Extensions Panel Component
 * 
 * UI for browsing and managing extensions.
 */

import React from 'react';
import {
    useExtensionsService,
    Extension,
    ExtensionCategory,
    EXTENSION_CATEGORY_INFO,
} from '../lib/extensions/extensions-service';

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
        setSearchQuery,
        setSelectedCategory,
        searchExtensions,
        getByCategory,
        getRecommended,
        isInstalled,
    } = useExtensionsService();

    const getFilteredExtensions = (): Extension[] => {
        if (searchQuery) {
            return searchExtensions(searchQuery);
        }

        switch (selectedCategory) {
            case 'installed':
                return installed;
            case 'recommended':
                return getRecommended();
            case 'all':
                return marketplace;
            default:
                return getByCategory(selectedCategory);
        }
    };

    const extensions = getFilteredExtensions();
    const categories = Object.keys(EXTENSION_CATEGORY_INFO) as ExtensionCategory[];

    return (
        <div className={`extensions-panel ${className || ''}`}>
            {/* Search */}
            <div className="extensions-panel__search">
                <input
                    type="text"
                    placeholder="Search extensions in marketplace..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Category Tabs */}
            <div className="extensions-panel__tabs">
                <button
                    className={selectedCategory === 'installed' ? 'active' : ''}
                    onClick={() => setSelectedCategory('installed')}
                >
                    Installed ({installed.length})
                </button>
                <button
                    className={selectedCategory === 'recommended' ? 'active' : ''}
                    onClick={() => setSelectedCategory('recommended')}
                >
                    Recommended
                </button>
                <button
                    className={selectedCategory === 'all' ? 'active' : ''}
                    onClick={() => setSelectedCategory('all')}
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
                            onClick={() => setSelectedCategory(category)}
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
                ) : extensions.length === 0 ? (
                    <div className="extensions-panel__empty">
                        {searchQuery
                            ? `No extensions found for "${searchQuery}"`
                            : selectedCategory === 'installed'
                                ? 'No extensions installed'
                                : 'No extensions available'}
                    </div>
                ) : (
                    extensions.map(ext => (
                        <ExtensionCard
                            key={ext.id}
                            extension={ext}
                            isInstalled={isInstalled(ext.id)}
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
    isInstalled: boolean;
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({ extension, isInstalled }) => {
    const { installExtension, uninstallExtension, isLoading } = useExtensionsService();

    const handleInstall = async () => {
        await installExtension(extension);
    };

    const handleUninstall = async () => {
        await uninstallExtension(extension.id);
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
                        ⬇️ {formatDownloads(extension.downloadCount)}
                    </span>
                    <div className="extension-card__tags">
                        {extension.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="extension-card__tag">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="extension-card__actions">
                {isInstalled ? (
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
