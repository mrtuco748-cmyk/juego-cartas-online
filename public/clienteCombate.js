let partidaActualId = null;
let miPJ = null;
let rivalPJ = null;
let esMiTurno = false;
let accionesRestantes = 0;
let misSkills = [];
let misPasivas = [];
let misRecetas = [];
let cartaSeleccionada = null;
let inventarioVisible = false;
let modoAccion = null;

const PASIVAS_POR_CLASE = {
  Chaman: { nombre: 'Espiritu Natural', desc: 'Recupera 2 HP por turno.', icono: '' },
  Sacerdote: { nombre: 'Fe Inquebrantable', desc: 'Las curaciones tienen +20% efecto.', icono: '' },
  Druida: { nombre: 'Piel de Corteza', desc: '+2 resistencia permanente.', icono: '' },
  Guerrero: { nombre: 'Corazon de Hierro', desc: 'Recibe 10% menos dano.', icono: '' },
  Paladin: { nombre: 'Escudo Sagrado', desc: '+3 resistencia contra magia.', icono: '' },
  Berserker: { nombre: 'Furia de Batalla', desc: '+2 fuerza por cada 10% HP perdido.', icono: '' },
  Acorazado: { nombre: 'Muro Viviente', desc: 'Los parrys tienen +3 de valor.', icono: '' },
  Ogro: { nombre: 'Golpe Brutal', desc: 'Los ataques ignoran 2 de resistencia.', icono: '' },
  Golem: { nombre: 'Petreo', desc: 'Reduce todo dano en 2.', icono: '' },
  Picaro: { nombre: 'Sombra Esquiva', desc: '+3 velocidad al esquivar.', icono: '' },
  Ninja: { nombre: 'Sigilo', desc: 'Primer ataque cada combate es critico.', icono: '' },
  Cazador: { nombre: 'Ojo de Aguila', desc: '+10% probabilidad de critico.', icono: '' },
  Mago: { nombre: 'Sabiduria Arcana', desc: 'Los hechizos cuestan 1 menos de energia.', icono: '' },
  MagoMaestro: { nombre: 'Concentracion', desc: 'Recupera 3 energia por turno.', icono: '' },
  MagoGuerrero: { nombre: 'Canalizacion Marcial', desc: 'Los ataques fisicos gastan 50% energia.', icono: '' },
  SemiDios: { nombre: 'Aura Divina', desc: '+1 a todas las stats.', icono: '' },
  Demonio: { nombre: 'Presencia Infernal', desc: 'El rival pierde 1 energia por turno.', icono: '' },
  Titan: { nombre: 'Coloso', desc: '+5 HP maximo.', icono: '' }
};

function obtenerPasiva(clase) {
  return PASIVAS_POR_CLASE[clase] || { nombre: 'Instinto', desc: '+1 resistencia en apuros.', icono: '' };
}

socket.on('rivalEncontrado', (data) => {
  partidaActualId = data.partidaId;
  miPJ = data.yo;
  rivalPJ = data.rival;
  esMiTurno = data.esmiTurno;
  accionesRestantes = data.accionesRestantes || 0;
  misSkills = data.skills || [];
  misPasivas = data.pasivas || [];
  misRecetas = data.recetas || [];
  cartaSeleccionada = null;

  mostrarPantallaCombate();
  renderizarCombate();
});

function mostrarPantallaCombate() {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById('pantallaCombate').classList.add('activa');
}

