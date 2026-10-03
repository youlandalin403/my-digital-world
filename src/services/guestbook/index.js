import { database, result } from '../observatory/client';
import { getSession, isOwner } from '../observatory/auth';
import { createGuestbookService, contactHref } from './service';
const table = () => database().from('guestbook_entries');
const confirmed = response => {
  const data = result(response);
  if (!data) throw new Error('Operation was not confirmed. Reload and try again.');
  return data;
};
export const privateContactHref = contactHref(import.meta.env.VITE_GUESTBOOK_CONTACT_EMAIL);
export const guestbookService = createGuestbookService({
  async requireOwner() { if (!isOwner(await getSession())) throw new Error('Owner authentication required.'); },
  async list(owner) {
    let query = table().select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(100);
    if (!owner) query = query.eq('is_hidden', false);
    return result(await query);
  },
  async insert(entry) { return confirmed(await table().insert(entry).select().single()); },
  async setHidden(id, hidden) { return confirmed(await table().update({ is_hidden: hidden }).eq('id', id).select().single()); },
  async remove(id) { return confirmed(await table().delete().eq('id', id).select().single()); },
});
