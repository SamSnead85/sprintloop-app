/**
 * User Profile Service
 * 
 * Manages user profile, settings sync, and session state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export interface UserProfile {
    id: string;
    email?: string;
    displayName: string;
    avatarUrl?: string;
    createdAt: Date;
    lastLogin: Date;
}

export interface SyncStatus {
    enabled: boolean;
    lastSync: Date | null;
    syncing: boolean;
    error?: string;
}

export interface SessionInfo {
    startTime: Date;
    filesOpened: number;
    linesEdited: number;
    commandsRun: number;
    aiInteractions: number;
}

export interface UserProfileState {
    profile: UserProfile | null;
    isAuthenticated: boolean;
    syncStatus: SyncStatus;
    session: SessionInfo;

    // Auth
    login: (email: string, displayName: string) => void;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;

    // Sync
    enableSync: () => void;
    disableSync: () => void;
    triggerSync: () => Promise<void>;

    // Session tracking
    trackFileOpen: () => void;
    trackLineEdit: (count?: number) => void;
    trackCommandRun: () => void;
    trackAIInteraction: () => void;
    resetSession: () => void;
    getSessionDuration: () => string;
}

// =============================================================================
// USER PROFILE STORE
// =============================================================================

const createInitialSession = (): SessionInfo => ({
    startTime: new Date(),
    filesOpened: 0,
    linesEdited: 0,
    commandsRun: 0,
    aiInteractions: 0,
});

export const useUserProfileService = create<UserProfileState>()(
    persist(
        (set, get) => ({
            profile: null,
            isAuthenticated: false,
            syncStatus: {
                enabled: false,
                lastSync: null,
                syncing: false,
            },
            session: createInitialSession(),

            login: (email, displayName) => {
                const profile: UserProfile = {
                    id: `user_${Date.now()}`,
                    email,
                    displayName,
                    createdAt: new Date(),
                    lastLogin: new Date(),
                };
                set({
                    profile,
                    isAuthenticated: true,
                    session: createInitialSession(),
                });
            },

            logout: () => {
                set({
                    profile: null,
                    isAuthenticated: false,
                    syncStatus: { enabled: false, lastSync: null, syncing: false },
                });
            },

            updateProfile: (updates) => {
                set(state => ({
                    profile: state.profile ? { ...state.profile, ...updates } : null,
                }));
            },

            enableSync: () => {
                set(state => ({
                    syncStatus: { ...state.syncStatus, enabled: true },
                }));
            },

            disableSync: () => {
                set(state => ({
                    syncStatus: { ...state.syncStatus, enabled: false },
                }));
            },

            triggerSync: async () => {
                set(state => ({
                    syncStatus: { ...state.syncStatus, syncing: true, error: undefined },
                }));

                // Simulate sync
                await new Promise(resolve => setTimeout(resolve, 1500));

                set(state => ({
                    syncStatus: {
                        ...state.syncStatus,
                        syncing: false,
                        lastSync: new Date(),
                    },
                }));
            },

            trackFileOpen: () => {
                set(state => ({
                    session: { ...state.session, filesOpened: state.session.filesOpened + 1 },
                }));
            },

            trackLineEdit: (count = 1) => {
                set(state => ({
                    session: { ...state.session, linesEdited: state.session.linesEdited + count },
                }));
            },

            trackCommandRun: () => {
                set(state => ({
                    session: { ...state.session, commandsRun: state.session.commandsRun + 1 },
                }));
            },

            trackAIInteraction: () => {
                set(state => ({
                    session: { ...state.session, aiInteractions: state.session.aiInteractions + 1 },
                }));
            },

            resetSession: () => {
                set({ session: createInitialSession() });
            },

            getSessionDuration: () => {
                const { session } = get();
                const now = new Date();
                const diff = now.getTime() - new Date(session.startTime).getTime();
                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                if (hours > 0) return `${hours}h ${minutes}m`;
                return `${minutes}m`;
            },
        }),
        {
            name: 'sprintloop-user-profile',
            partialize: (state) => ({
                profile: state.profile,
                isAuthenticated: state.isAuthenticated,
                syncStatus: { enabled: state.syncStatus.enabled, lastSync: state.syncStatus.lastSync, syncing: false },
            }),
        }
    )
);

// =============================================================================
// UTILITIES
// =============================================================================

export function generateAvatarUrl(name: string): string {
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3b82f6&color=fff`;
}

export function formatLastSync(date: Date | null): string {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}
