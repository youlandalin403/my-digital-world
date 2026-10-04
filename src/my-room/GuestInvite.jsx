import { useEffect, useRef, useState } from 'react';
import { followLocalLink } from '../navigation';
import { guestPass } from '../services/guest-pass';
import { TOKEN_PATTERN, saveVisit, checkStorage } from '../services/guest-pass/service';
import './myRoom.css';

export default function GuestInvite() {
  const [token] = useState(() => location.hash.slice(1));
  const [pending, setPending] = useState(false), [error, setError] = useState('');
  const busy = useRef(false);
  const [phase, setPhase] = useState(() => TOKEN_PATTERN.test(location.hash.slice(1)) ? 'ready' : 'unavailable');
  useEffect(() => {
    document.title = 'An invitation | Yunhan Lin';
    return () => { document.title = 'My Digital World | Yunhan Lin'; };
  }, []);
  useEffect(() => {
    if (phase !== 'success') return;
    const timer = setTimeout(() => {
      history.replaceState(null, '', '/room');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700);
    return () => clearTimeout(timer);
  }, [phase]);
  async function enter() {
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try {
      // Check storage BEFORE consuming a one-use invitation.
      try { checkStorage(sessionStorage); } catch { throw new Error('Allow browser storage before entering, then try again.'); }
      const visit = await guestPass('redeem-invitation', { token });
      // Replace the current history entry, including its secret fragment.
      history.replaceState(null, '', '/room/invite');
      try { saveVisit(sessionStorage, visit.token); }
      catch {
        await guestPass('revoke-room-session', { token: visit.token }).catch(() => {});
        throw new Error('The visit could not be saved. Request a new invitation.');
      }
      setPhase('success');
    } catch (failure) {
      const message = failure.message;
      const final = ['This invitation has already been used.', 'This invitation has expired.', 'This invitation or visit is unavailable.', 'The visit could not be saved. Request a new invitation.'].includes(message);
      setPhase(final ? (message.includes('already been used') ? 'used' : 'unavailable') : 'error');
      setError(final || message.startsWith('Allow browser storage') ? message : 'We couldn’t open the room just now. Please try again.');
      busy.current = false; setPending(false);
    }
  }
  const final = phase === 'used' || phase === 'unavailable';
  return <main className={`my-room room-invitation ${phase === 'success' ? 'is-entering' : ''}`} data-state={pending && phase !== 'success' ? 'redeeming' : phase}>
    <section className="invitation-paper" aria-labelledby="invitation-title">
      <svg className="invitation-sprig" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M30 88Q52 55 60 12M44 64Q16 63 23 40Q46 41 44 64M52 44Q78 46 80 23Q57 23 52 44M59 24Q43 22 48 8Q62 11 59 24" /></svg>
      <p className="invitation-eyebrow">A little place to pause</p>
      <h1 id="invitation-title">{final ? 'An invitation, one visit.' : 'You are invited'}</h1>
      <p className="invitation-host">to visit Yunhan’s Room</p>
      {!final && <><p>One visit only.</p><p className="invitation-note">Tea and the Guestbook are waiting.</p>
        <button className="invitation-enter" disabled={pending} onClick={enter}>{pending ? 'Entering…' : 'Enter My Room'}</button></>}
      <p className="invitation-status" role="status">{phase === 'success' ? 'The room is ready. Come in.' : pending ? 'Opening your invitation…' : ''}</p>
      {error && <p role="alert">{error}</p>}
      {final && <><p>Ask Yunhan for a new invitation whenever you’d like to visit.</p><a href="/map" onClick={followLocalLink}>Return to the public world</a></>}
      {!final && <p className="invitation-note">This invitation can only be used once.</p>}
    </section>
  </main>;
}
