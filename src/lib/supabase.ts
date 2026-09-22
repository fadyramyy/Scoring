import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.warn('⚠️ Running in Demo Mode (Mock Database). Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.');
} else {
  console.log('⚡ Connected to Live Supabase:', supabaseUrl);
}

export const supabase = !isDemoMode
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
