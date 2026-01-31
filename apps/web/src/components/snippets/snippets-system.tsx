/**
 * SprintLoop Code Snippets System
 * 
 * Phase 1101-1150: Snippet management
 * - Snippet library
 * - Custom snippets
 * - Variable placeholders
 * - Tab stops
 * - Snippet search
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import {
    Code,
    Plus,
    Search,
    Star,
    StarOff,
    Edit3,
    Trash2,
    Copy,
    Check,
    ChevronDown,
    ChevronRight,
    Folder,
    Tag,
    Clock,
    Download,
    Upload
} from 'lucide-react'

// ============================================================================
// TYPES
// ============================================================================

interface SnippetVariable {
    name: string
    default: string
    description?: string
}

interface Snippet {
    id: string
    name: string
    prefix: string
    description?: string
    body: string
    language: string
    category: string
    variables?: SnippetVariable[]
    tags?: string[]
    isBuiltIn: boolean
    isFavorite: boolean
    usageCount: number
    lastUsed?: Date
    createdAt: Date
    updatedAt: Date
}

interface SnippetCategory {
    id: string
    name: string
    icon?: React.ReactNode
    description?: string
    snippets: string[]
}

// ============================================================================
// BUILT-IN SNIPPETS
// ============================================================================

const builtInSnippets: Omit<Snippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>[] = [
    // React snippets
    {
        name: 'React Functional Component',
        prefix: 'rfc',
        description: 'Create a React functional component',
        body: `import React from 'react'

interface \${1:ComponentName}Props {
  \${2:// props}
}

export function \${1:ComponentName}({ \${3} }: \${1:ComponentName}Props) {
  return (
    <div>
      \${0}
    </div>
  )
}`,
        language: 'typescriptreact',
        category: 'React',
        tags: ['react', 'component', 'typescript'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'React useState Hook',
        prefix: 'rus',
        description: 'React useState hook',
        body: 'const [\${1:state}, set\${1/(.*)/${1:/capitalize}/}] = useState<\${2:type}>(\${3:initialValue})',
        language: 'typescriptreact',
        category: 'React',
        tags: ['react', 'hooks'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'React useEffect Hook',
        prefix: 'rue',
        description: 'React useEffect hook',
        body: `useEffect(() => {
  \${1:// effect}
  
  return () => {
    \${2:// cleanup}
  }
}, [\${3:dependencies}])`,
        language: 'typescriptreact',
        category: 'React',
        tags: ['react', 'hooks'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'React Context',
        prefix: 'rctx',
        description: 'Create React context with provider',
        body: `import React, { createContext, useContext, useState } from 'react'

interface \${1:Name}ContextValue {
  \${2:// context value type}
}

const \${1:Name}Context = createContext<\${1:Name}ContextValue | null>(null)

export function use\${1:Name}() {
  const context = useContext(\${1:Name}Context)
  if (!context) throw new Error('use\${1:Name} must be used within \${1:Name}Provider')
  return context
}

interface \${1:Name}ProviderProps {
  children: React.ReactNode
}

export function \${1:Name}Provider({ children }: \${1:Name}ProviderProps) {
  return (
    <\${1:Name}Context.Provider value={}>
      {children}
    </\${1:Name}Context.Provider>
  )
}`,
        language: 'typescriptreact',
        category: 'React',
        tags: ['react', 'context'],
        isBuiltIn: true,
        isFavorite: false,
    },
    // TypeScript snippets
    {
        name: 'TypeScript Interface',
        prefix: 'int',
        description: 'TypeScript interface',
        body: `interface \${1:Name} {
  \${0}
}`,
        language: 'typescript',
        category: 'TypeScript',
        tags: ['typescript', 'interface'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'TypeScript Type',
        prefix: 'type',
        description: 'TypeScript type alias',
        body: 'type \${1:Name} = \${0}',
        language: 'typescript',
        category: 'TypeScript',
        tags: ['typescript', 'type'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'Async Function',
        prefix: 'afn',
        description: 'Async function with error handling',
        body: `async function \${1:functionName}(\${2:params}): Promise<\${3:ReturnType}> {
  try {
    \${0}
  } catch (error) {
    console.error('Error in \${1:functionName}:', error)
    throw error
  }
}`,
        language: 'typescript',
        category: 'TypeScript',
        tags: ['typescript', 'async'],
        isBuiltIn: true,
        isFavorite: false,
    },
    // Console snippets
    {
        name: 'Console Log',
        prefix: 'cl',
        description: 'Console log',
        body: "console.log('\${1:message}', \${2:value})",
        language: 'javascript',
        category: 'Console',
        tags: ['console', 'debug'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'Console Log Object',
        prefix: 'clo',
        description: 'Console log with object',
        body: "console.log({ \${1:variable} })",
        language: 'javascript',
        category: 'Console',
        tags: ['console', 'debug'],
        isBuiltIn: true,
        isFavorite: false,
    },
    // Import snippets
    {
        name: 'Import Default',
        prefix: 'imp',
        description: 'Import default export',
        body: "import \${1:name} from '\${2:module}'",
        language: 'javascript',
        category: 'Imports',
        tags: ['import'],
        isBuiltIn: true,
        isFavorite: false,
    },
    {
        name: 'Import Named',
        prefix: 'imn',
        description: 'Import named exports',
        body: "import { \${1:exports} } from '\${2:module}'",
        language: 'javascript',
        category: 'Imports',
        tags: ['import'],
        isBuiltIn: true,
        isFavorite: false,
    },
]

// ============================================================================
// CONTEXT
// ============================================================================

interface SnippetsContextValue {
    snippets: Snippet[]
    categories: SnippetCategory[]
    addSnippet: (snippet: Omit<Snippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => void
    updateSnippet: (id: string, updates: Partial<Snippet>) => void
    deleteSnippet: (id: string) => void
    toggleFavorite: (id: string) => void
    useSnippet: (id: string) => Snippet | undefined
    searchSnippets: (query: string, language?: string) => Snippet[]
    exportSnippets: () => string
    importSnippets: (data: string) => void
}

const SnippetsContext = createContext<SnippetsContextValue | null>(null)

export function useSnippets() {
    const context = useContext(SnippetsContext)
    if (!context) throw new Error('useSnippets must be used within SnippetsProvider')
    return context
}

// ============================================================================
// PROVIDER
// ============================================================================

interface SnippetsProviderProps {
    children: React.ReactNode
}

export function SnippetsProvider({ children }: SnippetsProviderProps) {
    const [snippets, setSnippets] = useState<Snippet[]>(() => {
        // Initialize with built-in snippets
        return builtInSnippets.map((s, i) => ({
            ...s,
            id: `builtin-${i}`,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        }))
    })

    const categories = useMemo(() => {
        const cats = new Map<string, SnippetCategory>()

        snippets.forEach(s => {
            if (!cats.has(s.category)) {
                cats.set(s.category, {
                    id: s.category.toLowerCase().replace(/\s+/g, '-'),
                    name: s.category,
                    snippets: [],
                })
            }
            cats.get(s.category)!.snippets.push(s.id)
        })

        return Array.from(cats.values())
    }, [snippets])

    const addSnippet = useCallback((snippet: Omit<Snippet, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) => {
        const newSnippet: Snippet = {
            ...snippet,
            id: `custom-${Date.now()}`,
            usageCount: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        setSnippets(prev => [...prev, newSnippet])
    }, [])

    const updateSnippet = useCallback((id: string, updates: Partial<Snippet>) => {
        setSnippets(prev =>
            prev.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date() } : s)
        )
    }, [])

    const deleteSnippet = useCallback((id: string) => {
        setSnippets(prev => prev.filter(s => s.id !== id || s.isBuiltIn))
    }, [])

    const toggleFavorite = useCallback((id: string) => {
        setSnippets(prev =>
            prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)
        )
    }, [])

    const useSnippet = useCallback((id: string) => {
        setSnippets(prev =>
            prev.map(s =>
                s.id === id
                    ? { ...s, usageCount: s.usageCount + 1, lastUsed: new Date() }
                    : s
            )
        )
        return snippets.find(s => s.id === id)
    }, [snippets])

    const searchSnippets = useCallback((query: string, language?: string) => {
        const lowerQuery = query.toLowerCase()
        return snippets.filter(s => {
            if (language && s.language !== language) return false
            return (
                s.name.toLowerCase().includes(lowerQuery) ||
                s.prefix.toLowerCase().includes(lowerQuery) ||
                s.description?.toLowerCase().includes(lowerQuery) ||
                s.tags?.some(t => t.toLowerCase().includes(lowerQuery))
            )
        })
    }, [snippets])

    const exportSnippets = useCallback(() => {
        const customSnippets = snippets.filter(s => !s.isBuiltIn)
        return JSON.stringify(customSnippets, null, 2)
    }, [snippets])

    const importSnippets = useCallback((data: string) => {
        try {
            const imported = JSON.parse(data) as Snippet[]
            const newSnippets = imported.map(s => ({
                ...s,
                id: `imported-${Date.now()}-${Math.random()}`,
                isBuiltIn: false,
                usageCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            }))
            setSnippets(prev => [...prev, ...newSnippets])
        } catch (error) {
            console.error('Failed to import snippets:', error)
        }
    }, [])

    return (
        <SnippetsContext.Provider
            value={{
                snippets,
                categories,
                addSnippet,
                updateSnippet,
                deleteSnippet,
                toggleFavorite,
                useSnippet,
                searchSnippets,
                exportSnippets,
                importSnippets,
            }}
        >
            {children}
        </SnippetsContext.Provider>
    )
}

// ============================================================================
// SNIPPET CARD
// ============================================================================

interface SnippetCardProps {
    snippet: Snippet
    onSelect?: () => void
    onEdit?: () => void
    onDelete?: () => void
    compact?: boolean
}

export function SnippetCard({
    snippet,
    onSelect,
    onEdit,
    onDelete,
    compact = false,
}: SnippetCardProps) {
    const { toggleFavorite } = useSnippets()
    const [copied, setCopied] = useState(false)

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(snippet.body)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (compact) {
        return (
            <button
                onClick={onSelect}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-left"
            >
                <Code className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{snippet.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{snippet.prefix}</div>
                </div>
            </button>
        )
    }

    return (
        <div
            onClick={onSelect}
            className="group bg-slate-800/50 border border-white/5 rounded-xl p-4 hover:border-purple-500/30 transition-colors cursor-pointer"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-400" />
                    <h3 className="font-medium text-white">{snippet.name}</h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(snippet.id)
                        }}
                        className={`p-1 transition-colors ${snippet.isFavorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                    >
                        {snippet.isFavorite ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={handleCopy}
                        className="p-1 text-gray-500 hover:text-white transition-colors"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {!snippet.isBuiltIn && onEdit && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <Edit3 className="w-4 h-4" />
                        </button>
                    )}
                    {!snippet.isBuiltIn && onDelete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Prefix */}
            <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-mono rounded">
                    {snippet.prefix}
                </span>
                <span className="text-xs text-gray-500">{snippet.language}</span>
            </div>

            {/* Description */}
            {snippet.description && (
                <p className="text-sm text-gray-400 mb-3">{snippet.description}</p>
            )}

            {/* Code preview */}
            <pre className="p-3 bg-black/30 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto max-h-24 overflow-y-hidden">
                {snippet.body.slice(0, 200)}{snippet.body.length > 200 ? '...' : ''}
            </pre>

            {/* Tags */}
            {snippet.tags && snippet.tags.length > 0 && (
                <div className="flex items-center gap-1 mt-3">
                    {snippet.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-white/5 text-gray-500 text-xs rounded">
                            {tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-600">
                <span>Used {snippet.usageCount} times</span>
                {snippet.lastUsed && (
                    <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last used {snippet.lastUsed.toLocaleDateString()}
                    </span>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// SNIPPETS LIBRARY
// ============================================================================

interface SnippetsLibraryProps {
    onInsert?: (snippet: Snippet) => void
    className?: string
}

export function SnippetsLibrary({ onInsert, className = '' }: SnippetsLibraryProps) {
    const { snippets, categories, deleteSnippet, searchSnippets } = useSnippets()
    const [search, setSearch] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [showFavorites, setShowFavorites] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['react', 'typescript']))

    const filteredSnippets = useMemo(() => {
        let result = search ? searchSnippets(search) : snippets

        if (showFavorites) {
            result = result.filter(s => s.isFavorite)
        }

        if (selectedCategory) {
            result = result.filter(s => s.category.toLowerCase().replace(/\s+/g, '-') === selectedCategory)
        }

        return result
    }, [snippets, search, showFavorites, selectedCategory, searchSnippets])

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    return (
        <div className={`flex h-full ${className}`}>
            {/* Sidebar */}
            <div className="w-56 border-r border-white/5 flex flex-col">
                <div className="p-4 border-b border-white/5">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search snippets..."
                            className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {/* Quick filters */}
                    <button
                        onClick={() => {
                            setSelectedCategory(null)
                            setShowFavorites(false)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${!selectedCategory && !showFavorites ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Code className="w-4 h-4" />
                        All Snippets
                    </button>

                    <button
                        onClick={() => {
                            setSelectedCategory(null)
                            setShowFavorites(true)
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${showFavorites ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <Star className="w-4 h-4" />
                        Favorites
                    </button>

                    <div className="h-px bg-white/5 my-2" />

                    {/* Categories */}
                    {categories.map(category => (
                        <div key={category.id}>
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                {expandedCategories.has(category.id) ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                                <Folder className="w-4 h-4" />
                                <span className="flex-1 text-left">{category.name}</span>
                                <span className="text-xs text-gray-600">{category.snippets.length}</span>
                            </button>

                            {expandedCategories.has(category.id) && (
                                <div className="ml-6 space-y-0.5">
                                    {category.snippets.map(sid => {
                                        const s = snippets.find(sn => sn.id === sid)
                                        if (!s) return null
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => onInsert?.(s)}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
                                            >
                                                <span className="font-mono text-purple-400">{s.prefix}</span>
                                                <span className="truncate">{s.name}</span>
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
                    {filteredSnippets.map(snippet => (
                        <SnippetCard
                            key={snippet.id}
                            snippet={snippet}
                            onSelect={() => onInsert?.(snippet)}
                            onDelete={() => deleteSnippet(snippet.id)}
                        />
                    ))}
                </div>

                {filteredSnippets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <Code className="w-12 h-12 mb-4 opacity-30" />
                        <p>No snippets found</p>
                    </div>
                )}
            </div>
        </div>
    )
}
