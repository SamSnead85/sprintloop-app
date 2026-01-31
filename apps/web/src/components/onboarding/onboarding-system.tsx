/**
 * SprintLoop Onboarding & Empty States
 * 
 * First-time experience and helpful empty state components:
 * - Welcome tour
 * - Feature discovery
 * - Interactive tutorials
 * - Empty state illustrations
 */

import React, { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    X,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Code,
    Terminal,
    GitBranch,
    Settings,
    Bot,
    FolderOpen,
    File,
    Search,
    Zap,
    Check
} from 'lucide-react'

// ============================================================================
// ONBOARDING STATE
// ============================================================================

interface OnboardingState {
    hasCompletedOnboarding: boolean
    currentStep: number
    stepsCompleted: string[]
    showWelcomeModal: boolean

    completeOnboarding: () => void
    setCurrentStep: (step: number) => void
    completeStep: (stepId: string) => void
    showWelcome: () => void
    hideWelcome: () => void
    resetOnboarding: () => void
}

export const useOnboarding = create<OnboardingState>()(
    persist(
        (set) => ({
            hasCompletedOnboarding: false,
            currentStep: 0,
            stepsCompleted: [],
            showWelcomeModal: true,

            completeOnboarding: () => set({ hasCompletedOnboarding: true, showWelcomeModal: false }),
            setCurrentStep: (step) => set({ currentStep: step }),
            completeStep: (stepId) => set(s => ({
                stepsCompleted: [...new Set([...s.stepsCompleted, stepId])]
            })),
            showWelcome: () => set({ showWelcomeModal: true }),
            hideWelcome: () => set({ showWelcomeModal: false }),
            resetOnboarding: () => set({
                hasCompletedOnboarding: false,
                currentStep: 0,
                stepsCompleted: [],
                showWelcomeModal: true,
            }),
        }),
        { name: 'sprintloop-onboarding' }
    )
)

// ============================================================================
// WELCOME MODAL
// ============================================================================

interface WelcomeModalProps {
    onComplete: () => void
    onSkip: () => void
}

const welcomeSteps = [
    {
        id: 'welcome',
        title: 'Welcome to SprintLoop',
        description: 'The AI-powered IDE built for speed and efficiency. Let\'s take a quick tour.',
        icon: <Sparkles className="w-12 h-12 text-purple-400" />,
    },
    {
        id: 'ai-assistant',
        title: 'AI Assistant',
        description: 'Press ⌘I anytime to open the AI chat. Ask questions, generate code, or debug issues.',
        icon: <Bot className="w-12 h-12 text-blue-400" />,
    },
    {
        id: 'command-palette',
        title: 'Command Palette',
        description: 'Press ⌘K to access any command instantly. Search files, run actions, or switch modes.',
        icon: <Zap className="w-12 h-12 text-yellow-400" />,
    },
    {
        id: 'quick-edit',
        title: 'Quick Edit',
        description: 'Select code and press ⌘E for inline AI editing. Fix, refactor, or explain instantly.',
        icon: <Code className="w-12 h-12 text-green-400" />,
    },
    {
        id: 'ready',
        title: 'You\'re Ready!',
        description: 'Start coding with AI superpowers. We\'re here to help you build faster.',
        icon: <Check className="w-12 h-12 text-purple-400" />,
    },
]

