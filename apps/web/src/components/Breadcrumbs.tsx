/**
 * Breadcrumbs Component
 * 
 * File and symbol navigation breadcrumbs with dropdown.
 */

import React from 'react';
import {
    useBreadcrumbsService,
} from '../lib/navigation/breadcrumbs-service';

interface BreadcrumbsProps {
    className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className }) => {
    const {
        items,
        activeIndex,
        isDropdownOpen,
        dropdownIndex,
        dropdownItems,
        navigateToItem,
        openDropdown,
        closeDropdown,
        navigateToSymbol,
    } = useBreadcrumbsService();

    if (items.length === 0) {
        return null;
    }

    return (
        <div className={`breadcrumbs ${className || ''}`}>
            {items.map((item, idx) => (
                <React.Fragment key={item.id}>
                    {idx > 0 && <span className="breadcrumbs__separator">›</span>}
                    <div className="breadcrumbs__item-wrap">
                        <button
                            className={`breadcrumbs__item ${idx === activeIndex ? 'breadcrumbs__item--active' : ''}`}
                            onClick={() => navigateToItem(idx)}
                            onMouseEnter={() => openDropdown(idx)}
                        >
                            <span className="breadcrumbs__icon">{item.icon}</span>
                            <span className="breadcrumbs__label">{item.name}</span>
                        </button>

                        {/* Dropdown */}
                        {isDropdownOpen && dropdownIndex === idx && (
                            <div
                                className="breadcrumbs__dropdown"
                                onMouseLeave={closeDropdown}
                            >
                                {dropdownItems.map(dropItem => (
                                    <button
                                        key={dropItem.id}
                                        className="breadcrumbs__dropdown-item"
                                        onClick={() => {
                                            navigateToSymbol(dropItem);
                                            closeDropdown();
                                        }}
                                    >
                                        <span className="breadcrumbs__dropdown-icon">{dropItem.icon}</span>
                                        <span>{dropItem.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

export default Breadcrumbs;
