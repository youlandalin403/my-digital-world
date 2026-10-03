import { createClient } from '@supabase/supabase-js';

export const ownerId = import.meta.env.VITE_OBSERVATORY_OWNER_ID?.trim();
const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
export const configurationError = !url || !key || !ownerId
  ? 'Observatory configuration is missing.'
  : !key.startsWith('sb_publishable_')
    ? 'Observatory requires a Supabase publishable key.'
    : null;
export const supabase = configurationError ? null : createClient(url, key);

export function database() {
  if (!supabase) throw new Error(configurationError);
  return supabase;
}

export function result({ data, error }) {
  if (error) throw error;
  return data;
}
