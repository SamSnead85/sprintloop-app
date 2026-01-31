/**
 * SprintLoop Project Rules System
 * 
 * Implements Cursor-style .cursorrules and .sprintloop configuration:
 * - Project-wide AI behavior customization
 * - Custom instructions and patterns
 * - Technology stack configuration
 * - Ignore patterns for indexing
 * - Team-shared rules
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Project rule file types
export type RuleFileType = '.sprintloop' | '.sprintlooprc' | '.cursorrules' | 'sprintloop.config.json'

// Project rule
export interface ProjectRule {
    id: string
    name: string
    description?: string
    content: string
    priority: number
    enabled: boolean
    source: 'file' | 'user' | 'team'
    filePath?: string
}

// Technology stack configuration
export interface TechStackConfig {
    framework?: string
    language?: string
    testing?: string
    styling?: string
    packageManager?: string
    buildTool?: string
    database?: string
    orm?: string
    deployment?: string
}

// Project configuration
export interface ProjectConfig {
    // Project metadata
    name: string
    description?: string
    version?: string

    // AI behavior
    aiInstructions: string[]
    preferredModel?: string
    temperature?: number
    maxTokens?: number

    // Technology stack
    techStack: TechStackConfig

    // Code style
    codeStyle: {
        indentation: 'spaces' | 'tabs'
        indentSize: number
        lineWidth: number
        quoteStyle: 'single' | 'double'
        semicolons: boolean
        trailingComma: 'none' | 'es5' | 'all'
    }

    // File patterns
    include: string[]
    exclude: string[]
    prioritize: string[]

    // Context windows
    contextFiles: string[]
    alwaysInclude: string[]

    // Custom commands
    commands: {
        name: string
        description: string
        script?: string
        prompt?: string
    }[]
}

// Default project configuration
const DEFAULT_CONFIG: ProjectConfig = {
    name: 'Untitled Project',
    aiInstructions: [],
    techStack: {},
    codeStyle: {
        indentation: 'spaces',
        indentSize: 2,
        lineWidth: 100,
        quoteStyle: 'single',
        semicolons: false,
        trailingComma: 'es5',
    },
    include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.json', '**/*.md'],
    exclude: ['node_modules/**', 'dist/**', 'build/**', '.git/**', '*.lock'],
    prioritize: ['README.md', 'package.json', 'tsconfig.json'],
    contextFiles: [],
    alwaysInclude: [],
    commands: [],
}

// Project rules state
interface ProjectRulesState {
    // Current project config
    config: ProjectConfig

    // Active rules
    rules: ProjectRule[]

    // Rule file content
    ruleFileContent: string
    ruleFilePath: string | null

    // Detected technologies
    detectedTech: TechStackConfig

    // Validation
    isValid: boolean
    validationErrors: string[]

    // Actions
    setConfig: (config: Partial<ProjectConfig>) => void
    resetConfig: () => void

    // Rules management
    addRule: (rule: Omit<ProjectRule, 'id'>) => void
    updateRule: (id: string, updates: Partial<ProjectRule>) => void
    removeRule: (id: string) => void
    reorderRules: (ruleIds: string[]) => void

    // Parse rule files
    parseRuleFile: (content: string, type: RuleFileType) => ProjectConfig
    loadFromFile: (path: string, content: string) => void

    // Generate rule file content
    generateRuleFile: (type: RuleFileType) => string

    // Tech detection
    detectTechStack: (files: string[]) => TechStackConfig

    // AI instructions
    addInstruction: (instruction: string) => void
    removeInstruction: (index: number) => void

    // Custom commands
    addCommand: (command: ProjectConfig['commands'][0]) => void
    removeCommand: (name: string) => void

    // Pattern management
    addIncludePattern: (pattern: string) => void
    removeIncludePattern: (pattern: string) => void
    addExcludePattern: (pattern: string) => void
    removeExcludePattern: (pattern: string) => void

    // Build system prompt from rules
    buildRulesPrompt: () => string

    // Validation
    validate: () => boolean
}

