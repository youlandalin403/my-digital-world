import { useEffect, useRef, useState } from 'react';
import { guestPass } from '../services/guest-pass';

export default function GuestPassManager() {
  const [items, setItems] = useState([]), [link, setLink] = useState(''), [error, setError] = useState('');
  const [pending, setPending] = useState(false), [copied, setCopied] = useState(false);
  const busy = useRef(false);
  const refresh = async () => setItems((await guestPass('list-invitations', {}, true)).invitations);
  useEffect(() => { let active = true;
    guestPass('list-invitations', {}, true).then(data => { if (active) setItems(data.invitations); })
      .catch(() => { if (active) setError('Invitations unavailable. The Guest Pass backend may not be deployed yet.'); });
    return () => { active = false; };
  }, []);
  async function run(operation) {
    if (busy.current) return;
    busy.current = true; setPending(true); setError('');
    try { await operation(); await refresh(); } catch (failure) { setError(failure.message); }
    finally { busy.current = false; setPending(false); }
  }
  return <section className="room-invitations" aria-label="Guest Pass invitations"><h2>Guest Pass</h2>
    <button disabled={pending} onClick={() => run(async () => {
      setLink(''); setCopied(false);
      setLink((await guestPass('create-invitation', {}, true)).invitation_url);
    })}>Generate Invitation</button>
    <button disabled={pending} onClick={() => run(async () => {})}>Refresh invitations</button>
    {link && <div><p>Copy this link now. It cannot be retrieved later.</p><input aria-label="New invitation link" readOnly value={link} />
      <button onClick={async () => { try { await navigator.clipboard.writeText(link); setCopied(true); } catch { setError('Copy failed. Select and copy the link above.'); } }}>{copied ? 'Copied' : 'Copy invitation'}</button>
      <button onClick={() => setLink('')}>Dismiss link</button></div>}
    {error && <p role="alert">{error}</p>}
    <p>Most recent 100 invitations. Revoking an unused invitation prevents entry.</p>
    <ul>{items.map(item => <li key={item.id}>
      Created {new Date(item.created_at).toLocaleString()} · Expires {new Date(item.expires_at).toLocaleString()} · {item.status}
      {item.status === 'unused' && <button disabled={pending} onClick={() => run(() => guestPass('revoke-invitation', { id: item.id }, true))}>Revoke</button>}
    </li>)}</ul>
  </section>;
}
