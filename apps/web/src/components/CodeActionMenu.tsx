/**
 * Code Action Menu Component
 * 
 * Floating menu that appears on text selection with AI actions.
 */

import React from 'react';
import { useCodeActions, type CodeAction, type CodeActionType } from '../lib/ai/code-actions';

interface CodeActionMenuProps {
    className?: string;
}

export const CodeActionMenu: React.FC<CodeActionMenuProps> = ({ className }) => {
    const {
        isMenuVisible,
        menuPosition,
        isExecuting,
        getAvailableActions,
        executeAction,
        hideMenu,
    } = useCodeActions();

    const actions = getAvailableActions();

    const handleAction = async (actionType: CodeActionType) => {
        await executeAction(actionType);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            hideMenu();
        }
    };

    if (!isMenuVisible) return null;

    // Group actions by category
    const grouped = {
        understand: actions.filter(a => a.category === 'understand'),
        edit: actions.filter(a => a.category === 'edit'),
        generate: actions.filter(a => a.category === 'generate'),
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="code-action-backdrop"
                onClick={hideMenu}
            />

            {/* Menu */}
            <div
                className={`code-action-menu ${className || ''}`}
                style={{
                    left: menuPosition.x,
                    top: menuPosition.y,
                }}
                onKeyDown={handleKeyDown}
                role="menu"
            >
                {isExecuting ? (
                    <div className="code-action-menu__loading">
                        <span className="code-action-menu__spinner" />
                        Processing...
                    </div>
                ) : (
                    <>
                        {/* Understand Section */}
                        {grouped.understand.length > 0 && (
                            <div className="code-action-menu__section">
                                <div className="code-action-menu__section-title">Understand</div>
                                {grouped.understand.map(action => (
                                    <ActionButton
                                        key={action.id}
                                        action={action}
                                        onClick={() => handleAction(action.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Edit Section */}
                        {grouped.edit.length > 0 && (
                            <div className="code-action-menu__section">
                                <div className="code-action-menu__section-title">Edit</div>
                                {grouped.edit.map(action => (
                                    <ActionButton
                                        key={action.id}
                                        action={action}
                                        onClick={() => handleAction(action.id)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Generate Section */}
                        {grouped.generate.length > 0 && (
                            <div className="code-action-menu__section">
                                <div className="code-action-menu__section-title">Generate</div>
                                {grouped.generate.map(action => (
                                    <ActionButton
                                        key={action.id}
                                        action={action}
                                        onClick={() => handleAction(action.id)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
};

interface ActionButtonProps {
    action: CodeAction;
    onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onClick }) => {
    return (
        <button
            className="code-action-menu__item"
            onClick={onClick}
            role="menuitem"
        >
            <span className="code-action-menu__icon">{action.icon}</span>
            <span className="code-action-menu__name">{action.name}</span>
            {action.shortcut && (
                <span className="code-action-menu__shortcut">{action.shortcut}</span>
            )}
        </button>
    );
};

/**
 * Lightbulb indicator for quick fixes
 */
interface LightbulbIndicatorProps {
    hasQuickFix: boolean;
    position: { x: number; y: number };
    onClick: () => void;
}

export const LightbulbIndicator: React.FC<LightbulbIndicatorProps> = ({
    hasQuickFix,
    position,
    onClick
}) => {
    if (!hasQuickFix) return null;

    return (
        <button
            className="lightbulb-indicator"
            style={{ left: position.x, top: position.y }}
            onClick={onClick}
            title="Quick Fix Available (⌘.)"
        >
            💡
        </button>
    );
};

export default CodeActionMenu;
