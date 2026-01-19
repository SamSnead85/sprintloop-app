/**
 * Premium Vibe Coding UI Components
 * Cutting-edge interface for 10x developers
 */

import React, { useState, useEffect, useRef } from 'react';

// =============================================================================
// ANIMATED GRADIENT ORB
// =============================================================================

interface GradientOrbProps {
    size?: number;
    colors?: string[];
    className?: string;
}

export const GradientOrb: React.FC<GradientOrbProps> = ({
    size = 400,
    colors = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'],
    className = '',
}) => {
    return (
        <div
            className={`gradient-orb ${className}`}
            style={{
                width: size,
                height: size,
                background: `radial-gradient(circle at 30% 30%, ${colors.join(', ')})`,
                borderRadius: '50%',
                filter: 'blur(60px)',
                opacity: 0.4,
                animation: 'orbFloat 8s ease-in-out infinite',
                position: 'absolute',
                pointerEvents: 'none',
            }}
        />
    );
};

// =============================================================================
// GLASS PANEL
// =============================================================================

interface GlassPanelProps {
    children: React.ReactNode;
    className?: string;
    blur?: number;
    opacity?: number;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
    children,
    className = '',
    blur = 20,
    opacity = 0.8,
}) => {
    return (
        <div
            className={`glass-panel ${className}`}
            style={{
                background: `rgba(18, 18, 26, ${opacity})`,
                backdropFilter: `blur(${blur}px)`,
                WebkitBackdropFilter: `blur(${blur}px)`,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 16,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
        >
            {children}
        </div>
    );
};

// =============================================================================
// AGENT STATUS INDICATOR
// =============================================================================

interface AgentStatusProps {
    status: 'idle' | 'thinking' | 'working' | 'success' | 'error';
    label?: string;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ status, label }) => {
    const statusConfig = {
        idle: { color: '#64748b', label: 'Ready', animation: 'none' },
        thinking: { color: '#f59e0b', label: 'Thinking...', animation: 'pulse' },
        working: { color: '#3b82f6', label: 'Working...', animation: 'spin' },
        success: { color: '#22c55e', label: 'Complete', animation: 'none' },
        error: { color: '#ef4444', label: 'Error', animation: 'none' },
    };

    const config = statusConfig[status];

    return (
        <div className="agent-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: config.color,
                    boxShadow: `0 0 12px ${config.color}`,
                    animation: config.animation === 'pulse'
                        ? 'pulse 1.5s ease-in-out infinite'
                        : config.animation === 'spin'
                            ? 'spin 1s linear infinite'
                            : 'none',
                }}
            />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>{label || config.label}</span>
        </div>
    );
};

// =============================================================================
// VIBE METER
// =============================================================================

interface VibeMeterProps {
    value: number; // 0-100
    label?: string;
}

export const VibeMeter: React.FC<VibeMeterProps> = ({ value, label = 'Vibe Level' }) => {
    const getColor = (v: number) => {
        if (v < 30) return '#ef4444';
        if (v < 60) return '#f59e0b';
        if (v < 80) return '#3b82f6';
        return '#22c55e';
    };

    return (
        <div className="vibe-meter" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>{label}</span>
                <span style={{ fontSize: 12, color: getColor(value), fontWeight: 600 }}>{value}%</span>
            </div>
            <div style={{
                height: 6,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 3,
                overflow: 'hidden',
            }}>
                <div style={{
                    width: `${value}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${getColor(value)}, ${getColor(value)}88)`,
                    borderRadius: 3,
                    transition: 'width 0.5s ease-out',
                    boxShadow: `0 0 10px ${getColor(value)}`,
                }} />
            </div>
        </div>
    );
};

// =============================================================================
// COMMAND INPUT WITH AI
// =============================================================================

interface CommandInputProps {
    onSubmit: (command: string) => void;
    placeholder?: string;
    suggestions?: string[];
}

export const CommandInput: React.FC<CommandInputProps> = ({
    onSubmit,
    placeholder = 'Ask AI anything... ⌘K',
}) => {
    const [value, setValue] = useState('');
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value);
            setValue('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="command-input" style={{ width: '100%' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                background: focused ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255,255,255,0.05)',
                border: focused ? '1px solid rgba(99, 102, 241, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                padding: '12px 16px',
                gap: 12,
                transition: 'all 0.2s ease',
                boxShadow: focused ? '0 0 20px rgba(99, 102, 241, 0.2)' : 'none',
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={focused ? '#6366f1' : '#64748b'} strokeWidth="2">
                    <path d="M12 2a4 4 0 0 1 4 4v1a3 3 0 0 1 3 3v1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2v-1a3 3 0 0 1 3-3V6a4 4 0 0 1 4-4z" />
                </svg>
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={placeholder}
                    style={{
                        flex: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        fontSize: 14,
                        color: '#f8fafc',
                    }}
                />
                <kbd style={{
                    padding: '2px 8px',
                    fontSize: 11,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 4,
                    color: '#64748b',
                }}>⌘K</kbd>
            </div>
        </form>
    );
};

