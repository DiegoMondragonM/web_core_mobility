import { useEffect, useRef, useState } from 'react';
import { api } from './api';
import Stage from './Stage';
import { Header, StudyGoal, NetworkMap, Reflexes } from './StudyContent';

function groupStages(temas) {
  const stages = [];
  for (const tema of temas) {
    const etapa = tema.etapa || (tema.grupo === 'ATP' ? 'Después de la sesión del ATP' : 'Metas adicionales');
    let stage = stages.find(item => item.etapa === etapa && item.grupo === tema.grupo);
    if (!stage) {
      stage = { etapa, grupo: tema.grupo, orden: tema.orden ?? 999, nota: tema.nota || '', mono: tema.mono || false, items: [] };
      stages.push(stage);
    }
    stage.items.push(tema);
  }
  for (const grupo of ['ROUTE', 'ATP']) {
    if (!stages.some(stage => stage.grupo === grupo)) stages.push({ grupo, etapa: grupo === 'ROUTE' ? 'Metas adicionales' : 'Después de la sesión del ATP', orden: 0, nota: '', mono: false, items: [] });
  }
  // La estructura original recorre ROUTE y después ATP; orden es local a cada grupo.
  return stages.sort((a, b) => ['ROUTE', 'ATP'].indexOf(a.grupo) - ['ROUTE', 'ATP'].indexOf(b.grupo) || a.orden - b.orden);
}
const stageKey = stage => JSON.stringify([stage.grupo, stage.etapa]);

export default function App() {
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [destino, setDestino] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const mutation = useRef(false);
  const [activeKey, setActiveKey] = useState('');
  const stageContent = useRef(null);
  const scrollPending = useRef(false);
  const stages = groupStages(temas);
  const navigationStages = stages.filter(stage => stage.items.length);
  const activeIndex = Math.max(0, navigationStages.findIndex(stage => stageKey(stage) === activeKey));
  const activeStage = navigationStages[activeIndex];
  const selected = stages.find(stage => stageKey(stage) === destino) || stages[0];
  const disabled = loading || !loaded || busy;
  const done = temas.filter(tema => tema.hecho).length;

  useEffect(() => {
    if (!scrollPending.current) return;
    scrollPending.current = false;
    stageContent.current?.focus({ preventScroll: true });
    stageContent.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [activeKey]);

  function navigate(offset) {
    const next = navigationStages[activeIndex + offset];
    if (!next) return;
    scrollPending.current = true;
    setActiveKey(stageKey(next));
  }

  useEffect(() => {
    const controller = new AbortController();
    api('/api/temas', 'GET', undefined, controller.signal).then(data => {
      setTemas(data);
      setLoaded(true);
      setLoading(false);
    }).catch(err => {
      if (controller.signal.aborted) return;
      setError(err.message);
      setStatus('No se pudieron cargar los temas. Recarga la página para reintentar.');
      setLoading(false);
    });
    return () => controller.abort();
  }, []);

  async function change(action) {
    if (mutation.current || disabled) return;
    mutation.current = true;
    setBusy(true);
    setError('');
    setStatus('');
    try { await action(); }
    catch (err) { setError(err.message); }
    finally { mutation.current = false; setBusy(false); }
  }
  async function patch(id, hecho) {
    const updated = await api(`/api/temas/${encodeURIComponent(id)}`, 'PATCH', { hecho });
    setTemas(current => current.map(tema => tema.id === id ? updated : tema));
  }
  function addMeta(event) {
    event.preventDefault();
    change(async () => {
      const { items, ...stage } = selected;
      const tema = await api('/api/temas', 'POST', { ...stage, titulo, descripcion });
      setTemas(current => [...current, tema]);
      setTitulo('');
      setDescripcion('');
      setStatus('Meta agregada.');
    });
  }
  function resetProgress() {
    change(async () => {
      try {
        for (const tema of temas.filter(item => item.hecho)) await patch(tema.id, false);
        setStatus('Avance restablecido.');
      } catch (err) {
        throw new Error(`El reinicio no se completó: ${err.message} Puedes reintentarlo.`);
      } finally { setConfirmReset(false); }
    });
  }

  return <>
    <Header />
    <main className="wrap">
      <div className="progress">
        <div className="progress-row"><span>Avance total</span><strong id="total-count">{done} de {temas.length} temas</strong></div>
        <div className="bar"><span id="total-bar" style={{ width: `${temas.length ? done / temas.length * 100 : 0}%` }} /></div>
      </div>
      <p id="estado" role="status">{loading ? 'Cargando temas…' : status}</p>
      <p id="error" role="alert">{error}</p>
      <StudyGoal />
      <section className="stage-view" ref={stageContent} tabIndex={-1} aria-label="Etapa actual">
        <div className="sec-head"><h2>La ruta, etapa por etapa</h2></div>
        {activeStage?.grupo === 'ATP' && <h2>Temario que dejó el ATP</h2>}
        {activeStage && <Stage key={stageKey(activeStage)} stage={activeStage} disabled={disabled} onToggle={(id, hecho) => change(() => patch(id, hecho))} />}
        {loaded && !activeStage && <p>Aún no hay temas. Agrega una meta para comenzar.</p>}
        <nav className="stage-navigation" aria-label="Navegación entre etapas">
          <button type="button" disabled={disabled || activeIndex === 0} onClick={() => navigate(-1)}>← Anterior</button>
          <span role="status">Etapa {activeStage ? activeIndex + 1 : 0} de {navigationStages.length}</span>
          <button type="button" disabled={disabled || activeIndex >= navigationStages.length - 1} onClick={() => navigate(1)}>Siguiente etapa →</button>
        </nav>
      </section>
      <div className="support-grid">
      <NetworkMap />
      <Reflexes />
      <section>
        <h2>Nueva meta</h2>
        <form id="nueva-meta" onSubmit={addMeta}>
          <label htmlFor="titulo">Tema</label>
          <input id="titulo" name="titulo" maxLength={200} required disabled={disabled} value={titulo} onChange={event => setTitulo(event.target.value)} />
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <input id="descripcion" name="descripcion" maxLength={2000} disabled={disabled} value={descripcion} onChange={event => setDescripcion(event.target.value)} />
          <label htmlFor="destino">Etapa</label>
          <select id="destino" name="destino" required disabled={disabled} value={stageKey(selected)} onChange={event => setDestino(event.target.value)}>
            {stages.map(stage => <option key={stageKey(stage)} value={stageKey(stage)}>{stage.grupo} · {stage.etapa}</option>)}
          </select>
          <button type="submit" disabled={disabled}>Agregar meta</button>
        </form>
      </section>
      </div>
      <div className="foot">
        <span>Tu avance se guarda en el servidor.</span>
        <button id="reset" type="button" hidden={confirmReset} disabled={disabled} onClick={() => setConfirmReset(true)}>Borrar avance</button>
        <button id="reset-yes" type="button" hidden={!confirmReset} disabled={disabled} onClick={resetProgress}>Sí, borrar todo</button>
        <button id="reset-no" type="button" hidden={!confirmReset} disabled={disabled} onClick={() => setConfirmReset(false)}>Cancelar</button>
      </div>
    </main>
  </>;
}
