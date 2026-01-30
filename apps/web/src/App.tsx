import { useState, useCallback, useEffect } from 'react'
import {
    Panel,
    PanelGroup,
    PanelResizeHandle
} from 'react-resizable-panels'
import {
    ChevronRight,
    ChevronDown,
    File,
    Folder,
    Code
} from 'lucide-react'
import { EditorPanel } from './components/EditorPanel'
import { CommandPalette, useCommandPalette } from './components/CommandPalette'
import { WelcomeScreen } from './components/WelcomeScreen'
import { AuthScreen } from './components/AuthScreen'
import { SprintLoopLogo } from './components/SprintLoopLogo'
import { type AIModel } from './config/models'
import { useProjectStore } from './stores/project-store'
import { useAuthStore } from './stores/auth-store'
import { isSupabaseConfigured } from './lib/supabase'
import { ActivityBar, type ActivityPanel } from './components/ActivityBar'
import { BottomPanel } from './components/BottomPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { InlineEditMode, useInlineEditMode } from './components/InlineEditMode'
import { AIChatPanel } from './components/AIChatPanel'
import { StatusBar } from './components/StatusBar'
import { useChatStore } from './stores/chat-store'

// Phase 11/12 Components
import { SettingsPanel } from './components/SettingsPanel'
import { ExtensionsPanel } from './components/ExtensionsPanel'
import { SourceControlPanel } from './components/SourceControlPanel'
import { SearchPanelComponent } from './components/SearchPanelComponent'
import { DebugPanel } from './components/DebugPanel'
import { QuickOpen } from './components/QuickOpen'
import { ToastContainer } from './components/ToastContainer'
import { useQuickOpenService } from './lib/navigation/quick-open-service'
import { useBreadcrumbsService } from './lib/navigation/breadcrumbs-service'


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

function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
    return (
        <PanelResizeHandle className={`
      ${direction === 'horizontal' ? 'w-1' : 'h-1'}
      bg-transparent hover:bg-blue-500/50 active:bg-blue-500
      transition-colors duration-150
    `} />
    )
}

interface IDELayoutProps {
    project: ProjectState
    onCloseProject: () => void
    onModelChange: (model: AIModel) => void
}

