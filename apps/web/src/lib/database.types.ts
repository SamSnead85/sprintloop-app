/**
 * Database Types for Supabase
 * Auto-generated types should be placed here after running:
 * npx supabase gen types typescript --project-id YOUR_PROJECT > database.types.ts
 */

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    subscription_tier: 'free' | 'pro' | 'team' | 'enterprise'
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    subscription_tier?: 'free' | 'pro' | 'team' | 'enterprise'
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    subscription_tier?: 'free' | 'pro' | 'team' | 'enterprise'
                    updated_at?: string
                }
            }
            projects: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    path: string | null
                    mode: 'planning' | 'execution'
                    settings: Json
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    path?: string | null
                    mode?: 'planning' | 'execution'
                    settings?: Json
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    name?: string
                    description?: string | null
                    path?: string | null
                    mode?: 'planning' | 'execution'
                    settings?: Json
                    updated_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    project_id: string
                    title: string
                    description: string | null
                    status: 'backlog' | 'planning' | 'in-progress' | 'done'
                    priority: 'high' | 'medium' | 'low'
                    labels: string[]
                    order: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    title: string
                    description?: string | null
                    status?: 'backlog' | 'planning' | 'in-progress' | 'done'
                    priority?: 'high' | 'medium' | 'low'
                    labels?: string[]
                    order?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    title?: string
                    description?: string | null
                    status?: 'backlog' | 'planning' | 'in-progress' | 'done'
                    priority?: 'high' | 'medium' | 'low'
                    labels?: string[]
                    order?: number
                    updated_at?: string
                }
            }
            ai_conversations: {
                Row: {
                    id: string
                    project_id: string
                    messages: Json
                    model: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    messages?: Json
                    model?: string
                    created_at?: string
                }
                Update: {
                    messages?: Json
                    model?: string
                }
            }
        }
        Views: {}
        Functions: {}
        Enums: {
            subscription_tier: 'free' | 'pro' | 'team' | 'enterprise'
            project_mode: 'planning' | 'execution'
            task_status: 'backlog' | 'planning' | 'in-progress' | 'done'
            task_priority: 'high' | 'medium' | 'low'
        }
    }
}
