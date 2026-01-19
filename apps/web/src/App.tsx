import { useState, useCallback } from 'react'
import {
    Panel,
    PanelGroup,
    PanelResizeHandle
} from 'react-resizable-panels'
import {
    FolderTree,
    Code,
    Terminal as TerminalIcon,
    MessageSquare,
    Play,
    Settings,
    ChevronRight,
    ChevronDown,
    File,
    Folder
} from 'lucide-react'
import { EditorPanel } from './components/EditorPanel'
import { CommandPalette, useCommandPalette } from './components/CommandPalette'
import { AIChatPanel } from './components/AIChatPanel'
import { WelcomeScreen } from './components/WelcomeScreen'
import { SprintLoopLogo } from './components/SprintLoopLogo'
import { ModelSelector } from './components/ModelSelector'
import { type AIModel } from './config/models'
import { useProjectStore } from './stores/project-store'

// App state
interface ProjectState {
    isOpen: boolean
    path: string
    name: string
    model: AIModel
}

function FileExplorer({ projectName }: { projectName: string }) {
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src', 'components']))

    const toggleFolder = (folder: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            if (next.has(folder)) {
                next.delete(folder)
            } else {
                next.add(folder)
            }
            return next
        })
    }

    return (
        <div className="h-full flex flex-col">
            <div className="h-10 flex items-center px-3 border-b border-white/5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Explorer
                </span>
            </div>
            <div className="px-2 py-2 border-b border-white/5">
                <div className="flex items-center gap-2 px-2 py-1 text-sm text-white font-medium">
                    <Folder className="w-4 h-4 text-blue-400" />
                    <span>{projectName}</span>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-0.5">
                    <FolderItem
                        name="src"
                        expanded={expandedFolders.has('src')}
                        onToggle={() => toggleFolder('src')}
                    >
                        <FileItem name="App.tsx" indent={1} />
                        <FileItem name="main.tsx" indent={1} />
                        <FileItem name="index.css" indent={1} />
                        <FolderItem
                            name="components"
                            indent={1}
                            expanded={expandedFolders.has('components')}
                            onToggle={() => toggleFolder('components')}
                        >
                            <FileItem name="Button.tsx" indent={2} />
                            <FileItem name="Header.tsx" indent={2} />
                            <FileItem name="Sidebar.tsx" indent={2} />
                        </FolderItem>
                    </FolderItem>
                    <FileItem name="package.json" />
                    <FileItem name="tsconfig.json" />
                    <FileItem name="vite.config.ts" />
                    <FileItem name="README.md" />
                </div>
            </div>
        </div>
    )
}

function FolderItem({
    name,
    expanded = false,
    indent = 0,
    onToggle,
    children
}: {
    name: string
    expanded?: boolean
    indent?: number
    onToggle?: () => void
    children?: React.ReactNode
}) {
    return (
        <>
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-gray-300 hover:bg-white/5 transition-colors"
                style={{ paddingLeft: `${8 + indent * 16}px` }}
            >
                {expanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-500" />
                ) : (
                    <ChevronRight className="w-3 h-3 text-gray-500" />
                )}
                <Folder className="w-4 h-4 text-blue-400" />
                <span>{name}</span>
            </button>
            {expanded && children}
        </>
    )
}

function FileItem({
    name,
    indent = 0
}: {
    name: string
    indent?: number
}) {
    const getFileIcon = (filename: string) => {
        if (filename.endsWith('.tsx') || filename.endsWith('.ts')) {
            return <Code className="w-4 h-4 text-blue-400" />
        }
        if (filename.endsWith('.css')) {
            return <File className="w-4 h-4 text-pink-400" />
        }
        if (filename.endsWith('.json')) {
            return <File className="w-4 h-4 text-yellow-400" />
        }
        if (filename.endsWith('.md')) {
            return <File className="w-4 h-4 text-gray-400" />
        }
        return <File className="w-4 h-4 text-gray-500" />
    }

    return (
        <button
            className="w-full flex items-center gap-2 px-2 py-1 rounded text-sm text-gray-300 hover:bg-white/5 transition-colors"
            style={{ paddingLeft: `${8 + indent * 16 + 16}px` }}
        >
            {getFileIcon(name)}
            <span>{name}</span>
        </button>
    )
}

