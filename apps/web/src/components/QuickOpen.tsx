/**
 * Quick Open Component
 * 
 * Modal for fast file/symbol/command search.
 */

import React, { useEffect, useRef } from 'react';
import {
    useQuickOpenService,
    QuickOpenItem,
} from '../lib/navigation/quick-open-service';

interface QuickOpenProps {
    className?: string;
}

export const QuickOpen: React.FC<QuickOpenProps> = ({ className }) => {
    const {
        isOpen,
        query,
        filteredItems,
        selectedIndex,
        isLoading,
        placeholder,
        setQuery,
        selectNext,
        selectPrevious,
        selectIndex,
        confirm,
        close,
    } = useQuickOpenService();

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const selectedEl = listRef.current.querySelector('.quick-open__item--selected');
            if (selectedEl) {
                selectedEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                selectNext();
                break;
            case 'ArrowUp':
                e.preventDefault();
                selectPrevious();
                break;
            case 'Enter':
                e.preventDefault();
                confirm();
                break;
            case 'Escape':
                e.preventDefault();
                close();
                break;
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`quick-open-overlay ${className || ''}`} onClick={close}>
            <div className="quick-open" onClick={(e) => e.stopPropagation()}>
                {/* Search Input */}
                <div className="quick-open__input-wrap">
                    <input
                        ref={inputRef}
                        type="text"
                        className="quick-open__input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                    />
                    {isLoading && <span className="quick-open__spinner">⟳</span>}
                </div>

                {/* Results */}
                <div className="quick-open__list" ref={listRef}>
                    {filteredItems.length === 0 ? (
                        <div className="quick-open__empty">
                            {query ? 'No results found' : 'Type to search...'}
                        </div>
                    ) : (
                        filteredItems.map((item, idx) => (
                            <QuickOpenItemRow
                                key={item.id}
                                item={item}
                                isSelected={idx === selectedIndex}
                                onSelect={() => selectIndex(idx)}
                                onConfirm={confirm}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// ITEM ROW
// =============================================================================

interface QuickOpenItemRowProps {
    item: QuickOpenItem;
    isSelected: boolean;
    onSelect: () => void;
    onConfirm: () => void;
}

const QuickOpenItemRow: React.FC<QuickOpenItemRowProps> = ({
    item,
    isSelected,
    onSelect,
    onConfirm,
}) => {
    return (
        <div
            className={`quick-open__item ${isSelected ? 'quick-open__item--selected' : ''}`}
            onMouseEnter={onSelect}
            onClick={onConfirm}
        >
            <span className="quick-open__item-icon">{item.icon}</span>
            <div className="quick-open__item-content">
                <span className="quick-open__item-label">{item.label}</span>
                {item.description && (
                    <span className="quick-open__item-description">{item.description}</span>
                )}
            </div>
            {item.detail && (
                <span className="quick-open__item-detail">{item.detail}</span>
            )}
        </div>
    );
};

export default QuickOpen;
