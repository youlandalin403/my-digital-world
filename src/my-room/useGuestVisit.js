import { useEffect, useRef, useState } from 'react';
import { guestPass } from '../services/guest-pass';
import { clearVisit, readVisit } from '../services/guest-pass/service';

export default function useGuestVisit(owner, authReady) {
  const [valid, setValid] = useState(false), [checking, setChecking] = useState(true);
  const [error, setError] = useState(''), [leaving, setLeaving] = useState(false), [retryLeave, setRetryLeave] = useState(false);
  const closed = useRef(false), pendingRevoke = useRef(null);
  useEffect(() => {
    if (!authReady) return;
    if (owner) { setValid(false); setChecking(false); return; }
    let active = true, inFlight = false, expiryTimer;
    const storageToken = () => { try { return readVisit(sessionStorage); } catch { return null; } };
    const clear = () => { try { clearVisit(sessionStorage); } catch { /* Storage unavailable. */ } };
    const lock = () => { if (active) { setValid(false); clear(); } };
    async function validate() {
      if (inFlight || closed.current) { if (closed.current) setChecking(false); return; }
      const token = storageToken();
      if (!token) { lock(); setChecking(false); return; }
      inFlight = true;
      // Initial access is locked. Subsequent checks preserve movement/overlays
      // until a denial; the independent expiry timer still closes access on time.
      try {
        const result = await guestPass('validate-room-session', { token });
        if (!active || closed.current) return;
        const remaining = Date.parse(result.expires_at) - Date.now();
        if (result.valid !== true || !Number.isFinite(remaining) || remaining <= 0 || remaining > 4 * 60 * 60 * 1000) {
          lock(); setError('This visit has ended. Ask the owner for a new invitation.'); return;
        }
        clearTimeout(expiryTimer);
        expiryTimer = setTimeout(() => { lock(); setError('This visit has expired.'); }, remaining);
        setError(''); setValid(true);
      } catch { if (active && !closed.current) { setValid(false); setError('Unable to validate this visit. Reconnect and reload to retry.'); } }
      finally { inFlight = false; if (active) setChecking(false); }
    }
    const foreground = () => { if (!document.hidden) validate(); };
    validate();
    const interval = setInterval(validate, 60000);
    window.addEventListener('focus', foreground); window.addEventListener('pageshow', foreground);
    document.addEventListener('visibilitychange', foreground);
    return () => { active = false; clearInterval(interval); clearTimeout(expiryTimer);
      window.removeEventListener('focus', foreground); window.removeEventListener('pageshow', foreground);
      document.removeEventListener('visibilitychange', foreground); };
  }, [owner, authReady]);
  async function leave() {
    if (leaving) return;
    closed.current = true; setValid(false); setChecking(false); setLeaving(true); setError('');
    try {
      if (!pendingRevoke.current) pendingRevoke.current = readVisit(sessionStorage);
      clearVisit(sessionStorage);
      if (pendingRevoke.current) await guestPass('revoke-room-session', { token: pendingRevoke.current });
      pendingRevoke.current = null; setRetryLeave(false);
    } catch {
      setRetryLeave(true); setError('You have left locally, but server revocation failed. Retry ending the visit; otherwise it expires within four hours.');
    } finally { setLeaving(false); }
  }
  return { valid, checking, error, leave, leaving, retryLeave };
}