function renderizarCombate() {
  const pasiva = obtenerPasiva(miPJ.clase);
  const rivalHPct = Math.max(0, Math.round((rivalPJ.hp || 0) / (rivalPJ.maxHp || 40) * 100));
  const miHPct = Math.max(0, Math.round((miPJ.hp || 0) / (miPJ.maxHp || 40) * 100));
  const rivalEnPct = Math.max(0, Math.round((rivalPJ.energia || 0) / 100 * 100));
  const miEnPct = Math.max(0, Math.round((miPJ.energia || 0) / 100 * 100));

  const statusBadge = (pj) => {
    if (!pj.status) return '';
    const parts = [];
    if (pj.status.frozen && pj.status.frozen > 0) parts.push(`[CONGELADO ${pj.status.frozen}t]`);
    if (pj.status.silenced && pj.status.silenced > 0) parts.push(`[SILENCIADO ${pj.status.silenced}t]`);
    if (pj.status.shield && pj.status.shield > 0) parts.push(`[ESCUDO ${pj.status.shield}]`);
    if (pj.status.inmune) parts.push(`[INMUNE]`);
    return parts.length ? `<div class="sheet-status">${parts.join(' ')}</div>` : '';
  };

  const totalCards = misSkills.length;
  const angleStep = totalCards > 1 ? Math.min(10, 50 / totalCards) : 0;
  const startAngle = -((totalCards - 1) * angleStep) / 2;

  document.getElementById('pantallaCombate').innerHTML = `
    <div class="topbar">
      <div class="orb"></div>
    </div>

    <div class="battlefield">
      <div class="enemy-character">${rivalPJ.foto ? `<img src="${rivalPJ.foto}">` : '?'}</div>

      <div class="log-scroll" id="logBatalla">
        <h2>REGISTRO DE COMBATE</h2>
      </div>

      <div class="turn-message" id="indicadorTurno">
        ${esMiTurno ? `TU TURNO (${accionesRestantes}/2)` : 'RIVAL'}
      </div>

      <div class="player-character">${miPJ.foto ? `<img src="${miPJ.foto}">` : '?'}</div>

      <div class="sheet enemy-sheet">
        ${statusBadge(rivalPJ)}
        <h2>${rivalPJ.nombre}</h2>
        <h4>${rivalPJ.clase} · Nv.${rivalPJ.nivel || 1}</h4>
        <div class="bar"><div class="hp-fill" id="rivalHPFill" style="width:${rivalHPct}%"></div></div>
        <div style="font-size:11px;display:flex;justify-content:space-between;margin-bottom:4px;"><span>HP <span id="rivalHP">${rivalPJ.hp || 0}</span>/${rivalPJ.maxHp || 40}</span><span>EN ${rivalPJ.energia || 0}/100</span></div>
        <div class="bar"><div class="energy-fill" style="width:${rivalEnPct}%"></div></div>
        <div class="stats-grid">
          <div>F ${rivalPJ.fuerza}</div><div>R ${rivalPJ.resistencia}</div>
          <div>V ${rivalPJ.velocidad}</div><div>M ${rivalPJ.magia}</div>
          <div>S ${rivalPJ.suerte}</div>
        </div>
      </div>

      <div class="sheet player-sheet">
        ${statusBadge(miPJ)}
        <h2>${miPJ.nombre}</h2>
        <h4>${miPJ.clase} · Nv.${miPJ.nivel || 1}</h4>
        <div class="bar"><div class="hp-fill" id="pjHPFill" style="width:${miHPct}%"></div></div>
        <div style="font-size:11px;display:flex;justify-content:space-between;margin-bottom:4px;"><span>HP <span id="pjHP">${miPJ.hp || 0}</span>/${miPJ.maxHp || 40}</span><span>EN <span id="pjEnergia">${miPJ.energia || 0}</span>/100</span></div>
        <div class="bar"><div class="energy-fill" style="width:${miEnPct}%"></div></div>
        <div class="stats-grid">
          <div>F ${miPJ.fuerza}</div><div>R ${miPJ.resistencia}</div>
          <div>V ${miPJ.velocidad}</div><div>M ${miPJ.magia}</div>
          <div>S ${miPJ.suerte}</div>
        </div>
      </div>

      <div class="active-cards" id="cartasSkill">
        ${misSkills.map((skill, i) => {
          const angle = startAngle + i * angleStep;
          const ty = Math.abs(angle) * 1.3;
          const zIdx = totalCards === 1 ? 5 : totalCards - Math.abs(i - Math.floor((totalCards - 1) / 2));
          const cls = (skill.coste > (miPJ.energia || 0) ? 'disabled ' : '') + (cartaSeleccionada === i ? 'selected' : '');
          return `<div class="slot-card ${cls}" style="transform:rotate(${angle}deg) translateY(${ty}px);z-index:${zIdx}" onclick="seleccionarCarta(${i})" id="skillCard-${i}">
            <div class="card-name">${skill.nombre}</div>
            <div class="card-desc">${SKILL_DATA_LOOKUP[skill.id] ? SKILL_DATA_LOOKUP[skill.id].efecto.replace(/_/g,' ') : ''}</div>
            <div class="card-cost">${skill.coste} EN</div>
          </div>`;
        }).join('')}
      </div>

      <button class="btn-inventory" onclick="toggleInventario()">INVENTARIO</button>

      <div class="actions">
        <button class="btn-atk" onclick="enviarAccion('atacar')">ATACAR</button>
        <button class="btn-rest" onclick="enviarAccion('descansar')">DESCANSAR</button>
        <button class="btn-pose" onclick="enviarAccion('pose')">POSE</button>
        <button class="btn-extra" onclick="mostrarAccionesExtra()">EXTRA</button>
      </div>
    </div>

    <div id="cartaSeleccionInfo" style="display:none;position:fixed;bottom:200px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.85);border:2px solid #8b6430;border-radius:10px;padding:8px 16px;color:#f3ca6b;font-weight:bold;z-index:50;white-space:nowrap;">
      <span id="cartaSeleccionadaNombre">—</span>
      <button onclick="usarCartaSeleccionada()" style="margin-left:10px;padding:6px 16px;border:none;border-radius:6px;background:#ff2859;color:white;font-weight:bold;cursor:pointer;">USAR</button>
      <button onclick="cancelarSeleccionCarta()" style="margin-left:6px;padding:6px 12px;border:none;border-radius:6px;background:#555;color:white;cursor:pointer;">X</button>
    </div>

    <div id="panelInventario" style="display:none;position:fixed;top:80px;right:20px;width:220px;background:#1a1a1a;border:2px solid #8b6430;border-radius:10px;padding:10px;z-index:30;max-height:200px;overflow-y:auto;"></div>
    <div id="panelAccionesExtra" style="display:none;position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:#1a1a1a;border:2px solid #8b6430;border-radius:10px;padding:10px;z-index:30;max-height:180px;overflow-y:auto;min-width:280px;"></div>

    <div class="radial-overlay" id="radialOverlay">
      <div class="radial-container">
        <button class="central-btn" onclick="cerrarRadial()">CERRAR</button>
        <button class="radial-btn" id="btnAtakar" onclick="enviarAccion('atacar');cerrarRadial()">ATACAR</button>
        <button class="radial-btn" id="btnDescansar" onclick="enviarAccion('descansar');cerrarRadial()">DESCANSAR</button>
        <button class="radial-btn" id="btnPose" onclick="enviarAccion('pose');cerrarRadial()">POSE</button>
        <button class="radial-btn" id="btnCarta" onclick="usarCartaSeleccionada();cerrarRadial()">CARTA</button>
        <button class="radial-btn" id="btnExtra2" onclick="cerrarRadial();mostrarAccionesExtra()">EXTRA</button>
      </div>
    </div>
  `;

  actualizarIndicadorTurno();
}

