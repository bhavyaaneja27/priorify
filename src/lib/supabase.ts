import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './env';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
