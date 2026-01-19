/**
 * Kanban Store
 * Manages kanban board state with columns and cards
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Priority = 'high' | 'medium' | 'low';
export type CardStatus = 'backlog' | 'planning' | 'in-progress' | 'done';

export interface KanbanCard {
    id: string;
    title: string;
    description: string;
    priority: Priority;
    status: CardStatus;
    labels: string[];
    createdAt: string;
    updatedAt: string;
}

export interface KanbanColumn {
    id: CardStatus;
    title: string;
    icon: string;
    color: string;
}

interface KanbanStore {
    cards: KanbanCard[];
    columns: KanbanColumn[];

    // Card actions
    addCard: (title: string, status?: CardStatus) => void;
    updateCard: (id: string, updates: Partial<KanbanCard>) => void;
    deleteCard: (id: string) => void;
    moveCard: (id: string, newStatus: CardStatus) => void;

    // Helpers
    getCardsByStatus: (status: CardStatus) => KanbanCard[];
    clearBoard: () => void;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
    { id: 'backlog', title: 'Backlog', icon: '📥', color: '#6b7280' },
    { id: 'planning', title: 'Planning', icon: '🎯', color: '#8b5cf6' },
    { id: 'in-progress', title: 'In Progress', icon: '⚡', color: '#f59e0b' },
    { id: 'done', title: 'Done', icon: '✅', color: '#22c55e' },
];

export const useKanbanStore = create<KanbanStore>()(
    persist(
        (set, get) => ({
            cards: [],
            columns: DEFAULT_COLUMNS,

            addCard: (title, status = 'backlog') => {
                const now = new Date().toISOString();
                const newCard: KanbanCard = {
                    id: `card-${Date.now()}`,
                    title,
                    description: '',
                    priority: 'medium',
                    status,
                    labels: [],
                    createdAt: now,
                    updatedAt: now,
                };
                set(state => ({
                    cards: [...state.cards, newCard],
                }));
            },

            updateCard: (id, updates) => {
                set(state => ({
                    cards: state.cards.map(card =>
                        card.id === id
                            ? { ...card, ...updates, updatedAt: new Date().toISOString() }
                            : card
                    ),
                }));
            },

            deleteCard: (id) => {
                set(state => ({
                    cards: state.cards.filter(card => card.id !== id),
                }));
            },

            moveCard: (id, newStatus) => {
                set(state => ({
                    cards: state.cards.map(card =>
                        card.id === id
                            ? { ...card, status: newStatus, updatedAt: new Date().toISOString() }
                            : card
                    ),
                }));
            },

            getCardsByStatus: (status) => {
                return get().cards.filter(card => card.status === status);
            },

            clearBoard: () => {
                set({ cards: [] });
            },
        }),
        {
            name: 'sprintloop:kanban',
        }
    )
);