function TerminalPanel() {
    return (
        <div className="h-full flex flex-col">
            <div className="h-8 flex items-center px-3 border-b border-white/5 gap-2">
                <span className="text-xs font-medium text-gray-400">Terminal</span>
                <div className="flex-1" />
                <button className="text-gray-500 hover:text-white text-xs">+ New</button>
            </div>
            <div className="flex-1 p-3 font-mono text-sm text-green-400 overflow-auto">
                <div className="text-gray-500">$ </div>
                <div className="text-gray-300">npm run dev</div>
                <div className="mt-2 text-green-400">
                    ✓ Ready in 234ms
                </div>
                <div className="text-blue-400">
                    ➜ Local: http://localhost:5173/
                </div>
            </div>
        </div>
    )
}

function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
    return (
        <PanelResizeHandle className={`
      ${direction === 'horizontal' ? 'w-1' : 'h-1'}
      bg-transparent hover:bg-blue-500/50 active:bg-blue-500
      transition-colors duration-150
    `} />
    )
}

function IconButton({ icon: Icon, active = false, onClick }: { icon: React.ElementType; active?: boolean; onClick?: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
        w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150
        ${active
                    ? 'bg-white/10 text-white'
                    : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                }
      `}
        >
            <Icon className="w-5 h-5" />
        </button>
    )
}

interface IDELayoutProps {
    project: ProjectState
    onCloseProject: () => void
    onModelChange: (model: AIModel) => void
}

function IDELayout({ project, onCloseProject, onModelChange }: IDELayoutProps) {
    const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette()

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
            {/* Top Bar with Branding and Model Selector */}
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <SprintLoopLogo size={28} />
                    <span className="font-semibold text-white">SprintLoop</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-300">{project.name}</span>
                </div>

                {/* Model Selector in IDE */}
                <div className="flex items-center gap-3">
                    <ModelSelector
                        selectedModel={project.model}
                        onModelChange={onModelChange}
                        compact
                    />
                    <div className="w-px h-6 bg-white/10" />
                    <button
                        onClick={onCloseProject}
                        className="px-3 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                        Close Project
                    </button>
                </div>
            </div>

            {/* Command Palette */}
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

            {/* Main Panel Layout */}
            <div className="flex-1 flex overflow-hidden">
                <PanelGroup direction="horizontal" className="flex-1">
                    {/* Sidebar */}
                    <Panel defaultSize={4} minSize={4} maxSize={6} className="panel-bg">
                        <div className="h-full w-full flex flex-col bg-slate-900/50">
                            <div className="flex-1 py-3 flex flex-col items-center gap-1">
                                <IconButton icon={FolderTree} active />
                                <IconButton icon={Code} />
                                <IconButton icon={TerminalIcon} />
                                <IconButton icon={MessageSquare} />
                                <IconButton icon={Play} />
                            </div>
                            <div className="py-3 flex justify-center border-t border-white/5">
                                <IconButton icon={Settings} />
                            </div>
                        </div>
                    </Panel>

                    <ResizeHandle />

                    {/* File Explorer */}
                    <Panel defaultSize={15} minSize={10} maxSize={25} className="panel-bg">
                        <FileExplorer projectName={project.name} />
                    </Panel>

                    <ResizeHandle />

                    {/* Main Content Area */}
                    <Panel defaultSize={55} minSize={30}>
                        <PanelGroup direction="vertical">
                            {/* Editor */}
                            <Panel defaultSize={70} minSize={30} className="panel-bg">
                                <EditorPanel />
                            </Panel>

                            <ResizeHandle direction="vertical" />

                            {/* Terminal */}
                            <Panel defaultSize={30} minSize={15} className="panel-bg">
                                <TerminalPanel />
                            </Panel>
                        </PanelGroup>
                    </Panel>

                    <ResizeHandle />

                    {/* AI Chat Panel */}
                    <Panel defaultSize={22} minSize={15} maxSize={40} className="panel-bg">
                        <AIChatPanel />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    )
}

export default function App() {
    // Use the project store for state management
    const { currentProject, isProjectOpen, closeProject, setProjectModel } = useProjectStore()

    const handleCloseProject = useCallback(() => {
        closeProject()
    }, [closeProject])

    const handleModelChange = useCallback((model: AIModel) => {
        if (currentProject) {
            setProjectModel(model)
        }
        console.log('Switched model to:', model.name)
    }, [currentProject, setProjectModel])

    // Show welcome screen if no project is open
    if (!isProjectOpen || !currentProject) {
        return <WelcomeScreen />
    }

    // Show IDE layout when project is open
    return (
        <IDELayout
            project={{
                isOpen: true,
                path: currentProject.path,
                name: currentProject.name,
                model: currentProject.model
            }}
            onCloseProject={handleCloseProject}
            onModelChange={handleModelChange}
        />
    )
}