export const useProjectRules = create<ProjectRulesState>()(
    persist(
        (set, get) => ({
            config: DEFAULT_CONFIG,
            rules: [],
            ruleFileContent: '',
            ruleFilePath: null,
            detectedTech: {},
            isValid: true,
            validationErrors: [],

            setConfig: (updates) => {
                set(state => ({
                    config: { ...state.config, ...updates },
                }))
                get().validate()
            },

            resetConfig: () => set({ config: DEFAULT_CONFIG }),

            addRule: (rule) => {
                const newRule: ProjectRule = {
                    ...rule,
                    id: `rule-${Date.now()}`,
                }
                set(state => ({
                    rules: [...state.rules, newRule],
                }))
            },

            updateRule: (id, updates) => {
                set(state => ({
                    rules: state.rules.map(r => r.id === id ? { ...r, ...updates } : r),
                }))
            },

            removeRule: (id) => {
                set(state => ({
                    rules: state.rules.filter(r => r.id !== id),
                }))
            },

            reorderRules: (ruleIds) => {
                set(state => {
                    const ruleMap = new Map(state.rules.map(r => [r.id, r]))
                    const reordered = ruleIds
                        .map(id => ruleMap.get(id))
                        .filter((r): r is ProjectRule => !!r)
                        .map((r, i) => ({ ...r, priority: i }))
                    return { rules: reordered }
                })
            },

            parseRuleFile: (content, type) => {
                const config: ProjectConfig = { ...DEFAULT_CONFIG }

                if (type === 'sprintloop.config.json') {
                    // Parse JSON config
                    try {
                        const parsed = JSON.parse(content)
                        return { ...config, ...parsed }
                    } catch {
                        return config
                    }
                }

                // Parse YAML-like or plain text rules
                const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'))

                for (const line of lines) {
                    // Parse key: value pairs
                    const match = line.match(/^([^:]+):\s*(.+)$/)
                    if (match) {
                        const [, key, value] = match

                        switch (key.trim().toLowerCase()) {
                            case 'framework':
                                config.techStack.framework = value.trim()
                                break
                            case 'language':
                                config.techStack.language = value.trim()
                                break
                            case 'testing':
                                config.techStack.testing = value.trim()
                                break
                            case 'styling':
                                config.techStack.styling = value.trim()
                                break
                            case 'model':
                            case 'preferred-model':
                                config.preferredModel = value.trim()
                                break
                        }
                    } else {
                        // Plain instruction line
                        config.aiInstructions.push(line.trim())
                    }
                }

                return config
            },

            loadFromFile: (path, content) => {
                const type = path.split('/').pop() as RuleFileType
                const config = get().parseRuleFile(content, type)

                set({
                    config,
                    ruleFileContent: content,
                    ruleFilePath: path,
                })
            },

            generateRuleFile: (type) => {
                const { config } = get()

                if (type === 'sprintloop.config.json') {
                    return JSON.stringify(config, null, 2)
                }

                // Generate plain text format
                const lines: string[] = [
                    '# SprintLoop Project Configuration',
                    '# These rules are used to customize AI behavior for this project',
                    '',
                ]

                if (config.name !== 'Untitled Project') {
                    lines.push(`# Project: ${config.name}`)
                    lines.push('')
                }

                if (config.description) {
                    lines.push(`# ${config.description}`)
                    lines.push('')
                }

                // Tech stack
                if (Object.keys(config.techStack).length > 0) {
                    lines.push('# Technology Stack')
                    for (const [key, value] of Object.entries(config.techStack)) {
                        if (value) {
                            lines.push(`${key}: ${value}`)
                        }
                    }
                    lines.push('')
                }

                // AI instructions
                if (config.aiInstructions.length > 0) {
                    lines.push('# AI Instructions')
                    for (const instruction of config.aiInstructions) {
                        lines.push(instruction)
                    }
                    lines.push('')
                }

                // Exclude patterns
                if (config.exclude.length > 0) {
                    lines.push('# Excluded Patterns')
                    for (const pattern of config.exclude) {
                        lines.push(`exclude: ${pattern}`)
                    }
                }

                return lines.join('\n')
            },

            detectTechStack: (files) => {
                const tech: TechStackConfig = {}

                // Detect based on file presence
                if (files.includes('package.json')) {
                    tech.packageManager = files.includes('pnpm-lock.yaml')
                        ? 'pnpm'
                        : files.includes('yarn.lock')
                            ? 'yarn'
                            : 'npm'
                }

                if (files.includes('tsconfig.json')) {
                    tech.language = 'TypeScript'
                }

                if (files.includes('next.config.js') || files.includes('next.config.ts')) {
                    tech.framework = 'Next.js'
                } else if (files.includes('vite.config.ts') || files.includes('vite.config.js')) {
                    tech.buildTool = 'Vite'
                    if (files.some(f => f.includes('react'))) {
                        tech.framework = 'React'
                    }
                }

                if (files.includes('tailwind.config.js') || files.includes('tailwind.config.ts')) {
                    tech.styling = 'Tailwind CSS'
                }

                if (files.includes('vitest.config.ts') || files.includes('vitest.config.js')) {
                    tech.testing = 'Vitest'
                } else if (files.includes('jest.config.js') || files.includes('jest.config.ts')) {
                    tech.testing = 'Jest'
                }

                if (files.includes('prisma/schema.prisma')) {
                    tech.orm = 'Prisma'
                } else if (files.includes('drizzle.config.ts')) {
                    tech.orm = 'Drizzle'
                }

                if (files.includes('Dockerfile')) {
                    tech.deployment = 'Docker'
                } else if (files.includes('vercel.json')) {
                    tech.deployment = 'Vercel'
                } else if (files.includes('netlify.toml')) {
                    tech.deployment = 'Netlify'
                }

                set({ detectedTech: tech })
                return tech
            },

            addInstruction: (instruction) => {
                set(state => ({
                    config: {
                        ...state.config,
                        aiInstructions: [...state.config.aiInstructions, instruction],
                    },
                }))
            },

            removeInstruction: (index) => {
                set(state => ({
                    config: {
                        ...state.config,
                        aiInstructions: state.config.aiInstructions.filter((_, i) => i !== index),
                    },
                }))
            },

            addCommand: (command) => {
                set(state => ({
                    config: {
                        ...state.config,
                        commands: [...state.config.commands, command],
                    },
                }))
            },

            removeCommand: (name) => {
                set(state => ({
                    config: {
                        ...state.config,
                        commands: state.config.commands.filter(c => c.name !== name),
                    },
                }))
            },

            addIncludePattern: (pattern) => {
                set(state => ({
                    config: {
                        ...state.config,
                        include: [...new Set([...state.config.include, pattern])],
                    },
                }))
            },

            removeIncludePattern: (pattern) => {
                set(state => ({
                    config: {
                        ...state.config,
                        include: state.config.include.filter(p => p !== pattern),
                    },
                }))
            },

            addExcludePattern: (pattern) => {
                set(state => ({
                    config: {
                        ...state.config,
                        exclude: [...new Set([...state.config.exclude, pattern])],
                    },
                }))
            },

            removeExcludePattern: (pattern) => {
                set(state => ({
                    config: {
                        ...state.config,
                        exclude: state.config.exclude.filter(p => p !== pattern),
                    },
                }))
            },

            buildRulesPrompt: () => {
                const { config, rules } = get()

                let prompt = ''

                // Add tech stack context
                const techStack = Object.entries(config.techStack)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)

                if (techStack.length > 0) {
                    prompt += `## Project Technology Stack\n${techStack.join('\n')}\n\n`
                }

                // Add code style
                prompt += `## Code Style
- Indentation: ${config.codeStyle.indentSize} ${config.codeStyle.indentation}
- Line width: ${config.codeStyle.lineWidth}
- Quotes: ${config.codeStyle.quoteStyle}
- Semicolons: ${config.codeStyle.semicolons ? 'required' : 'omitted'}
- Trailing commas: ${config.codeStyle.trailingComma}

`

                // Add AI instructions
                if (config.aiInstructions.length > 0) {
                    prompt += `## Project Rules\n${config.aiInstructions.map(i => `- ${i}`).join('\n')}\n\n`
                }

                // Add custom rules
                const enabledRules = rules.filter(r => r.enabled).sort((a, b) => a.priority - b.priority)
                if (enabledRules.length > 0) {
                    prompt += `## Custom Rules\n${enabledRules.map(r => r.content).join('\n\n')}\n\n`
                }

                return prompt
            },

            validate: () => {
                const { config } = get()
                const errors: string[] = []

                if (!config.name || config.name.trim() === '') {
                    errors.push('Project name is required')
                }

                if (config.codeStyle.indentSize < 1 || config.codeStyle.indentSize > 8) {
                    errors.push('Indent size must be between 1 and 8')
                }

                if (config.codeStyle.lineWidth < 40 || config.codeStyle.lineWidth > 200) {
                    errors.push('Line width must be between 40 and 200')
                }

                set({
                    isValid: errors.length === 0,
                    validationErrors: errors,
                })

                return errors.length === 0
            },
        }),
        {
            name: 'sprintloop-project-rules',
            partialize: (state) => ({
                config: state.config,
                rules: state.rules,
            }),
        }
    )
)

// Sample .sprintloop file template
export const SPRINTLOOP_TEMPLATE = `# SprintLoop Project Configuration
# ================================
# This file customizes AI behavior for your project.
# Place it in your project root as .sprintloop or sprintloop.config.json

# Technology Stack
framework: Next.js
language: TypeScript
styling: Tailwind CSS
testing: Vitest

# AI Instructions
# These rules guide the AI's code generation:

Always use TypeScript with strict mode enabled
Prefer functional components with hooks
Use Tailwind CSS for styling, avoid inline styles
Write comprehensive tests for new features
Follow the existing code patterns in the codebase
Use meaningful variable and function names
Add JSDoc comments for exported functions

# File Patterns
exclude: node_modules/**
exclude: dist/**
exclude: .git/**
exclude: *.lock

# Custom Commands
# Define shortcuts for common tasks:
# command:test = npm run test
# command:build = npm run build
`
