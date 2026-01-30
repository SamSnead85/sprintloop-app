/**
 * Output Panel Component
 * 
 * Displays output channels with filtering and clear options.
 */

import React, { useEffect, useRef } from 'react';
import { useOutput, type OutputLine } from '../lib/output/output-panel';

interface OutputPanelProps {
    className?: string;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ className }) => {
    const { channels, activeChannelId, setActiveChannel, clear } = useOutput();
    const contentRef = useRef<HTMLDivElement>(null);

    const activeChannel = activeChannelId ? channels.get(activeChannelId) : null;
    const visibleChannels = Array.from(channels.values()).filter(c => c.visible);

    // Auto-scroll to bottom
    useEffect(() => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
    }, [activeChannel?.lines.length]);

    return (
        <div className={`output-panel ${className || ''}`}>
            {/* Header */}
            <div className="output-panel__header">
                <div className="output-panel__tabs">
                    {visibleChannels.map(channel => (
                        <button
                            key={channel.id}
                            className={`output-panel__tab ${activeChannelId === channel.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(channel.id)}
                        >
                            {channel.name}
                            {channel.lines.length > 0 && (
                                <span className="output-panel__badge">{channel.lines.length}</span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="output-panel__actions">
                    {activeChannelId && (
                        <button
                            className="output-panel__action"
                            onClick={() => clear(activeChannelId)}
                            title="Clear"
                        >
                            🗑️
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="output-panel__content" ref={contentRef}>
                {activeChannel?.lines.map((line, i) => (
                    <OutputLineView key={i} line={line} />
                ))}
                {activeChannel?.lines.length === 0 && (
                    <div className="output-panel__empty">No output</div>
                )}
            </div>
        </div>
    );
};

// =============================================================================
// OUTPUT LINE COMPONENT
// =============================================================================

interface OutputLineViewProps {
    line: OutputLine;
}

const OutputLineView: React.FC<OutputLineViewProps> = ({ line }) => {
    const time = new Date(line.timestamp).toLocaleTimeString();

    return (
        <div className={`output-line output-line--${line.type}`}>
            <span className="output-line__time">[{time}]</span>
            <span className="output-line__text">{line.text}</span>
        </div>
    );
};

export default OutputPanel;
