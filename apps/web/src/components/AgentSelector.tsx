/**
 * Agent Selector Component
 * 
 * Switch between BMAD agent personas or enable Party Mode.
 */

import React from 'react';
import { useAgentRegistry, type AgentPersona } from '../lib/sdlc';

interface AgentSelectorProps {
    className?: string;
    onAgentChange?: (agentId: string | null) => void;
}

export const AgentSelector: React.FC<AgentSelectorProps> = ({ className, onAgentChange }) => {
    const {
        agents,
        activeAgentId,
        partyMode,
        partyAgents,
        setActiveAgent,
        enablePartyMode,
        disablePartyMode
    } = useAgentRegistry();

    const agentList = Array.from(agents.values());
    const activeAgent = activeAgentId ? agents.get(activeAgentId) : null;

    const handleAgentSelect = (agentId: string) => {
        if (partyMode) {
            disablePartyMode();
        }
        setActiveAgent(agentId);
        onAgentChange?.(agentId);
    };

    const handlePartyMode = () => {
        if (partyMode) {
            disablePartyMode();
        } else {
            // Enable party mode with first 3 agents
            enablePartyMode(agentList.slice(0, 3).map(a => a.id));
        }
    };

    return (
        <div className={`agent-selector ${className || ''}`}>
            <div className="agent-selector__header">
                <span className="agent-selector__label">Active Agent</span>
                {partyMode ? (
                    <span className="agent-selector__badge party">
                        🎉 Party Mode ({partyAgents.length})
                    </span>
                ) : activeAgent ? (
                    <span
                        className="agent-selector__badge"
                        style={{ backgroundColor: activeAgent.color }}
                    >
                        {activeAgent.emoji} {activeAgent.name}
                    </span>
                ) : (
                    <span className="agent-selector__badge default">
                        🤖 Auto
                    </span>
                )}
            </div>

            <div className="agent-selector__grid">
                {agentList.map(agent => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        isActive={activeAgentId === agent.id}
                        isInParty={partyAgents.includes(agent.id)}
                        onClick={() => handleAgentSelect(agent.id)}
                    />
                ))}

                <button
                    className={`agent-card party-mode ${partyMode ? 'active' : ''}`}
                    onClick={handlePartyMode}
                >
                    <span className="agent-card__emoji">🎉</span>
                    <span className="agent-card__name">Party Mode</span>
                    <span className="agent-card__desc">Multi-agent</span>
                </button>
            </div>
        </div>
    );
};

interface AgentCardProps {
    agent: AgentPersona;
    isActive: boolean;
    isInParty: boolean;
    onClick: () => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, isActive, isInParty, onClick }) => {
    return (
        <button
            className={`agent-card ${isActive ? 'active' : ''} ${isInParty ? 'in-party' : ''}`}
            onClick={onClick}
            style={{
                '--agent-color': agent.color,
                borderColor: isActive ? agent.color : undefined,
            } as React.CSSProperties}
        >
            <span className="agent-card__emoji">{agent.emoji}</span>
            <span className="agent-card__name">{agent.name}</span>
            <span className="agent-card__role">{agent.role.replace('_', ' ')}</span>
        </button>
    );
};

export default AgentSelector;
