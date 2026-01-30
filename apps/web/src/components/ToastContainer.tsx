/**
 * Toast Container Component
 * 
 * Displays toast notifications.
 */

import React from 'react';
import { useNotifications, type Notification } from '../lib/notifications/notifications';

interface ToastContainerProps {
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    className?: string;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    position = 'bottom-right',
    className,
}) => {
    const { toasts, dismiss } = useNotifications();

    if (toasts.length === 0) return null;

    return (
        <div className={`toast-container toast-container--${position} ${className || ''}`}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    notification={toast}
                    onDismiss={() => dismiss(toast.id)}
                />
            ))}
        </div>
    );
};

// =============================================================================
// TOAST COMPONENT
// =============================================================================

interface ToastProps {
    notification: Notification;
    onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ notification, onDismiss }) => {
    const { type, title, message, progress, actions } = notification;

    return (
        <div className={`toast toast--${type}`}>
            <div className="toast__icon">{getTypeIcon(type)}</div>
            <div className="toast__content">
                <div className="toast__title">{title}</div>
                {message && <div className="toast__message">{message}</div>}
                {type === 'progress' && progress !== undefined && (
                    <div className="toast__progress">
                        <div
                            className="toast__progress-bar"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
                {actions && actions.length > 0 && (
                    <div className="toast__actions">
                        {actions.map((action, i) => (
                            <button
                                key={i}
                                className={`toast__action ${action.primary ? 'toast__action--primary' : ''}`}
                                onClick={action.action}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <button className="toast__dismiss" onClick={onDismiss}>
                ✕
            </button>
        </div>
    );
};

function getTypeIcon(type: Notification['type']): string {
    switch (type) {
        case 'info': return 'ℹ️';
        case 'success': return '✅';
        case 'warning': return '⚠️';
        case 'error': return '❌';
        case 'progress': return '⏳';
        default: return 'ℹ️';
    }
}

export default ToastContainer;
