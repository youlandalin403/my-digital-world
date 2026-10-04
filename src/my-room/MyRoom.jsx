import { useEffect, useState } from 'react';
import { configurationError } from '../services/observatory/client';
import { getSession, subscribeAuth, isOwner, signIn, signOut } from '../services/observatory/auth';
import { followLocalLink } from '../navigation';
import GuestbookPage from '../guestbook/GuestbookPage';
import DiaryEditor from './DiaryEditor';
import RoomExperience from './RoomExperience';
import RoomOverlay from './RoomOverlay';
import GuestPassManager from './GuestPassManager';
import useGuestVisit from './useGuestVisit';
import './myRoom.css';

export default function MyRoom() {
  const [session, setSession] = useState(null), [ready, setReady] = useState(false), [error, setError] = useState('');
  const [pending, setPending] = useState(false), [view, setView] = useState('room'), [tea, setTea] = useState(2), [notice, setNotice] = useState('');
  const owner = isOwner(session);
  const visit = useGuestVisit(owner, ready);
  const allowed = owner || visit.valid;
  const [farewell, setFarewell] = useState(false);
  const [arrival, setArrival] = useState(false);
  useEffect(() => {
    if (!visit.valid || owner) return;
    setArrival(true);
    const timer = setTimeout(() => setArrival(false), 4500);
    return () => clearTimeout(timer);
  }, [visit.valid, owner]);
  useEffect(() => {
    if (!allowed) { setView('room'); if (document.pointerLockElement) document.exitPointerLock(); }
  }, [allowed]);
  useEffect(() => {
    document.title = 'My Room | Yunhan Lin';
    let active = true, received = false;
    if (configurationError) { setReady(true); return; }
    const unsubscribe = subscribeAuth(value => {
      received = true;
      if (active) { setSession(value); setReady(true); if (!isOwner(value)) setView(current => current === 'diary' ? 'room' : current); }
    });
    getSession().then(value => { if (active && !received) { setSession(value); setReady(true); } }).catch(() => { if (active) { setError('Could not restore owner session. Reload to retry.'); setReady(true); } });
    return () => { active = false; unsubscribe(); document.title = 'My Digital World | Yunhan Lin'; };
  }, []);
  async function authenticate(operation) {
    setPending(true); setError('');
    try { await operation(); } catch (failure) { setError(failure.message || 'Authentication failed.'); } finally { setPending(false); }
  }
  function open(viewName) {
    if (viewName === 'diary' && !owner) { setNotice('Diary is private. Sign in as owner.'); return; }
    setNotice(''); setView(viewName);
    if (document.pointerLockElement) document.exitPointerLock();
  }
  const close = () => { setView('room'); document.title = 'My Room | Yunhan Lin'; };
  if (farewell && !owner) return <main className="my-room room-invitation">
    <section className="invitation-paper" aria-labelledby="farewell-title">
      <p className="invitation-eyebrow">Until another time</p>
      <h1 id="farewell-title" tabIndex={-1} ref={node => node?.focus()}>Thanks for visiting.</h1>
      <p>The invitation has been used.</p>
      <p role="status">{visit.leaving ? 'Closing your visit…' : visit.retryLeave ? '' : 'Your visit has ended.'}</p>
      {visit.error && <p role="alert">{visit.error}</p>}
      {visit.retryLeave && <button disabled={visit.leaving} onClick={visit.leave}>Retry ending visit</button>}
      <a className="farewell-return" href="/map" onClick={followLocalLink}>Return to the public world</a>
    </section>
  </main>;
  return <main className="my-room">
    <header><a href="/map" onClick={followLocalLink}>← World map</a><h1>My Room</h1>
      {owner && <button disabled={pending} onClick={() => authenticate(signOut)}>Sign out</button>}
      {!owner && (visit.valid || visit.retryLeave) && <button disabled={visit.leaving} onClick={() => { setFarewell(true); visit.leave(); }}>{visit.retryLeave ? 'Retry ending visit' : 'Leave Room'}</button>}
    </header>
    {!ready || (!owner && visit.checking) ? <p role="status">Checking room access…</p> : <>
      {!allowed && <section className="room-access"><p>My Room is locked. Use a Guest Pass invitation or sign in as owner.</p>
        {configurationError ? <p role="alert">Owner authentication is not configured.</p> : <form onSubmit={event => { event.preventDefault(); const values = new FormData(event.currentTarget); authenticate(() => signIn(values.get('email').trim(), values.get('password'))); }}>
          <label>Email<input type="email" name="email" autoComplete="username" required /></label><label>Password<input type="password" name="password" autoComplete="current-password" required /></label><button disabled={pending}>Sign in</button>
        </form>}
      </section>}
      {error && <p role="alert">{error}</p>}
      {visit.error && <p role="alert">{visit.error}</p>}
      {owner && <details><summary>Manage Guest Pass invitations</summary><GuestPassManager /></details>}
      {allowed && <>
        <div className="room-arrival" aria-live="polite">{arrival && !owner ? 'Welcome. Stay a while.' : ''}</div>
        <RoomExperience canOpenDiary={owner} suspended={view !== 'room'} tea={tea} drinkTea={() => { setTea(value => Math.max(0, value - 1)); setNotice(''); }} openDiary={() => open('diary')} openGuestbook={() => open('guestbook')} />
        <p className="room-feedback" aria-live="polite">{notice} <span data-testid="tea-state">{['The cup is empty.', 'Half a cup left.', 'The tea is still warm.'][tea]}</span></p>
      </>}
    </>}
    {allowed && view === 'guestbook' && <RoomOverlay label="Guestbook"><GuestbookPage onClose={close} /></RoomOverlay>}
    {owner && view === 'diary' && <RoomOverlay label="Private Diary"><DiaryEditor onClose={close} /></RoomOverlay>}
  </main>;
}