function IDELayout({ project, onCloseProject, onModelChange: _onModelChange }: IDELayoutProps) {
    const { open: commandPaletteOpen, setOpen: setCommandPaletteOpen } = useCommandPalette()
    const [activePanel, setActivePanel] = useState<ActivityPanel>('files')
    const [showBottomPanel, setShowBottomPanel] = useState(true)
    const [showAIPanel, setShowAIPanel] = useState(true)
    const { mode } = useProjectStore()
    const { isStreaming } = useChatStore()

    // Quick Open service
    const { open: openQuickOpen } = useQuickOpenService()

    // Breadcrumbs - initialize with current file path
    const { updateFromPath } = useBreadcrumbsService()

    // Keyboard shortcuts for IDE features
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+Shift+A - Toggle AI Panel
            if (e.metaKey && e.shiftKey && e.key === 'a') {
                e.preventDefault()
                setShowAIPanel(prev => !prev)
            }
            // Cmd+P - Quick Open
            if (e.metaKey && e.key === 'p' && !e.shiftKey) {
                e.preventDefault()
                openQuickOpen('files')
            }
            // Cmd+Shift+P - Command Palette (already handled)
            // Cmd+Shift+E - Explorer
            if (e.metaKey && e.shiftKey && e.key === 'e') {
                e.preventDefault()
                setActivePanel('files')
            }
            // Cmd+Shift+F - Search
            if (e.metaKey && e.shiftKey && e.key === 'f') {
                e.preventDefault()
                setActivePanel('search')
            }
            // Cmd+Shift+G - Source Control
            if (e.metaKey && e.shiftKey && e.key === 'g') {
                e.preventDefault()
                setActivePanel('git')
            }
            // Cmd+Shift+X - Extensions
            if (e.metaKey && e.shiftKey && e.key === 'x') {
                e.preventDefault()
                setActivePanel('extensions')
            }
            // Cmd+Shift+D - Debug
            if (e.metaKey && e.shiftKey && e.key === 'd') {
                e.preventDefault()
                setActivePanel('debug')
            }
            // Cmd+, - Settings
            if (e.metaKey && e.key === ',') {
                e.preventDefault()
                setActivePanel('settings')
            }
            // Cmd+` - Toggle Bottom Panel
            if (e.metaKey && e.key === '`') {
                e.preventDefault()
                setShowBottomPanel(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [openQuickOpen])

    // Initialize breadcrumbs with demo path
    useEffect(() => {
        updateFromPath('src/App.tsx')
    }, [updateFromPath])

    // Inline edit mode (Cmd+K)
    const { isOpen: inlineEditOpen, selection, closeEditMode } = useInlineEditMode()

    // Handle inline edit accept
    const handleInlineEditAccept = (newCode: string) => {
        console.log('Inline edit accepted:', newCode)
        closeEditMode()
        // TODO: Apply the edit to the editor
    }

    return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden">
            {/* Top Bar */}
            <div className="h-11 flex items-center justify-between px-3 border-b border-white/5 bg-slate-900/50">
                <div className="flex items-center gap-2.5">
                    <SprintLoopLogo size={24} />
                    <span className="font-semibold text-white text-sm">SprintLoop</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-gray-300 text-sm">{project.name}</span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Mode Indicator */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${mode === 'planning'
                        ? 'bg-purple-500/15 text-purple-400'
                        : 'bg-green-500/15 text-green-400'
                        }`}>
                        {mode === 'planning' ? '🎯 Planning' : '⚡ Executing'}
                    </div>

                    <div className="w-px h-5 bg-white/10" />

                    <button
                        onClick={onCloseProject}
                        className="px-2.5 py-1 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Command Palette */}
            <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Activity Bar */}
                <ActivityBar
                    activePanel={activePanel}
                    onPanelChange={setActivePanel}
                />

                {/* Main Panels */}
                <PanelGroup direction="horizontal" className="flex-1">
                    {/* Side Panel (File Explorer / Search / Git / etc) */}
                    <Panel defaultSize={18} minSize={12} maxSize={30} className="panel-bg">
                        {activePanel === 'files' && <FileExplorer projectName={project.name} />}
                        {activePanel === 'search' && <SearchPanelComponent />}
                        {activePanel === 'git' && <SourceControlPanel />}
                        {activePanel === 'debug' && <DebugPanel />}
                        {activePanel === 'extensions' && <ExtensionsPanel />}
                        {activePanel === 'kanban' && (
                            <div className="p-4 text-gray-500 text-sm">Kanban in bottom panel</div>
                        )}
                        {activePanel === 'preview' && <PreviewPanel />}
                        {activePanel === 'ai' && (
                            <div className="p-4 text-gray-500 text-sm">AI panel on right</div>
                        )}
                        {activePanel === 'settings' && <SettingsPanel />}
                    </Panel>

                    <ResizeHandle />

                    {/* Editor + Bottom Panel (Center) */}
                    <Panel defaultSize={showAIPanel ? 55 : 82} minSize={40}>
                        <div className="h-full flex flex-col">
                            {/* Editor Area */}
                            <div className="flex-1 overflow-hidden">
                                <EditorPanel />
                            </div>

                            {/* Bottom Panel (Terminal/Kanban/Output) */}
                            <BottomPanel
                                isVisible={showBottomPanel}
                                onClose={() => setShowBottomPanel(false)}
                                defaultTab={activePanel === 'kanban' ? 'kanban' : 'terminal'}
                            />
                        </div>
                    </Panel>

                    {/* AI Chat Sidebar (Right) - Antigravity style */}
                    {showAIPanel && (
                        <>
                            <ResizeHandle />
                            <Panel defaultSize={27} minSize={20} maxSize={40} className="panel-bg border-l border-white/5">
                                <AIChatPanel />
                            </Panel>
                        </>
                    )}
                </PanelGroup>
            </div>

            {/* Status Bar (Bottom) */}
            <StatusBar
                gitBranch="main"
                lineNumber={1}
                columnNumber={1}
                language="TypeScript"
                aiModel="Claude 4"
                aiStatus={isStreaming ? 'streaming' : 'idle'}
            />

            {/* Inline Edit Mode (Cmd+K) */}
            {selection && (
                <InlineEditMode
                    isOpen={inlineEditOpen}
                    selectedCode={selection.code}
                    filename={selection.filename}
                    lineRange={selection.lineRange}
                    onAccept={handleInlineEditAccept}
                    onCancel={closeEditMode}
                />
            )}

            {/* Quick Open (Cmd+P) */}
            <QuickOpen />

            {/* Toast Notifications */}
            <ToastContainer />
        </div>
    )
}

export default function App() {
    // Auth and project state
    const { isAuthenticated, isLoading: authLoading, initialize } = useAuthStore()
    const { currentProject, isProjectOpen, closeProject, setProjectModel } = useProjectStore()

    // Initialize auth on mount
    useEffect(() => {
        initialize()
    }, [initialize])

    const handleCloseProject = useCallback(() => {
        closeProject()
    }, [closeProject])

    const handleModelChange = useCallback((model: AIModel) => {
        if (currentProject) {
            setProjectModel(model)
        }
        console.log('Switched model to:', model.name)
    }, [currentProject, setProjectModel])

    // Show loading while checking auth
    if (authLoading && isSupabaseConfigured()) {
        return (
            <div className="h-screen w-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <SprintLoopLogo size={48} />
                    <div className="text-gray-400 text-sm">Loading...</div>
                </div>
            </div>
        )
    }

    // Show auth screen if Supabase is configured and user not authenticated
    if (isSupabaseConfigured() && !isAuthenticated) {
        return <AuthScreen />
    }

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
