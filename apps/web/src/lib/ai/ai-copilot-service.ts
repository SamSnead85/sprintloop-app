/**
 * Phase 501-550: AI Chat & Copilot Services
 * 
 * Conversational AI and code assistance:
 * - Chat interface
 * - Context management
 * - Code generation
 * - Inline suggestions
 * - Multi-model support
 * - Conversation history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    model?: string;
    tokens?: { input: number; output: number };
    codeBlocks?: CodeBlock[];
    attachments?: Attachment[];
}

export interface CodeBlock {
    language: string;
    code: string;
    filename?: string;
}

export interface Attachment {
    type: 'file' | 'image' | 'snippet';
    name: string;
    content: string;
    mimeType?: string;
}

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: Date;
    updatedAt: Date;
    model: string;
    context?: ConversationContext;
}

export interface ConversationContext {
    files: string[];
    workspace?: string;
    language?: string;
    framework?: string;
}

export interface AIModel {
    id: string;
    name: string;
    provider: 'openai' | 'anthropic' | 'google' | 'local';
    contextWindow: number;
    capabilities: ('chat' | 'code' | 'vision' | 'function-calling')[];
    isAvailable: boolean;
}

export interface InlineSuggestion {
    id: string;
    text: string;
    range: { startLine: number; endLine: number; startColumn: number; endColumn: number };
    confidence: number;
}

export interface AICopilotState {
    conversations: Conversation[];
    activeConversationId: string | null;
    models: AIModel[];
    activeModelId: string;
    isGenerating: boolean;
    inlineSuggestions: InlineSuggestion[];
    copilotEnabled: boolean;

    // Conversation operations
    createConversation: (title?: string) => string;
    deleteConversation: (id: string) => void;
    setActiveConversation: (id: string | null) => void;
    sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
    regenerateResponse: (messageId: string) => Promise<void>;
    clearConversation: (id: string) => void;

    // Model operations
    setActiveModel: (modelId: string) => void;
    getAvailableModels: () => AIModel[];

    // Inline suggestions
    requestSuggestion: (context: { code: string; line: number; column: number }) => Promise<void>;
    acceptSuggestion: (id: string) => void;
    dismissSuggestion: (id: string) => void;
    toggleCopilot: () => void;

    // Context
    setContext: (conversationId: string, context: ConversationContext) => void;

    // Helpers
    getCurrentConversation: () => Conversation | undefined;
}

// =============================================================================
// MOCK DATA
// =============================================================================

const DEFAULT_MODELS: AIModel[] = [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextWindow: 128000, capabilities: ['chat', 'code', 'vision', 'function-calling'], isAvailable: true },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextWindow: 128000, capabilities: ['chat', 'code', 'vision', 'function-calling'], isAvailable: true },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', contextWindow: 200000, capabilities: ['chat', 'code', 'vision'], isAvailable: true },
    { id: 'gemini-pro', name: 'Gemini Pro', provider: 'google', contextWindow: 1000000, capabilities: ['chat', 'code', 'vision'], isAvailable: true },
];

// =============================================================================
// STORE
// =============================================================================

export const useAICopilotService = create<AICopilotState>()(
    persist(
        (set, get) => ({
            conversations: [],
            activeConversationId: null,
            models: DEFAULT_MODELS,
            activeModelId: 'gpt-4-turbo',
            isGenerating: false,
            inlineSuggestions: [],
            copilotEnabled: true,

            createConversation: (title) => {
                const id = `conv_${Date.now()}`;
                const conversation: Conversation = {
                    id,
                    title: title || 'New Chat',
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    model: get().activeModelId,
                };
                set(state => ({
                    conversations: [conversation, ...state.conversations],
                    activeConversationId: id,
                }));
                return id;
            },

            deleteConversation: (id) => {
                set(state => ({
                    conversations: state.conversations.filter(c => c.id !== id),
                    activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
                }));
            },

            setActiveConversation: (id) => set({ activeConversationId: id }),

            sendMessage: async (content, attachments) => {
                const { activeConversationId, activeModelId } = get();
                if (!activeConversationId) return;

                const userMessage: ChatMessage = {
                    id: `msg_${Date.now()}_user`,
                    role: 'user',
                    content,
                    timestamp: new Date(),
                    attachments,
                };

                set(state => ({
                    conversations: state.conversations.map(c =>
                        c.id === activeConversationId
                            ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date() }
                            : c
                    ),
                    isGenerating: true,
                }));

                // Simulate AI response
                await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));

                const assistantMessage: ChatMessage = {
                    id: `msg_${Date.now()}_assistant`,
                    role: 'assistant',
                    content: `I understand you're asking about "${content.slice(0, 50)}...". Here's my response:\n\nBased on the context, I can help you with this. Let me explain the approach...`,
                    timestamp: new Date(),
                    model: activeModelId,
                    tokens: { input: content.length / 4, output: 150 },
                    codeBlocks: content.toLowerCase().includes('code') ? [{
                        language: 'typescript',
                        code: 'function example() {\n  return "Hello, World!";\n}',
                    }] : undefined,
                };

                set(state => ({
                    conversations: state.conversations.map(c =>
                        c.id === activeConversationId
                            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
                            : c
                    ),
                    isGenerating: false,
                }));
            },

            regenerateResponse: async (_messageId) => {
                set({ isGenerating: true });
                await new Promise(r => setTimeout(r, 800));
                set({ isGenerating: false });
            },

            clearConversation: (id) => {
                set(state => ({
                    conversations: state.conversations.map(c =>
                        c.id === id ? { ...c, messages: [], updatedAt: new Date() } : c
                    ),
                }));
            },

            setActiveModel: (modelId) => set({ activeModelId: modelId }),
            getAvailableModels: () => get().models.filter(m => m.isAvailable),

            requestSuggestion: async (context) => {
                await new Promise(r => setTimeout(r, 200));
                const suggestion: InlineSuggestion = {
                    id: `sug_${Date.now()}`,
                    text: ' // TODO: implement this',
                    range: { startLine: context.line, endLine: context.line, startColumn: context.column, endColumn: context.column },
                    confidence: 0.85,
                };
                set(state => ({ inlineSuggestions: [suggestion, ...state.inlineSuggestions] }));
            },

            acceptSuggestion: (id) => {
                set(state => ({ inlineSuggestions: state.inlineSuggestions.filter(s => s.id !== id) }));
            },

            dismissSuggestion: (id) => {
                set(state => ({ inlineSuggestions: state.inlineSuggestions.filter(s => s.id !== id) }));
            },

            toggleCopilot: () => set(state => ({ copilotEnabled: !state.copilotEnabled })),

            setContext: (conversationId, context) => {
                set(state => ({
                    conversations: state.conversations.map(c =>
                        c.id === conversationId ? { ...c, context } : c
                    ),
                }));
            },

            getCurrentConversation: () => {
                const { conversations, activeConversationId } = get();
                return conversations.find(c => c.id === activeConversationId);
            },
        }),
        {
            name: 'sprintloop-ai-copilot',
            partialize: (state) => ({
                conversations: state.conversations.slice(0, 50),
                activeModelId: state.activeModelId,
                copilotEnabled: state.copilotEnabled,
            }),
        }
    )
);