// =============================================================================
// CODE DIFF VIEWER
// =============================================================================

interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    lineNumber?: number;
}

interface CodeDiffProps {
    diff: DiffLine[];
    filename?: string;
}

export const CodeDiff: React.FC<CodeDiffProps> = ({ diff, filename }) => {
    return (
        <div className="code-diff" style={{
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 12,
            overflow: 'hidden',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
        }}>
            {filename && (
                <div style={{
                    padding: '8px 16px',
                    background: 'rgba(255,255,255,0.05)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    color: '#94a3b8',
                    fontSize: 12,
                }}>
                    {filename}
                </div>
            )}
            <div style={{ padding: 16 }}>
                {diff.map((line, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        color: line.type === 'add' ? '#22c55e'
                            : line.type === 'remove' ? '#ef4444'
                                : '#94a3b8',
                        background: line.type === 'add' ? 'rgba(34, 197, 94, 0.1)'
                            : line.type === 'remove' ? 'rgba(239, 68, 68, 0.1)'
                                : 'transparent',
                        padding: '2px 0',
                    }}>
                        <span style={{ width: 40, color: '#475569', textAlign: 'right', paddingRight: 12 }}>
                            {line.lineNumber || ''}
                        </span>
                        <span style={{ paddingRight: 8 }}>
                            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                        </span>
                        <span style={{ flex: 1 }}>{line.content}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// =============================================================================
// TASK PROGRESS RING
// =============================================================================

interface ProgressRingProps {
    progress: number;
    size?: number;
    strokeWidth?: number;
    label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 120,
    strokeWidth = 8,
    label,
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                </defs>
            </svg>
            <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#f8fafc' }}>{progress}%</span>
                {label && <span style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{label}</span>}
            </div>
        </div>
    );
};

// =============================================================================
// AGENT CARD
// =============================================================================

interface AgentCardProps {
    name: string;
    icon: string;
    status: 'idle' | 'working' | 'success';
    task?: string;
    onClick?: () => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ name, icon, status, task, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                borderRadius: 16,
                padding: 20,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{icon}</span>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{name}</div>
                    <AgentStatus status={status} />
                </div>
            </div>
            {task && (
                <div style={{
                    fontSize: 13,
                    color: '#94a3b8',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '8px 12px',
                    borderRadius: 8,
                    marginTop: 8,
                }}>
                    {task}
                </div>
            )}
        </div>
    );
};

// =============================================================================
// FLOATING ACTION BUTTON
// =============================================================================

interface FABProps {
    onClick: () => void;
    icon?: React.ReactNode;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick, icon }) => {
    return (
        <button
            onClick={onClick}
            style={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)',
                transition: 'all 0.2s ease',
                color: 'white',
                fontSize: 24,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(99, 102, 241, 0.6)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(99, 102, 241, 0.4)';
            }}
        >
            {icon || '+'}
        </button>
    );
};

// =============================================================================
// TYPING INDICATOR
// =============================================================================

export const TypingIndicator: React.FC = () => {
    return (
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#6366f1',
                        animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`,
                    }}
                />
            ))}
            <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </div>
    );
};

// =============================================================================
// NOTIFICATION TOAST
// =============================================================================

interface ToastProps {
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ type, message, onClose }) => {
    const config = {
        success: { icon: '✓', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
        error: { icon: '✕', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
        info: { icon: 'ℹ', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
        warning: { icon: '⚠', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    };

    const c = config[type];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: c.bg,
            border: `1px solid ${c.color}40`,
            borderRadius: 12,
            animation: 'slideUp 0.3s ease-out',
        }}>
            <span style={{ color: c.color, fontSize: 16 }}>{c.icon}</span>
            <span style={{ flex: 1, color: '#f8fafc', fontSize: 14 }}>{message}</span>
            {onClose && (
                <button
                    onClick={onClose}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: 18,
                    }}
                >
                    ×
                </button>
            )}
        </div>
    );
};
