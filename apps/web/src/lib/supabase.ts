/**
 * Supabase Client Configuration
 * Provides authenticated client for auth, database, and real-time sync
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Environment variables (set in .env or Tauri config)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
    return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
};

// Create Supabase client only if configured (prevents crash on empty URL)
const createSupabaseClient = () => {
    if (!isSupabaseConfigured()) {
        // Return a mock client that won't crash the app
        return null;
    }
    return createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        realtime: {
            params: {
                eventsPerSecond: 10,
            },
        },
    });
};

export const supabase = createSupabaseClient();

// Auth helpers
export const auth = {
    // Sign up with email
    signUp: async (email: string, password: string, name?: string) => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name },
            },
        });
        return { data, error };
    },

    // Sign in with email
    signIn: async (email: string, password: string) => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },

    // Sign in with OAuth (GitHub, Google)
    signInWithOAuth: async (provider: 'github' | 'google') => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    },

    // Magic link
    signInWithMagicLink: async (email: string) => {
        if (!supabase) return { data: null, error: new Error('Supabase not configured') };
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        return { data, error };
    },

    // Sign out
    signOut: async () => {
        if (!supabase) return { error: new Error('Supabase not configured') };
        const { error } = await supabase.auth.signOut();
        return { error };
    },

    // Get current user
    getUser: async () => {
        if (!supabase) return { user: null, error: new Error('Supabase not configured') };
        const { data: { user }, error } = await supabase.auth.getUser();
        return { user, error };
    },

    // Get session
    getSession: async () => {
        if (!supabase) return { session: null, error: new Error('Supabase not configured') };
        const { data: { session }, error } = await supabase.auth.getSession();
        return { session, error };
    },

    // Listen to auth changes
    onAuthStateChange: (callback: (event: string, session: any) => void) => {
        if (!supabase) return { data: { subscription: { unsubscribe: () => { } } } };
        return supabase.auth.onAuthStateChange(callback);
    },
};

export default supabase;

