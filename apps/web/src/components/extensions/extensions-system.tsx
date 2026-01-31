/**
 * SprintLoop Extension System
 * 
 * Phase 1151-1200: Extension marketplace
 * - Extension cards
 * - Install/uninstall
 * - Extension settings
 * - Marketplace browser
 * - Extension recommendations
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
    Package,
    Download,
    Check,
    X,
    Star,
    Settings,
    Search,
    Filter,
    ChevronDown,
    ExternalLink,
    RefreshCw,
    Shield,
    Zap,
    Code,
    Palette,
    Terminal,
    GitBranch,
    Globe,
    Trash2,
    ToggleLeft,
    ToggleRight
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

type ExtensionCategory = 'language' | 'theme' | 'linter' | 'debugger' | 'formatter' | 'git' | 'ai' | 'utility' | 'productivity'

interface Extension {
    id: string
    name: string
    displayName: string
    description: string
    version: string
    publisher: string
    publisherVerified: boolean
    category: ExtensionCategory
    icon?: string
    iconColor?: string
    rating: number
    ratingCount: number
    downloadCount: number
    lastUpdated: Date
    installed: boolean
    enabled: boolean
    homepage?: string
    repository?: string
    tags?: string[]
    dependencies?: string[]
}

interface ExtensionSettings {
    extensionId: string
    settings: Record<string, unknown>
}

// ============================================================================
// MOCK DATA
// ============================================================================

const mockExtensions: Extension[] = [
    {
        id: 'typescript-language',
        name: 'typescript-language',
        displayName: 'TypeScript Language Features',
        description: 'Advanced TypeScript language support with IntelliSense, refactoring, and more',
        version: '5.3.0',
        publisher: 'Microsoft',
        publisherVerified: true,
        category: 'language',
        iconColor: '#3178c6',
        rating: 4.9,
        ratingCount: 12500,
        downloadCount: 5800000,
        lastUpdated: new Date('2024-01-15'),
        installed: true,
        enabled: true,
        tags: ['typescript', 'javascript', 'intellisense'],
    },
    {
        id: 'eslint',
        name: 'eslint',
        displayName: 'ESLint',
        description: 'Integrates ESLint JavaScript into VS Code',
        version: '2.4.2',
        publisher: 'Dirk Baeumer',
        publisherVerified: true,
        category: 'linter',
        iconColor: '#4B32C3',
        rating: 4.7,
        ratingCount: 8900,
        downloadCount: 4200000,
        lastUpdated: new Date('2024-01-10'),
        installed: true,
        enabled: true,
        tags: ['linter', 'javascript', 'typescript'],
    },
    {
        id: 'prettier',
        name: 'prettier',
        displayName: 'Prettier - Code Formatter',
        description: 'Code formatter using prettier',
        version: '10.1.0',
        publisher: 'Prettier',
        publisherVerified: true,
        category: 'formatter',
        iconColor: '#c596c7',
        rating: 4.6,
        ratingCount: 7200,
        downloadCount: 3900000,
        lastUpdated: new Date('2024-01-08'),
        installed: true,
        enabled: true,
        tags: ['formatter', 'code style'],
    },
    {
        id: 'github-copilot',
        name: 'github-copilot',
        displayName: 'GitHub Copilot',
        description: 'Your AI pair programmer',
        version: '1.156.0',
        publisher: 'GitHub',
        publisherVerified: true,
        category: 'ai',
        iconColor: '#000000',
        rating: 4.5,
        ratingCount: 15000,
        downloadCount: 8500000,
        lastUpdated: new Date('2024-01-20'),
        installed: false,
        enabled: false,
        tags: ['ai', 'autocomplete', 'copilot'],
    },
    {
        id: 'tokyo-night',
        name: 'tokyo-night',
        displayName: 'Tokyo Night',
        description: 'A clean, dark theme that celebrates the lights of Downtown Tokyo at night',
        version: '1.0.3',
        publisher: 'enkia',
        publisherVerified: false,
        category: 'theme',
        iconColor: '#7aa2f7',
        rating: 4.8,
        ratingCount: 3200,
        downloadCount: 1200000,
        lastUpdated: new Date('2023-12-15'),
        installed: false,
        enabled: false,
        tags: ['theme', 'dark', 'tokyo'],
    },
    {
        id: 'gitlens',
        name: 'gitlens',
        displayName: 'GitLens — Git supercharged',
        description: 'Supercharge Git within VS Code',
        version: '14.7.0',
        publisher: 'GitKraken',
        publisherVerified: true,
        category: 'git',
        iconColor: '#00b4a0',
        rating: 4.7,
        ratingCount: 9500,
        downloadCount: 4800000,
        lastUpdated: new Date('2024-01-18'),
        installed: false,
        enabled: false,
        tags: ['git', 'blame', 'history'],
    },
]

// ============================================================================
// CONTEXT
// ============================================================================

interface ExtensionsContextValue {
    extensions: Extension[]
    installedExtensions: Extension[]
    install: (extensionId: string) => Promise<void>
    uninstall: (extensionId: string) => Promise<void>
    enable: (extensionId: string) => void
    disable: (extensionId: string) => void
    search: (query: string, category?: ExtensionCategory) => Extension[]
    getRecommendations: () => Extension[]
}

const ExtensionsContext = createContext<ExtensionsContextValue | null>(null)

export function useExtensions() {
    const context = useContext(ExtensionsContext)
    if (!context) throw new Error('useExtensions must be used within ExtensionsProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface ExtensionsProviderProps {
    children: React.ReactNode
}

export function ExtensionsProvider({ children }: ExtensionsProviderProps) {
    const [extensions, setExtensions] = useState<Extension[]>(mockExtensions)

    const installedExtensions = useMemo(
        () => extensions.filter(e => e.installed),
        [extensions]
    )

    const install = useCallback(async (extensionId: string) => {
        // Simulate installation
        await new Promise(resolve => setTimeout(resolve, 1500))
        setExtensions(prev =>
            prev.map(e =>
                e.id === extensionId
                    ? { ...e, installed: true, enabled: true }
                    : e
            )
        )
    }, [])

    const uninstall = useCallback(async (extensionId: string) => {
        await new Promise(resolve => setTimeout(resolve, 500))
        setExtensions(prev =>
            prev.map(e =>
                e.id === extensionId
                    ? { ...e, installed: false, enabled: false }
                    : e
            )
        )
    }, [])

    const enable = useCallback((extensionId: string) => {
        setExtensions(prev =>
            prev.map(e =>
                e.id === extensionId ? { ...e, enabled: true } : e
            )
        )
    }, [])

    const disable = useCallback((extensionId: string) => {
        setExtensions(prev =>
            prev.map(e =>
                e.id === extensionId ? { ...e, enabled: false } : e
            )
        )
    }, [])

    const search = useCallback((query: string, category?: ExtensionCategory) => {
        const lowerQuery = query.toLowerCase()
        return extensions.filter(e => {
            if (category && e.category !== category) return false
            return (
                e.name.toLowerCase().includes(lowerQuery) ||
                e.displayName.toLowerCase().includes(lowerQuery) ||
                e.description.toLowerCase().includes(lowerQuery) ||
                e.tags?.some(t => t.toLowerCase().includes(lowerQuery))
            )
        })
    }, [extensions])

    const getRecommendations = useCallback(() => {
        return extensions
            .filter(e => !e.installed)
            .sort((a, b) => b.downloadCount - a.downloadCount)
            .slice(0, 5)
    }, [extensions])

    return (
        <ExtensionsContext.Provider
            value={{
                extensions,
                installedExtensions,
                install,
                uninstall,
                enable,
                disable,
                search,
                getRecommendations,
            }}
        >
            {children}
        </ExtensionsContext.Provider>
    )
}

// ============================================================================
// CATEGORY ICON
// ============================================================================

function CategoryIcon({ category }: { category: ExtensionCategory }) {
    const icons: Record<ExtensionCategory, React.ReactNode> = {
        language: <Code className="w-4 h-4" />,
        theme: <Palette className="w-4 h-4" />,
        linter: <Shield className="w-4 h-4" />,
        debugger: <Zap className="w-4 h-4" />,
        formatter: <Code className="w-4 h-4" />,
        git: <GitBranch className="w-4 h-4" />,
        ai: <Zap className="w-4 h-4" />,
        utility: <Settings className="w-4 h-4" />,
        productivity: <Zap className="w-4 h-4" />,
    }
    return icons[category] || <Package className="w-4 h-4" />
}

// ============================================================================
// EXTENSION CARD
// ============================================================================

interface ExtensionCardProps {
    extension: Extension
    onInstall?: () => void
    onUninstall?: () => void
    onToggle?: () => void
    onSettings?: () => void
    compact?: boolean
}

export function ExtensionCard({
    extension,
    onInstall,
    onUninstall,
    onToggle,
    onSettings,
    compact = false,
}: ExtensionCardProps) {
    const [isInstalling, setIsInstalling] = useState(false)
    const { install, uninstall, enable, disable } = useExtensions()

    const handleInstall = async () => {
        setIsInstalling(true)
        try {
            await install(extension.id)
            onInstall?.()
        } finally {
            setIsInstalling(false)
        }
    }

    const handleUninstall = async () => {
        await uninstall(extension.id)
        onUninstall?.()
    }

    const handleToggle = () => {
        if (extension.enabled) {
            disable(extension.id)
        } else {
            enable(extension.id)
        }
        onToggle?.()
    }

    const formatDownloads = (count: number) => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
        if (count >= 1000) return `${(count / 1000).toFixed(0)}K`
        return count.toString()
    }

    if (compact) {
        return (
            <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: extension.iconColor ? `${extension.iconColor}20` : 'rgb(139 92 246 / 0.2)' }}
                >
                    <CategoryIcon category={extension.category} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-white truncate">{extension.displayName}</span>
                        {extension.publisherVerified && (
                            <Shield className="w-3.5 h-3.5 text-blue-400" />
                        )}
                    </div>
                    <div className="text-xs text-gray-500">{extension.publisher}</div>
                </div>

                {extension.installed ? (
                    <button
                        onClick={handleToggle}
                        className={`p-1 transition-colors ${extension.enabled ? 'text-green-400' : 'text-gray-500'}`}
                    >
                        {extension.enabled ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                ) : (
                    <button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="px-3 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-400 disabled:opacity-50 transition-colors"
                    >
                        {isInstalling ? 'Installing...' : 'Install'}
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: extension.iconColor ? `${extension.iconColor}20` : 'rgb(139 92 246 / 0.2)' }}
                >
                    <CategoryIcon category={extension.category} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-medium text-white truncate">{extension.displayName}</h3>
                        {extension.publisherVerified && (
                            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{extension.publisher}</span>
                        <span>•</span>
                        <span>v{extension.version}</span>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-400 mb-4 line-clamp-2">{extension.description}</p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1 text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{extension.rating}</span>
                    <span className="text-gray-600">({extension.ratingCount})</span>
                </div>
                <div className="flex items-center gap-1 text-gray-500">
                    <Download className="w-3.5 h-3.5" />
                    <span>{formatDownloads(extension.downloadCount)}</span>
                </div>
            </div>

            {/* Tags */}
            {extension.tags && extension.tags.length > 0 && (
                <div className="flex items-center gap-1 mb-4">
                    {extension.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                {extension.installed ? (
                    <>
                        <button
                            onClick={handleToggle}
                            className={`
                                flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors
                                ${extension.enabled
                                    ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                    : 'bg-slate-700 text-gray-400 hover:bg-slate-600'
                                }
                            `}
                        >
                            {extension.enabled ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    Enabled
                                </>
                            ) : (
                                <>
                                    <X className="w-4 h-4" />
                                    Disabled
                                </>
                            )}
                        </button>
                        <button
                            onClick={onSettings}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                            title="Settings"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleUninstall}
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Uninstall"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleInstall}
                        disabled={isInstalling}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-400 disabled:opacity-50 transition-colors"
                    >
                        {isInstalling ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Installing...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Install
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// EXTENSIONS MARKETPLACE
// ============================================================================

interface ExtensionsMarketplaceProps {
    className?: string
}

export function ExtensionsMarketplace({ className = '' }: ExtensionsMarketplaceProps) {
    const { extensions, installedExtensions, search, getRecommendations } = useExtensions()
    const [query, setQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<ExtensionCategory | null>(null)
    const [view, setView] = useState<'installed' | 'browse' | 'recommendations'>('browse')

    const filteredExtensions = useMemo(() => {
        if (view === 'installed') return installedExtensions
        if (view === 'recommendations') return getRecommendations()
        return query || selectedCategory ? search(query, selectedCategory ?? undefined) : extensions
    }, [view, installedExtensions, extensions, query, selectedCategory, search, getRecommendations])

    const categories: { id: ExtensionCategory; label: string }[] = [
        { id: 'language', label: 'Languages' },
        { id: 'theme', label: 'Themes' },
        { id: 'linter', label: 'Linters' },
        { id: 'formatter', label: 'Formatters' },
        { id: 'git', label: 'Git' },
        { id: 'ai', label: 'AI' },
        { id: 'utility', label: 'Utilities' },
    ]

    return (
        <div className={`flex h-full bg-slate-900 ${className}`}>
            {/* Sidebar */}
            <div className="w-56 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search extensions..."
                            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    <button
                        onClick={() => { setView('installed'); setSelectedCategory(null) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${view === 'installed' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Package className="w-4 h-4" />
                        Installed
                        <span className="ml-auto text-xs text-gray-600">{installedExtensions.length}</span>
                    </button>

                    <button
                        onClick={() => { setView('recommendations'); setSelectedCategory(null) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${view === 'recommendations' ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Star className="w-4 h-4" />
                        Recommendations
                    </button>

                    <button
                        onClick={() => { setView('browse'); setSelectedCategory(null) }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${view === 'browse' && !selectedCategory ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        Browse All
                    </button>

                    <div className="h-px bg-white/5 my-2" />

                    <div className="px-3 py-2 text-xs text-gray-500 uppercase">Categories</div>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => { setView('browse'); setSelectedCategory(cat.id) }}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <CategoryIcon category={cat.id} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                    {filteredExtensions.map(ext => (
                        <ExtensionCard key={ext.id} extension={ext} />
                    ))}
                </div>

                {filteredExtensions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mb-4 opacity-30" />
                        <p>No extensions found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
