import { useRef, useState } from 'react';
import { guestPass } from '../services/guest-pass';
import { TOKEN_PATTERN, saveVisit, checkStorage } from '../services/guest-pass/service';
import './myRoom.css';

export default function GuestInvite() {
  const [token] = useState(() => location.hash.slice(1));
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  async function enter() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try {
      // Check storage BEFORE consuming a one-use invitation.
      try { checkStorage(sessionStorage); } catch { throw new Error('Enable browser session storage before entering.'); }
      const visit = await guestPass('redeem-invitation', { token });
      // Replace the current history entry, including its secret fragment.
      history.replaceState(null, '', '/room/invite');
      try { saveVisit(sessionStorage, visit.token); }
      catch {
        await guestPass('revoke-room-session', { token: visit.token }).catch(() => {});
        throw new Error('The visit could not be saved. Request a new invitation.');
      }
      history.replaceState(null, '', '/room');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (failure) { setError(failure.message); }
    finally { busy.current = false; setPending(false); }
  }
  return <main className="my-room"><h1>You have been invited to My Room.</h1>
    <p>One invitation, one visit, up to four hours. Tea and the Guestbook are waiting.</p>
    {TOKEN_PATTERN.test(token) ? <button disabled={pending} onClick={enter}>{pending ? 'Entering…' : 'Enter My Room'}</button>
      : <p>This invitation is unavailable. Ask the owner for a new link.</p>}
    {error && <p role="alert">{error}</p>}
  </main>;
}