function abrirRadial() {
  if (!esMiTurno || accionesRestantes <= 0) return;
  document.getElementById('radialOverlay').classList.add('active');
}
function cerrarRadial() {
  document.getElementById('radialOverlay').classList.remove('active');
}

function mostrarAccionesExtra() {
  const panel = document.getElementById('panelAccionesExtra');
  if (!panel) return;
  const acciones = [
    { id: 'investigar', label: 'Investigar', desc: 'Buscar objetos' },
    { id: 'crear', label: 'Crear', desc: 'Fabricar con materiales' },
    { id: 'negociar', label: 'Negociar', desc: 'Intercambiar objetos' },
    { id: 'robar', label: 'Robar', desc: 'Robar al rival' },
    { id: 'lanzar', label: 'Lanzar', desc: 'Tirar un objeto' },
    { id: 'reforzar', label: 'Reforzar', desc: 'Mejorar arma equipada' },
    { id: 'recibir', label: 'Recibir', desc: 'Atrapar objeto' },
    { id: 'desviar', label: 'Desviar', desc: 'Redirigir objeto' }
  ];
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="text-align:center;font-weight:bold;margin-bottom:8px;color:#ffd86b;">ACCIONES AVANZADAS</div>
    <div class="actions-extra-grid">
      ${acciones.map(a => `
        <button onclick="ejecutarAccionExtra('${a.id}')">${a.label}</button>
      `).join('')}
    </div>
    <button onclick="document.getElementById('panelAccionesExtra').style.display='none'" style="display:block;margin:8px auto 0;padding:6px 20px;border:none;border-radius:6px;background:#555;color:white;font-weight:bold;cursor:pointer;">CERRAR</button>
  `;
}

function ejecutarAccionExtra(tipo) {
  document.getElementById('panelAccionesExtra').style.display = 'none';
  if (!esMiTurno || accionesRestantes <= 0) return;

  switch (tipo) {
    case 'investigar':
      enviarAccion('investigar');
      break;
    case 'crear':
      mostrarMenuCreacion();
      break;
    case 'negociar':
      mostrarMenuNegociacion();
      break;
    case 'robar':
      enviarAccion('robar');
      break;
    case 'lanzar':
      mostrarMenuLanzar();
      break;
    case 'reforzar':
      enviarAccion('reforzar');
      break;
    case 'recibir':
      if (miPJ.objetosRecibidos && miPJ.objetosRecibidos.length > 0) {
        const dif = Math.floor(Math.random() * 6) + 3;
        enviarAccion('recibir', null, { dificultad: dif });
      } else enviarAccion('recibir');
      break;
    case 'desviar':
      if (miPJ.objetosRecibidos && miPJ.objetosRecibidos.length > 0) {
        const dif2 = Math.floor(Math.random() * 6) + 3;
        enviarAccion('desviar', null, { dificultad: dif2, redirigirA: 'rival' });
      } else enviarAccion('desviar');
      break;
  }
}

function mostrarMenuCreacion() {
  if (!misRecetas || misRecetas.length === 0) {
    alert('No hay recetas disponibles');
    return;
  }
  const panel = document.getElementById('panelAccionesExtra');
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="color:#9a7040;font-size:9px;letter-spacing:2px;text-align:center;margin-bottom:6px;">CREAR OBJETO</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">
      ${misRecetas.map(r => `
        <button onclick="enviarAccion('crear', null, { receta: '${r.nombre}' })" style="font-family:'Cinzel',serif;font-size:8px;padding:4px 8px;background:rgba(0,0,0,0.4);border:1px solid #4a3010;color:#d4a060;border-radius:4px;cursor:pointer;">
          <div>${r.nombre}</div>
          <div style="font-size:6px;color:#6a4018;">${r.requiere.join(', ')}</div>
        </button>
      `).join('')}
    </div>
    <button onclick="document.getElementById('panelAccionesExtra').style.display='none'" style="display:block;margin:6px auto 0;font-family:'Cinzel',serif;font-size:8px;padding:3px 12px;background:transparent;border:1px solid #3a2008;color:#6a4018;border-radius:3px;cursor:pointer;">CERRAR</button>
  `;
}

