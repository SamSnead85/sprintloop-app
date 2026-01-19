/**
 * Preview Panel Component
 * Embedded webview for previewing applications being built
 */
import { useState } from 'react';
import {
    Globe,
    RefreshCw,
    ExternalLink,
    X
} from 'lucide-react';
import { useProjectStore } from '../stores/project-store';

export function PreviewPanel() {
    const { previewUrl, setPreviewUrl, isPreviewVisible, togglePreview } = useProjectStore();
    const [inputUrl, setInputUrl] = useState(previewUrl);
    const [isLoading, setIsLoading] = useState(false);
    const [key, setKey] = useState(0); // For forcing iframe refresh

    const handleRefresh = () => {
        setIsLoading(true);
        setKey(prev => prev + 1);
        setTimeout(() => setIsLoading(false), 1000);
    };

    const handleNavigate = () => {
        let url = inputUrl;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'http://' + url;
        }
        setPreviewUrl(url);
        handleRefresh();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleNavigate();
        }
    };

    if (!isPreviewVisible) {
        return null;
    }

    return (
        <div className="h-full flex flex-col bg-slate-900 border-l border-white/5">
            {/* Header */}
            <div className="h-10 flex items-center gap-2 px-3 border-b border-white/5 bg-slate-900/80">
                <Globe className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium text-gray-400">Preview</span>
                <div className="flex-1" />
                <button
                    onClick={togglePreview}
                    className="p-1 hover:bg-white/5 rounded"
                    title="Close preview"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* URL Bar */}
            <div className="h-10 flex items-center gap-2 px-3 border-b border-white/5 bg-slate-800/50">
                <button
                    onClick={handleRefresh}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <div className="flex-1 flex items-center bg-slate-900/50 rounded border border-white/5">
                    <input
                        type="text"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter URL..."
                        className="flex-1 bg-transparent px-3 py-1.5 text-sm text-white placeholder-gray-500 outline-none"
                    />
                </div>

                <button
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    title="Open in browser"
                >
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Quick Actions */}
            <div className="h-8 flex items-center gap-1 px-3 border-b border-white/5 bg-slate-800/30">
                <button
                    onClick={() => { setInputUrl('http://localhost:5173'); setPreviewUrl('http://localhost:5173'); handleRefresh(); }}
                    className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded"
                >
                    :5173
                </button>
                <button
                    onClick={() => { setInputUrl('http://localhost:3000'); setPreviewUrl('http://localhost:3000'); handleRefresh(); }}
                    className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded"
                >
                    :3000
                </button>
                <button
                    onClick={() => { setInputUrl('http://localhost:8080'); setPreviewUrl('http://localhost:8080'); handleRefresh(); }}
                    className="px-2 py-0.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded"
                >
                    :8080
                </button>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 bg-white relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-slate-900 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
                            <span className="text-sm text-gray-400">Loading...</span>
                        </div>
                    </div>
                )}
                <iframe
                    key={key}
                    src={previewUrl}
                    className="w-full h-full border-0"
                    title="App Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    onLoad={() => setIsLoading(false)}
                />
            </div>
        </div>
    );
}

/**
 * Preview Toggle Button - for sidebar
 */
export function PreviewToggleButton() {
    const { isPreviewVisible, togglePreview } = useProjectStore();

    return (
        <button
            onClick={togglePreview}
            className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                ${isPreviewVisible
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }
                transition-colors
            `}
            title="Toggle Preview"
        >
            <Globe className="w-4 h-4" />
            <span>Preview</span>
            {isPreviewVisible && <span className="ml-auto text-xs opacity-60">On</span>}
        </button>
    );
}
