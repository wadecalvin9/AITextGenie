import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient;

if (!supabaseUrl || supabaseUrl === 'undefined') {
  console.warn('VITE_SUPABASE_URL environment variable is not set');
  // Create a placeholder client that won't work but won't crash
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else if (!supabaseAnonKey || supabaseAnonKey === 'undefined') {
  console.warn('VITE_SUPABASE_ANON_KEY environment variable is not set');
  supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
} else {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseClient;