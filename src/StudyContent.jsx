export function Header() { return (<header className="band">
  <div className="band-in">
    <div className="eyebrow">Plan de capacitación</div>
    <h1>Ruta de estudio Core Mobility</h1>
    <p className="lede">Temas a dominar según la sesión de recomendaciones y la revisión del ATP de los CMM Nokia, en el orden sugerido.</p>
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
      <p>No depender del nombre del equipo para entender qué está pasando. De cualquier cosa que veas en una traza o alarma, reconstruir esta cadena:</p>
    </div>
    <div className="chain"><b>mensaje</b> → <b>protocolo</b> → <b>interfaz</b> → <b>elementos</b> → <b>procedimiento</b></div>
  </section>); }

export function NetworkMap() { return (  <section>
    <div className="sec-head">
      <h2>Mapa mental del CMM</h2>
      <p>El CMM de Nokia cumple funciones de MME. El ATP busca demostrar que todas estas interacciones siguen funcionando cuando entra a la arquitectura.</p>
    </div>
    <div className="map"><pre>{"                          HSS\n                           │ S6a\nUE ── eNodeB ── S1-MME ── CMM/MME ── S11 ── SGW / PGW\n        │                  │\n        │ X2               ├── S10 ── otro MME / CMM\n        │                  ├── SGs ── MSC Server\n     eNodeB                └── Gn  ── SGSN ── 3G"}</pre></div>
    <div className="around">
      <span>IMS / VoLTE</span><span>DNS</span><span>DRA / Diameter</span><span>Mediation / Charging</span><span>RAN</span><span>OAM</span><span>Lawful Interception</span><span>5G NSA</span>
    </div>
  </section>); }

export function Reflexes() { return (  <section>
    <div className="sec-head">
      <h2>Reflejos</h2>
      <p>Lee lo que aparece, piensa la respuesta y luego ábrelo para comprobar.</p>
    </div>
    <div className="reflex">
      <details><summary>S6a — Update Location</summary><p>LTE → MME ↔ HSS → Diameter</p><p>Procedimiento de registro o movilidad del suscriptor.</p></details>
      <details><summary>Iu Link Connection Fault</summary><p>3G → RNC ↔ Core</p><p>El problema está del lado UMTS, entre el controlador de radio y el core.</p></details>
      <details><summary>S1 Link…</summary><p>LTE → eNodeB ↔ EPC</p><p>S1-MME si es control (hacia el MME), S1-U si es user plane (hacia el SGW).</p></details>
      <details><summary>Create Session</summary><p>GTP-C → S11 → MME ↔ SGW</p><p>Creación de la sesión y los bearers, parte del Attach.</p></details>
      <details><summary>Gb</summary><p>2G → BSC ↔ SGSN</p><p>Acceso de paquetes de 2G hacia el core.</p></details>
    </div>
  </section>); }