export function WelcomeModal({ onComplete, onSkip }: WelcomeModalProps) {
    const [currentStep, setCurrentStep] = useState(0)

    const step = welcomeSteps[currentStep]
    const isLastStep = currentStep === welcomeSteps.length - 1

    const goNext = () => {
        if (isLastStep) {
            onComplete()
        } else {
            setCurrentStep(s => s + 1)
        }
    }

    const goPrev = () => {
        setCurrentStep(s => Math.max(0, s - 1))
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-2xl blur-xl" />

                <div className="relative bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
                    {/* Skip button */}
                    <button
                        onClick={onSkip}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                        aria-label="Skip onboarding"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Content */}
                    <div className="p-8 text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/5 mb-6">
                            {step.icon}
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-white mb-3">
                            {step.title}
                        </h2>

                        {/* Description */}
                        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                            {step.description}
                        </p>

                        {/* Progress dots */}
                        <div className="flex justify-center gap-2 mb-6">
                            {welcomeSteps.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentStep(i)}
                                    className={`
                                        w-2 h-2 rounded-full transition-all
                                        ${i === currentStep
                                            ? 'w-6 bg-purple-500'
                                            : i < currentStep
                                                ? 'bg-purple-500/50'
                                                : 'bg-white/20'
                                        }
                                    `}
                                    aria-label={`Go to step ${i + 1}`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center justify-center gap-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={goPrev}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                            )}

                            <button
                                onClick={goNext}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                            >
                                {isLastStep ? 'Get Started' : 'Next'}
                            </button>

                            {!isLastStep && (
                                <button
                                    onClick={goNext}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ============================================================================
// FEATURE TOOLTIP
// ============================================================================

interface FeatureTooltipProps {
    feature: string
    title: string
    description: string
    shortcut?: string
    position?: 'top' | 'bottom' | 'left' | 'right'
    onDismiss: () => void
    children: React.ReactNode
}

export function FeatureTooltip({
    feature,
    title,
    description,
    shortcut,
    position = 'bottom',
    onDismiss,
    children
}: FeatureTooltipProps) {
    const { stepsCompleted, completeStep } = useOnboarding()

    if (stepsCompleted.includes(feature)) {
        return <>{children}</>
    }

    const handleDismiss = () => {
        completeStep(feature)
        onDismiss()
    }

    const positionClasses = {
        top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
        bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
        left: 'right-full mr-2 top-1/2 -translate-y-1/2',
        right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    }

    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-purple-500',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-purple-500',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-purple-500',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-purple-500',
    }

    return (
        <div className="relative inline-block">
            {children}

            <div
                className={`
                    absolute z-50 w-64 p-4 rounded-xl
                    bg-gradient-to-br from-purple-900/90 to-slate-900/90
                    border border-purple-500/30 backdrop-blur-xl
                    shadow-xl shadow-purple-500/20
                    animate-in fade-in zoom-in-95 duration-300
                    ${positionClasses[position]}
                `}
            >
                {/* Arrow */}
                <div
                    className={`
                        absolute w-0 h-0 border-8 border-transparent
                        ${arrowClasses[position]}
                    `}
                />

                {/* Content */}
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-white">{title}</h4>
                            <button
                                onClick={handleDismiss}
                                className="p-0.5 text-gray-500 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{description}</p>
                        {shortcut && (
                            <kbd className="px-2 py-0.5 text-xs font-mono text-purple-400 bg-purple-500/20 rounded">
                                {shortcut}
                            </kbd>
                        )}
                    </div>
                </div>

                {/* Got it button */}
                <button
                    onClick={handleDismiss}
                    className="w-full mt-3 py-1.5 text-sm font-medium text-purple-400 hover:text-white border border-purple-500/30 rounded-lg hover:bg-purple-500/20 transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    )
}

// ============================================================================
// EMPTY STATES
// ============================================================================

interface EmptyStateConfig {
    icon: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    secondaryAction?: {
        label: string
        onClick: () => void
    }
}

const emptyStates: Record<string, EmptyStateConfig> = {
    'no-files': {
        icon: <FolderOpen className="w-16 h-16 text-gray-600" />,
        title: 'No files open',
        description: 'Open a file from the explorer or create a new one to get started.',
        action: {
            label: 'Open File',
            onClick: () => console.log('Open file'),
        },
        secondaryAction: {
            label: 'New File',
            onClick: () => console.log('New file'),
        },
    },
    'no-search-results': {
        icon: <Search className="w-16 h-16 text-gray-600" />,
        title: 'No results found',
        description: 'Try adjusting your search terms or filters.',
    },
    'empty-folder': {
        icon: <File className="w-16 h-16 text-gray-600" />,
        title: 'This folder is empty',
        description: 'Create a new file or drag files here.',
        action: {
            label: 'Create File',
            onClick: () => console.log('Create file'),
        },
    },
    'no-git-repo': {
        icon: <GitBranch className="w-16 h-16 text-gray-600" />,
        title: 'No repository found',
        description: 'Initialize a Git repository to track changes.',
        action: {
            label: 'Initialize Repository',
            onClick: () => console.log('Init repo'),
        },
    },
    'no-terminal': {
        icon: <Terminal className="w-16 h-16 text-gray-600" />,
        title: 'No terminal open',
        description: 'Open a terminal to run commands.',
        action: {
            label: 'New Terminal',
            onClick: () => console.log('New terminal'),
        },
    },
}

interface PremiumEmptyStateProps {
    type: keyof typeof emptyStates
    customTitle?: string
    customDescription?: string
    onAction?: () => void
}

export function PremiumEmptyState({
    type,
    customTitle,
    customDescription,
    onAction
}: PremiumEmptyStateProps) {
    const config = emptyStates[type]

    if (!config) return null

    return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            {/* Icon with subtle animation */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-purple-500/10 blur-2xl rounded-full" />
                <div className="relative p-6 rounded-2xl bg-white/5 border border-white/5">
                    {config.icon}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold text-white mb-2">
                {customTitle || config.title}
            </h3>

            {/* Description */}
            <p className="text-gray-500 max-w-sm mb-6">
                {customDescription || config.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {config.action && (
                    <button
                        onClick={onAction || config.action.onClick}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                        {config.action.label}
                    </button>
                )}
                {config.secondaryAction && (
                    <button
                        onClick={config.secondaryAction.onClick}
                        className="px-4 py-2 text-gray-400 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        {config.secondaryAction.label}
                    </button>
                )}
            </div>
        </div>
    )
}

// ============================================================================
// KEYBOARD SHORTCUTS QUICK REFERENCE
// ============================================================================

const shortcuts = [
    { key: '⌘K', description: 'Command Palette' },
    { key: '⌘I', description: 'AI Chat' },
    { key: '⌘P', description: 'Quick Open' },
    { key: '⌘⇧F', description: 'Search Files' },
    { key: '⌘B', description: 'Toggle Sidebar' },
    { key: '⌘`', description: 'Toggle Terminal' },
    { key: '⌘S', description: 'Save File' },
    { key: '⌘⇧S', description: 'Save All' },
]

export function KeyboardShortcutsCard() {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                        <Settings className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                        <h4 className="font-medium text-white">Keyboard Shortcuts</h4>
                        <p className="text-sm text-gray-500">Quick reference</p>
                    </div>
                </div>
                <ChevronRight
                    className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                />
            </button>

            {isExpanded && (
                <div className="px-4 pb-4">
                    <div className="grid grid-cols-2 gap-2">
                        {shortcuts.map((shortcut, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                            >
                                <span className="text-sm text-gray-400">{shortcut.description}</span>
                                <kbd className="px-2 py-0.5 text-xs font-mono text-gray-300 bg-white/10 rounded">
                                    {shortcut.key}
                                </kbd>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// QUICK START TEMPLATES
// ============================================================================

interface Template {
    id: string
    name: string
    description: string
    icon: React.ReactNode
    category: string
}

const templates: Template[] = [
    { id: 'nextjs', name: 'Next.js App', description: 'Full-stack React with App Router', icon: <Code className="w-6 h-6" />, category: 'Web' },
    { id: 'vite', name: 'Vite + React', description: 'Lightning-fast React development', icon: <Zap className="w-6 h-6" />, category: 'Web' },
    { id: 'api', name: 'Express API', description: 'REST API with TypeScript', icon: <Terminal className="w-6 h-6" />, category: 'Backend' },
]

interface QuickStartProps {
    onSelectTemplate: (template: Template) => void
}

export function QuickStart({ onSelectTemplate }: QuickStartProps) {
    return (
        <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Start</h3>
            <div className="grid gap-3">
                {templates.map(template => (
                    <button
                        key={template.id}
                        onClick={() => onSelectTemplate(template)}
                        className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all text-left group"
                    >
                        <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 text-purple-400 group-hover:text-white transition-colors">
                            {template.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium text-white">{template.name}</h4>
                            <p className="text-sm text-gray-500">{template.description}</p>
                        </div>
                        <span className="text-xs text-gray-600 px-2 py-1 rounded bg-white/5">
                            {template.category}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    )
}
