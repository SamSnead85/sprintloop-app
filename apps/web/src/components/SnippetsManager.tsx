/**
 * Snippets Manager Component
 * 
 * UI for viewing, creating, and editing code snippets.
 */

import { useState } from 'react';
import {
    Search, Plus, Copy, Trash2, Edit2, X, Code
} from 'lucide-react';
import {
    useSnippetsService,
    LANGUAGE_LABELS,
    Snippet
} from '../lib/snippets/snippets-service';

const LANGUAGES = [
    'javascript', 'typescript', 'javascriptreact', 'typescriptreact',
    'python', 'html', 'css', 'scss', 'json', 'markdown'
];

export function SnippetsManager() {
    const {
        searchQuery,
        selectedScope,
        selectedSnippetId,
        addSnippet,
        updateSnippet,
        deleteSnippet,
        duplicateSnippet,
        setSearchQuery,
        setSelectedScope,
        getFilteredSnippets,
        selectSnippet,
        getSelectedSnippet,
    } = useSnippetsService();

    const [isEditing, setIsEditing] = useState(false);
    const filteredSnippets = getFilteredSnippets();
    const selectedSnippet = getSelectedSnippet();

    const handleNewSnippet = () => {
        const id = addSnippet({
            name: 'New Snippet',
            prefix: 'new',
            body: ['$0'],
            scope: ['javascript'],
            description: '',
        });
        selectSnippet(id);
        setIsEditing(true);
    };

    return (
        <div className="snippets-manager">
            {/* Sidebar */}
            <div className="snippets-sidebar">
                {/* Header */}
                <div className="snippets-header">
                    <h2><Code size={18} /> Snippets</h2>
                    <button className="new-snippet-btn" onClick={handleNewSnippet}>
                        <Plus size={14} />
                    </button>
                </div>

                {/* Search */}
                <div className="snippets-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="Search snippets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}>
                            <X size={12} />
                        </button>
                    )}
                </div>

                {/* Language Filter */}
                <div className="snippets-filters">
                    <select
                        value={selectedScope || ''}
                        onChange={(e) => setSelectedScope(e.target.value || null)}
                    >
                        <option value="">All Languages</option>
                        {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>
                                {LANGUAGE_LABELS[lang] || lang}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Snippet List */}
                <div className="snippets-list">
                    {filteredSnippets.length === 0 ? (
                        <div className="no-snippets">No snippets found</div>
                    ) : (
                        filteredSnippets.map(snippet => (
                            <div
                                key={snippet.id}
                                className={`snippet-item ${selectedSnippetId === snippet.id ? 'selected' : ''}`}
                                onClick={() => selectSnippet(snippet.id)}
                            >
                                <span className="snippet-prefix">{snippet.prefix}</span>
                                <span className="snippet-name">{snippet.name}</span>
                                <span className={`snippet-source ${snippet.source}`}>
                                    {snippet.source === 'user' ? '✓' : ''}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Detail Panel */}
            <div className="snippets-detail">
                {!selectedSnippet ? (
                    <div className="no-selection">
                        <Code size={48} />
                        <p>Select a snippet to view details</p>
                        <button onClick={handleNewSnippet}>
                            <Plus size={14} /> Create Snippet
                        </button>
                    </div>
                ) : isEditing ? (
                    <SnippetEditor
                        snippet={selectedSnippet}
                        onSave={(updates) => {
                            updateSnippet(selectedSnippet.id, updates);
                            setIsEditing(false);
                        }}
                        onCancel={() => setIsEditing(false)}
                    />
                ) : (
                    <SnippetDetail
                        snippet={selectedSnippet}
                        onEdit={() => setIsEditing(true)}
                        onDuplicate={() => duplicateSnippet(selectedSnippet.id)}
                        onDelete={() => {
                            deleteSnippet(selectedSnippet.id);
                            selectSnippet(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
}

interface SnippetDetailProps {
    snippet: Snippet;
    onEdit: () => void;
    onDuplicate: () => void;
    onDelete: () => void;
}

function SnippetDetail({ snippet, onEdit, onDuplicate, onDelete }: SnippetDetailProps) {
    return (
        <div className="snippet-detail-view">
            <div className="detail-header">
                <div className="detail-title">
                    <h3>{snippet.name}</h3>
                    <code>{snippet.prefix}</code>
                </div>
                <div className="detail-actions">
                    {snippet.source === 'user' && (
                        <button onClick={onEdit}><Edit2 size={14} /> Edit</button>
                    )}
                    <button onClick={onDuplicate}><Copy size={14} /> Duplicate</button>
                    {snippet.source === 'user' && (
                        <button className="delete-btn" onClick={onDelete}>
                            <Trash2 size={14} /> Delete
                        </button>
                    )}
                </div>
            </div>
            {snippet.description && (
                <p className="detail-description">{snippet.description}</p>
            )}
            <div className="detail-meta">
                <span>Languages: {snippet.scope.map(s => LANGUAGE_LABELS[s] || s).join(', ')}</span>
                <span>Source: {snippet.source}</span>
            </div>
            <div className="detail-body">
                <h4>Body</h4>
                <pre>{snippet.body.join('\n')}</pre>
            </div>
        </div>
    );
}

interface SnippetEditorProps {
    snippet: Snippet;
    onSave: (updates: Partial<Snippet>) => void;
    onCancel: () => void;
}

function SnippetEditor({ snippet, onSave, onCancel }: SnippetEditorProps) {
    const [name, setName] = useState(snippet.name);
    const [prefix, setPrefix] = useState(snippet.prefix);
    const [description, setDescription] = useState(snippet.description || '');
    const [body, setBody] = useState(snippet.body.join('\n'));
    const [scope, setScope] = useState<string[]>(snippet.scope);

    const toggleScope = (lang: string) => {
        setScope(prev => prev.includes(lang) ? prev.filter(s => s !== lang) : [...prev, lang]);
    };

    const handleSave = () => {
        onSave({ name, prefix, description, body: body.split('\n'), scope });
    };

    return (
        <div className="snippet-editor">
            <div className="editor-row">
                <label>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="editor-row">
                <label>Prefix</label>
                <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} />
            </div>
            <div className="editor-row">
                <label>Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="editor-row">
                <label>Languages</label>
                <div className="scope-list">
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang}
                            className={scope.includes(lang) ? 'active' : ''}
                            onClick={() => toggleScope(lang)}
                        >
                            {LANGUAGE_LABELS[lang] || lang}
                        </button>
                    ))}
                </div>
            </div>
            <div className="editor-row body-row">
                <label>Body</label>
                <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />
            </div>
            <div className="editor-actions">
                <button className="save-btn" onClick={handleSave}>Save</button>
                <button onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}

export default SnippetsManager;
