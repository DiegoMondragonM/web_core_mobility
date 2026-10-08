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
  return stages.sort((a, b) => a.orden - b.orden);
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
  const stages = groupStages(temas);
  const selected = stages.find(stage => stageKey(stage) === destino) || stages[0];
  const disabled = loading || !loaded || busy;
  const done = temas.filter(tema => tema.hecho).length;

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
  const stageList = grupo => stages.filter(stage => stage.grupo === grupo && stage.items.length).map(stage =>
    <Stage key={stageKey(stage)} stage={stage} disabled={disabled} onToggle={(id, hecho) => change(() => patch(id, hecho))} />);

  return <>
    <Header />
    <div className="wrap">
      <div className="progress">
        <div className="progress-row"><span>Avance total</span><strong id="total-count">{done} de {temas.length} temas</strong></div>
        <div className="bar"><span id="total-bar" style={{ width: `${temas.length ? done / temas.length * 100 : 0}%` }} /></div>
      </div>
      <p id="estado" role="status">{loading ? 'Cargando temas…' : status}</p>
      <p id="error" role="alert">{error}</p>
      <StudyGoal />
      <section>
        <div className="sec-head"><h2>La ruta, etapa por etapa</h2><p>El orden importa: cada etapa se apoya en la anterior.</p></div>
        <div id="route">{stageList('ROUTE')}</div>
      </section>
      <NetworkMap />
      <section>
        <div className="sec-head"><h2>Temario que dejó el ATP</h2><p>Los diez temas a estudiar después de la revisión del ATP, con lo que se dijo de cada uno en la sesión.</p></div>
        <div id="atp">{stageList('ATP')}</div>
      </section>
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
      <div className="foot">
        <span>Tu avance se guarda en el servidor.</span>
        <button id="reset" type="button" hidden={confirmReset} disabled={disabled} onClick={() => setConfirmReset(true)}>Borrar avance</button>
        <button id="reset-yes" type="button" hidden={!confirmReset} disabled={disabled} onClick={resetProgress}>Sí, borrar todo</button>
        <button id="reset-no" type="button" hidden={!confirmReset} disabled={disabled} onClick={() => setConfirmReset(false)}>Cancelar</button>
      </div>
    </div>
  </>;
}
