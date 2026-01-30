/**
 * Notification Center Component
 * 
 * Panel for viewing and managing notifications.
 */

import { useState } from 'react';
import {
    Bell, X, Check, CheckCheck, Trash2,
    BellOff, ChevronDown, Filter
} from 'lucide-react';
import {
    useNotificationService,
    getNotificationIcon,
    getSourceIcon,
    formatTimeAgo,
    Notification,
    NotificationSource
} from '../lib/notifications/notification-service';

const SOURCES: NotificationSource[] = ['system', 'git', 'extension', 'task', 'ai', 'debug'];

export function NotificationCenter() {
    const {
        notifications,
        isNotificationPanelOpen,
        unreadCount,
        doNotDisturb,
        toggleNotificationPanel,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        setDoNotDisturb,
    } = useNotificationService();

    const [filterSource, setFilterSource] = useState<NotificationSource | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);

    const filteredNotifications = filterSource === 'all'
        ? notifications
        : notifications.filter(n => n.source === filterSource);

    return (
        <>
            {/* Bell Button */}
            <button
                className="notification-bell"
                onClick={toggleNotificationPanel}
            >
                {doNotDisturb ? <BellOff size={18} /> : <Bell size={18} />}
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {/* Notification Panel */}
            {isNotificationPanelOpen && (
                <>
                    <div
                        className="notification-overlay"
                        onClick={toggleNotificationPanel}
                    />
                    <div className="notification-panel">
                        {/* Header */}
                        <div className="notification-header">
                            <h3>Notifications</h3>
                            <div className="notification-header-actions">
                                <button
                                    onClick={() => setDoNotDisturb(!doNotDisturb)}
                                    title={doNotDisturb ? 'Enable notifications' : 'Do not disturb'}
                                    className={doNotDisturb ? 'active' : ''}
                                >
                                    <BellOff size={14} />
                                </button>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    title="Filter"
                                >
                                    <Filter size={14} />
                                </button>
                                <button onClick={markAllAsRead} title="Mark all as read">
                                    <CheckCheck size={14} />
                                </button>
                                <button onClick={clearAll} title="Clear all">
                                    <Trash2 size={14} />
                                </button>
                                <button onClick={toggleNotificationPanel}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        {showFilters && (
                            <div className="notification-filters">
                                <button
                                    className={filterSource === 'all' ? 'active' : ''}
                                    onClick={() => setFilterSource('all')}
                                >
                                    All
                                </button>
                                {SOURCES.map(source => (
                                    <button
                                        key={source}
                                        className={filterSource === source ? 'active' : ''}
                                        onClick={() => setFilterSource(source)}
                                    >
                                        {getSourceIcon(source)} {source}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Notification List */}
                        <div className="notification-list">
                            {filteredNotifications.length === 0 ? (
                                <div className="notification-empty">
                                    <Bell size={32} />
                                    <p>No notifications</p>
                                </div>
                            ) : (
                                filteredNotifications.map(notification => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkRead={() => markAsRead(notification.id)}
                                        onRemove={() => removeNotification(notification.id)}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onMarkRead: () => void;
    onRemove: () => void;
}

function NotificationItem({ notification, onMarkRead, onRemove }: NotificationItemProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`notification-item ${notification.read ? 'read' : 'unread'} notification-${notification.type}`}
            onClick={() => !notification.read && onMarkRead()}
        >
            <div className="notification-item-header">
                <span className="notification-type-icon">
                    {getNotificationIcon(notification.type)}
                </span>
                <span className="notification-source-icon">
                    {getSourceIcon(notification.source)}
                </span>
                <span className="notification-title">{notification.title}</span>
                <span className="notification-time">
                    {formatTimeAgo(notification.timestamp)}
                </span>
            </div>

            {notification.message && (
                <div className="notification-message">
                    {notification.message}
                </div>
            )}

            {notification.detail && (
                <button
                    className="notification-detail-toggle"
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpanded(!expanded);
                    }}
                >
                    <ChevronDown
                        size={12}
                        style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
                    />
                    {expanded ? 'Hide details' : 'Show details'}
                </button>
            )}

            {expanded && notification.detail && (
                <div className="notification-detail">
                    {notification.detail}
                </div>
            )}

            {notification.progress !== undefined && (
                <div className="notification-progress">
                    <div
                        className="notification-progress-bar"
                        style={{ width: `${notification.progress}%` }}
                    />
                </div>
            )}

            {notification.actions && notification.actions.length > 0 && (
                <div className="notification-actions">
                    {notification.actions.map((action, i) => (
                        <button
                            key={i}
                            className={action.primary ? 'primary' : ''}
                            onClick={(e) => {
                                e.stopPropagation();
                                action.callback();
                            }}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            <div className="notification-item-actions">
                {!notification.read && (
                    <button onClick={(e) => { e.stopPropagation(); onMarkRead(); }} title="Mark as read">
                        <Check size={12} />
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove">
                    <X size={12} />
                </button>
            </div>
        </div>
    );
}

export default NotificationCenter;
