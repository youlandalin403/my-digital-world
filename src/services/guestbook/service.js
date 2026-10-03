export const COOLDOWN_MS = 30000;
export function validateEntry(name = '', message = '') {
  if (typeof name !== 'string' || typeof message !== 'string') throw new Error('Name and message must be text.');
  if ([...name].length > 80) throw new Error('Name must be at most 80 characters.');
  if ([...message].length > 2000) throw new Error('Message must be at most 2000 characters.');
  if (!message.trim()) throw new Error('Please enter a message.');
  return { name: name.trim(), message: message.trim() };
}
export function contactHref(email) {
  const value = email?.trim();
  return value && /^[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+$/.test(value) ? `mailto:${value}` : null;
}
// Cooldown is page-session convenience only; it is not server-side rate limiting.
export function createGuestbookService(adapter, now = Date.now) {
  let inFlight = false, nextSubmission = 0;
  const requireOwner = async operation => { await adapter.requireOwner(); return operation(); };
  return {
    getVisibleEntries: () => adapter.list(false),
    getOwnerEntries: () => requireOwner(() => adapter.list(true)),
    remainingCooldown: () => Math.max(0, nextSubmission - now()),
    async submitEntry(name, message, honeypot = '') {
      if (honeypot) throw new Error('Submission rejected.');
      const entry = validateEntry(name, message);
      if (inFlight) throw new Error('A submission is already in progress.');
      if (now() < nextSubmission) throw new Error('Please wait before leaving another message.');
      inFlight = true;
      try { const saved = await adapter.insert(entry); nextSubmission = now() + COOLDOWN_MS; return saved; }
      finally { inFlight = false; }
    },
    hideEntry: id => requireOwner(() => adapter.setHidden(id, true)),
    unhideEntry: id => requireOwner(() => adapter.setHidden(id, false)),
    deleteEntry: id => requireOwner(() => adapter.remove(id)),
  };
}
