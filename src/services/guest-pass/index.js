import { getSession } from '../observatory/auth';
import { createGuestPassService } from './service';
export const guestPass = createGuestPassService({
  url: import.meta.env.VITE_SUPABASE_URL?.trim(),
  key: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim(), getSession,
});
