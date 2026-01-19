/**
 * New Project Modal
 * Professional project creation dialog with name, location, template selection
 */
import { useState, useEffect } from 'react';
import {
    X,
    FolderOpen,
    Rocket,
    Code2,
    Box,
    Hexagon,
    FileCode,
    Loader2
} from 'lucide-react';
import { openFolderDialog, getHomeDir } from '../lib/tauri-bridge';
import { useProjectStore } from '../stores/project-store';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const TEMPLATES = [
    { id: 'empty', name: 'Empty', icon: Box, description: 'Start from scratch' },
    { id: 'react', name: 'React', icon: Code2, description: 'Vite + React + TypeScript' },
    { id: 'nextjs', name: 'Next.js', icon: Hexagon, description: 'Full-stack React framework' },
    { id: 'node', name: 'Node.js', icon: FileCode, description: 'Express backend' },
];

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
    const [projectName, setProjectName] = useState('my-project');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('empty');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const { createProject } = useProjectStore();

    // Get default location on mount
    useEffect(() => {
        if (isOpen && !location) {
            getHomeDir().then(home => {
                setLocation(`${home}/Projects`);
            }).catch(() => {
                setLocation('~/Projects');
            });
        }
    }, [isOpen, location]);

    // Clean project name for folder
    const folderName = projectName
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const fullPath = `${location}/${folderName}`;

    const handleSelectLocation = async () => {
        const folder = await openFolderDialog();
        if (folder) {
            setLocation(folder);
        }
    };

    const handleCreate = async () => {
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            await createProject(fullPath, projectName, description);
            onClose();
            // Reset form
            setProjectName('my-project');
            setDescription('');
            setSelectedTemplate('empty');
        } catch (e) {
            setError(String(e));
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">New Project</h2>
                            <p className="text-sm text-gray-500">Create a new SprintLoop project</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Project Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="my-awesome-project"
                            className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            autoFocus
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="/Users/dev/Projects"
                                className="flex-1 px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            />
                            <button
                                onClick={handleSelectLocation}
                                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-gray-300 transition-colors"
                                title="Browse..."
                            >
                                <FolderOpen className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Will create: <code className="text-indigo-400">{fullPath}</code>
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description <span className="text-gray-500">(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A brief description of your project..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                        />
                    </div>

                    {/* Template Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                            Template
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {TEMPLATES.map((template) => {
                                const Icon = template.icon;
                                const isSelected = selectedTemplate === template.id;
                                return (
                                    <button
                                        key={template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        className={`
                                            flex flex-col items-center gap-2 p-4 rounded-xl border transition-all
                                            ${isSelected
                                                ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                                                : 'bg-slate-800/50 border-white/5 text-gray-400 hover:border-white/10'
                                            }
                                        `}
                                    >
                                        <Icon className="w-6 h-6" />
                                        <span className="text-sm font-medium">{template.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5 bg-slate-900/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-400 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !projectName.trim()}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Rocket className="w-4 h-4" />
                                Create Project
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
