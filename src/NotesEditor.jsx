import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { api } from './api';

export default function NotesEditor({ tema, temas, onSaved, onClose, onSwitch }) {
  const [text, setText] = useState(tema.apuntes ?? '');
  const [saved, setSaved] = useState(tema.apuntes ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const dialog = useRef(null);
  const editor = useRef(null);
  const savingRef = useRef(false);
  const dirty = text !== saved;
  const length = Array.from(text).length;

  useEffect(() => {
    const node = dialog.current;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node.close(); document.body.style.overflow = overflow; };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function finish(action) {
    if (action.id) onSwitch(action.id);
    else onClose();
  }
  function request(action) {
    if (savingRef.current) return;
    if (dirty) setPending(action);
    else finish(action);
  }
  async function save(action) {
    if (savingRef.current || length > 20000) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await api(`/api/temas/${encodeURIComponent(tema.id)}`, 'PATCH', { apuntes: text });
      setSaved(text);
      onSaved(updated);
      setMessage('Apuntes guardados.');
      if (action) finish(action);
    } catch (err) { setError(`No se pudieron guardar los apuntes. Tu texto sigue aquí. ${err.message}`); }
    finally { savingRef.current = false; setSaving(false); }
  }
  function format(type) {
    const node = editor.current;
    const start = node.selectionStart, end = node.selectionEnd;
    const selection = text.slice(start, end) || 'Texto';
    let replacement;
    if (type === 'bold') replacement = `**${selection}**`;
    else {
      const lines = selection.split('\n');
      replacement = lines.map((line, i) => `${type === 'number' ? `${i + 1}. ` : type}${line}`).join('\n');
      if (start > 0 && text[start - 1] !== '\n') replacement = '\n\n' + replacement;
      if (end < text.length && text[end] !== '\n') replacement += '\n\n';
    }
    setText(text.slice(0, start) + replacement + text.slice(end));
    setMessage('');
    requestAnimationFrame(() => { node.focus(); node.setSelectionRange(start, start + replacement.length); });
  }

  return <dialog ref={dialog} className="notes-dialog" aria-labelledby="notes-title"
    onCancel={event => { event.preventDefault(); request({}); }}>
    <header className="notes-heading"><h2 id="notes-title">Mis apuntes · {tema.titulo}</h2></header>
    <label htmlFor="notes-topic">Tema</label>
    <select id="notes-topic" value={tema.id} disabled={saving || !!pending} onChange={event => request({ id: event.target.value })}>
      {temas.map(item => <option key={item.id} value={item.id}>{item.grupo} · {item.titulo}</option>)}
    </select>
    <div className="notes-toolbar" role="group" aria-label="Formato de apuntes">
      {[['Título', '# '], ['Subtítulo', '## '], ['Párrafo', ''], ['Negrita', 'bold'], ['Viñetas', '- '], ['Lista numerada', 'number']].map(([label, type]) =>
        <button key={label} type="button" disabled={saving || !!pending} onClick={() => format(type)}>{label}</button>)}
    </div>
    <div className="notes-columns">
      <section><label htmlFor="notes-text">Editor</label><textarea ref={editor} id="notes-text" value={text} disabled={saving || !!pending}
        onChange={event => { setText(event.target.value); setMessage(''); }} /></section>
      <section><h3>Vista previa</h3><div className="notes-preview">
        <Markdown skipHtml disallowedElements={['img']} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a> }}>{text}</Markdown>
      </div></section>
    </div>
    <div className="notes-state"><span>{length.toLocaleString('es-MX')} / 20 000</span>
      <span role="status">{saving ? 'Guardando…' : dirty ? 'Cambios pendientes' : message || 'Sin cambios pendientes'}</span></div>
    {length > 20000 && <p role="alert">El límite es de 20 000 caracteres. Reduce el texto para guardarlo.</p>}
    {error && <p role="alert" className="notes-error">{error}</p>}
    {pending && <div className="notes-confirm" role="group" aria-label="Cambios sin guardar">
      <p>Hay cambios sin guardar.</p>
      <button type="button" disabled={saving || length > 20000} onClick={() => save(pending)}>Guardar y continuar</button>
      <button type="button" disabled={saving} onClick={() => finish(pending)}>Descartar cambios</button>
      <button type="button" disabled={saving} onClick={() => { setPending(null); requestAnimationFrame(() => editor.current.focus()); }}>Seguir editando</button>
    </div>}
    <footer className="notes-actions">
      <button type="button" disabled={saving || !dirty || length > 20000 || !!pending} onClick={() => save()}>Guardar</button>
      <button type="button" disabled={saving || !!pending} onClick={() => request({})}>Cerrar</button>
    </footer>
  </dialog>;
}
