import { useState, useEffect, useMemo } from 'react'
import {
    FolderOpen,
    Plus,
    Zap,
    ArrowRight,
    Settings,
    History,
    Sparkles,
    Command,
    GitBranch,
    Code2,
    Rocket
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

// Quick start templates
const QUICK_TEMPLATES = [
    { id: 'react', name: 'React + Vite', icon: '⚛️', color: 'from-cyan-500/20 to-blue-500/20' },
    { id: 'nextjs', name: 'Next.js App', icon: '▲', color: 'from-white/10 to-gray-500/10' },
    { id: 'python', name: 'Python API', icon: '🐍', color: 'from-green-500/20 to-yellow-500/20' },
    { id: 'node', name: 'Node.js', icon: '💚', color: 'from-green-500/20 to-emerald-500/20' },
]

// Floating particle component
function FloatingParticle({ delay, duration, size, x, y }: {
    delay: number;
    duration: number;
    size: number;
    x: number;
    y: number;
}) {
    return (
        <div
            className="absolute rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-sm animate-float"
            style={{
                width: size,
                height: size,
                left: `${x}%`,
                top: `${y}%`,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`,
            }}
        />
    )
}

// Code rain effect
function CodeRain() {
    const chars = useMemo(() => {
        const codeChars = ['<', '>', '/', '{', '}', '=', ';', '(', ')', 'fn', 'let', 'const', 'if', '&&', '=>']
        return Array.from({ length: 30 }, (_, i) => ({
            id: i,
            char: codeChars[Math.floor(Math.random() * codeChars.length)],
            x: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 8 + Math.random() * 12,
            opacity: 0.1 + Math.random() * 0.15,
        }))
    }, [])

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {chars.map(({ id, char, x, delay, duration, opacity }) => (
                <div
                    key={id}
                    className="absolute text-blue-500/20 font-mono text-sm animate-code-rain"
                    style={{
                        left: `${x}%`,
                        animationDelay: `${delay}s`,
                        animationDuration: `${duration}s`,
                        opacity,
                    }}
                >
                    {char}
                </div>
            ))}
        </div>
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

    // Generate floating particles
    const particles = useMemo(() =>
        Array.from({ length: 15 }, (_, i) => ({
            id: i,
            delay: Math.random() * 3,
            duration: 6 + Math.random() * 4,
            size: 4 + Math.random() * 8,
            x: Math.random() * 100,
            y: Math.random() * 100,
        })), [])

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
            <div className="h-screen w-screen bg-slate-950 flex flex-col relative overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0">
                    {/* Gradient orbs */}
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse-slow" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-blue-500/5 via-purple-500/5 to-transparent rounded-full" />

                    {/* Floating particles */}
                    {particles.map(p => <FloatingParticle key={p.id} {...p} />)}

                    {/* Code rain effect */}
                    <CodeRain />

                    {/* Grid overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
                </div>

                {/* Top Bar - Glass morphism */}
                <div className={`h-14 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-xl bg-slate-900/50 relative z-10 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <SprintLoopLogo size={36} />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
                        </div>
                        <span className="text-lg font-semibold text-white">SprintLoop</span>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Beta</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5">
                            <Command className="w-4 h-4" />
                            <span className="text-xs">⌘K</span>
                        </button>
                        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                            <Settings className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                    <div className="max-w-4xl w-full">
                        {/* Hero Branding */}
                        <div className={`text-center mb-12 transition-all duration-700 delay-100 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="relative w-28 h-28 mx-auto mb-8">
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl opacity-20 blur-xl animate-pulse-slow" />
                                <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 flex items-center justify-center backdrop-blur-xl">
                                    <SprintLoopLogo size={64} />
                                </div>
                                {/* AI indicator */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            </div>
                            <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
                                Build with <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">AI Superpowers</span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-lg mx-auto leading-relaxed">
                                The AI-native IDE that thinks, codes, and ships alongside you.
                            </p>
                        </div>

                        {/* Model Selector - Glass card */}
                        <div className={`mb-10 flex justify-center transition-all duration-700 delay-200 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="backdrop-blur-xl bg-white/5 rounded-2xl border border-white/10 p-3">
                                <ModelSelector
                                    selectedModel={selectedModel}
                                    onModelChange={setSelectedModel}
                                />
                            </div>
                        </div>

                        {/* Action Buttons - Glass cards with hover glow */}
                        <div className={`grid grid-cols-2 gap-5 mb-10 transition-all duration-700 delay-300 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <button
                                onClick={handleNewProject}
                                className="group relative flex items-center gap-4 p-6 backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl transition-all duration-300 overflow-hidden"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-purple-500/10 to-transparent" />
                                <div className="absolute -inset-px bg-gradient-to-br from-purple-500/50 to-pink-500/50 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-purple-500/20">
                                    <Plus className="w-7 h-7 text-purple-300" />
                                </div>
                                <div className="relative text-left flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">New Project</h3>
                                    <p className="text-sm text-gray-400">Start fresh with AI scaffolding</p>
                                </div>
                                <ArrowRight className="relative w-5 h-5 text-purple-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                            </button>

                            <button
                                onClick={handleOpenProject}
                                disabled={isOpening}
                                className="group relative flex items-center gap-4 p-6 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border border-blue-500/20 hover:border-blue-500/40 rounded-2xl transition-all duration-300 disabled:opacity-50 overflow-hidden"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-500/10 to-transparent" />
                                <div className="absolute -inset-px bg-gradient-to-br from-blue-500/50 to-cyan-500/50 rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500" />

                                <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-blue-500/20">
                                    <FolderOpen className={`w-7 h-7 text-blue-300 ${isOpening ? 'animate-pulse' : ''}`} />
                                </div>
                                <div className="relative text-left flex-1">
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        {isOpening ? 'Opening...' : 'Open Project'}
                                    </h3>
                                    <p className="text-sm text-gray-400">Import existing codebase</p>
                                </div>
                                <ArrowRight className="relative w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                            </button>
                        </div>

                        {/* Quick Templates */}
                        <div className={`mb-8 transition-all duration-700 delay-400 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <Rocket className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-400">Quick Start</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {QUICK_TEMPLATES.map(template => (
                                    <button
                                        key={template.id}
                                        className={`group p-4 backdrop-blur-xl bg-gradient-to-br ${template.color} border border-white/10 hover:border-white/20 rounded-xl transition-all duration-300 hover:scale-105`}
                                    >
                                        <div className="text-2xl mb-2">{template.icon}</div>
                                        <div className="text-sm font-medium text-white">{template.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recent Projects - Glass list */}
                        <div className={`transition-all duration-700 delay-500 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="flex items-center gap-2 mb-4 px-1">
                                <History className="w-4 h-4 text-gray-500" />
                                <h2 className="text-sm font-medium text-gray-400">Recent Projects</h2>
                            </div>
                            <div className="backdrop-blur-xl bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden">
                                {RECENT_PROJECTS.map((project, i) => (
                                    <button
                                        key={project.id}
                                        onClick={() => handleOpenRecent(project.path, project.name)}
                                        className={`w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-all group ${i !== 0 ? 'border-t border-white/5' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                                            {project.icon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{project.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{project.path}</div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-xs text-gray-600">{project.lastOpened}</div>
                                            <ArrowRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Quick Tip */}
                        <div className={`mt-8 flex items-center justify-center gap-3 transition-all duration-700 delay-600 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                            <div className="flex items-center gap-2 text-sm text-gray-500 backdrop-blur-xl bg-white/5 px-4 py-2 rounded-full border border-white/5">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span>Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-gray-400 border border-white/10">⌘K</kbd> for AI commands</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer - Glass bar */}
                <div className={`h-12 flex items-center justify-center border-t border-white/5 backdrop-blur-xl bg-slate-900/30 relative z-10 transition-all duration-700 delay-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5" />
                            SprintLoop v0.1.0
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                        <span className="flex items-center gap-1.5">
                            <GitBranch className="w-3.5 h-3.5" />
                            Ready
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-700" />
                        <span className="flex items-center gap-1.5 text-emerald-500">
                            <Sparkles className="w-3.5 h-3.5" />
                            AI Connected
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
