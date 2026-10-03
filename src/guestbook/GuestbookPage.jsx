import { useEffect, useRef, useState } from 'react';
import { followLocalLink } from '../navigation';
import { configurationError } from '../services/observatory/client';
import { getSession, subscribeAuth, isOwner, signIn, signOut } from '../services/observatory/auth';
import { guestbookService as service, privateContactHref } from '../services/guestbook';
import './guestbook.css';

export default function GuestbookPage({ onClose }) {
  const [session, setSession] = useState(null), [ready, setReady] = useState(false), [authError, setAuthError] = useState('');
  useEffect(() => {
    document.title = 'Guestbook | Yunhan Lin';
    if (configurationError) return;
    let active = true, received = false;
    const unsubscribe = subscribeAuth(value => { received = true; if (active) { setSession(value); setReady(true); } });
    getSession().then(value => { if (active && !received) { setSession(value); setReady(true); } }).catch(() => {
      if (active) { setAuthError('Could not restore your session. Reload to try again.'); setReady(true); }
    });
    return () => { active = false; unsubscribe(); document.title = 'My Digital World | Yunhan Lin'; };
  }, []);
  return <main className="guestbook-page"><div className="guestbook-container">
    {onClose ? <button onClick={onClose}>Return to room</button> : <a href="/map" onClick={followLocalLink}>← World map</a>}<h1>Guestbook</h1>
    <p>Leave a short public note. Messages are visible to everyone.</p>
    <aside><p>Want to say something privately? {privateContactHref ? <a href={privateContactHref}>Send me an email.</a> : <span>Private email contact is not configured yet.</span>}</p></aside>
    {authError && <p role="alert">{authError}</p>}
    {configurationError ? <p role="alert">Guestbook database configuration is missing or invalid.</p>
      : <Workspace key={session?.user?.id || 'visitor'} session={session} ready={ready} />}
  </div></main>;
}

function Workspace({ session, ready }) {
  const owner = isOwner(session);
  const [entries, setEntries] = useState(null), [loading, setLoading] = useState(true), [readError, setReadError] = useState('');
  const [state, setState] = useState('idle'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [name, setName] = useState(''), [message, setMessage] = useState(''), [honeypot, setHoneypot] = useState('');
  const [cooldown, setCooldown] = useState(service.remainingCooldown()), [login, setLogin] = useState(false);
  const active = useRef(true), lock = useRef(false), readVersion = useRef(0);
  const busy = state === 'submitting';
  async function load() {
    const version = ++readVersion.current;
    setLoading(true); setReadError('');
    try {
      const data = await (owner ? service.getOwnerEntries() : service.getVisibleEntries());
      if (active.current && version === readVersion.current) setEntries(data);
    } catch {
      if (active.current && version === readVersion.current) setReadError('Could not load messages. The Guestbook migration may not be applied, or the connection failed. Retry loading.');
    } finally { if (active.current && version === readVersion.current) setLoading(false); }
  }
  useEffect(() => {
    active.current = true; load();
    const timer = setInterval(() => setCooldown(service.remainingCooldown()), 500);
    return () => { active.current = false; clearInterval(timer); };
  }, []);
  async function run(operation, onSuccess, text) {
    if (lock.current) return;
    lock.current = true; setState('submitting'); setError(''); setNotice('');
    try {
      await operation();
      if (active.current) { onSuccess?.(); setState('success'); setNotice(text); }
    } catch (failure) {
      if (active.current) { setState('error'); setError(failure.message || 'Request failed. Please try again.'); }
    } finally { lock.current = false; }
  }
  return <>
    <div className="guestbook-toolbar">{session ? <button disabled={busy} onClick={() => run(signOut)}>Sign out</button>
      : <button disabled={!ready || busy} onClick={() => setLogin(value => !value)}>Owner login</button>}</div>
    {login && !session && <form onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      run(() => signIn(data.get('email').trim(), data.get('password')));
    }}><label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={busy}>Sign in</button></form>}
    <form aria-label="Leave a public message" onSubmit={event => {
      event.preventDefault();
      run(() => service.submitEntry(name, message, honeypot), () => {
        setName(''); setMessage(''); setHoneypot(''); setCooldown(service.remainingCooldown()); load();
      }, 'Your public message was posted.');
    }}>
      <label>Name (optional)<input aria-label="Name (optional)" value={name} maxLength={80} disabled={busy} onChange={event => setName(event.target.value)} /></label>
      <label>Message<textarea aria-label="Message" value={message} required maxLength={2000} rows={5} disabled={busy} onChange={event => setMessage(event.target.value)} /></label>
      <div className="guestbook-honeypot" aria-hidden="true"><input name="website" data-testid="guestbook-honeypot" tabIndex={-1} autoComplete="off" value={honeypot} onChange={event => setHoneypot(event.target.value)} /></div>
      <button disabled={busy || cooldown > 0}>Leave a message</button>
      {cooldown > 0 && <p>Please wait {Math.ceil(cooldown / 1000)} seconds before leaving another message.</p>}
    </form>
    <p role="status" aria-live="polite">{busy ? 'Submitting…' : state === 'success' ? notice : ''}</p>
    {error && <p role="alert">{error}</p>}
    <section aria-label="Recent messages"><h2>Recent messages</h2>
      <button disabled={loading || busy} onClick={load}>Reload messages</button>
      {loading && <p>Loading messages…</p>}
      {readError && <p role="alert">{readError}</p>}
      {entries?.length === 0 && <p>No messages yet.</p>}
      <ol>{entries?.map(entry => <li key={entry.id}><article aria-label={`Message from ${entry.name || 'Anonymous'}`}>
        <header><strong>{entry.name || 'Anonymous'}</strong> <time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time>
          {owner && entry.is_hidden && <span className="guestbook-hidden">Hidden</span>}</header>
        <p className="guestbook-message">{entry.message}</p>
        {owner && <div className="guestbook-toolbar">
          <button disabled={busy} onClick={() => run(() => entry.is_hidden ? service.unhideEntry(entry.id) : service.hideEntry(entry.id), load, entry.is_hidden ? 'Message is public.' : 'Message hidden.')}>{entry.is_hidden ? 'Unhide' : 'Hide'}</button>
          <button disabled={busy} onClick={() => { if (window.confirm('Permanently delete this message?')) run(() => service.deleteEntry(entry.id), load, 'Message deleted.'); }}>Delete</button>
        </div>}
      </article></li>)}</ol>
    </section>
  </>;
}
