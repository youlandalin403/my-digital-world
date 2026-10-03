import { useEffect, useMemo, useRef, useState } from 'react';
import { followLocalLink } from '../navigation';
import { configurationError } from '../services/observatory/client';
import { getSession, subscribeAuth, isOwner, signIn, signOut } from '../services/observatory/auth';
import { constellationService as service } from '../services/constellation';
import { pathToRoot, radialLayout, statuses, validateMove } from './tree';
import './constellation.css';

export default function ConstellationPage() {
  const [session, setSession] = useState(null), [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    document.title = 'Constellation | Yunhan Lin';
    if (configurationError) { setAuthError(configurationError); return; }
    let active = true, received = false;
    const unsubscribe = subscribeAuth(value => { received = true; if (active) { setSession(value); setAuthReady(true); } });
    getSession().then(value => { if (active && !received) { setSession(value); setAuthReady(true); } })
      .catch(() => { if (active) { setAuthError('Could not restore your session. Reload to try again.'); setAuthReady(true); } });
    return () => { active = false; unsubscribe(); document.title = 'My Digital World | Yunhan Lin'; };
  }, []);
  return <main className="constellation-page">
    <header><a href="/map" onClick={followLocalLink}>← World map</a><h1>Constellation</h1></header>
    {authError && <p role="alert">{authError}</p>}
    {!configurationError && <Workspace key={session?.user?.id || 'visitor'} session={session} authReady={authReady} />}
  </main>;
}

function Workspace({ session, authReady }) {
  const [model, setModel] = useState(null), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Loading tree…'), [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(new Set()), [login, setLogin] = useState(false);
  const active = useRef(true), locked = useRef(false);
  const owner = authReady && isOwner(session);
  async function load(initial = false) {
    const next = await service.getConstellationTree();
    if (!active.current) return;
    setModel(next);
    setSelected(id => next.nodes.has(id) ? id : next.root.id);
    if (initial) setExpanded(new Set([next.root.id]));
  }
  async function run(operation, after, success = 'Saved') {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setMessage('Working…');
    try {
      await operation();
      if (active.current) { after?.(); setMessage(success); }
    } catch (failure) {
      if (active.current) { setError(failure.message || 'Request failed. Please retry.'); setMessage('Request failed'); }
    } finally { locked.current = false; if (active.current) setBusy(false); }
  }
  useEffect(() => {
    active.current = true;
    run(() => load(true), null, 'Ready');
    return () => { active.current = false; };
  }, []);
  async function persist(operation, after) {
    await run(async () => {
      await operation();
      try { await load(); } catch { throw new Error('The write succeeded, but refreshing failed. Reload the tree before making another change.'); }
    }, after);
  }
  const node = model?.nodes.get(selected);
  function toggle(id) {
    setSelected(id);
    setExpanded(current => {
      const next = new Set(current);
      if (next.has(id)) {
        // Collapsing resets descendants too, so reopening reveals only direct children.
        for (const key of next) if (pathToRoot(model, key).some(item => item.id === id)) next.delete(key);
      } else next.add(id);
      return next;
    });
  }
  return <>
    <div className="constellation-toolbar">
      {session ? <button disabled={busy} onClick={() => run(signOut)}>Sign out</button>
        : <button disabled={!authReady || busy} onClick={() => setLogin(value => !value)}>Owner login</button>}
      <button disabled={busy} onClick={() => run(() => load(!model), null, 'Ready')}>Reload tree</button>
      <span role="status" aria-live="polite">{message}</span>
    </div>
    {login && !session && <form className="constellation-login" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      run(() => signIn(data.get('email').trim(), data.get('password')));
    }}><label>Email<input name="email" type="email" autoComplete="username" required /></label>
      <label>Password<input name="password" type="password" autoComplete="current-password" required /></label><button disabled={busy}>Sign in</button></form>}
    {error && <p role="alert">{error}</p>}
    {!model && !busy && <p>The tree is unavailable. Check the connection and whether the Constellation migration has been applied, then reload.</p>}
    {model && <>
      <p>Explore an interest to reveal its children. Drag the background to pan; use the wheel or buttons to zoom.</p>
      <StarMap model={model} expanded={expanded} selected={selected} onToggle={toggle} onHome={() => { setExpanded(new Set([model.root.id])); setSelected(model.root.id); }} />
      {node && <section className="constellation-details" aria-label="Selected interest">
        <p className="constellation-breadcrumb">{pathToRoot(model, selected).map(item => item.name).join(' / ')}</p>
        <h2>{node.name}</h2><span>{node.status}</span><p>{node.description || 'No description yet.'}</p>
      </section>}
      {owner && <Editor model={model} selected={selected} select={setSelected} busy={busy} persist={persist} />}
    </>}
  </>;
}

