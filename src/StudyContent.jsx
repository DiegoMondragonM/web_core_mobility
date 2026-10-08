export function Header() { return (<header className="band">
  <div className="band-in">
    <h1>Ruta de estudio Core Mobility</h1>
    <dl className="meta">
      <div><dt>Área</dt><dd>Core Mobility</dd></div>
      <div><dt>Alcance</dt><dd>LTE/EPC · 3G · 5G NSA</dd></div>
      <div><dt>Actualizado</dt><dd>7 de octubre de 2026</dd></div>
    </dl>
  </div>
</header>); }
export function StudyGoal() { return (  <section>
    <div className="sec-head">
      <h2>La habilidad a desarrollar</h2>
    </div>
    <div className="chain"><b>mensaje</b> → <b>protocolo</b> → <b>interfaz</b> → <b>elementos</b> → <b>procedimiento</b></div>
  </section>); }

export function NetworkMap() { return (  <section>
    <div className="sec-head">
      <h2>Mapa mental del CMM</h2>
    </div>
    <div className="map"><pre>{"                          HSS\n                           │ S6a\nUE ── eNodeB ── S1-MME ── CMM/MME ── S11 ── SGW / PGW\n        │                  │\n        │ X2               ├── S10 ── otro MME / CMM\n        │                  ├── SGs ── MSC Server\n     eNodeB                └── Gn  ── SGSN ── 3G"}</pre></div>
    <div className="around">
      <span>IMS / VoLTE</span><span>DNS</span><span>DRA / Diameter</span><span>Mediation / Charging</span><span>RAN</span><span>OAM</span><span>Lawful Interception</span><span>5G NSA</span>
    </div>
  </section>); }

export function Reflexes() { return (  <section>
    <div className="sec-head">
      <h2>Reflejos</h2>
    </div>
    <div className="reflex">
      <div className="reflex-card">S6a — Update Location</div>
      <div className="reflex-card">Iu Link Connection Fault</div>
      <div className="reflex-card">S1 Link…</div>
      <div className="reflex-card">Create Session</div>
      <div className="reflex-card">Gb</div>
    </div>
  </section>); }