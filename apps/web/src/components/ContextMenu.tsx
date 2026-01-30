/**
 * Context Menu Component
 * 
 * Renders a context menu with nested submenus support.
 */

import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import { useContextMenuService, MenuItem } from '../lib/menus/context-menu-service';

export function ContextMenu() {
    const {
        isOpen,
        position,
        items,
        close,
        executeItem,
    } = useContextMenuService();

    const menuRef = useRef<HTMLDivElement>(null);
    const [adjustedPosition, setAdjustedPosition] = useState(position);

    // Close on click outside or escape
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                close();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, close]);

    // Adjust position to fit in viewport
    useEffect(() => {
        if (isOpen && menuRef.current) {
            const menu = menuRef.current;
            const rect = menu.getBoundingClientRect();
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight,
            };

            let { x, y } = position;

            if (x + rect.width > viewport.width) {
                x = viewport.width - rect.width - 8;
            }
            if (y + rect.height > viewport.height) {
                y = viewport.height - rect.height - 8;
            }

            setAdjustedPosition({ x: Math.max(8, x), y: Math.max(8, y) });
        }
    }, [isOpen, position]);

    if (!isOpen) return null;

    return (
        <div
            ref={menuRef}
            className="context-menu"
            style={{ left: adjustedPosition.x, top: adjustedPosition.y }}
        >
            {items.map((item, index) => (
                <ContextMenuItem
                    key={item.id || index}
                    item={item}
                    onExecute={executeItem}
                />
            ))}
        </div>
    );
}

// =============================================================================
// MENU ITEM
// =============================================================================

interface ContextMenuItemProps {
    item: MenuItem;
    onExecute: (id: string) => void;
}

function ContextMenuItem({ item, onExecute }: ContextMenuItemProps) {
    const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
    const itemRef = useRef<HTMLDivElement>(null);

    if (item.type === 'separator') {
        return <div className="context-menu-separator" />;
    }

    const hasSubmenu = item.type === 'submenu' && item.submenu;

    const handleClick = () => {
        if (item.disabled) return;
        if (hasSubmenu) {
            setIsSubmenuOpen(!isSubmenuOpen);
        } else {
            onExecute(item.id);
        }
    };

    const handleMouseEnter = () => {
        if (hasSubmenu) {
            setIsSubmenuOpen(true);
        }
    };

    const handleMouseLeave = () => {
        if (hasSubmenu) {
            setIsSubmenuOpen(false);
        }
    };

    return (
        <div
            ref={itemRef}
            className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Checkbox/Radio indicator */}
            {(item.type === 'checkbox' || item.type === 'radio') && (
                <span className="context-menu-check">
                    {item.checked && <Check size={14} />}
                </span>
            )}

            {/* Icon */}
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}

            {/* Label */}
            <span className="context-menu-label">{item.label}</span>

            {/* Shortcut */}
            {item.shortcut && (
                <span className="context-menu-shortcut">{item.shortcut}</span>
            )}

            {/* Submenu indicator */}
            {hasSubmenu && (
                <ChevronRight size={14} className="context-menu-arrow" />
            )}

            {/* Submenu */}
            {hasSubmenu && isSubmenuOpen && (
                <div className="context-menu-submenu">
                    {item.submenu!.map((subItem, index) => (
                        <ContextMenuItem
                            key={subItem.id || index}
                            item={subItem}
                            onExecute={onExecute}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ContextMenu;
