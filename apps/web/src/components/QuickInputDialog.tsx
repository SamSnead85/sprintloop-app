/**
 * Quick Input Component
 * 
 * VS Code-style quick input dialog.
 */

import React, { useEffect, useRef } from 'react';
import { useQuickInput } from '../lib/dialogs/quick-input';

interface QuickInputDialogProps {
    className?: string;
}

export const QuickInputDialog: React.FC<QuickInputDialogProps> = ({ className }) => {
    const {
        isOpen,
        options,
        query,
        selectedIndex,
        selectedItems,
        setQuery,
        selectNext,
        selectPrevious,
        toggleSelection,
        confirm,
        cancel,
        getFilteredItems,
    } = useQuickInput();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

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
                cancel();
                break;
            case ' ':
                if (options.canSelectMany) {
                    e.preventDefault();
                    const items = getFilteredItems();
                    const item = items[selectedIndex];
                    if (item) toggleSelection(item.value);
                }
                break;
        }
    };

    if (!isOpen) return null;

    const items = getFilteredItems();
    const isPicker = !!options.items;

    return (
        <>
            <div className="quick-input-backdrop" onClick={cancel} />
            <div className={`quick-input ${className || ''}`}>
                {options.title && (
                    <div className="quick-input__title">{options.title}</div>
                )}
                <div className="quick-input__input-wrapper">
                    <input
                        ref={inputRef}
                        type="text"
                        className="quick-input__input"
                        placeholder={options.placeholder || 'Type here...'}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>

                {isPicker && (
                    <div className="quick-input__list">
                        {items.length === 0 && (
                            <div className="quick-input__empty">No matching items</div>
                        )}
                        {items.map((item, index) => (
                            <div
                                key={item.value}
                                className={`quick-input__item ${index === selectedIndex ? 'quick-input__item--selected' : ''}`}
                                onClick={() => {
                                    if (options.canSelectMany) {
                                        toggleSelection(item.value);
                                    } else {
                                        confirm();
                                    }
                                }}
                            >
                                {options.canSelectMany && (
                                    <span className="quick-input__checkbox">
                                        {selectedItems.has(item.value) ? '☑️' : '⬜'}
                                    </span>
                                )}
                                {item.icon && (
                                    <span className="quick-input__icon">{item.icon}</span>
                                )}
                                <div className="quick-input__item-content">
                                    <span className="quick-input__label">{item.label}</span>
                                    {item.description && (
                                        <span className="quick-input__description">{item.description}</span>
                                    )}
                                </div>
                                {item.detail && (
                                    <span className="quick-input__detail">{item.detail}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default QuickInputDialog;
