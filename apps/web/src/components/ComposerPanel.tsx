/**
 * Composer Mode Panel
 * 
 * Full-screen agentic interface with plan → execute → verify flow.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAIProvider, type Message } from '../lib/ai/ai-provider';
import { useMultiFileEdit } from '../lib/ai/multi-file-edit';

interface ComposerPanelProps {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export const ComposerPanel: React.FC<ComposerPanelProps> = ({ isOpen, onClose, className }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ComposerMessage[]>([]);
    const [phase, setPhase] = useState<'idle' | 'planning' | 'executing' | 'complete'>('idle');

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { stream, model } = useAIProvider();
    const { generateEdits, getActiveSession } = useMultiFileEdit();

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async () => {
        if (!input.trim() || phase !== 'idle') return;

        const userMessage: ComposerMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: input,
            timestamp: Date.now(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setPhase('planning');

        // Add planning message
        const planningMessage: ComposerMessage = {
            id: `planning-${Date.now()}`,
            type: 'assistant',
            content: '',
            timestamp: Date.now(),
            isStreaming: true,
        };
        setMessages(prev => [...prev, planningMessage]);

        try {
            // Stream the planning response
            const aiMessages: Message[] = [
                {
                    role: 'system',
                    content: `You are an expert software engineer. The user will describe what they want to build or change.

Your response should be a detailed plan with:
1. **Understanding** - Restate what the user wants
2. **Approach** - How you'll implement it
3. **Files to Modify** - List of files you'll create or change
4. **Steps** - Numbered implementation steps
5. **Verification** - How to test the changes

Be concise but thorough. Use markdown formatting.`
                },
                { role: 'user', content: input },
            ];

            let fullContent = '';

            for await (const chunk of stream(aiMessages, { temperature: 0.7 })) {
                if (chunk.type === 'text' && chunk.content) {
                    fullContent += chunk.content;
                    setMessages(prev => prev.map(m =>
                        m.id === planningMessage.id
                            ? { ...m, content: fullContent }
                            : m
                    ));
                }
            }

            // Mark planning complete
            setMessages(prev => prev.map(m =>
                m.id === planningMessage.id
                    ? { ...m, isStreaming: false }
                    : m
            ));

            setPhase('executing');

            // Execute changes (mock for now)
            const executingMessage: ComposerMessage = {
                id: `executing-${Date.now()}`,
                type: 'system',
                content: '🔄 Generating file changes...',
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, executingMessage]);

            // Generate multi-file edits
            await generateEdits(input, ['src/App.tsx', 'src/index.ts']);

            const session = getActiveSession();

            const completeMessage: ComposerMessage = {
                id: `complete-${Date.now()}`,
                type: 'system',
                content: `✅ Generated ${session?.files.length || 0} file edits. Review them in the Diff Preview panel.`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, completeMessage]);

            setPhase('complete');
        } catch (error) {
            const errorMessage: ComposerMessage = {
                id: `error-${Date.now()}`,
                type: 'error',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMessage]);
            setPhase('idle');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleReset = () => {
        setMessages([]);
        setPhase('idle');
        setInput('');
    };

    if (!isOpen) return null;

    return (
        <div className={`composer-panel ${className || ''}`}>
            {/* Header */}
            <div className="composer-panel__header">
                <div className="composer-panel__title">
                    <span className="composer-panel__icon">🚀</span>
                    <span>Composer</span>
                    <PhaseIndicator phase={phase} />
                </div>
                <div className="composer-panel__actions">
                    <button onClick={handleReset} title="Reset">🔄</button>
                    <button onClick={onClose} title="Close">✕</button>
                </div>
            </div>

            {/* Messages */}
            <div className="composer-panel__messages">
                {messages.length === 0 && (
                    <div className="composer-panel__empty">
                        <h3>What would you like to build?</h3>
                        <p>Describe your task in natural language. I'll plan it out and generate the code.</p>
                        <div className="composer-panel__examples">
                            <button onClick={() => setInput('Create a new React component for user authentication')}>
                                Create auth component
                            </button>
                            <button onClick={() => setInput('Add dark mode support to the application')}>
                                Add dark mode
                            </button>
                            <button onClick={() => setInput('Refactor the API calls to use React Query')}>
                                Refactor to React Query
                            </button>
                        </div>
                    </div>
                )}

                {messages.map(message => (
                    <MessageBubble key={message.id} message={message} />
                ))}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="composer-panel__input-container">
                <textarea
                    ref={inputRef}
                    className="composer-panel__input"
                    placeholder="Describe what you want to build... (⌘+Enter to submit)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={phase !== 'idle' && phase !== 'complete'}
                    rows={3}
                />
                <div className="composer-panel__input-actions">
                    <span className="composer-panel__model">Using {model}</span>
                    <button
                        className="composer-panel__submit"
                        onClick={handleSubmit}
                        disabled={!input.trim() || (phase !== 'idle' && phase !== 'complete')}
                    >
                        {phase === 'idle' || phase === 'complete' ? 'Generate' : 'Working...'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface ComposerMessage {
    id: string;
    type: 'user' | 'assistant' | 'system' | 'error';
    content: string;
    timestamp: number;
    isStreaming?: boolean;
}

interface MessageBubbleProps {
    message: ComposerMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
    return (
        <div className={`composer-message composer-message--${message.type}`}>
            <div className="composer-message__avatar">
                {message.type === 'user' && '👤'}
                {message.type === 'assistant' && '🤖'}
                {message.type === 'system' && '⚙️'}
                {message.type === 'error' && '⚠️'}
            </div>
            <div className="composer-message__content">
                <div className="composer-message__text">
                    {message.content}
                    {message.isStreaming && <span className="composer-message__cursor">▊</span>}
                </div>
            </div>
        </div>
    );
};

interface PhaseIndicatorProps {
    phase: 'idle' | 'planning' | 'executing' | 'complete';
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({ phase }) => {
    const phases = ['idle', 'planning', 'executing', 'complete'];
    const currentIndex = phases.indexOf(phase);

    return (
        <div className="phase-indicator">
            {phases.slice(1).map((p, i) => (
                <span
                    key={p}
                    className={`phase-indicator__step ${i < currentIndex ? 'complete' : ''} ${i === currentIndex - 1 ? 'active' : ''}`}
                >
                    {p === 'planning' && '📋'}
                    {p === 'executing' && '⚡'}
                    {p === 'complete' && '✅'}
                </span>
            ))}
        </div>
    );
};

export default ComposerPanel;
