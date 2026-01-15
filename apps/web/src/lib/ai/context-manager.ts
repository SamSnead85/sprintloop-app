/**
 * Context Window Manager
 * 
 * Phase 11: Token counting and context compression
 * - Count tokens per provider (approximate)
 * - Auto-compress large contexts
 * - Smart message truncation
 */

export interface TokenCount {
    input: number;
    output: number;
    total: number;
    maxAllowed: number;
    percentUsed: number;
}

export interface ContextWindow {
    messages: CompressedMessage[];
    tokenCount: TokenCount;
    isCompressed: boolean;
    originalMessageCount: number;
}

export interface CompressedMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokens: number;
    isCompressed: boolean;
}

// Approximate tokens per character by provider
const CHARS_PER_TOKEN: Record<string, number> = {
    anthropic: 3.5,  // Claude uses ~3.5 chars/token
    openai: 4,       // GPT uses ~4 chars/token
    google: 4,       // Gemini similar to GPT
    default: 4,
};

// Context window sizes by model
const MAX_CONTEXT_TOKENS: Record<string, number> = {
    // Claude
    'claude-4-opus': 200000,
    'claude-4-sonnet': 200000,
    'claude-4-haiku': 200000,

    // GPT
    'gpt-5': 128000,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,

    // Gemini
    'gemini-2.5-pro': 1000000,
    'gemini-2.5-flash': 1000000,

    default: 100000,
};

/**
 * Estimate token count for a string
 */
export function estimateTokens(text: string, provider: string = 'default'): number {
    const charsPerToken = CHARS_PER_TOKEN[provider] || CHARS_PER_TOKEN.default;
    return Math.ceil(text.length / charsPerToken);
}

/**
 * Get max tokens for a model
 */
export function getMaxTokens(modelId: string): number {
    return MAX_CONTEXT_TOKENS[modelId] || MAX_CONTEXT_TOKENS.default;
}

/**
 * Count tokens in a conversation
 */
export function countConversationTokens(
    messages: { role: string; content: string }[],
    provider: string = 'default'
): TokenCount {
    let inputTokens = 0;
    let outputTokens = 0;

    for (const msg of messages) {
        const tokens = estimateTokens(msg.content, provider);
        if (msg.role === 'assistant') {
            outputTokens += tokens;
        } else {
            inputTokens += tokens;
        }
    }

    const total = inputTokens + outputTokens;
    const maxAllowed = MAX_CONTEXT_TOKENS[provider] || MAX_CONTEXT_TOKENS.default;

    return {
        input: inputTokens,
        output: outputTokens,
        total,
        maxAllowed,
        percentUsed: Math.round((total / maxAllowed) * 100),
    };
}

/**
 * Compress a message if it's too long
 */
export function compressMessage(
    content: string,
    maxTokens: number,
    provider: string = 'default'
): { content: string; isCompressed: boolean } {
    const currentTokens = estimateTokens(content, provider);

    if (currentTokens <= maxTokens) {
        return { content, isCompressed: false };
    }

    // Strategy: Keep first and last parts, summarize middle
    const charsPerToken = CHARS_PER_TOKEN[provider] || CHARS_PER_TOKEN.default;
    const maxChars = maxTokens * charsPerToken;

    const keepChars = Math.floor(maxChars * 0.4); // Keep 40% from each end
    const firstPart = content.slice(0, keepChars);
    const lastPart = content.slice(-keepChars);

    const compressedContent = `${firstPart}\n\n[... content truncated for context limits ...]\n\n${lastPart}`;

    return {
        content: compressedContent,
        isCompressed: true,
    };
}

/**
 * Build an optimized context window
 */
export function buildContextWindow(
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    modelId: string,
    provider: string = 'default',
    reserveTokens: number = 4000 // Reserve for response
): ContextWindow {
    const maxTokens = getMaxTokens(modelId) - reserveTokens;
    const compressedMessages: CompressedMessage[] = [];
    let totalTokens = 0;
    let isCompressed = false;

    // Always include system message
    const systemMessages = messages.filter(m => m.role === 'system');
    const otherMessages = messages.filter(m => m.role !== 'system');

    // Add system messages first
    for (const msg of systemMessages) {
        const tokens = estimateTokens(msg.content, provider);
        compressedMessages.push({
            role: msg.role,
            content: msg.content,
            tokens,
            isCompressed: false,
        });
        totalTokens += tokens;
    }

    // Add messages from most recent to oldest until we hit limit
    const messagesToAdd: CompressedMessage[] = [];

    for (let i = otherMessages.length - 1; i >= 0; i--) {
        const msg = otherMessages[i];
        const tokens = estimateTokens(msg.content, provider);

        if (totalTokens + tokens <= maxTokens) {
            messagesToAdd.unshift({
                role: msg.role,
                content: msg.content,
                tokens,
                isCompressed: false,
            });
            totalTokens += tokens;
        } else {
            // Try to compress older messages
            const halfTokens = Math.floor((maxTokens - totalTokens) / 2);
            if (halfTokens > 100) {
                const compressed = compressMessage(msg.content, halfTokens, provider);
                const compressedTokens = estimateTokens(compressed.content, provider);
                messagesToAdd.unshift({
                    role: msg.role,
                    content: compressed.content,
                    tokens: compressedTokens,
                    isCompressed: true,
                });
                totalTokens += compressedTokens;
                isCompressed = true;
            }
            // Stop adding older messages
            break;
        }
    }

    compressedMessages.push(...messagesToAdd);

    return {
        messages: compressedMessages,
        tokenCount: {
            input: totalTokens,
            output: 0,
            total: totalTokens,
            maxAllowed: maxTokens + reserveTokens,
            percentUsed: Math.round((totalTokens / (maxTokens + reserveTokens)) * 100),
        },
        isCompressed,
        originalMessageCount: messages.length,
    };
}

/**
 * Format token count for display
 */
export function formatTokenCount(count: TokenCount): string {
    const used = count.total.toLocaleString();
    const max = count.maxAllowed.toLocaleString();
    return `${used} / ${max} tokens (${count.percentUsed}%)`;
}
