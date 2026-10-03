import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Plus, Save, Trash2 } from 'lucide-react';
import { navigate } from '../navigation';
import { configurationError } from '../services/observatory/client';
import { getSession, subscribeAuth, signIn, signOut, isOwner } from '../services/observatory/auth';
import { getDailyRecord, saveReflection, setVisibility } from '../services/observatory/dailyRecords';
import { addTask, updateTask, deleteTask, reorderTasks } from '../services/observatory/dailyTasks';
import { localDateKey, parseDateKey, shiftDate } from '../services/observatory/date';
import './observatory.css';

function report(error) {
  if (import.meta.env.DEV) console.error('Observatory request failed', error);
}

function IconButton({ label, children, ...props }) {
  return <button type="button" className="daily-icon" aria-label={label} title={label} {...props}>{children}</button>;
}

export default function ObservatoryPage() {
  const [auth, setAuth] = useState({ loading: true, session: null, error: '' });
  const [date, setDate] = useState(localDateKey);
  useEffect(() => {
    document.title = 'Observatory | Yunhan Lin';
    if (configurationError) {
      setAuth({ loading: false, session: null, error: configurationError });
      return;
    }
    let active = true;
    let receivedEvent = false;
    const unsubscribe = subscribeAuth(session => {
      receivedEvent = true;
      if (active) setAuth({ loading: false, session, error: '' });
    });
    getSession().then(session => {
      if (active && !receivedEvent) setAuth({ loading: false, session, error: '' });
    }).catch(error => {
      report(error);
      if (active) setAuth({ loading: false, session: null, error: 'Could not restore your session. Reload to try again.' });
    });
    return () => { active = false; unsubscribe(); document.title = 'My Digital World | Yunhan Lin'; };
  }, []);
  return <main className="observatory-page" aria-label="Observatory">
    {auth.loading ? <p role="status">Loading session...</p> : auth.error ? <div role="alert"><p>{auth.error}</p><button onClick={() => location.reload()}>Reload</button></div>
      : <DailyWorkspace key={`${auth.session?.user.id || 'visitor'}:${date}`} session={auth.session} date={date} setDate={setDate} />}
  </main>;
}

