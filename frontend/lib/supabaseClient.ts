// Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables - use NEXT_PUBLIC_ prefix for client-side access
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_API_KEY || '';

// Create Supabase client (only if credentials are available)
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (typeof window === 'undefined') return null;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials not found in environment variables.');
        return null;
    }

    if (!supabase) {
        try {
            supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        } catch (error) {
            console.error('Failed to create Supabase client:', error);
            return null;
        }
    }

    return supabase;
}

export { supabase };
