import { useEffect, useRef, useState } from 'react';
import { diaryService } from '../services/diary';
import { localDateKey, shiftDate } from '../services/observatory/date';

export default function DiaryEditor({ onClose }) {
  const [date, setDate] = useState(localDateKey), [title, setTitle] = useState(''), [body, setBody] = useState('');
  const [state, setState] = useState('loading'), [error, setError] = useState(''), [dirty, setDirty] = useState(false);
  const [loaded, setLoaded] = useState(false), [retry, setRetry] = useState(0);
  const version = useRef(0), saving = useRef(false);
  useEffect(() => {
    const current = ++version.current;
    setState('loading'); setLoaded(false); setError(''); setTitle(''); setBody(''); setDirty(false);
    diaryService.getDiaryEntry(date).then(entry => {
      if (current !== version.current) return;
      setTitle(entry?.title || ''); setBody(entry?.body_markdown || ''); setLoaded(true); setState('ready');
    }).catch(failure => {
      if (current === version.current) { setState('error'); setError(`Could not load Diary. The migration may not be applied. ${failure.message || 'Please retry.'}`); }
    });
    return () => { version.current++; };
  }, [date, retry]);
  useEffect(() => {
    const warn = event => { if (dirty || saving.current) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const leave = action => { if (!saving.current && (!dirty || window.confirm('Discard unsaved Diary changes?'))) action(); };
  const busy = state === 'loading' || state === 'saving';
  async function save(event) {
    event.preventDefault();
    if (!loaded || saving.current) return;
    saving.current = true; const current = version.current;
    setState('saving'); setError('');
    try {
      await diaryService.saveDiaryEntry(date, title, body);
      if (current === version.current) { setDirty(false); setState('saved'); }
    } catch (failure) {
      if (current === version.current) { setState('error'); setError(`Diary was not saved. ${failure.message || 'Please retry.'}`); }
    } finally { saving.current = false; }
  }
  return <section className="diary-editor" aria-label="Private Diary">
    <button disabled={state === 'saving'} onClick={() => leave(onClose)}>Return to room</button>
    <h1>Diary</h1><p>Private, free-form writing. Markdown is saved as text.</p>
    <div className="diary-navigation">
      <button disabled={busy || date === '0001-01-01'} onClick={() => leave(() => setDate(shiftDate(date, -1)))}>Previous day</button>
      <label>Date<input type="date" value={date} min="0001-01-01" max="9999-12-31" disabled={busy} onChange={event => { const next = event.target.value; if (next) leave(() => setDate(next)); }} /></label>
      <button disabled={busy || date === '9999-12-31'} onClick={() => leave(() => setDate(shiftDate(date, 1)))}>Next day</button>
      <button disabled={busy} onClick={() => leave(() => setDate(localDateKey()))}>Today</button>
    </div>
    <form onSubmit={save}>
      <label>Title (optional)<input value={title} disabled={!loaded || busy} onChange={event => { setTitle(event.target.value); setDirty(true); setState('ready'); }} /></label>
      <label>Markdown<textarea rows={14} value={body} disabled={!loaded || busy} onChange={event => { setBody(event.target.value); setDirty(true); setState('ready'); }} /></label>
      <button disabled={!loaded || busy}>Save</button>
    </form>
    <p role="status">{({ loading: 'Loading…', ready: dirty ? 'Unsaved changes' : 'Ready', saving: 'Saving…', saved: 'Saved', error: '' })[state]}</p>
    {error && <p role="alert">{error}</p>}
    {!loaded && state === 'error' && <button onClick={() => setRetry(value => value + 1)}>Retry loading Diary</button>}
  </section>;
}

