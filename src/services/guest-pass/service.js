export const SESSION_KEY = 'my-room-visit-v07';
export const TOKEN_PATTERN = /^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/;
export function readVisit(storage) {
  try { const token = storage.getItem(SESSION_KEY); return TOKEN_PATTERN.test(token || '') ? token : null; }
  catch { return null; }
}
export function saveVisit(storage, token) {
  if (!TOKEN_PATTERN.test(token)) throw new Error('Invalid visit response.');
  storage.setItem(SESSION_KEY, token);
}
export function clearVisit(storage) {
  try { storage.removeItem(SESSION_KEY); } catch { /* Gate still closes in memory. */ }
}
export function checkStorage(storage) {
  const key = `${SESSION_KEY}-check`;
  storage.setItem(key, '1'); storage.removeItem(key);
}
export function createGuestPassService({ url, key, getSession, fetcher = fetch }) {
  return async (action, body = {}, owner = false) => {
    if (!url || !key) throw new Error('Guest Pass is not configured.');
    const headers = { 'Content-Type': 'application/json', apikey: key };
    if (owner) {
      const session = await getSession();
      if (!session?.access_token) throw new Error('Owner sign-in required.');
      headers.Authorization = `Bearer ${session.access_token}`;
    }
    let response;
    try {
      response = await fetcher(`${url.replace(/\/$/, '')}/functions/v1/${action}`, {
        method: 'POST', headers, body: JSON.stringify(body), cache: 'no-store',
        credentials: 'omit', referrerPolicy: 'no-referrer', signal: AbortSignal.timeout(15000),
      });
    } catch { throw new Error('Guest Pass service unavailable. Please retry.'); }
    let data;
    try { data = await response.json(); } catch { throw new Error('Guest Pass service unavailable. Please retry.'); }
    if (!response.ok) {
      const messages = { already_used: 'This invitation has already been used.', expired: 'This invitation has expired.',
        unavailable: 'This invitation or visit is unavailable.', forbidden: 'Owner access required.', unauthorized: 'Owner sign-in required.' };
      throw new Error(messages[data.error] || 'Guest Pass service unavailable. Please retry.');
    }
    return data;
  };
}
