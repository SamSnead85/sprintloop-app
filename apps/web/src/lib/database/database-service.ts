/**
 * Phase 351-400: Database & Data Management
 * 
 * Database tooling and data management:
 * - Database connections
 * - Schema visualization
 * - Query builder
 * - Migration management
 * - Data seeding
 * - Query history
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface DatabaseConnection {
    id: string;
    name: string;
    type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis' | 'supabase' | 'planetscale';
    host: string;
    port: number;
    database: string;
    username?: string;
    ssl: boolean;
    status: 'connected' | 'disconnected' | 'connecting' | 'error';
    lastConnected?: Date;
    error?: string;
}

export interface TableSchema {
    name: string;
    columns: ColumnSchema[];
    primaryKey: string[];
    foreignKeys: ForeignKey[];
    indexes: Index[];
    rowCount?: number;
}

export interface ColumnSchema {
    name: string;
    type: string;
    nullable: boolean;
    defaultValue?: string;
    isPrimary: boolean;
    isUnique: boolean;
    isIndexed: boolean;
}

export interface ForeignKey {
    column: string;
    referencedTable: string;
    referencedColumn: string;
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
    onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface Index {
    name: string;
    columns: string[];
    unique: boolean;
    type: 'btree' | 'hash' | 'gist' | 'gin';
}

export interface QueryResult {
    id: string;
    query: string;
    rows: Record<string, unknown>[];
    columns: string[];
    rowCount: number;
    duration: number;
    executedAt: Date;
    error?: string;
}

export interface Migration {
    id: string;
    name: string;
    status: 'pending' | 'applied' | 'failed';
    appliedAt?: Date;
    sql: string;
}

export interface DatabaseState {
    connections: DatabaseConnection[];
    activeConnectionId: string | null;
    schema: TableSchema[];
    queryHistory: QueryResult[];
    migrations: Migration[];
    savedQueries: { id: string; name: string; query: string }[];

    // Connection management
    addConnection: (conn: Omit<DatabaseConnection, 'id' | 'status'>) => string;
    updateConnection: (id: string, updates: Partial<DatabaseConnection>) => void;
    removeConnection: (id: string) => void;
    connect: (id: string) => Promise<void>;
    disconnect: (id: string) => void;
    setActiveConnection: (id: string | null) => void;

    // Schema operations
    refreshSchema: () => Promise<void>;
    getTable: (name: string) => TableSchema | undefined;

    // Query operations
    executeQuery: (query: string) => Promise<QueryResult>;
    saveQuery: (name: string, query: string) => void;
    deleteQuery: (id: string) => void;
    clearHistory: () => void;

    // Migration operations
    createMigration: (name: string, sql: string) => string;
    applyMigration: (id: string) => Promise<void>;
    rollbackMigration: (id: string) => Promise<void>;
}

// =============================================================================
// STORE
// =============================================================================

export const useDatabaseService = create<DatabaseState>()(
    persist(
        (set, get) => ({
            connections: [],
            activeConnectionId: null,
            schema: [],
            queryHistory: [],
            migrations: [],
            savedQueries: [],

            addConnection: (conn) => {
                const id = `db_${Date.now()}`;
                set(state => ({
                    connections: [...state.connections, { ...conn, id, status: 'disconnected' }],
                }));
                return id;
            },

            updateConnection: (id, updates) => {
                set(state => ({
                    connections: state.connections.map(c =>
                        c.id === id ? { ...c, ...updates } : c
                    ),
                }));
            },

            removeConnection: (id) => {
                set(state => ({
                    connections: state.connections.filter(c => c.id !== id),
                    activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
                }));
            },

            connect: async (id) => {
                set(state => ({
                    connections: state.connections.map(c =>
                        c.id === id ? { ...c, status: 'connecting' } : c
                    ),
                }));

                await new Promise(r => setTimeout(r, 1000));

                set(state => ({
                    connections: state.connections.map(c =>
                        c.id === id ? { ...c, status: 'connected', lastConnected: new Date() } : c
                    ),
                    activeConnectionId: id,
                }));

                await get().refreshSchema();
            },

            disconnect: (id) => {
                set(state => ({
                    connections: state.connections.map(c =>
                        c.id === id ? { ...c, status: 'disconnected' } : c
                    ),
                    activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
                    schema: state.activeConnectionId === id ? [] : state.schema,
                }));
            },

            setActiveConnection: (id) => set({ activeConnectionId: id }),

            refreshSchema: async () => {
                await new Promise(r => setTimeout(r, 500));

                const mockSchema: TableSchema[] = [
                    {
                        name: 'users',
                        columns: [
                            { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isIndexed: true },
                            { name: 'email', type: 'varchar(255)', nullable: false, isPrimary: false, isUnique: true, isIndexed: true },
                            { name: 'name', type: 'varchar(100)', nullable: true, isPrimary: false, isUnique: false, isIndexed: false },
                            { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimary: false, isUnique: false, isIndexed: false },
                        ],
                        primaryKey: ['id'],
                        foreignKeys: [],
                        indexes: [{ name: 'idx_users_email', columns: ['email'], unique: true, type: 'btree' }],
                        rowCount: 1250,
                    },
                    {
                        name: 'projects',
                        columns: [
                            { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isIndexed: true },
                            { name: 'name', type: 'varchar(255)', nullable: false, isPrimary: false, isUnique: false, isIndexed: false },
                            { name: 'owner_id', type: 'uuid', nullable: false, isPrimary: false, isUnique: false, isIndexed: true },
                            { name: 'created_at', type: 'timestamp', nullable: false, defaultValue: 'now()', isPrimary: false, isUnique: false, isIndexed: false },
                        ],
                        primaryKey: ['id'],
                        foreignKeys: [{ column: 'owner_id', referencedTable: 'users', referencedColumn: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }],
                        indexes: [{ name: 'idx_projects_owner', columns: ['owner_id'], unique: false, type: 'btree' }],
                        rowCount: 450,
                    },
                    {
                        name: 'files',
                        columns: [
                            { name: 'id', type: 'uuid', nullable: false, isPrimary: true, isUnique: true, isIndexed: true },
                            { name: 'project_id', type: 'uuid', nullable: false, isPrimary: false, isUnique: false, isIndexed: true },
                            { name: 'path', type: 'text', nullable: false, isPrimary: false, isUnique: false, isIndexed: false },
                            { name: 'content', type: 'text', nullable: true, isPrimary: false, isUnique: false, isIndexed: false },
                        ],
                        primaryKey: ['id'],
                        foreignKeys: [{ column: 'project_id', referencedTable: 'projects', referencedColumn: 'id', onDelete: 'CASCADE', onUpdate: 'CASCADE' }],
                        indexes: [{ name: 'idx_files_project', columns: ['project_id'], unique: false, type: 'btree' }],
                        rowCount: 8750,
                    },
                ];

                set({ schema: mockSchema });
            },

            getTable: (name) => get().schema.find(t => t.name === name),

            executeQuery: async (query) => {
                await new Promise(r => setTimeout(r, 300));

                const result: QueryResult = {
                    id: `query_${Date.now()}`,
                    query,
                    rows: [
                        { id: '1', name: 'Example', created_at: '2024-01-01' },
                        { id: '2', name: 'Test', created_at: '2024-01-02' },
                    ],
                    columns: ['id', 'name', 'created_at'],
                    rowCount: 2,
                    duration: 45,
                    executedAt: new Date(),
                };

                set(state => ({
                    queryHistory: [result, ...state.queryHistory.slice(0, 99)],
                }));

                return result;
            },

            saveQuery: (name, query) => {
                set(state => ({
                    savedQueries: [...state.savedQueries, { id: `saved_${Date.now()}`, name, query }],
                }));
            },

            deleteQuery: (id) => {
                set(state => ({
                    savedQueries: state.savedQueries.filter(q => q.id !== id),
                }));
            },

            clearHistory: () => set({ queryHistory: [] }),

            createMigration: (name, sql) => {
                const id = `migration_${Date.now()}`;
                const migration: Migration = { id, name, status: 'pending', sql };
                set(state => ({ migrations: [...state.migrations, migration] }));
                return id;
            },

            applyMigration: async (id) => {
                await new Promise(r => setTimeout(r, 500));
                set(state => ({
                    migrations: state.migrations.map(m =>
                        m.id === id ? { ...m, status: 'applied', appliedAt: new Date() } : m
                    ),
                }));
            },

            rollbackMigration: async (id) => {
                await new Promise(r => setTimeout(r, 500));
                set(state => ({
                    migrations: state.migrations.map(m =>
                        m.id === id ? { ...m, status: 'pending', appliedAt: undefined } : m
                    ),
                }));
            },
        }),
        {
            name: 'sprintloop-database',
            partialize: (state) => ({
                connections: state.connections.map(c => ({ ...c, status: 'disconnected' })),
                savedQueries: state.savedQueries,
            }),
        }
    )
);