function DailyWorkspace({ session, date, setDate }) {
  const owner = isOwner(session);
  const [record, setRecord] = useState(null);
  const [reflection, setReflection] = useState('');
  const [drafts, setDrafts] = useState({});
  const [newTask, setNewTask] = useState('');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const active = useRef(true);
  const locked = useRef(false);
  const tasks = record?.tasks || [];
  const dirty = owner && (reflection !== (record?.reflection || '') || newTask.trim() || Object.keys(drafts).length > 0);
  const busy = status === 'loading' || status === 'saving';

  useEffect(() => {
    active.current = true;
    load();
    return () => { active.current = false; };
  }, []);
  useEffect(() => {
    const preventLoss = event => {
      if (dirty || locked.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', preventLoss);
    return () => window.removeEventListener('beforeunload', preventLoss);
  }, [dirty]);

  async function load() {
    if (locked.current) return;
    locked.current = true;
    setStatus('loading'); setError('');
    try {
      const data = await getDailyRecord(date);
      if (!active.current) return;
      setRecord(data); setReflection(data?.reflection || ''); setDrafts({}); setLoaded(true); setStatus('ready');
    } catch (failure) {
      report(failure);
      if (active.current) { setStatus('error'); setError('Could not load this day. The database may not be ready, or the connection failed. Try again.'); }
    } finally { locked.current = false; }
  }

  async function persist(operation, onSuccess, message = 'Could not save. Your unsaved text is still here. Try again.') {
    if (locked.current) return;
    locked.current = true;
    setStatus('saving'); setError('');
    try {
      const data = await operation();
      if (!active.current) return;
      onSuccess?.(data); setStatus('saved');
    } catch (failure) {
      report(failure);
      if (active.current) { setStatus('error'); setError(message); }
    } finally { locked.current = false; }
  }

  function leave(action) {
    if (locked.current) return;
    if (dirty && !window.confirm('Discard unsaved changes for this day?')) return;
    action();
  }
  function mergeRecord(fields) {
    setRecord(current => ({ date, reflection: '', visibility: 'private', tasks: [], ...current, ...fields }));
  }
  function changeTask(task, text) {
    setDrafts(current => {
      const next = { ...current };
      if (text === task.text) delete next[task.id]; else next[task.id] = text;
      return next;
    });
  }
  function moveTask(index, delta) {
    const ordered = [...tasks];
    [ordered[index], ordered[index + delta]] = [ordered[index + delta], ordered[index]];
    persist(() => reorderTasks(record.id, ordered.map(task => task.id)), () => mergeRecord({ tasks: ordered }),
      'Could not reorder tasks. Retry, or reload if another device changed this day.');
  }

  return <div className="daily-container">
    <header className="daily-header">
      <a href="/map" onClick={event => { event.preventDefault(); leave(() => navigate('/map')); }}><ArrowLeft size={16} /> World map</a>
      {session ? <button disabled={busy} onClick={() => leave(() => persist(signOut, null, 'Could not sign out. Try again.'))}>Sign out</button>
        : <button disabled={busy} onClick={() => setLoginOpen(open => !open)}>Owner login</button>}
    </header>
    <h1>Observatory</h1>
    {loginOpen && !session && <form className="daily-login" onSubmit={event => {
      event.preventDefault();
      persist(() => signIn(email.trim(), password), () => setPassword(''), 'Could not sign in. Check your owner credentials and connection.');
    }}>
      <label>Email<input type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label>
      <label>Password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /></label>
      <button disabled={busy}>Sign in</button>
    </form>}
    <nav className="daily-navigation" aria-label="Daily date navigation">
      <IconButton label="Previous day" disabled={busy || date === '0001-01-01'} onClick={() => leave(() => setDate(shiftDate(date, -1)))}><ArrowLeft size={18} /></IconButton>
      <label className="daily-date">Daily<input aria-label="Daily date" type="date" min="0001-01-01" max="9999-12-31" value={date} disabled={busy} onChange={event => {
        const next = event.target.value;
        try { parseDateKey(next); leave(() => setDate(next)); } catch { /* Incomplete date input. */ }
      }} /></label>
      <IconButton label="Next day" disabled={busy || date === '9999-12-31'} onClick={() => leave(() => setDate(shiftDate(date, 1)))}><ArrowRight size={18} /></IconButton>
      <button disabled={busy} onClick={() => leave(() => setDate(localDateKey()))}>Today</button>
    </nav>
    <div className="daily-status" role="status" aria-live="polite">{status === 'loading' ? 'Loading day...' : status === 'saving' ? 'Saving...' : dirty ? 'Unsaved changes' : status === 'saved' ? 'Saved' : loaded ? 'Ready' : ''}</div>
    {error && <div className="daily-error" role="alert"><p>{error}</p>{!loaded && <button disabled={busy} onClick={load}>Retry loading</button>}</div>}
    {loaded && <>
      {!record && <p>{owner ? 'No record for this day.' : 'No public record for this day.'}</p>}
      {(owner || record) && <>
        <div className="daily-visibility">{owner ? <label>Visibility <select aria-label="Visibility" value={record?.visibility || 'private'} disabled={busy} onChange={event => {
          const visibility = event.target.value;
          persist(() => setVisibility(date, visibility), data => mergeRecord({ id: data.id, visibility: data.visibility }));
        }}><option value="private">Private</option><option value="public">Public</option></select></label> : <span>Public · Read only</span>}</div>
        <section aria-labelledby="daily-plan"><h2 id="daily-plan">Plan</h2>
          <ul className="daily-tasks">{tasks.map((task, index) => <li key={task.id}>
            <input type="checkbox" aria-label={`Complete ${task.text}`} checked={task.done} disabled={!owner || busy}
              onChange={event => persist(() => updateTask(task.id, { done: event.target.checked }), updated => mergeRecord({ tasks: tasks.map(item => item.id === task.id ? updated : item) }))} />
            {owner ? <form className="daily-task-editor" onSubmit={event => {
              event.preventDefault();
              const text = drafts[task.id];
              if (!text?.trim()) return;
              persist(() => updateTask(task.id, { text }), updated => {
                mergeRecord({ tasks: tasks.map(item => item.id === task.id ? updated : item) });
                setDrafts(current => { const next = { ...current }; delete next[task.id]; return next; });
              });
            }}>
              <input aria-label={`Task ${index + 1}`} className={task.done ? 'is-done' : ''} value={drafts[task.id] ?? task.text} maxLength={2000} disabled={busy} onChange={event => changeTask(task, event.target.value)} />
              <button className="daily-icon" aria-label={`Save task ${index + 1}`} title="Save task" disabled={busy || !drafts[task.id]?.trim()}><Save size={16} /></button>
            </form> : <span className={task.done ? 'is-done' : ''}>{task.text}</span>}
            {owner && <div className="daily-task-actions">
              <IconButton label={`Move task ${index + 1} up`} disabled={busy || index === 0} onClick={() => moveTask(index, -1)}><ArrowUp size={16} /></IconButton>
              <IconButton label={`Move task ${index + 1} down`} disabled={busy || index === tasks.length - 1} onClick={() => moveTask(index, 1)}><ArrowDown size={16} /></IconButton>
              <IconButton label={`Delete task ${index + 1}`} disabled={busy} onClick={() => persist(() => deleteTask(task.id), () => {
                mergeRecord({ tasks: tasks.filter(item => item.id !== task.id) });
                setDrafts(current => { const next = { ...current }; delete next[task.id]; return next; });
              })}><Trash2 size={16} /></IconButton>
            </div>}
          </li>)}</ul>
          {owner && <form className="daily-add" onSubmit={event => {
            event.preventDefault(); if (!newTask.trim()) return;
            persist(() => addTask(date, newTask), task => { mergeRecord({ id: task.record_id, tasks: [...tasks, task] }); setNewTask(''); });
          }}><input aria-label="New task" placeholder="Add a task" value={newTask} maxLength={2000} disabled={busy} onChange={event => setNewTask(event.target.value)} />
            <button disabled={busy || !newTask.trim()}><Plus size={16} /> Add task</button></form>}
        </section>
        <section aria-labelledby="daily-reflection"><h2 id="daily-reflection">Reflection</h2>
          {owner ? <form onSubmit={event => {
            event.preventDefault(); persist(() => saveReflection(date, reflection), data => mergeRecord({ id: data.id, reflection: data.reflection }));
          }}><textarea aria-label="Reflection" rows={10} value={reflection} disabled={busy} onChange={event => setReflection(event.target.value)} />
            <button disabled={busy || reflection === (record?.reflection || '')}><Save size={16} /> Save reflection</button></form>
            : <p className="daily-reflection-text">{record.reflection || 'No reflection.'}</p>}
        </section>
      </>}
    </>}
  </div>;
}