function StarMap({ model, expanded, selected, onToggle, onHome }) {
  const nodes = useMemo(() => radialLayout(model, expanded), [model, expanded]);
  const byId = new Map(nodes.map(node => [node.id, node]));
  const path = new Set(pathToRoot(model, selected).map(node => node.id));
  const [hover, setHover] = useState(null), [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef(null), svg = useRef(null);
  const zoom = factor => setView(current => ({ ...current, scale: Math.min(4, Math.max(.2, current.scale * factor)) }));
  useEffect(() => {
    const element = svg.current;
    const wheel = event => { event.preventDefault(); zoom(event.deltaY < 0 ? 1.12 : 1 / 1.12); };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, []);
  return <section aria-label="Interest map" className="constellation-map">
    <div className="constellation-toolbar"><button onClick={() => zoom(1.25)} aria-label="Zoom in">+</button><button onClick={() => zoom(.8)} aria-label="Zoom out">−</button>
      <button onClick={() => { setView({ x: 0, y: 0, scale: 1 }); onHome(); }}>Home / reset</button></div>
    <svg ref={svg} viewBox="-540 -340 1080 680" aria-label="Radial interest tree" onPointerDown={event => {
      if (event.button !== 0 || event.target.closest('[data-node]')) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { x: event.clientX, y: event.clientY, view };
    }} onPointerMove={event => {
      if (!drag.current) return;
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = Math.max(1080 / rect.width, 680 / rect.height);
      setView({ ...drag.current.view, x: drag.current.view.x + (event.clientX - drag.current.x) * ratio, y: drag.current.view.y + (event.clientY - drag.current.y) * ratio });
    }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      <g data-testid="map-transform" transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
        {nodes.filter(node => byId.has(node.parent_id)).map(node => {
          const parent = byId.get(node.parent_id);
          const highlighted = path.has(node.id) && path.has(parent.id);
          return <line key={node.id} x1={parent.x} y1={parent.y} x2={node.x} y2={node.y} className={highlighted ? 'path-line' : hover === node.id || hover === parent.id ? 'hover-line' : ''} />;
        })}
        {nodes.map(node => <g key={node.id} data-node={node.id} role="button" tabIndex={0} aria-label={`Explore ${node.name}`} aria-pressed={selected === node.id}
          aria-expanded={node.children.length ? expanded.has(node.id) : undefined}
          transform={`translate(${node.x} ${node.y})`} className={`interest-node ${selected === node.id ? 'selected' : ''} ${path.has(node.id) ? 'on-path' : ''}`}
          onMouseEnter={() => setHover(node.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(node.id)} onBlur={() => setHover(null)}
          onClick={() => onToggle(node.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onToggle(node.id); } }}>
          <circle className="node-hit" r={20} /><circle r={node.depth === 0 ? 8 : 5} />
          <text x={node.depth === 0 ? 0 : node.x < -1 ? -13 : 13} y={node.depth === 0 ? 27 : 4} textAnchor={node.depth === 0 ? 'middle' : node.x < -1 ? 'end' : 'start'}>{node.name}{node.children.length ? expanded.has(node.id) ? ' −' : ' +' : ''}</text>
        </g>)}
      </g>
    </svg>
  </section>;
}

function Editor({ model, selected, select, busy, persist }) {
  const [open, setOpen] = useState(new Set([model.root.id]));
  const node = model.nodes.get(selected) || model.root;
  function branch(current) {
    return <li key={current.id}><div className="editor-row">
      {current.children.length > 0 && <button aria-label={`Toggle editor ${current.name}`} aria-expanded={open.has(current.id)} onClick={() => setOpen(value => { const next = new Set(value); next.has(current.id) ? next.delete(current.id) : next.add(current.id); return next; })}>{open.has(current.id) ? '−' : '+'}</button>}
      <button aria-pressed={selected === current.id} disabled={busy} onClick={() => select(current.id)}>{current.name}</button></div>
      {open.has(current.id) && <ul>{current.children.map(branch)}</ul>}</li>;
  }
  return <section className="constellation-editor" aria-label="Owner tree editor"><h2>Tree editor</h2>
    <div className="editor-columns"><nav aria-label="Editable interest tree"><ul>{branch(model.root)}</ul></nav>
      <NodeEditor key={`${node.id}:${node.updated_at || ''}`} node={node} model={model} busy={busy} persist={persist} select={select} />
    </div></section>;
}

function Fields({ prefix, defaults = {} }) {
  return <><label>{prefix} name<input aria-label={`${prefix} name`} name="name" required maxLength={160} defaultValue={defaults.name || ''} /></label>
    <label>{prefix} description<textarea aria-label={`${prefix} description`} name="description" maxLength={2000} defaultValue={defaults.description || ''} rows={3} /></label>
    <label>{prefix} status<select aria-label={`${prefix} status`} name="status" defaultValue={defaults.status || 'curious'}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label></>;
}

function NodeEditor({ node, model, busy, persist, select }) {
  const [deleteError, setDeleteError] = useState('');
  const siblings = model.nodes.get(node.parent_id)?.children || [], index = siblings.findIndex(item => item.id === node.id);
  const parents = [...model.nodes.values()].filter(candidate => { try { validateMove(model, node.id, candidate.id); return candidate.id !== node.parent_id; } catch { return false; } });
  function reorder(delta) {
    const ids = siblings.map(item => item.id); [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    persist(() => service.reorderSiblings(node.parent_id, ids));
  }
  return <fieldset disabled={busy} className="node-editor"><legend>{node.name}</legend>
    <form onSubmit={event => { event.preventDefault(); persist(() => service.updateNode(node.id, Object.fromEntries(new FormData(event.currentTarget)))); }}>
      <h3>Edit interest</h3><Fields prefix="Edit" defaults={node} /><button>Save node</button></form>
    <form onSubmit={event => { event.preventDefault(); const form = event.currentTarget; const fields = Object.fromEntries(new FormData(form)); persist(() => service.createNode(node.id, fields), () => form.reset()); }}>
      <h3>Add child</h3><Fields prefix="Child" /><button>Add child</button></form>
    {node.parent_id !== null && <>
      <form onSubmit={event => { event.preventDefault(); const parentId = new FormData(event.currentTarget).get('parent'); persist(() => service.moveNode(node.id, parentId)); }}>
        <label>New parent<select aria-label="New parent" name="parent" required defaultValue=""><option value="" disabled>Choose parent</option>{parents.map(parent => <option key={parent.id} value={parent.id}>{pathToRoot(model, parent.id).map(item => item.name).join(' / ')}</option>)}</select></label><button>Move node</button></form>
      <div className="constellation-toolbar"><button disabled={busy || index <= 0} onClick={() => reorder(-1)}>Move sibling up</button><button disabled={busy || index === siblings.length - 1} onClick={() => reorder(1)}>Move sibling down</button></div>
      <button onClick={() => {
        if (node.children.length) { setDeleteError('Move or delete the children first.'); return; }
        if (window.confirm(`Delete “${node.name}”?`)) persist(() => service.deleteNode(node.id), () => select(node.parent_id));
      }}>Delete leaf</button>
      {deleteError && <p role="alert">{deleteError}</p>}
    </>}
    {node.parent_id === null && <p>The root cannot be moved or deleted.</p>}
  </fieldset>;
}
