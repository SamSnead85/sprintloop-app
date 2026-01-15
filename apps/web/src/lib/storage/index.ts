/**
 * Persistent Storage Layer
 * Uses localStorage for settings and IndexedDB for larger data
 */

const STORAGE_PREFIX = 'sprintloop:'

// Simple localStorage wrapper with JSON serialization
export const storage = {
    get<T>(key: string, defaultValue: T): T {
        try {
            const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
            return item ? JSON.parse(item) : defaultValue
        } catch {
            return defaultValue
        }
    },

    set<T>(key: string, value: T): void {
        try {
            localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
        } catch (error) {
            console.error('Storage error:', error)
        }
    },

    remove(key: string): void {
        localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
    },

    clear(): void {
        Object.keys(localStorage)
            .filter(key => key.startsWith(STORAGE_PREFIX))
            .forEach(key => localStorage.removeItem(key))
    },
}

// IndexedDB wrapper for larger data (files, chat history)
const DB_NAME = 'sprintloop'
const DB_VERSION = 1

interface StoreConfig {
    name: string
    keyPath: string
    indexes?: { name: string; keyPath: string; unique?: boolean }[]
}

const STORES: StoreConfig[] = [
    {
        name: 'projects',
        keyPath: 'id',
        indexes: [
            { name: 'name', keyPath: 'name' },
            { name: 'lastOpened', keyPath: 'lastOpened' },
        ]
    },
    {
        name: 'files',
        keyPath: 'id',
        indexes: [
            { name: 'projectId', keyPath: 'projectId' },
            { name: 'path', keyPath: 'path' },
        ]
    },
    {
        name: 'chatHistory',
        keyPath: 'id',
        indexes: [
            { name: 'projectId', keyPath: 'projectId' },
            { name: 'timestamp', keyPath: 'timestamp' },
        ]
    },
    {
        name: 'auditLog',
        keyPath: 'id',
        indexes: [
            { name: 'timestamp', keyPath: 'timestamp' },
            { name: 'action', keyPath: 'action' },
            { name: 'userId', keyPath: 'userId' },
        ]
    },
]

let dbInstance: IDBDatabase | null = null

export async function openDatabase(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
            dbInstance = request.result
            resolve(dbInstance)
        }

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result

            STORES.forEach(storeConfig => {
                if (!db.objectStoreNames.contains(storeConfig.name)) {
                    const store = db.createObjectStore(storeConfig.name, {
                        keyPath: storeConfig.keyPath
                    })

                    storeConfig.indexes?.forEach(idx => {
                        store.createIndex(idx.name, idx.keyPath, { unique: idx.unique })
                    })
                }
            })
        }
    })
}

// Generic IndexedDB operations
export const db = {
    async get<T>(storeName: string, key: string): Promise<T | undefined> {
        const database = await openDatabase()
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readonly')
            const store = transaction.objectStore(storeName)
            const request = store.get(key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
        })
    },

    async getAll<T>(storeName: string): Promise<T[]> {
        const database = await openDatabase()
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readonly')
            const store = transaction.objectStore(storeName)
            const request = store.getAll()

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
        })
    },

    async put<T>(storeName: string, value: T): Promise<void> {
        const database = await openDatabase()
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readwrite')
            const store = transaction.objectStore(storeName)
            const request = store.put(value)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    },

    async delete(storeName: string, key: string): Promise<void> {
        const database = await openDatabase()
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readwrite')
            const store = transaction.objectStore(storeName)
            const request = store.delete(key)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve()
        })
    },

    async query<T>(
        storeName: string,
        indexName: string,
        value: IDBValidKey
    ): Promise<T[]> {
        const database = await openDatabase()
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(storeName, 'readonly')
            const store = transaction.objectStore(storeName)
            const index = store.index(indexName)
            const request = index.getAll(value)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)
        })
    },
}
