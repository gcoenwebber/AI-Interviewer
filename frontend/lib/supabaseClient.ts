// Supabase client configuration
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Create Supabase client (only if credentials are available)
let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
    if (typeof window === 'undefined') return null;

    // Read environment variables lazily (at runtime, not at module load)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('Supabase credentials not found in environment variables.');
        console.warn('SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
        console.warn('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
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
