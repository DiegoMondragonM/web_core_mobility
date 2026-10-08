export default function Stage({ stage, disabled, onToggle }) {
  return <div className="stage">
    <div className="stage-head">
      {stage.grupo === 'ROUTE' && stage.orden < 999 && <span className="stage-num">{String(stage.orden).padStart(2, '0')}</span>}
      <h3>{stage.etapa}</h3>
      <span className="stage-count">{stage.items.filter(item => item.hecho).length}/{stage.items.length}</span>
    </div>
    {stage.nota && <p className="stage-note">{stage.nota}</p>}
    <ul className="items">
      {stage.items.map(tema => <li key={tema.id} className={tema.hecho ? 'checked' : ''}>
        <label>
          <input type="checkbox" id={tema.id} checked={tema.hecho} disabled={disabled}
            onChange={event => onToggle(tema.id, event.target.checked)} />
          <span className="item-text">
            <span className={`item-title${tema.mono ? ' mono' : ''}`}>{tema.titulo}</span>
            {tema.descripcion && <span className="item-desc">{tema.descripcion}</span>}
          </span>
        </label>
      </li>)}
    </ul>
  </div>;
}