function mostrarMenuNegociacion() {
  const inv = miPJ.inventario || [];
  const invRival = rivalPJ.inventario || [];
  if (inv.length === 0 || invRival.length === 0) { alert('Alguien no tiene objetos'); return; }
  const panel = document.getElementById('panelAccionesExtra');
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="color:#9a7040;font-size:9px;letter-spacing:2px;text-align:center;margin-bottom:6px;">NEGOCIAR</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div>
        <div style="color:#d4a060;font-size:8px;text-align:center;">TUS OBJETOS</div>
        ${inv.map((o, i) => `<div style="color:#9a7040;font-size:8px;padding:2px 4px;cursor:pointer;border:1px solid #2a1808;margin:2px;border-radius:2px;" onclick="seleccionarNegOferta(${i})" id="negOferta-${i}">${o.nombre}</div>`).join('')}
      </div>
      <div>
        <div style="color:#d4a060;font-size:8px;text-align:center;">OBJETOS RIVAL</div>
        ${invRival.map((o, i) => `<div style="color:#9a7040;font-size:8px;padding:2px 4px;cursor:pointer;border:1px solid #2a1808;margin:2px;border-radius:2px;" onclick="seleccionarNegPides(${i})" id="negPides-${i}">${o.nombre}</div>`).join('')}
      </div>
    </div>
    <div style="text-align:center;margin:6px 0;color:#6a4018;font-size:9px;" id="negStatus">Selecciona que dar y que pedir</div>
    <button onclick="confirmarNegociacion()" style="font-family:'Cinzel',serif;font-size:9px;padding:4px 16px;background:linear-gradient(180deg,#c85030,#7a2010);color:#fff;border:none;border-radius:4px;cursor:pointer;display:block;margin:0 auto;">CONFIRMAR TRUEQUE</button>
    <button onclick="document.getElementById('panelAccionesExtra').style.display='none'" style="display:block;margin:6px auto 0;font-family:'Cinzel',serif;font-size:8px;padding:3px 12px;background:transparent;border:1px solid #3a2008;color:#6a4018;border-radius:3px;cursor:pointer;">CANCELAR</button>
  `;
  window._negOferta = null;
  window._negPides = null;
}

function seleccionarNegOferta(i) {
  document.querySelectorAll('[id^="negOferta-"]').forEach(e => e.style.borderColor = '#2a1808');
  document.getElementById(`negOferta-${i}`).style.borderColor = '#c85030';
  window._negOferta = i;
  actualizarNegStatus();
}
function seleccionarNegPides(i) {
  document.querySelectorAll('[id^="negPides-"]').forEach(e => e.style.borderColor = '#2a1808');
  document.getElementById(`negPides-${i}`).style.borderColor = '#c85030';
  window._negPides = i;
  actualizarNegStatus();
}
function actualizarNegStatus() {
  const s = document.getElementById('negStatus');
  if (!s) return;
  const inv = miPJ.inventario || [];
  const invR = rivalPJ.inventario || [];
  const o = window._negOferta !== null ? inv[window._negOferta] : null;
  const p = window._negPides !== null ? invR[window._negPides] : null;
  s.textContent = o && p ? `${o.nombre} ↔ ${p.nombre}` : 'Selecciona que dar y que pedir';
  s.style.color = o && p ? '#d4a060' : '#6a4018';
}
function confirmarNegociacion() {
  const inv = miPJ.inventario || [];
  const invR = rivalPJ.inventario || [];
  const oIdx = window._negOferta;
  const pIdx = window._negPides;
  if (oIdx === null || pIdx === null || !inv[oIdx] || !invR[pIdx]) { alert('Selecciona ambos objetos'); return; }
  enviarAccion('negociar', null, { oferta: inv[oIdx]._id, pides: invR[pIdx]._id });
  document.getElementById('panelAccionesExtra').style.display = 'none';
}

function mostrarMenuLanzar() {
  const inv = miPJ.inventario || [];
  const lanzables = inv.filter(o => o.tipo === 'material' || o.tipo === 'arma');
  if (lanzables.length === 0) { alert('No tenes objetos lanzables'); return; }
  const panel = document.getElementById('panelAccionesExtra');
  panel.style.display = 'block';
  panel.innerHTML = `
    <div style="color:#9a7040;font-size:9px;letter-spacing:2px;text-align:center;margin-bottom:6px;">LANZAR OBJETO</div>
    ${lanzables.map((o, i) => {
      const realIdx = inv.indexOf(o);
      return `<button onclick="enviarAccion('lanzar', null, { objIdx: ${realIdx} });document.getElementById('panelAccionesExtra').style.display='none';" style="display:block;width:100%;text-align:left;font-family:'Cinzel',serif;font-size:9px;padding:5px 8px;background:rgba(0,0,0,0.4);border:1px solid #4a3010;color:#d4a060;border-radius:4px;cursor:pointer;margin:2px 0;">${o.nombre} (peso:${o.peso||0} filo:${o.filo||0})</button>`;
    }).join('')}
    <button onclick="document.getElementById('panelAccionesExtra').style.display='none'" style="display:block;margin:6px auto 0;font-family:'Cinzel',serif;font-size:8px;padding:3px 12px;background:transparent;border:1px solid #3a2008;color:#6a4018;border-radius:3px;cursor:pointer;">CANCELAR</button>
  `;
}

function toggleInventario() {
  inventarioVisible = !inventarioVisible;
  const panel = document.getElementById('panelInventario');
  if (!panel) return;
  if (!inventarioVisible) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  const inv = miPJ.inventario || [];
  const eq = miPJ.equipment || { arma: null, armadura: null, accesorio: null };
  panel.innerHTML = `
    <div style="color:#9a7040;font-size:9px;letter-spacing:2px;text-align:center;margin-bottom:4px;">INVENTARIO (${inv.filter(o => !o._equipado).length}/5)</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:4px;">
      <div style="font-size:8px;color:#6a4018;">Arma: ${eq.arma ? eq.arma.nombre : '—'}</div>
      <div style="font-size:8px;color:#6a4018;">Armadura: ${eq.armadura ? eq.armadura.nombre : '—'}</div>
      <div style="font-size:8px;color:#6a4018;">Accesorio: ${eq.accesorio ? eq.accesorio.nombre : '—'}</div>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">
      ${inv.map((o, i) => `
        <div style="background:rgba(0,0,0,0.4);border:1px solid #3a2008;border-radius:4px;padding:4px 6px;text-align:center;">
          <div style="color:#d4a060;font-size:9px;">${o.nombre}</div>
          <div style="font-size:7px;color:#6a4018;">${o.tipo}</div>
          <div style="display:flex;gap:2px;margin-top:2px;">
            ${(o.tipo === 'arma' || o.tipo === 'armadura' || o.tipo === 'accesorio') ? `<button onclick="enviarAccion('equipar', null, { objIdx: ${i} });toggleInventario();" style="font-size:7px;padding:1px 4px;background:rgba(0,0,0,0.3);border:1px solid #3a6a3a;color:#60d060;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;">EQUIPAR</button>` : ''}
            ${(o.tipo === 'consumible') ? `<button onclick="enviarAccion('usar_objeto', null, { objIdx: ${i} });toggleInventario();" style="font-size:7px;padding:1px 4px;background:rgba(0,0,0,0.3);border:1px solid #6a3a3a;color:#d06060;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;">USAR</button>` : ''}
            ${(o.tipo === 'material' || o.tipo === 'arma') ? `<button onclick="enviarAccion('lanzar', null, { objIdx: ${i} });toggleInventario();" style="font-size:7px;padding:1px 4px;background:rgba(0,0,0,0.3);border:1px solid #3a3a6a;color:#6060d0;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;">LANZAR</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:4px;justify-content:center;margin-top:4px;">
      ${eq.arma ? `<button onclick="enviarAccion('desequipar', null, { slot: 'arma' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Desequipar arma</button>` : ''}
      ${eq.armadura ? `<button onclick="enviarAccion('desequipar', null, { slot: 'armadura' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Desequipar armadura</button>` : ''}
      ${eq.accesorio ? `<button onclick="enviarAccion('desequipar', null, { slot: 'accesorio' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Desequipar accesorio</button>` : ''}
    </div>
    <button onclick="toggleInventario()" style="display:block;margin:6px auto 0;font-family:'Cinzel',serif;font-size:8px;padding:3px 12px;background:transparent;border:1px solid #3a2008;color:#6a4018;border-radius:3px;cursor:pointer;">CERRAR</button>
  `;
}

function seleccionarCarta(idx) {
  const skill = misSkills[idx];
  if (!skill || skill.coste > (miPJ.energia || 0)) return;
  cartaSeleccionada = idx;
  document.querySelectorAll('.carta-slot').forEach(c => c.classList.remove('selected'));
  const el = document.getElementById(`skillCard-${idx}`);
  if (el) el.classList.add('selected');
  document.getElementById('cartaSeleccionadaNombre').textContent = skill.nombre;
  document.getElementById('cartaSeleccionInfo').style.display = 'block';
}

function cancelarSeleccionCarta() {
  cartaSeleccionada = null;
  document.querySelectorAll('.carta-slot').forEach(c => c.classList.remove('selected'));
  document.getElementById('cartaSeleccionInfo').style.display = 'none';
}

function usarCartaSeleccionada() {
  if (cartaSeleccionada === null) return;
  const skill = misSkills[cartaSeleccionada];
  enviarAccion('carta', skill.id || skill.nombre);
  cancelarSeleccionCarta();
}

function enviarAccion(tipo, cartaId, accionData) {
  if (!partidaActualId) return;
  if (tipo !== 'carta' && (!esMiTurno || accionesRestantes <= 0)) return;
  socket.emit('ejecutarAccion', {
    partidaId: partidaActualId,
    tipo,
    atacante: miPJ,
    defensor: rivalPJ,
    cartaId: cartaId || null,
    accionData: accionData || null
  });
}

function actualizarIndicadorTurno() {
  const el = document.getElementById('indicadorTurno');
  if (!el) return;
  el.textContent = esMiTurno ? `TU TURNO (${accionesRestantes}/2)` : 'RIVAL';
}
function actualizarHP() {
  const el1 = document.getElementById('rivalHP'), el2 = document.getElementById('pjHP');
  const f1 = document.getElementById('rivalHPFill'), f2 = document.getElementById('pjHPFill');
  const en = document.getElementById('pjEnergia');
  if (el1) el1.textContent = rivalPJ.hp || 0;
  if (el2) el2.textContent = miPJ.hp || 0;
  if (en) en.textContent = miPJ.energia || 0;
  if (f1) f1.style.width = Math.max(0, Math.round((rivalPJ.hp || 0) / (rivalPJ.maxHp || 40) * 100)) + '%';
  if (f2) f2.style.width = Math.max(0, Math.round((miPJ.hp || 0) / (miPJ.maxHp || 40) * 100)) + '%';
}

function estiloLog(data) {
  const estilos = {
    ataque: 'color:#e89838;font-size:11px;font-weight:600;',
    curacion: 'color:#40c060;font-size:11px;',
    pose: 'color:#60a0d0;font-size:11px;',
    muerte: 'color:#ff4422;font-size:14px;font-weight:700;letter-spacing:1px;',
    marea: 'color:#a060d0;font-size:11px;',
    energia: 'color:#60d0d0;font-size:11px;',
    carta: 'color:#d4a060;font-size:11px;font-weight:600;',
    pasiva: 'color:#50c850;font-size:10px;',
    status: 'color:#a0a0d0;font-size:10px;'
  };
  return estilos[data.tipo] || 'color:#9a7040;font-size:10px;';
}

function colorearNombres(msg) {
  let s = msg;
  if (rivalPJ && rivalPJ.nombre) {
    const re = new RegExp(rivalPJ.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    s = s.replace(re, `<span style="color:#ff6040;font-weight:700;">${rivalPJ.nombre}</span>`);
  }
  if (miPJ && miPJ.nombre) {
    const re = new RegExp(miPJ.nombre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    s = s.replace(re, `<span style="color:#60a0ff;font-weight:700;">${miPJ.nombre}</span>`);
  }
  return s;
}

socket.on('logBatalla', (data) => {
  const log = document.getElementById('logBatalla');
  if (!log) return;
  const msg = typeof data === 'string' ? data : data.msg;
  const estilo = typeof data === 'string' ? 'color:#9a7040;font-size:10px;' : estiloLog(data);
  log.innerHTML += `<div style="${estilo}">> ${colorearNombres(msg)}</div>`;
  log.scrollTop = log.scrollHeight;
});

socket.on('actualizarEstado', (datos) => {
  const yoMio = datos.socketJ1 === socket.id;
  const miHP = yoMio ? datos.j1 : datos.j2;
  const rivalHP = yoMio ? datos.j2 : datos.j1;
  const miEnergia = yoMio ? datos.j1energia : datos.j2energia;
  const miStatus = yoMio ? (datos.j1status || {}) : (datos.j2status || {});
  const rivalStatus = yoMio ? (datos.j2status || {}) : (datos.j1status || {});

  miPJ.hp = miHP;
  rivalPJ.hp = rivalHP;
  miPJ.status = miStatus;
  rivalPJ.status = rivalStatus;
  accionesRestantes = datos.accionesRestantes || 0;
  esMiTurno = datos.turnoActual === socket.id;

  if (datos.j1skills) misSkills = yoMio ? datos.j1skills : datos.j2skills;
  if (datos.pasivasJ1) misPasivas = yoMio ? datos.pasivasJ1 : datos.pasivasJ2;
  if (datos.inventarioJ1) miPJ.inventario = yoMio ? datos.inventarioJ1 : datos.inventarioJ2;
  if (datos.equipmentJ1) miPJ.equipment = yoMio ? datos.equipmentJ1 : datos.equipmentJ2;
  miPJ.objetosRecibidos = yoMio ? (datos.objetosRecibidosJ1 || []) : (datos.objetosRecibidosJ2 || []);
  rivalPJ.objetosRecibidos = yoMio ? (datos.objetosRecibidosJ2 || []) : (datos.objetosRecibidosJ1 || []);

  actualizarHP();
  actualizarCardsSkills();
  actualizarIndicadorTurno();
});

function actualizarCardsSkills() {
  const container = document.getElementById('cartasSkill');
  if (!container) return;
  const total = misSkills.length;
  const angleStep = total > 1 ? Math.min(10, 50 / total) : 0;
  const startAngle = -((total - 1) * angleStep) / 2;
  container.innerHTML = misSkills.map((skill, i) => {
    const angle = startAngle + i * angleStep;
    const ty = Math.abs(angle) * 1.3;
    const zIdx = total === 1 ? 5 : total - Math.abs(i - Math.floor((total - 1) / 2));
    const cls = (skill.coste > (miPJ.energia || 0) ? 'disabled ' : '') + (cartaSeleccionada === i ? 'selected' : '');
    return `<div class="slot-card ${cls}" style="transform:rotate(${angle}deg) translateY(${ty}px);z-index:${zIdx}" onclick="seleccionarCarta(${i})" id="skillCard-${i}">
      <div class="card-name">${skill.nombre}</div>
      <div class="card-desc">${SKILL_DATA_LOOKUP[skill.id] ? SKILL_DATA_LOOKUP[skill.id].efecto.replace(/_/g,' ') : ''}</div>
      <div class="card-cost">${skill.coste} EN</div>
    </div>`;
  }).join('');
}

socket.on('finPartida', (datos) => {
  const gane = datos.ganador === socket.id;
  const log = document.getElementById('logBatalla');
  if (log) {
    log.innerHTML += `<div style="color:${gane ? '#60d060' : '#c85030'};font-size:13px;text-align:center;margin-top:10px;letter-spacing:2px;">${gane ? 'VICTORIA!' : 'DERROTA'}</div>`;
    log.scrollTop = log.scrollHeight;
  }
  esMiTurno = false;
  accionesRestantes = 0;
  cartaSeleccionada = null;
  actualizarIndicadorTurno();
  mostrarPantallaFinPartida(gane);
});

function mostrarPantallaFinPartida(gane) {
  const existing = document.getElementById('finPartidaOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'finPartidaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);';
  overlay.innerHTML = `
    <div style="width:300px;padding:30px 20px;background:radial-gradient(ellipse at center top,#1a0e08 0%,#0a0604 100%);border:3px solid ${gane ? '#c85030' : '#4a3010'};border-radius:8px;text-align:center;">
      <div style="font-size:22px;letter-spacing:4px;color:${gane ? '#60d060' : '#c85030'};margin-bottom:6px;font-family:'Cinzel',serif;font-weight:700;">${gane ? 'VICTORIA' : 'DERROTA'}</div>
      <div style="color:#6a4018;font-size:10px;letter-spacing:2px;margin-bottom:20px;">${gane ? '+1 XP' : '+0.5 XP'}</div>
      <button onclick="volverAlMenuDesdeCombate()" style="font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:3px;color:#fffbe8;cursor:pointer;border:none;padding:11px 30px;background:linear-gradient(180deg,#c85030 0%,#7a2010 40%,#8a2515 60%,#c04020 100%);clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%);">VOLVER AL MENU</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function volverAlMenuDesdeCombate() {
  const overlay = document.getElementById('finPartidaOverlay');
  if (overlay) overlay.remove();
  partidaActualId = null;
  cartaSeleccionada = null;
  mostrarPantalla('menu');
  mostrarSeccionMenu('pantallaMenu');
}
