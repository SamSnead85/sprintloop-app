/**
 * Kanban Board Component
 * Drag-and-drop project planning board
 */
import { useState, useRef } from 'react';
import {
    Plus,
    MoreHorizontal,
    GripVertical,
    Trash2,
    Edit3,
    Play,
    CheckCircle2
} from 'lucide-react';
import { useKanbanStore, type CardStatus, type KanbanCard, type Priority } from '../stores/kanban-store';

const PRIORITY_LABELS: Record<Priority, string> = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
};

// Kanban Card Component
function KanbanCardItem({
    card,
    onDragStart,
    onEdit,
    onDelete
}: {
    card: KanbanCard;
    onDragStart: (e: React.DragEvent, card: KanbanCard) => void;
    onEdit: (card: KanbanCard) => void;
    onDelete: (id: string) => void;
}) {
    const [showMenu, setShowMenu] = useState(false);
    const { moveCard } = useKanbanStore();

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, card)}
            className="group bg-slate-800/50 hover:bg-slate-800 border border-white/5 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all hover:border-white/10"
        >
            {/* Header */}
            <div className="flex items-start gap-2 mb-2">
                <GripVertical className="w-4 h-4 text-gray-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span title={card.priority}>{PRIORITY_LABELS[card.priority]}</span>
                        <span className="text-sm text-white font-medium">{card.title}</span>
                    </div>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>

                    {showMenu && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowMenu(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-36 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20 py-1">
                                <button
                                    onClick={() => { onEdit(card); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-white/5"
                                >
                                    <Edit3 className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => { onDelete(card.id); setShowMenu(false); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Description */}
            {card.description && (
                <p className="text-xs text-gray-500 mb-2 line-clamp-2 pl-6">
                    {card.description}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-1 pl-6">
                {card.status !== 'done' && (
                    <>
                        <button
                            onClick={() => moveCard(card.id, 'in-progress')}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 rounded transition-colors"
                            title="Start working on this"
                        >
                            <Play className="w-3 h-3" />
                            Start
                        </button>
                        <button
                            onClick={() => moveCard(card.id, 'done')}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded transition-colors"
                            title="Mark as done"
                        >
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// Kanban Column Component
function KanbanColumn({
    id,
    title,
    icon,
    cards,
    onDragOver,
    onDrop,
    onAddCard,
    onEditCard,
    onDeleteCard,
    onDragStart
}: {
    id: CardStatus;
    title: string;
    icon: string;
    cards: KanbanCard[];
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: CardStatus) => void;
    onAddCard: (status: CardStatus) => void;
    onEditCard: (card: KanbanCard) => void;
    onDeleteCard: (id: string) => void;
    onDragStart: (e: React.DragEvent, card: KanbanCard) => void;
}) {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div
            className={`flex-1 min-w-[250px] bg-slate-900/50 rounded-xl border transition-colors ${isDragOver ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-white/5'
                }`}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
                onDragOver(e);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
                setIsDragOver(false);
                onDrop(e, id);
            }}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span>{icon}</span>
                    <span className="text-sm font-medium text-gray-300">{title}</span>
                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                        {cards.length}
                    </span>
                </div>
                <button
                    onClick={() => onAddCard(id)}
                    className="p-1 hover:bg-white/5 rounded transition-colors"
                    title="Add card"
                >
                    <Plus className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            {/* Cards */}
            <div className="p-3 space-y-2 min-h-[200px]">
                {cards.map(card => (
                    <KanbanCardItem
                        key={card.id}
                        card={card}
                        onDragStart={onDragStart}
                        onEdit={onEditCard}
                        onDelete={onDeleteCard}
                    />
                ))}

                {cards.length === 0 && (
                    <div className="text-center py-8 text-gray-600 text-sm">
                        Drop cards here
                    </div>
                )}
            </div>
        </div>
    );
}

// Main Kanban Board
export function KanbanBoard() {
    const { cards, columns, addCard, moveCard, deleteCard, updateCard: _updateCard } = useKanbanStore();
    const [newCardTitle, setNewCardTitle] = useState('');
    const [addingTo, setAddingTo] = useState<CardStatus | null>(null);
    const [_editingCard, setEditingCard] = useState<KanbanCard | null>(null);
    const draggedCard = useRef<KanbanCard | null>(null);

    const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
        draggedCard.current = card;
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: CardStatus) => {
        e.preventDefault();
        if (draggedCard.current) {
            moveCard(draggedCard.current.id, status);
            draggedCard.current = null;
        }
    };

    const handleAddCard = (status: CardStatus) => {
        setAddingTo(status);
        setNewCardTitle('');
    };

    const handleCreateCard = () => {
        if (newCardTitle.trim() && addingTo) {
            addCard(newCardTitle.trim(), addingTo);
            setNewCardTitle('');
            setAddingTo(null);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <h2 className="text-sm font-medium text-white">Project Board</h2>
                </div>
                <button
                    onClick={() => handleAddCard('backlog')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Add Task
                </button>
            </div>

            {/* Board */}
            <div className="flex-1 overflow-x-auto p-4">
                <div className="flex gap-4 h-full">
                    {columns.map(column => (
                        <KanbanColumn
                            key={column.id}
                            id={column.id}
                            title={column.title}
                            icon={column.icon}
                            cards={cards.filter(c => c.status === column.id)}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onAddCard={handleAddCard}
                            onEditCard={setEditingCard}
                            onDeleteCard={deleteCard}
                            onDragStart={handleDragStart}
                        />
                    ))}
                </div>
            </div>

            {/* Add Card Modal */}
            {addingTo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setAddingTo(null)}
                    />
                    <div className="relative bg-slate-900 border border-white/10 rounded-xl p-4 w-full max-w-md">
                        <h3 className="text-sm font-medium text-white mb-3">Add New Task</h3>
                        <input
                            type="text"
                            value={newCardTitle}
                            onChange={(e) => setNewCardTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateCard()}
                            placeholder="Enter task title..."
                            className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-4">
                            <button
                                onClick={() => setAddingTo(null)}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateCard}
                                className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg"
                            >
                                Add Task
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
