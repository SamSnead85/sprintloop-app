/**
 * Welcome View Component
 * 
 * Landing page showing recent projects and quick actions.
 */

import { useState } from 'react';
import {
    Folder, FolderPlus, Clock, Star, X,
    ExternalLink, Trash2, Plus, GitBranch
} from 'lucide-react';
import {
    useWorkspaceManager,
    formatLastOpened,
    RecentProject
} from '../lib/workspace/workspace-manager';

export function WelcomeView() {
    const {
        recentProjects,
        isWelcomeVisible,
        createWorkspace,
        openWorkspace,
        removeRecentProject,
        togglePinProject,
        setWelcomeVisible,
        getRecentPinned,
    } = useWorkspaceManager();

    const [showNewWorkspace, setShowNewWorkspace] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    const pinnedProjects = getRecentPinned();
    const unpinnedProjects = recentProjects.filter(p => !p.pinned);

    const handleCreateWorkspace = () => {
        if (newWorkspaceName.trim()) {
            createWorkspace(newWorkspaceName);
            setNewWorkspaceName('');
            setShowNewWorkspace(false);
        }
    };

    if (!isWelcomeVisible) return null;

    return (
        <div className="welcome-view">
            <button className="welcome-close" onClick={() => setWelcomeVisible(false)}>
                <X size={20} />
            </button>

            <div className="welcome-header">
                <div className="welcome-logo">
                    <span className="logo-icon">🚀</span>
                    <span className="logo-text">SprintLoop</span>
                </div>
                <p className="welcome-tagline">AI-Native IDE for Autonomous Development</p>
            </div>

            <div className="welcome-actions">
                <button className="action-card" onClick={() => setShowNewWorkspace(true)}>
                    <FolderPlus size={24} />
                    <span>New Project</span>
                </button>
                <button className="action-card">
                    <Folder size={24} />
                    <span>Open Folder</span>
                </button>
                <button className="action-card">
                    <GitBranch size={24} />
                    <span>Clone Repo</span>
                </button>
            </div>

            {showNewWorkspace && (
                <div className="new-workspace-dialog">
                    <input
                        type="text"
                        placeholder="Workspace name..."
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
                        autoFocus
                    />
                    <button onClick={handleCreateWorkspace}><Plus size={14} /> Create</button>
                    <button onClick={() => setShowNewWorkspace(false)}>Cancel</button>
                </div>
            )}

            <div className="welcome-recent">
                {pinnedProjects.length > 0 && (
                    <div className="recent-section">
                        <h3><Star size={14} /> Pinned</h3>
                        <div className="project-list">
                            {pinnedProjects.map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onOpen={() => openWorkspace(project.workspaceId || '')}
                                    onRemove={() => removeRecentProject(project.id)}
                                    onTogglePin={() => togglePinProject(project.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="recent-section">
                    <h3><Clock size={14} /> Recent</h3>
                    {unpinnedProjects.length === 0 ? (
                        <div className="no-recent">
                            <p>No recent projects</p>
                            <p className="hint">Open a folder to get started</p>
                        </div>
                    ) : (
                        <div className="project-list">
                            {unpinnedProjects.slice(0, 8).map(project => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onOpen={() => openWorkspace(project.workspaceId || '')}
                                    onRemove={() => removeRecentProject(project.id)}
                                    onTogglePin={() => togglePinProject(project.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="welcome-footer">
                <span>v1.0.0</span>
                <a href="#" className="footer-link">Documentation</a>
                <a href="#" className="footer-link">Release Notes</a>
            </div>
        </div>
    );
}

interface ProjectCardProps {
    project: RecentProject;
    onOpen: () => void;
    onRemove: () => void;
    onTogglePin: () => void;
}

function ProjectCard({ project, onOpen, onRemove, onTogglePin }: ProjectCardProps) {
    return (
        <div className="project-card" onClick={onOpen}>
            <div className="project-icon"><Folder size={20} /></div>
            <div className="project-info">
                <span className="project-name">{project.name}</span>
                <span className="project-path">{project.path}</span>
                <span className="project-time">{formatLastOpened(project.lastOpened)}</span>
            </div>
            <div className="project-actions">
                <button onClick={(e) => { e.stopPropagation(); onTogglePin(); }} title={project.pinned ? 'Unpin' : 'Pin'}>
                    <Star size={14} fill={project.pinned ? 'currentColor' : 'none'} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); window.open(project.path); }} title="Open in Explorer">
                    <ExternalLink size={14} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} title="Remove">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

export default WelcomeView;
