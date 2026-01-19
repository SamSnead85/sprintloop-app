import { useState } from 'react'
import {
    FolderOpen,
    Plus,
    Zap,
    ArrowRight,
    Settings,
    History
} from 'lucide-react'
import { SprintLoopLogo } from './SprintLoopLogo'
import { ModelSelector } from './ModelSelector'
import { DEFAULT_MODEL, type AIModel } from '../config/models'
import { openFolderDialog, isTauri } from '../lib/tauri-bridge'
import { useProjectStore } from '../stores/project-store'
import { NewProjectModal } from './NewProjectModal'

// Recent projects (placeholder data)
const RECENT_PROJECTS = [
    { id: '1', name: 'New GroupLink Platform Build', path: '/Users/ssweilem/Projects/grouplink-platform', lastOpened: '2 hours ago' },
    { id: '2', name: 'ClaimsLink Platform', path: '/Users/ssweilem/Projects/claimslink-platform', lastOpened: 'Yesterday' },
    { id: '3', name: 'my-react-app', path: '/Users/dev/projects/my-react-app', lastOpened: '3 days ago' },
]

export function WelcomeScreen() {
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL)
    const [isOpening, setIsOpening] = useState(false)
    const [showNewProjectModal, setShowNewProjectModal] = useState(false)

    const { openProject } = useProjectStore()

    // Create new project - open the modal
    const handleNewProject = () => {
        setShowNewProjectModal(true)
    }

    // Open existing project
    const handleOpenProject = async () => {
        if (isTauri()) {
            setIsOpening(true)
            try {
                const folderPath = await openFolderDialog()
                if (folderPath) {
                    const name = folderPath.split('/').pop() || 'project'
                    openProject(folderPath, name, selectedModel)
                }
            } catch (e) {
                console.error('Failed to open project:', e)
            } finally {
                setIsOpening(false)
            }
        } else {
            // Browser fallback
            openProject('/demo-project', 'demo-project', selectedModel)
        }
    }

    // Open recent project
    const handleOpenRecent = (path: string, name: string) => {
        openProject(path, name, selectedModel)
    }

    return (
        <>
            <NewProjectModal
                isOpen={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
            />
            <div className="h-screen w-screen bg-slate-950 flex flex-col">
                {/* Top Bar */}
                <div className="h-14 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <SprintLoopLogo size={36} />
                        <span className="text-lg font-semibold text-white">SprintLoop</span>
                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Beta</span>
                    </div>

                    <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="max-w-3xl w-full">
                        {/* Hero Branding */}
                        <div className="text-center mb-12">
                            <div className="w-24 h-24 mx-auto mb-6">
                                <SprintLoopLogo size={96} />
                            </div>
                            <h1 className="text-4xl font-bold text-white mb-3">
                                Welcome to <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">SprintLoop</span>
                            </h1>
                            <p className="text-lg text-gray-400 max-w-md mx-auto">
                                Your AI-native workspace for building, debugging, and shipping faster than ever.
                            </p>
                        </div>

                        {/* Model Selector */}
                        <div className="mb-8 flex justify-center">
                            <ModelSelector
                                selectedModel={selectedModel}
                                onModelChange={setSelectedModel}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-4 mb-10">
                            <button
                                onClick={handleNewProject}
                                className="group relative flex items-center gap-4 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 rounded-2xl transition-all"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Plus className="w-6 h-6 text-purple-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold text-white mb-1">New Project</h3>
                                    <p className="text-sm text-gray-400">Create a new AI-powered project</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-purple-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <button
                                onClick={handleOpenProject}
                                disabled={isOpening}
                                className="group relative flex items-center gap-4 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 rounded-2xl transition-all disabled:opacity-50"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FolderOpen className={`w-6 h-6 text-blue-400 ${isOpening ? 'animate-pulse' : ''}`} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {isOpening ? 'Opening...' : 'Open Project'}
                                    </h3>
                                    <p className="text-sm text-gray-400">Open an existing project folder</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>

                        {/* Recent Projects */}
                        <div>
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <History className="w-4 h-4 text-gray-500" />
                                <h2 className="text-sm font-medium text-gray-400">Recent Projects</h2>
                            </div>
                            <div className="space-y-2">
                                {RECENT_PROJECTS.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => handleOpenRecent(project.path, project.name)}
                                        className="w-full flex items-center gap-4 p-4 bg-white/[0.02] hover:bg-white/5 border border-white/5 rounded-xl transition-all group"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                            <FolderOpen className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium text-white">{project.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{project.path}</div>
                                        </div>
                                        <div className="text-xs text-gray-600">{project.lastOpened}</div>
                                        <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Tip */}
                        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span>Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-400">⌘K</kbd> anytime for quick commands</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="h-10 flex items-center justify-center border-t border-white/5 text-xs text-gray-600">
                    <span>SprintLoop v0.1.0 Beta • AI-Native Workspace</span>
                </div>
            </div>
        </>
    )
}
