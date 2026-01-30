/**
 * Toast Container Component
 * 
 * Displays toast notifications with animations.
 */

import { X, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import {
    useNotificationService,
    Toast,
    NotificationType
} from '../lib/notifications/notification-service';

const TypeIcons: Record<NotificationType, React.ComponentType<{ size?: number }>> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
    error: XCircle,
};

export function ToastContainer() {
    const { toasts, dismissToast } = useNotificationService();

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => dismissToast(toast.id)}
                />
            ))}
        </div>
    );
}

interface ToastItemProps {
    toast: Toast;
    onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
    const Icon = TypeIcons[toast.type];

    return (
        <div className={`toast-item toast-${toast.type}`}>
            <span className="toast-icon">
                <Icon size={18} />
            </span>
            <span className="toast-message">{toast.message}</span>
            {toast.closable && (
                <button className="toast-close" onClick={onDismiss}>
                    <X size={14} />
                </button>
            )}
            {toast.progress !== undefined && (
                <div className="toast-progress">
                    <div
                        className="toast-progress-bar"
                        style={{ width: `${toast.progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

export default ToastContainer;
