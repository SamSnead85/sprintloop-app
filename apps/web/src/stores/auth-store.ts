/**
 * Auth Store
 * Manages user authentication state with Supabase
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    signUp: (email: string, password: string, name?: string) => Promise<boolean>;
    signIn: (email: string, password: string) => Promise<boolean>;
    signInWithProvider: (provider: 'github' | 'google') => Promise<boolean>;
    signInWithMagicLink: (email: string) => Promise<boolean>;
    signOut: () => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            session: null,
            isLoading: true,
            isAuthenticated: false,
            error: null,

            initialize: async () => {
                if (!isSupabaseConfigured()) {
                    set({ isLoading: false });
                    return;
                }

                try {
                    const { session } = await auth.getSession();
                    const { user } = await auth.getUser();

                    set({
                        user,
                        session,
                        isAuthenticated: !!session,
                        isLoading: false,
                    });

                    // Listen for auth changes
                    auth.onAuthStateChange((_event, session) => {
                        set({
                            session,
                            user: session?.user ?? null,
                            isAuthenticated: !!session,
                        });
                    });
                } catch (error) {
                    set({ isLoading: false, error: 'Failed to initialize auth' });
                }
            },

            signUp: async (email, password, name) => {
                set({ isLoading: true, error: null });
                const { data, error } = await auth.signUp(email, password, name);

                if (error || !data) {
                    set({ isLoading: false, error: error?.message || 'Sign up failed' });
                    return false;
                }

                set({
                    user: data.user,
                    session: data.session,
                    isAuthenticated: !!data.session,
                    isLoading: false,
                });
                return true;
            },

            signIn: async (email, password) => {
                set({ isLoading: true, error: null });
                const { data, error } = await auth.signIn(email, password);

                if (error || !data) {
                    set({ isLoading: false, error: error?.message || 'Sign in failed' });
                    return false;
                }

                set({
                    user: data.user,
                    session: data.session,
                    isAuthenticated: !!data.session,
                    isLoading: false,
                });
                return true;
            },

            signInWithProvider: async (provider) => {
                set({ isLoading: true, error: null });
                const { error } = await auth.signInWithOAuth(provider);

                if (error) {
                    set({ isLoading: false, error: error.message });
                    return false;
                }

                // OAuth redirect will happen, loading state handled by callback
                return true;
            },

            signInWithMagicLink: async (email) => {
                set({ isLoading: true, error: null });
                const { error } = await auth.signInWithMagicLink(email);

                if (error) {
                    set({ isLoading: false, error: error.message });
                    return false;
                }

                set({ isLoading: false });
                return true;
            },

            signOut: async () => {
                set({ isLoading: true });
                await auth.signOut();
                set({
                    user: null,
                    session: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'sprintloop:auth',
            partialize: (state) => ({
                // Only persist minimal data
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
