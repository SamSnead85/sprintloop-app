import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { Code, X, Circle } from 'lucide-react'

// Sample code for demonstration
const SAMPLE_CODE = `// Welcome to SprintLoop!
// Your AI-Native Workspace Platform

import { useState, useEffect } from 'react'
import { useAI } from '@sprintloop/ai'

interface Task {
  id: string
  title: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
}

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const { suggest, autoComplete } = useAI()

  const addTask = useCallback(async (title: string) => {
    // AI-powered task creation
    const suggestion = await suggest({
      context: 'task_creation',
      input: title,
    })

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: suggestion.enhancedTitle || title,
      completed: false,
      priority: suggestion.suggestedPriority || 'medium',
    }

    setTasks(prev => [...prev, newTask])
  }, [suggest])

  return (
    <div className="task-manager">
      <h1>AI-Powered Task Manager</h1>
      <TaskList tasks={tasks} />
      <AddTaskForm onAdd={addTask} />
    </div>
  )
}

function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="space-y-2">
      {tasks.map(task => (
        <TaskItem key={task.id} task={task} />
      ))}
    </ul>
  )
}

function TaskItem({ task }: { task: Task }) {
  const priorityColors = {
    low: 'text-green-400',
    medium: 'text-yellow-400',
    high: 'text-red-400',
  }

  return (
    <li className="flex items-center gap-3">
      <input type="checkbox" checked={task.completed} />
      <span className={task.completed ? 'line-through' : ''}>
        {task.title}
      </span>
      <span className={priorityColors[task.priority]}>
        {task.priority}
      </span>
    </li>
  )
}

export default TaskManager
`

interface OpenFile {
    id: string
    name: string
    language: string
    content: string
    modified: boolean
}

export function EditorPanel() {
    const [openFiles, setOpenFiles] = useState<OpenFile[]>([
        {
            id: '1',
            name: 'TaskManager.tsx',
            language: 'typescript',
            content: SAMPLE_CODE,
            modified: false,
        },
    ])
    const [activeFileId, setActiveFileId] = useState('1')

    const activeFile = openFiles.find(f => f.id === activeFileId)

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (!value || !activeFileId) return

        setOpenFiles(prev => prev.map(f =>
            f.id === activeFileId
                ? { ...f, content: value, modified: true }
                : f
        ))
    }, [activeFileId])

    const handleEditorMount = useCallback((
        editor: monaco.editor.IStandaloneCodeEditor,
        monacoInstance: typeof monaco
    ) => {
        // Define custom theme matching Obsidian Glass
        monacoInstance.editor.defineTheme('obsidian-glass', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
                { token: 'keyword', foreground: 'c084fc' },
                { token: 'string', foreground: '34d399' },
                { token: 'number', foreground: 'fb923c' },
                { token: 'type', foreground: '38bdf8' },
                { token: 'function', foreground: '60a5fa' },
                { token: 'variable', foreground: 'e5e7eb' },
                { token: 'constant', foreground: 'f472b6' },
                { token: 'operator', foreground: '94a3b8' },
            ],
            colors: {
                'editor.background': '#0d0f12',
                'editor.foreground': '#e5e7eb',
                'editorCursor.foreground': '#3b82f6',
                'editor.lineHighlightBackground': '#1a1d2480',
                'editorLineNumber.foreground': '#4b5563',
                'editorLineNumber.activeForeground': '#9ca3af',
                'editor.selectionBackground': '#3b82f640',
                'editorIndentGuide.background': '#ffffff10',
                'editorIndentGuide.activeBackground': '#ffffff20',
                'editorWidget.background': '#1a1d24',
                'editorWidget.border': '#ffffff10',
                'editorSuggestWidget.background': '#1a1d24',
                'editorSuggestWidget.selectedBackground': '#3b82f640',
                'scrollbarSlider.background': '#ffffff15',
                'scrollbarSlider.hoverBackground': '#ffffff25',
            },
        })

        monacoInstance.editor.setTheme('obsidian-glass')

        // Configure editor
        editor.updateOptions({
            fontSize: 14,
            lineHeight: 22,
            fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
            fontLigatures: true,
            minimap: { enabled: true, renderCharacters: false, maxColumn: 80 },
            padding: { top: 12, bottom: 12 },
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            renderLineHighlight: 'all',
            scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        })

        editor.focus()
    }, [])

    const closeFile = (fileId: string) => {
        setOpenFiles(prev => prev.filter(f => f.id !== fileId))
        if (activeFileId === fileId && openFiles.length > 1) {
            const remaining = openFiles.filter(f => f.id !== fileId)
            setActiveFileId(remaining[0]?.id || '')
        }
    }

    return (
        <div className="h-full flex flex-col">
            {/* Tab Bar */}
            <div className="h-10 flex items-center px-2 border-b border-white/5 gap-1 overflow-x-auto">
                {openFiles.map((file) => (
                    <button
                        key={file.id}
                        onClick={() => setActiveFileId(file.id)}
                        className={`
              flex items-center gap-2 px-3 py-1.5 text-sm rounded-t
              transition-colors shrink-0
              ${activeFileId === file.id
                                ? 'bg-white/5 text-white border-b-2 border-blue-500'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }
            `}
                    >
                        <Code className="w-4 h-4 text-blue-400" />
                        <span>{file.name}</span>
                        {file.modified && (
                            <Circle className="w-2 h-2 fill-blue-400 text-blue-400" />
                        )}
                        <button
                            onClick={(e) => { e.stopPropagation(); closeFile(file.id) }}
                            className="ml-1 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </button>
                ))}
            </div>

            {/* Editor */}
            <div className="flex-1">
                {activeFile ? (
                    <Editor
                        height="100%"
                        width="100%"
                        language={activeFile.language}
                        value={activeFile.content}
                        onChange={handleEditorChange}
                        onMount={handleEditorMount}
                        theme="vs-dark"
                        loading={
                            <div className="h-full w-full flex items-center justify-center bg-slate-950">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Loading editor...</span>
                                </div>
                            </div>
                        }
                    />
                ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                            <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No file open</p>
                            <p className="text-sm mt-1">Open a file from the explorer or press ⌘K</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
