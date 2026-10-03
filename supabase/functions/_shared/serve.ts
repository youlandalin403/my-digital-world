import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import { createHandler } from './guest-pass.js';

export function serveGuestPass(action: string) {
  const required = (name: string) => {
    const value = Deno.env.get(name);
    if (!value) throw new Error(`Missing server configuration: ${name}`);
    return value;
  };
  // This module must never be imported into the frontend.
  const admin = createClient(required('SUPABASE_URL'), required('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  Deno.serve(createHandler({
    action,
    siteOrigin: required('ROOM_SITE_ORIGIN'),
    getUser: async (jwt: string) => {
      const { data, error } = await admin.auth.getUser(jwt);
      return error ? null : data.user;
    },
    rpc: async (name: string, args: Record<string, unknown>) => {
      const { data, error } = await admin.rpc(name, args);
      if (error) throw new Error('Database operation failed');
      return data;
    },
  }));
}
