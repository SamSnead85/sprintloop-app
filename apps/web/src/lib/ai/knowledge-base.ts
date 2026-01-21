/**
 * Knowledge Base System
 * Provides RAG capabilities, context management, and document indexing
 * Supports both cloud and on-prem vector stores
 */

export interface KnowledgeDocument {
    id: string
    title: string
    content: string
    type: 'file' | 'url' | 'note' | 'code'
    source: string
    embedding?: number[]
    metadata: {
        createdAt: Date
        updatedAt: Date
        tokens?: number
        language?: string
        tags?: string[]
    }
}

export interface KnowledgeChunk {
    id: string
    documentId: string
    content: string
    embedding: number[]
    position: number
    metadata: {
        startLine?: number
        endLine?: number
        heading?: string
    }
}

export interface SearchResult {
    chunk: KnowledgeChunk
    document: KnowledgeDocument
    score: number
    highlights?: string[]
}

// Vector store configuration
export interface VectorStoreConfig {
    type: 'in-memory' | 'qdrant' | 'milvus' | 'chroma' | 'pinecone' | 'supabase'
    endpoint?: string
    apiKey?: string
    collection?: string
}

// Knowledge base configuration
export interface KnowledgeBaseConfig {
    name: string
    vectorStore: VectorStoreConfig
    embeddingModel: 'local' | 'openai' | 'voyage' | 'cohere'
    chunkSize: number
    chunkOverlap: number
}

// Default config
const DEFAULT_KB_CONFIG: KnowledgeBaseConfig = {
    name: 'default',
    vectorStore: { type: 'in-memory' },
    embeddingModel: 'local',
    chunkSize: 512,
    chunkOverlap: 50,
}

/**
 * In-memory vector store for local development
 */
class InMemoryVectorStore {
    private documents: Map<string, KnowledgeDocument> = new Map()
    private chunks: Map<string, KnowledgeChunk> = new Map()

    async addDocument(doc: KnowledgeDocument): Promise<void> {
        this.documents.set(doc.id, doc)
    }

    async addChunk(chunk: KnowledgeChunk): Promise<void> {
        this.chunks.set(chunk.id, chunk)
    }

    async search(queryEmbedding: number[], topK: number = 5): Promise<SearchResult[]> {
        const results: SearchResult[] = []

        for (const chunk of this.chunks.values()) {
            const score = cosineSimilarity(queryEmbedding, chunk.embedding)
            const document = this.documents.get(chunk.documentId)

            if (document) {
                results.push({ chunk, document, score })
            }
        }

        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, topK)
    }

    async deleteDocument(docId: string): Promise<void> {
        this.documents.delete(docId)
        // Remove associated chunks
        for (const [chunkId, chunk] of this.chunks.entries()) {
            if (chunk.documentId === docId) {
                this.chunks.delete(chunkId)
            }
        }
    }

    getStats() {
        return {
            documents: this.documents.size,
            chunks: this.chunks.size,
        }
    }
}

// Cosine similarity for vector comparison
function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i]
        normA += a[i] * a[i]
        normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Knowledge Base Manager
 */
export class KnowledgeBase {
    private config: KnowledgeBaseConfig
    private vectorStore: InMemoryVectorStore

    constructor(config: Partial<KnowledgeBaseConfig> = {}) {
        this.config = { ...DEFAULT_KB_CONFIG, ...config }
        this.vectorStore = new InMemoryVectorStore()
    }

    /**
     * Index a document into the knowledge base
     */
    async indexDocument(doc: Omit<KnowledgeDocument, 'id' | 'embedding' | 'metadata'>): Promise<string> {
        const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2)}`

        const document: KnowledgeDocument = {
            ...doc,
            id,
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                tokens: this.estimateTokens(doc.content),
            },
        }

        // Chunk the content
        const chunks = this.chunkContent(document.content, id)

        // Generate embeddings for each chunk
        for (const chunk of chunks) {
            chunk.embedding = await this.generateEmbedding(chunk.content)
            await this.vectorStore.addChunk(chunk)
        }

        await this.vectorStore.addDocument(document)

        return id
    }

    /**
     * Search the knowledge base
     */
    async search(query: string, topK: number = 5): Promise<SearchResult[]> {
        const queryEmbedding = await this.generateEmbedding(query)
        return this.vectorStore.search(queryEmbedding, topK)
    }

    /**
     * Get context for a prompt
     */
    async getContext(query: string, maxTokens: number = 2000): Promise<string> {
        const results = await this.search(query, 10)

        let context = ''
        let tokenCount = 0

        for (const result of results) {
            const chunkTokens = this.estimateTokens(result.chunk.content)
            if (tokenCount + chunkTokens > maxTokens) break

            context += `\n---\nSource: ${result.document.title}\n${result.chunk.content}\n`
            tokenCount += chunkTokens
        }

        return context
    }

    /**
     * Delete a document
     */
    async deleteDocument(docId: string): Promise<void> {
        await this.vectorStore.deleteDocument(docId)
    }

    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.vectorStore.getStats(),
            config: this.config,
        }
    }

    // Chunk content into smaller pieces
    private chunkContent(content: string, docId: string): KnowledgeChunk[] {
        const chunks: KnowledgeChunk[] = []
        const lines = content.split('\n')

        let currentChunk = ''
        let startLine = 0
        let position = 0

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (this.estimateTokens(currentChunk + line) > this.config.chunkSize) {
                if (currentChunk) {
                    chunks.push({
                        id: `chunk_${docId}_${position}`,
                        documentId: docId,
                        content: currentChunk.trim(),
                        embedding: [],
                        position,
                        metadata: { startLine, endLine: i - 1 },
                    })
                    position++
                }

                // Start new chunk with overlap
                const overlapLines = Math.ceil(this.config.chunkOverlap / 10)
                startLine = Math.max(0, i - overlapLines)
                currentChunk = lines.slice(startLine, i).join('\n') + '\n' + line
            } else {
                currentChunk += (currentChunk ? '\n' : '') + line
            }
        }

        // Add final chunk
        if (currentChunk) {
            chunks.push({
                id: `chunk_${docId}_${position}`,
                documentId: docId,
                content: currentChunk.trim(),
                embedding: [],
                position,
                metadata: { startLine, endLine: lines.length - 1 },
            })
        }

        return chunks
    }

    // Simple token estimation (4 chars per token)
    private estimateTokens(text: string): number {
        return Math.ceil(text.length / 4)
    }

    // Generate embedding (placeholder - uses random for now)
    private async generateEmbedding(text: string): Promise<number[]> {
        // TODO: Integrate with actual embedding model
        // For now, create a simple hash-based embedding
        const dims = 384
        const embedding = new Array(dims).fill(0)

        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i)
            embedding[i % dims] += charCode / 1000
        }

        // Normalize
        const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
        return embedding.map(val => val / (norm || 1))
    }
}

// Global knowledge base instance
let globalKnowledgeBase: KnowledgeBase | null = null

export function getKnowledgeBase(): KnowledgeBase {
    if (!globalKnowledgeBase) {
        globalKnowledgeBase = new KnowledgeBase()
    }
    return globalKnowledgeBase
}

export function initKnowledgeBase(config: Partial<KnowledgeBaseConfig>): KnowledgeBase {
    globalKnowledgeBase = new KnowledgeBase(config)
    return globalKnowledgeBase
}
