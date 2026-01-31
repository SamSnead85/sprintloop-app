import { useState, useEffect, useMemo } from 'react'
import {
    FolderOpen,
    ArrowRight,
    Settings,
    Clock,
    ChevronRight,
    Cpu,
    Zap
} from 'lucide-react'
import { SprintLoopLogo } from './SprintLoopLogo'
import { ModelSelector } from './ModelSelector'
import { DEFAULT_MODEL, type AIModel } from '../config/models'
import { openFolderDialog, isTauri } from '../lib/tauri-bridge'
import { useProjectStore } from '../stores/project-store'
import { NewProjectModal } from './NewProjectModal'

// Recent projects (placeholder data)
const RECENT_PROJECTS = [
    { id: '1', name: 'New GroupLink Platform Build', path: '/Users/ssweilem/Projects/grouplink-platform', lastOpened: '2 hours ago', icon: '🚀' },
    { id: '2', name: 'ClaimsLink Platform', path: '/Users/ssweilem/Projects/claimslink-platform', lastOpened: 'Yesterday', icon: '📊' },
    { id: '3', name: 'my-react-app', path: '/Users/dev/projects/my-react-app', lastOpened: '3 days ago', icon: '⚛️' },
]

// Premium floating orb
function FloatingOrb({ delay, x, y, size, color }: {
    delay: number;
    x: number;
    y: number;
    size: number;
    color: string;
}) {
    return (
        <div
            className={`absolute rounded-full blur-3xl animate-float-slow ${color}`}
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}s`,
            }}
        />
    )
}

export function WelcomeScreen() {
    const [selectedModel, setSelectedModel] = useState<AIModel>(DEFAULT_MODEL)
    const [isOpening, setIsOpening] = useState(false)
    const [showNewProjectModal, setShowNewProjectModal] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    const { openProject } = useProjectStore()

    // Staggered entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 100)
        return () => clearTimeout(timer)
    }, [])

    // Premium floating orbs
    const orbs = useMemo(() => [
        { id: 1, delay: 0, x: 20, y: 30, size: 400, color: 'bg-purple-600/8' },
        { id: 2, delay: 2, x: 70, y: 60, size: 350, color: 'bg-blue-600/8' },
        { id: 3, delay: 4, x: 50, y: 20, size: 300, color: 'bg-indigo-600/6' },
    ], [])

    // Open folder - single entry point
    const handleOpenFolder = async () => {
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
            setShowNewProjectModal(true)
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
            <div className="h-screen w-screen bg-[#0a0a0f] flex flex-col relative overflow-hidden">
                {/* Premium Background */}
                <div className="absolute inset-0">
                    {/* Gradient mesh */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.15),transparent)]" />

                    {/* Floating orbs */}
                    {orbs.map(orb => <FloatingOrb key={orb.id} {...orb} />)}

                    {/* Subtle noise texture */}
                    <div className="absolute inset-0 opacity-[0.015]" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    }} />

                    {/* Premium grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black,transparent)]" />
                </div>

                {/* Premium Top Bar */}
                <div className={`h-14 flex items-center justify-between px-8 border-b border-white/[0.06] backdrop-blur-2xl bg-black/20 relative z-10 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                    <div className="flex items-center gap-3">
                        <SprintLoopLogo size={32} />
                        <div className="flex items-center gap-2">
                            <span className="text-base font-semibold text-white tracking-tight">SprintLoop</span>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                Beta
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <ModelSelector
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            placement="top-bar"
                            compact
                        />
                        <div className="w-px h-5 bg-white/10 mx-2" />
                        <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all duration-200">
                            <Settings className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Main Content - Premium Centered */}
                <div className="flex-1 flex items-center justify-center relative z-10">
                    <div className="max-w-lg w-full px-8">
                        {/* Premium Logo - Larger with dramatic glow */}
                        <div className={`flex justify-center mb-12 transition-all duration-1000 delay-100 ${isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}`}>
                            <div className="relative group">
                                {/* Dramatic glow layers */}
                                <div className="absolute -inset-8 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 rounded-[32px] blur-3xl opacity-60 group-hover:opacity-80 transition-opacity duration-700" />
                                <div className="absolute -inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-[28px] blur-2xl" />

                                {/* Logo container */}
                                <div className="relative w-32 h-32 bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl shadow-purple-500/10 backdrop-blur-xl">
                                    <SprintLoopLogo size={72} />

                                    {/* Shine effect */}
                                    <div className="absolute inset-0 rounded-3xl overflow-hidden">
                                        <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-12 translate-x-full group-hover:translate-x-[-200%] transition-transform duration-1000" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Premium Headline */}
                        <div className={`text-center mb-12 transition-all duration-700 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight leading-tight">
                                Welcome to{' '}
                                <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    SprintLoop
                                </span>
                            </h1>
                            <p className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
                                The AI-native development environment for building the future
                            </p>
                        </div>

                        {/* Premium Primary Action */}
                        <div className={`mb-12 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                            <button
                                onClick={handleOpenFolder}
                                disabled={isOpening}
                                className="w-full group relative overflow-hidden"
                            >
                                {/* Button glow */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500" />

                                {/* Button content */}
                                <div className="relative flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold text-lg transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/25">
                                    <FolderOpen className={`w-5 h-5 ${isOpening ? 'animate-pulse' : ''}`} />
                                    <span>{isOpening ? 'Opening...' : 'Open Folder'}</span>
                                    <ChevronRight className="w-5 h-5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                                </div>
                            </button>

                            <p className="text-center text-sm text-gray-500 mt-4">
                                Open an existing project or start a new one
                            </p>
                        </div>

                        {/* Recent Projects - Premium List */}
                        {RECENT_PROJECTS.length > 0 && (
                            <div className={`transition-all duration-700 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}>
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="w-4 h-4 text-gray-500" />
                                    <span className="text-sm font-medium text-gray-400">Recent Projects</span>
                                </div>

                                <div className="bg-white/[0.02] backdrop-blur-xl rounded-xl border border-white/[0.06] overflow-hidden">
                                    {RECENT_PROJECTS.slice(0, 3).map((project, index) => (
                                        <button
                                            key={project.id}
                                            onClick={() => handleOpenRecent(project.path, project.name)}
                                            className={`w-full flex items-center gap-4 p-4 hover:bg-white/[0.04] transition-all duration-200 group text-left ${index !== 0 ? 'border-t border-white/[0.04]' : ''
                                                }`}
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/[0.06] flex items-center justify-center text-lg group-hover:scale-105 transition-transform duration-200">
                                                {project.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-200 group-hover:text-white truncate transition-colors">
                                                    {project.name}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate mt-0.5">{project.path}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{project.lastOpened}</span>
                                                <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Keyboard Shortcut - Premium */}
                        <div className={`mt-10 flex justify-center transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.02] rounded-full border border-white/[0.06]">
                                <kbd className="px-2 py-1 bg-white/[0.05] rounded-md border border-white/10 text-xs font-medium text-gray-400">⌘O</kbd>
                                <span className="text-xs text-gray-500">to open folder</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Premium Footer */}
                <div className={`h-10 flex items-center justify-center border-t border-white/[0.04] bg-black/20 backdrop-blur-xl relative z-10 transition-all duration-500 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Cpu className="w-3 h-3" />
                            SprintLoop v0.1.0
                        </span>
                        <div className="w-1 h-1 rounded-full bg-gray-700" />
                        <span className="flex items-center gap-1.5 text-emerald-400">
                            <Zap className="w-3 h-3" />
                            AI Ready
                        </span>
                    </div>
                </div>
            </div>

            {/* Custom animations */}
            <style>{`
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0) translateX(0); }
                    25% { transform: translateY(-20px) translateX(10px); }
                    50% { transform: translateY(-10px) translateX(-10px); }
                    75% { transform: translateY(-30px) translateX(5px); }
                }
                .animate-float-slow {
                    animation: float-slow 20s ease-in-out infinite;
                }
            `}</style>
        </>
    )
}
