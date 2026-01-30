/**
 * User Profile Panel Component
 * 
 * UI for viewing user profile, sync status, and session stats.
 */

import { useState } from 'react';
import {
    User, LogOut, Cloud, CloudOff, RefreshCw, Settings,
    FileCode, Edit, Terminal, Bot, Clock
} from 'lucide-react';
import {
    useUserProfileService,
    generateAvatarUrl,
    formatLastSync
} from '../lib/user/user-profile-service';

export function UserProfilePanel() {
    const {
        profile,
        isAuthenticated,
        syncStatus,
        session,
        login,
        logout,
        updateProfile,
        enableSync,
        disableSync,
        triggerSync,
        getSessionDuration,
    } = useUserProfileService();

    const [showLogin, setShowLogin] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginName, setLoginName] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');

    const handleLogin = () => {
        if (loginEmail.trim() && loginName.trim()) {
            login(loginEmail, loginName);
            setLoginEmail('');
            setLoginName('');
            setShowLogin(false);
        }
    };

    const handleSave = () => {
        if (editName.trim()) {
            updateProfile({ displayName: editName });
            setIsEditing(false);
        }
    };

    return (
        <div className="user-profile-panel">
            {!isAuthenticated ? (
                showLogin ? (
                    <div className="login-form">
                        <h3>Sign In</h3>
                        <input
                            type="email"
                            placeholder="Email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Display Name"
                            value={loginName}
                            onChange={(e) => setLoginName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                        />
                        <div className="login-actions">
                            <button className="primary" onClick={handleLogin}>Sign In</button>
                            <button onClick={() => setShowLogin(false)}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="guest-view">
                        <User size={48} />
                        <p>Sign in to sync settings</p>
                        <button onClick={() => setShowLogin(true)}>Sign In</button>
                    </div>
                )
            ) : (
                <div className="profile-view">
                    {/* Profile Header */}
                    <div className="profile-header">
                        <img
                            src={profile?.avatarUrl || generateAvatarUrl(profile?.displayName || 'U')}
                            alt="Avatar"
                            className="avatar"
                        />
                        <div className="profile-info">
                            {isEditing ? (
                                <div className="edit-name">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                        autoFocus
                                    />
                                    <button onClick={handleSave}>Save</button>
                                </div>
                            ) : (
                                <span
                                    className="display-name"
                                    onClick={() => { setEditName(profile?.displayName || ''); setIsEditing(true); }}
                                >
                                    {profile?.displayName}
                                </span>
                            )}
                            <span className="email">{profile?.email}</span>
                        </div>
                        <button className="logout-btn" onClick={logout} title="Sign Out">
                            <LogOut size={16} />
                        </button>
                    </div>

                    {/* Sync Status */}
                    <div className="sync-section">
                        <h4>Settings Sync</h4>
                        <div className="sync-toggle">
                            <button
                                className={syncStatus.enabled ? 'enabled' : ''}
                                onClick={() => syncStatus.enabled ? disableSync() : enableSync()}
                            >
                                {syncStatus.enabled ? <Cloud size={16} /> : <CloudOff size={16} />}
                                {syncStatus.enabled ? 'Enabled' : 'Disabled'}
                            </button>
                            {syncStatus.enabled && (
                                <button
                                    className="sync-btn"
                                    onClick={triggerSync}
                                    disabled={syncStatus.syncing}
                                >
                                    <RefreshCw size={14} className={syncStatus.syncing ? 'spinning' : ''} />
                                </button>
                            )}
                        </div>
                        {syncStatus.enabled && (
                            <span className="last-sync">
                                Last sync: {formatLastSync(syncStatus.lastSync)}
                            </span>
                        )}
                    </div>

                    {/* Session Stats */}
                    <div className="session-section">
                        <h4>Session Activity</h4>
                        <div className="stats-grid">
                            <div className="stat-item">
                                <Clock size={16} />
                                <span className="stat-value">{getSessionDuration()}</span>
                                <span className="stat-label">Duration</span>
                            </div>
                            <div className="stat-item">
                                <FileCode size={16} />
                                <span className="stat-value">{session.filesOpened}</span>
                                <span className="stat-label">Files</span>
                            </div>
                            <div className="stat-item">
                                <Edit size={16} />
                                <span className="stat-value">{session.linesEdited}</span>
                                <span className="stat-label">Lines</span>
                            </div>
                            <div className="stat-item">
                                <Terminal size={16} />
                                <span className="stat-value">{session.commandsRun}</span>
                                <span className="stat-label">Commands</span>
                            </div>
                            <div className="stat-item">
                                <Bot size={16} />
                                <span className="stat-value">{session.aiInteractions}</span>
                                <span className="stat-label">AI</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Settings */}
                    <div className="quick-actions">
                        <button>
                            <Settings size={14} /> Preferences
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UserProfilePanel;
