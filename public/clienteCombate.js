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
let draggedCardIdx = null;
let touchClone = null;
let esPractica = false;
let rivalSkills = [];
let rivalPasivas = [];

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
  esPractica = data.esPractica || false;
  rivalSkills = data.skillsRival || [];
  rivalPasivas = data.pasivasRival || [];

  mostrarPantallaCombate();
  renderizarCombate();
});

function mostrarPantallaCombate() {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById('pantallaCombate').classList.add('activa');
}

const CLASS_MODS = {
  Chaman: { fuerza: 2, resistencia: 2, velocidad: 4, magia: 3, suerte: 0 },
  Sacerdote: { fuerza: 1, resistencia: 3, velocidad: 0, magia: 5, suerte: 0 },
  Druida: { fuerza: 3, resistencia: 2, velocidad: 1, magia: 4, suerte: 0 },
  Guerrero: { fuerza: 4, resistencia: 3, velocidad: 3, magia: -3, suerte: 0 },
  Paladin: { fuerza: 4, resistencia: 5, velocidad: 1, magia: -3, suerte: 0 },
  Berserker: { fuerza: 5, resistencia: 5, velocidad: -5, magia: -6, suerte: 0 },
  Acorazado: { fuerza: -1, resistencia: 10, velocidad: -5, magia: 0, suerte: 0 },
  Ogro: { fuerza: 3, resistencia: 6, velocidad: 1, magia: -7, suerte: 0 },
  Golem: { fuerza: 2, resistencia: 7, velocidad: -3, magia: -4, suerte: 0 },
  Picaro: { fuerza: -2, resistencia: 3, velocidad: 6, magia: -2, suerte: 5 },
  Ninja: { fuerza: -4, resistencia: -1, velocidad: 8, magia: -5, suerte: 2 },
  Cazador: { fuerza: -3, resistencia: 2, velocidad: 7, magia: 0, suerte: 0 },
  Mago: { fuerza: 0, resistencia: 0, velocidad: 4, magia: 5, suerte: 0 },
  MagoMaestro: { fuerza: -3, resistencia: -3, velocidad: -3, magia: 10, suerte: 0 },
  MagoGuerrero: { fuerza: 3, resistencia: 3, velocidad: -3, magia: 5, suerte: 0 },
  SemiDios: { fuerza: 5, resistencia: 2, velocidad: 2, magia: 2, suerte: 2 },
  Demonio: { fuerza: 3, resistencia: 3, velocidad: 3, magia: 3, suerte: 3 },
  Titan: { fuerza: 4, resistencia: 3, velocidad: 0, magia: 3, suerte: 0 }
};

function calcularStatsConBuffsCliente(pj) {
  const STATS = ['fuerza','resistencia','velocidad','magia','suerte'];
  const permanent = {}, buffMod = {}, total = {};
  for (const s of STATS) {
    const serverStat = pj[s] || 0;
    let eMod = 0;
    if (pj.equipment) {
      for (const eq of Object.values(pj.equipment)) {
        if (!eq) continue;
        if (eq.stat === s) eMod += eq.valor || 0;
        if (eq.stats && typeof eq.stats[s] === 'number') eMod += eq.stats[s];
        if (eq.penalidad && typeof eq.penalidad[s] === 'number') eMod += eq.penalidad[s];
      }
    }
    let bMod = 0;
    if (pj.status) {
      if (pj.status.buffs && pj.status.buffs[s]) bMod += pj.status.buffs[s].valor;
      if (pj.status.debuffs && pj.status.debuffs[s]) bMod -= pj.status.debuffs[s].valor;
    }
    permanent[s] = serverStat + eMod;
    buffMod[s] = bMod;
    total[s] = serverStat + eMod + bMod;
  }
  return { total, permanent, buffMod };
}

let prevMiHP, prevRivalHP;

function renderizarCombate() {
  const rivalHPct = Math.max(0, Math.round((rivalPJ.hp || 0) / (rivalPJ.maxHp || 40) * 100));
  const miHPct = Math.max(0, Math.round((miPJ.hp || 0) / (miPJ.maxHp || 40) * 100));
  const rivalEnPct = Math.max(0, Math.round((rivalPJ.energia || 0) / 100 * 100));
  const miEnPct = Math.max(0, Math.round((miPJ.energia || 0) / 100 * 100));
  prevMiHP = miPJ.hp || 0;
  prevRivalHP = rivalPJ.hp || 0;

  const statusBadge = (pj) => {
    const parts = [];
    if (pj.status) {
      if (pj.status.frozen && pj.status.frozen > 0) parts.push(`[CONGELADO ${pj.status.frozen}t]`);
      if (pj.status.silenced && pj.status.silenced > 0) parts.push(`[SILENCIADO ${pj.status.silenced}t]`);
      if (pj.status.shield && pj.status.shield > 0) parts.push(`[ESCUDO ${pj.status.shield}]`);
      if (pj.status.inmune) parts.push(`[INMUNE]`);
    }
    return `<div class="sheet-status">${parts.join(' ')}</div>`;
  };

  const statLine = (label, stat, c) => {
    const base = c.permanent[stat];
    const b = c.buffMod[stat];
    if (b > 0) return `<div>${label} ${base} <span class="mod-pos">+${b}</span></div>`;
    if (b < 0) return `<div>${label} ${base} <span class="mod-neg">${b}</span></div>`;
    return `<div>${label} ${base}</div>`;
  };

  const sheetHTML = (pj, prefix) => {
    const c = calcularStatsConBuffsCliente(pj);
    return `<div class="character-bio">
      <div class="sheet">
        ${statusBadge(pj)}
        <h2>${pj.nombre}</h2>
        <h4>${pj.clase} · Nv.${pj.nivel || 1}</h4>
        <div class="bar"><div class="hp-fill" id="${prefix}HPFill" style="width:${prefix === 'pj' ? miHPct : rivalHPct}%"></div></div>
        <div class="hp-energy-text">
          <span>HP <span id="${prefix}HP">${pj.hp || 0}</span>/${pj.maxHp || 40}</span>
          <span><span class="e-color">E</span> <span id="${prefix}Energia">${pj.energia || 0}</span>/100</span>
        </div>
        <div class="bar"><div class="energy-fill" id="${prefix}EnergyFill" style="width:${prefix === 'pj' ? miEnPct : rivalEnPct}%"></div></div>
        <div class="stats-grid">
          ${statLine('F', 'fuerza', c)}
          ${statLine('R', 'resistencia', c)}
          ${statLine('V', 'velocidad', c)}
          ${statLine('M', 'magia', c)}
          ${statLine('S', 'suerte', c)}
        </div>
      </div>
    </div>`;
  };

  const totalCards = misSkills.length;
  const angleStep = totalCards > 1 ? Math.min(8, 40 / totalCards) : 0;
  const startAngle = -((totalCards - 1) * angleStep) / 2;

  const combateEl = document.getElementById('pantallaCombate');
  const bgSaved = localStorage.getItem('loop_fondo_combate');
  combateEl.style.background = bgSaved ? `radial-gradient(ellipse at 50% 30%, rgba(26,18,16,0.7) 0%, rgba(8,6,6,0.85) 100%), url("${bgSaved}") center/cover no-repeat` : '';
  combateEl.innerHTML = `
    <div class="topbar">
      <div class="orb"></div>
    </div>

    <div class="battlefield">
      <div class="col-left">
        <div class="player-character">${miPJ.foto ? `<img src="${miPJ.foto}">` : '?'}</div>
        ${sheetHTML(miPJ, 'pj')}
      </div>

      <div class="col-mid">
        <div class="log-scroll" ondragover="onLogDragOver(event)" ondrop="onLogDrop(event)">
          <h2>REGISTRO DE COMBATE</h2>
          <div id="logBatch"></div>
        </div>
        <div class="turn-message" id="indicadorTurno">
          ${esMiTurno ? `TU TURNO (${accionesRestantes}/2)` : 'RIVAL'}
        </div>
      </div>

      <div class="col-right">
        <div class="enemy-character">${rivalPJ.foto ? `<img src="${rivalPJ.foto}">` : '?'}</div>
        ${sheetHTML(rivalPJ, 'rival')}
      </div>

      <div class="cards-row${esPractica ? ' stacked' : ''}">
        <div class="cards-stack">
          <div class="cards-stack-item">
            ${esPractica ? `<div class="cards-label ${esMiTurno ? 'active-turn' : ''}">TUS CARTAS</div>` : ''}
            <div class="active-cards" id="cartasSkill">
              ${misSkills.map((skill, i) => {
                const angle = startAngle + i * angleStep;
                const ty = Math.abs(angle) * 1.3;
                const zIdx = totalCards === 1 ? 5 : totalCards - Math.abs(i - Math.floor((totalCards - 1) / 2));
                const cls = (skill.coste > (miPJ.energia || 0) ? 'disabled ' : '') + (cartaSeleccionada === i ? 'selected' : '');
                const skillData = SKILL_DATA_LOOKUP[skill.id];
                return `<div class="slot-card ${cls}" style="transform:rotate(${angle}deg) translateY(${ty}px);z-index:${zIdx}" draggable="true"
                  ondragstart="onCardDragStart(event, ${i})"
                  ontouchstart="onCardTouchStart(event, ${i})"
                  ontouchmove="onCardTouchMove(event)"
                  ontouchend="onCardTouchEnd(event)"
                  onclick="seleccionarCarta(${i})" id="skillCard-${i}">
                  <div class="card-name">${skill.nombre}</div>
                  <div class="card-desc">${skillData ? describirEfecto(skillData) : ''}</div>
                  <div class="card-cost">${skill.coste} <span class="e-color">E</span></div>
                </div>`;
              }).join('')}
            </div>
          </div>
          ${esPractica ? `
          <div class="cards-stack-item">
            <div class="cards-label ${!esMiTurno ? 'active-turn' : ''}">CARTAS DEL ${rivalPJ.nombre}</div>
            <div class="active-cards" id="cartasSkillRival">
              ${rivalSkills.map((skill, i) => {
                const totalR = rivalSkills.length;
                const stepR = totalR > 1 ? Math.min(8, 40 / totalR) : 0;
                const startR = -((totalR - 1) * stepR) / 2;
                const angle = startR + i * stepR;
                const ty = Math.abs(angle) * 1.3;
                const zIdx = totalR === 1 ? 5 : totalR - Math.abs(i - Math.floor((totalR - 1) / 2));
                const costOk = skill.coste <= (rivalPJ.energia || 0);
                const skillData = SKILL_DATA_LOOKUP[skill.id];
                return `<div class="slot-card ${costOk ? '' : 'disabled'}" style="transform:rotate(${angle}deg) translateY(${ty}px);z-index:${zIdx}"
                  onclick="${!esMiTurno && costOk ? `usarCartaRival(${i})` : ''}" id="skillCardRival-${i}">
                  <div class="card-name">${skill.nombre}</div>
                  <div class="card-desc">${skillData ? describirEfecto(skillData) : ''}</div>
                  <div class="card-cost">${skill.coste} <span class="e-color">E</span></div>
                </div>`;
              }).join('')}
            </div>
          </div>` : ''}
        </div>
      </div>

      <div class="actions-row">
        <button class="btn-inventory" onclick="toggleInventario()">INVENTARIO</button>
        <div class="actions">
          <button class="btn-atk" onclick="enviarAccion('atacar')">ATACAR</button>
          <button class="btn-rest" onclick="enviarAccion('descansar')">DESCANSAR</button>
          <button class="btn-pose" onclick="enviarAccion('pose')">POSE</button>
          <button class="btn-extra" onclick="mostrarAccionesExtra()">EXTRA</button>
        </div>
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
  const rivalExtra = esPractica && !esMiTurno;
  if (!rivalExtra && (!esMiTurno || accionesRestantes <= 0)) return;
  if (rivalExtra && accionesRestantes <= 0) return;

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
  const eq = miPJ.equipment || { mano1: null, mano2: null, armadura: null, accesorio: null };
  const equipoTexto = `M1:${eq.mano1 ? eq.mano1.nombre : '—'} M2:${eq.mano2 ? (eq.mano2 === eq.mano1 ? '(2M)' : eq.mano2.nombre) : '—'} Arm:${eq.armadura ? eq.armadura.nombre : '—'} Acc:${eq.accesorio ? eq.accesorio.nombre : '—'}`;
  panel.innerHTML = `
    <div style="color:#9a7040;font-size:9px;letter-spacing:2px;text-align:center;margin-bottom:4px;">INVENTARIO (${inv.filter(o => !o._equipado).length}/5)</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:4px;font-size:8px;color:#6a4018;">
      ${equipoTexto}
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">
      ${inv.map((o, i) => `
        <div style="background:rgba(0,0,0,0.4);border:1px solid #3a2008;border-radius:4px;padding:4px 6px;text-align:center;">
          <div style="color:#d4a060;font-size:9px;">${o.nombre}</div>
          <div style="font-size:7px;color:#6a4018;">${o.tipo}${o.manos ? ' ('+o.manos+'M)' : ''}</div>
          <div style="display:flex;gap:2px;margin-top:2px;">
            ${(o.tipo === 'arma' || o.tipo === 'armadura' || o.tipo === 'accesorio') ? `<button onclick="enviarAccion('equipar', null, { objIdx: ${i} });toggleInventario();" style="font-size:7px;padding:1px 4px;background:rgba(0,0,0,0.3);border:1px solid #3a6a3a;color:#60d060;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;">EQUIPAR</button>` : ''}
            ${(o.tipo === 'consumible' || o.tipo === 'especial') ? `<button onclick="enviarAccion('usar_objeto', null, { objIdx: ${i} });toggleInventario();" style="font-size:7px;padding:1px 4px;background:rgba(0,0,0,0.3);border:1px solid #6a3a3a;color:#d06060;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;">USAR</button>` : ''}
            ${(o.tipo !== 'consumible' && o.tipo !== 'especial' && o.tipo !== 'nada' && o.tipo !== 'moneda') ? `<button onclick="enviarAccion('lanzar', null, { objIdx: ${i} });toggleInventario();" style="font-size:7px;padding:1px 4px;background:rgba(0,0,0,0.3);border:1px solid #3a3a6a;color:#6060d0;border-radius:2px;cursor:pointer;font-family:'Cinzel',serif;">LANZAR</button>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:4px;justify-content:center;margin-top:4px;flex-wrap:wrap;">
      ${eq.mano1 ? `<button onclick="enviarAccion('desequipar', null, { slot: 'mano1' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Deseq M1</button>` : ''}
      ${eq.mano2 && eq.mano2 !== eq.mano1 ? `<button onclick="enviarAccion('desequipar', null, { slot: 'mano2' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Deseq M2</button>` : ''}
      ${eq.armadura ? `<button onclick="enviarAccion('desequipar', null, { slot: 'armadura' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Deseq Armadura</button>` : ''}
      ${eq.accesorio ? `<button onclick="enviarAccion('desequipar', null, { slot: 'accesorio' });toggleInventario();" style="font-size:8px;padding:2px 8px;background:rgba(0,0,0,0.3);border:1px solid #4a3010;color:#c85030;border-radius:3px;cursor:pointer;font-family:'Cinzel',serif;">Deseq Accesorio</button>` : ''}
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

function onCardDragStart(e, idx) {
  const skill = misSkills[idx];
  if (!skill || skill.coste > (miPJ.energia || 0)) return;
  draggedCardIdx = idx;
  e.dataTransfer.setData('text/plain', idx);
  e.dataTransfer.effectAllowed = 'move';
}

function onCardTouchStart(e, idx) {
  const skill = misSkills[idx];
  if (!skill || skill.coste > (miPJ.energia || 0)) return;
  draggedCardIdx = idx;
  const touch = e.touches[0];
  touchClone = document.createElement('div');
  touchClone.textContent = skill.nombre;
  touchClone.style.cssText = 'position:fixed;padding:6px 12px;background:#d2b574;border:2px solid #8b6d3f;border-radius:8px;color:#222;font-size:12px;font-weight:bold;z-index:1000;pointer-events:none;';
  touchClone.style.left = (touch.clientX - 40) + 'px';
  touchClone.style.top = (touch.clientY - 20) + 'px';
  document.body.appendChild(touchClone);
}

function onCardTouchMove(e) {
  if (!touchClone) return;
  e.preventDefault();
  const touch = e.touches[0];
  touchClone.style.left = (touch.clientX - 40) + 'px';
  touchClone.style.top = (touch.clientY - 20) + 'px';
}

function onCardTouchEnd(e) {
  if (!touchClone) return;
  touchClone.remove();
  touchClone = null;
  const touch = e.changedTouches[0];
  const logEl = document.querySelector('.log-scroll');
  if (logEl) {
    const rect = logEl.getBoundingClientRect();
    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
      usarCartaDrag();
    }
  }
}

function onLogDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function onLogDrop(e) {
  e.preventDefault();
  usarCartaDrag();
}

function usarCartaDrag() {
  if (draggedCardIdx === null) return;
  const skill = misSkills[draggedCardIdx];
  if (!skill || skill.coste > (miPJ.energia || 0)) return;
  enviarAccion('carta', skill.id || skill.nombre);
  draggedCardIdx = null;
  const info = document.getElementById('cartaSeleccionInfo');
  if (info) info.style.display = 'none';
  document.querySelectorAll('.slot-card').forEach(c => c.classList.remove('selected'));
}

function usarCartaRival(idx) {
  const skill = rivalSkills[idx];
  if (!skill || skill.coste > (rivalPJ.energia || 0)) return;
  enviarAccion('carta', skill.id || skill.nombre, null, true);
}

function enviarAccion(tipo, cartaId, accionData, comoRival) {
  if (!partidaActualId) return;
  if (esPractica && !esMiTurno) comoRival = true;
  if (tipo !== 'carta') {
    if (!esPractica && (!esMiTurno || accionesRestantes <= 0)) return;
    if (esPractica && !comoRival && (!esMiTurno || accionesRestantes <= 0)) return;
  }
  socket.emit('ejecutarAccion', {
    partidaId: partidaActualId,
    tipo,
    atacante: comoRival ? rivalPJ : miPJ,
    defensor: comoRival ? miPJ : rivalPJ,
    cartaId: cartaId || null,
    accionData: accionData || null,
    actuandoComoRival: comoRival || false
  });
}

function actualizarIndicadorTurno() {
  const el = document.getElementById('indicadorTurno');
  if (!el) return;
  if (esPractica) {
    el.textContent = esMiTurno ? `TU TURNO (${accionesRestantes}/2) — Controlas a ${miPJ.nombre}` : `TURNO DE ${rivalPJ.nombre} (${accionesRestantes}/2) — Controlas al rival`;
  } else {
    el.textContent = esMiTurno ? `TU TURNO (${accionesRestantes}/2)` : 'RIVAL';
  }
  document.querySelectorAll('.character-bio, .player-character, .enemy-character').forEach(el2 => el2.classList.remove('tu-turno'));
  if (esMiTurno) {
    document.querySelectorAll('.col-left .player-character, .col-left .character-bio').forEach(el2 => { if (el2) el2.classList.add('tu-turno'); });
  } else {
    document.querySelectorAll('.col-right .enemy-character, .col-right .character-bio').forEach(el2 => { if (el2) el2.classList.add('tu-turno'); });
  }
  const labels = document.querySelectorAll('.cards-label');
  labels.forEach(l => l.classList.remove('active-turn'));
  if (esPractica) {
    const idx = esMiTurno ? 0 : 1;
    if (labels[idx]) labels[idx].classList.add('active-turn');
  }
}
function agitarPersonaje(selector, intensidad) {
  const el = document.querySelector(selector);
  if (!el) return;

  const token = {};
  el._shakeToken = token;

  const magnitud = Math.min(20, Math.max(6, Math.round(Math.abs(intensidad) * 26)));
  const totalFrames = 10;
  let frame = 0;

  function step() {
    if (el._shakeToken !== token) return;
    frame++;
    const progress = frame / totalFrames;
    if (progress >= 1) {
      el.style.transform = '';
      return;
    }
    const decay = 1 - progress;
    const offset = (Math.random() * 2 - 1) * magnitud * decay;
    const tilt = (Math.random() * 2 - 1) * 3 * decay;
    el.style.transform = `translateX(${offset}px) rotate(${tilt}deg)`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function actualizarHP() {
  const el1 = document.getElementById('rivalHP'), el2 = document.getElementById('pjHP');
  const f1 = document.getElementById('rivalHPFill'), f2 = document.getElementById('pjHPFill');
  const en = document.getElementById('pjEnergia');
  const rivalEn = document.getElementById('rivalEnergia');
  const rivalEnFill = document.getElementById('rivalEnergyFill');
  const miEnFill = document.getElementById('pjEnergyFill');
  if (el1) el1.textContent = rivalPJ.hp || 0;
  if (el2) el2.textContent = miPJ.hp || 0;
  if (en) en.textContent = miPJ.energia || 0;
  if (rivalEn) rivalEn.textContent = rivalPJ.energia || 0;
  if (f1) f1.style.width = Math.max(0, Math.round((rivalPJ.hp || 0) / (rivalPJ.maxHp || 40) * 100)) + '%';
  if (f2) f2.style.width = Math.max(0, Math.round((miPJ.hp || 0) / (miPJ.maxHp || 40) * 100)) + '%';
  if (rivalEnFill) rivalEnFill.style.width = Math.max(0, Math.round((rivalPJ.energia || 0) / 100 * 100)) + '%';
  if (miEnFill) miEnFill.style.width = Math.max(0, Math.round((miPJ.energia || 0) / 100 * 100)) + '%';

  const miPerdida = prevMiHP - (miPJ.hp || 0);
  const rivalPerdida = prevRivalHP - (rivalPJ.hp || 0);
  if (miPerdida > 0) {
    agitarPersonaje('.player-character', miPerdida / (miPJ.maxHp || 40));
    const pFill = document.getElementById('pjHPFill');
    if (pFill) { pFill.style.transition = 'none'; pFill.style.filter = 'brightness(2)'; setTimeout(() => { pFill.style.transition = ''; pFill.style.filter = ''; }, 150); }
  } else if (miPerdida < 0) {
    prevMiHP = miPJ.hp || 0; // HP increased (heal), just sync
  }
  if (rivalPerdida > 0) {
    agitarPersonaje('.enemy-character', rivalPerdida / (rivalPJ.maxHp || 40));
    const rFill = document.getElementById('rivalHPFill');
    if (rFill) { rFill.style.transition = 'none'; rFill.style.filter = 'brightness(2)'; setTimeout(() => { rFill.style.transition = ''; rFill.style.filter = ''; }, 150); }
  } else if (rivalPerdida < 0) {
    prevRivalHP = rivalPJ.hp || 0; // HP increased (heal), just sync
  }
  prevMiHP = miPJ.hp || 0;
  prevRivalHP = rivalPJ.hp || 0;
}

function actualizarEscudoVisual() {
  const pjEl = document.querySelector('.player-character');
  const rivEl = document.querySelector('.enemy-character');
  [pjEl, rivEl].forEach(el => { if (el) el.classList.remove('shield-active'); });
  if (miPJ.status && miPJ.status.shield > 0 && pjEl) pjEl.classList.add('shield-active');
  if (rivalPJ.status && rivalPJ.status.shield > 0 && rivEl) rivEl.classList.add('shield-active');
  ['.col-left .sheet-status', '.col-right .sheet-status'].forEach(sel => {
    const el = document.querySelector(sel);
    if (!el) return;
    const pj = sel.startsWith('.col-left') ? miPJ : rivalPJ;
    const parts = [];
    if (pj.status) {
      if (pj.status.frozen && pj.status.frozen > 0) parts.push(`[CONGELADO ${pj.status.frozen}t]`);
      if (pj.status.silenced && pj.status.silenced > 0) parts.push(`[SILENCIADO ${pj.status.silenced}t]`);
      if (pj.status.shield && pj.status.shield > 0) parts.push(`[ESCUDO ${pj.status.shield}]`);
      if (pj.status.inmune) parts.push(`[INMUNE]`);
    }
    el.textContent = parts.join(' ');
  });
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

let logQueue = [];
let logProcessing = false;
let logInstantMode = false;
let instantTimer = null;
let ultimoTurno;

function mostrarDañoFlotante(valor, esCritico) {
  const popup = document.createElement('div');
  popup.className = 'dmg-popup';
  popup.style.color = esCritico ? '#ffcc00' : '#ff6030';
  popup.style.fontSize = esCritico ? 'clamp(40px, 7vw, 64px)' : 'clamp(28px, 5vw, 48px)';
  popup.style.textShadow = esCritico ? '0 0 30px rgba(255,200,0,0.9),0 0 60px rgba(255,200,0,0.5)' : '0 0 20px rgba(200,60,30,0.8),0 0 40px rgba(200,60,30,0.4)';
  popup.innerHTML = `-${Math.round(valor)}`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1100);
}

function popCentro(texto, color, tamano, sombra) {
  const p = document.createElement('div');
  p.className = 'pop-center';
  p.style.color = color;
  p.style.fontSize = tamano || 'clamp(28px,5vw,48px)';
  p.style.textShadow = sombra || '0 0 20px rgba(200,60,30,0.7)';
  p.innerHTML = texto;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1300);
}

const popCounters = {};
function popPersonaje(texto, color, selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const r = el.getBoundingClientRect();
  popCounters[selector] = (popCounters[selector] || 0) + 1;
  const idx = popCounters[selector];
  const offsetX = (idx % 2 === 0 ? 1 : -1) * Math.ceil(idx / 2) * 45;
  const offsetY = (idx - 1) * 22;
  const p = document.createElement('div');
  p.className = 'pop-char';
  p.style.left = (r.left + r.width / 2 + offsetX) + 'px';
  p.style.top = (r.top + offsetY) + 'px';
  p.style.color = color;
  p.style.fontSize = 'clamp(20px,3.5vw,36px)';
  p.style.textShadow = '0 0 16px currentColor';
  p.innerHTML = texto;
  document.body.appendChild(p);
  setTimeout(() => { p.remove(); popCounters[selector]--; if (popCounters[selector] <= 0) delete popCounters[selector]; }, 1100);
}

function personajeSelector(msg) {
  return miPJ && msg.includes(miPJ.nombre) ? '.player-character' : '.enemy-character';
}

function agregarLog(data) {
  const msg = typeof data === 'string' ? data : data.msg;
  const estilo = typeof data === 'string' ? 'color:#9a7040;font-size:10px;' : estiloLog(data);
  const el = document.getElementById('logBatch');
  if (!el) return;
  el.innerHTML += `<div class="logEntryAnim" style="${estilo}">> ${colorearNombres(msg)}</div>`;
  el.scrollTop = el.scrollHeight;

  const tipo = data.tipo || '';

  /* ─── ATAQUE (daño) ─── */
  if (tipo === 'ataque') {
    const nums = msg.match(/(\d+)\s*$/) || msg.match(/(\d+)(?:\s*daño)?\s*$/);
    if (nums) {
      mostrarDañoFlotante(parseInt(nums[1]), /crític|CRÍTIC/i.test(msg));
    }
    if (/escudo/i.test(msg)) {
      const m = msg.match(/-(\d+)/);
      if (m) popCentro('🛡 -' + m[1], '#40b0ff', 'clamp(22px,4vw,38px)', '0 0 20px rgba(40,150,255,0.7)');
    }
  }

  /* ─── CURACIÓN ─── */
  if (tipo === 'curacion') {
    const nums = msg.match(/\+?(\d+)\s*HP/) || msg.match(/cura\s*(\d+)\s*HP/);
    if (nums) {
      const sel = personajeSelector(msg);
      const elC = document.querySelector(sel);
      if (elC) {
        const r = elC.getBoundingClientRect();
        const p = document.createElement('div');
        p.className = 'dmg-popup';
        p.style.left = r.left + r.width / 2 + 'px';
        p.style.top = r.top + 'px';
        p.style.color = '#40e060';
        p.style.fontSize = 'clamp(22px,4vw,40px)';
        p.style.textShadow = '0 0 20px rgba(60,200,80,0.8),0 0 40px rgba(60,200,80,0.4)';
        p.style.animation = 'healFloat 1s ease-out forwards';
        p.innerHTML = '+' + parseInt(nums[1]);
        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1100);
      }
    }
    if (/energía|energia/i.test(msg)) {
      const m = msg.match(/\+?(\d+)\s*energ/i);
      if (m) popPersonaje('✦ +' + m[1], '#b060e0', personajeSelector(msg));
    }
  }

  /* ─── ENERGÍA ─── */
  if (tipo === 'energia') {
    const m = msg.match(/(\d+)\s*energ/);
    if (m) popPersonaje('✦ +' + m[1], '#b060e0', personajeSelector(msg));
  }

  /* ─── POSE / DODGE / PARRY ─── */
  if (/esquiv|evadi|dodge|parr|bloque/i.test(msg)) {
    const sel = personajeSelector(msg);
    const elChar = document.querySelector(sel);
    if (elChar) {
      elChar.classList.remove('dodge-anim-l', 'dodge-anim-r');
      void elChar.offsetWidth;
      elChar.classList.add(sel === '.player-character' ? 'dodge-anim-l' : 'dodge-anim-r');
      setTimeout(() => elChar.classList.remove('dodge-anim-l', 'dodge-anim-r'), 500);
    }
    if (/PARRY/i.test(msg)) {
      popCentro('¡PARRY!', '#ffcc00', 'clamp(30px,5vw,50px)', '0 0 30px rgba(255,200,0,0.9)');
    } else if (/ESQUIVA/i.test(msg)) {
      popCentro('¡ESQUIVA!', '#80d0ff', 'clamp(26px,4.5vw,44px)', '0 0 20px rgba(80,180,255,0.8)');
    }
  }

  /* ─── CARTAS / SKILLS ─── */
  if (tipo === 'carta' && /recibe.*daño|de.*daño|drena/i.test(msg)) {
    const m = msg.match(/(\d+)\s*de\s*daño|\+?(\d+)\s*daño/i);
    if (m) popCentro('⚡ ' + (m[1] || m[2] || '?'), '#e08040', 'clamp(24px,4vw,40px)');
  }
  if (tipo === 'carta' && /paralizado|aturdido/i.test(msg)) {
    popCentro('❄ PARALIZADO', '#60c0ff', 'clamp(26px,4.5vw,44px)', '0 0 30px rgba(60,180,255,0.7)');
  }
  if (tipo === 'carta' && /silenciado/i.test(msg)) {
    popCentro('🔇 SILENCIADO', '#888', 'clamp(26px,4.5vw,44px)', '0 0 20px rgba(100,100,100,0.7)');
  }
  if (tipo === 'carta' && /escudo\s*(de|de )?(\d+)/i.test(msg)) {
    const m = msg.match(/(\d+)/);
    if (m) popPersonaje('🛡 +' + m[1], '#40b0ff', personajeSelector(msg));
  }
  if (tipo === 'carta' && /energía\s*extra/i.test(msg)) {
    const m = msg.match(/(\d+)/);
    if (m) popPersonaje('✦ +' + m[1], '#b060e0', personajeSelector(msg));
  }
  if (tipo === 'carta' && (/\bgana\s*\+/i.test(msg) || /\bgana\s*\+\d+/i.test(msg))) {
    const m = msg.match(/\+(\d+)\s*([a-záéíóú]+)/i);
    if (m) popPersonaje('↑ ' + m[1] + ' ' + m[2], '#60e880', personajeSelector(msg));
  }
  if (tipo === 'carta' && /pierde\s*\d+/i.test(msg)) {
    const m = msg.match(/pierde\s*(\d+)\s*([a-záéíóú]+)/i);
    if (m) popPersonaje('↓ ' + m[1] + ' ' + (m[2] || ''), '#ff6040', personajeSelector(msg));
  }

  /* ─── PASIVAS ─── */
  if (tipo === 'pasiva') {
    if (/daño por veneno/i.test(msg)) {
      const m = msg.match(/(\d+)\s*de\s*daño/);
      if (m) popPersonaje('☠ ' + m[1], '#b040c0', personajeSelector(msg));
    }
    if (/contraataca/i.test(msg)) {
      const m = msg.match(/(\d+)\s*daño/);
      if (m) popCentro('↩ ' + m[1], '#ff7040', 'clamp(24px,4vw,40px)', '0 0 20px rgba(255,100,50,0.8)');
    }
    if (/espinas causan/i.test(msg) || /devuelve.*daño/i.test(msg)) {
      const m = msg.match(/(\d+)\s*daño/);
      if (m) popCentro('↩ ' + m[1], '#ff8040', 'clamp(24px,4vw,40px)', '0 0 20px rgba(255,120,40,0.8)');
    }
    if (/revive/i.test(msg)) {
      const m = msg.match(/(\d+)\s*HP/);
      if (m) popCentro('REVIVE +' + m[1], '#ffcc00', 'clamp(30px,5vw,50px)', '0 0 30px rgba(255,200,0,0.9)');
    }
    if (/sobrevive/i.test(msg)) {
      popCentro('¡TÓTEM!', '#ff8800', 'clamp(30px,5vw,50px)', '0 0 30px rgba(255,130,0,0.9)');
    }
    if (/acción extra/i.test(msg)) {
      popCentro('+1 ACCIÓN', '#ffcc00', 'clamp(26px,4.5vw,44px)', '0 0 30px rgba(255,200,0,0.8)');
    }
    if (/purifica/i.test(msg)) {
      popPersonaje('PURIFICADO', '#ffffff', personajeSelector(msg));
    }
    if (/escudo natural/i.test(msg)) {
      const m = msg.match(/\+(\d+)/);
      const pj = personajeSelector(msg);
      popPersonaje('🛡 +' + (m ? m[1] : ''), '#40b0ff', pj);
    }
    if (/concentra/i.test(msg)) {
      popPersonaje('✦ −3', '#a060d0', personajeSelector(msg));
    }
    if (/reduce.*daño/i.test(msg)) {
      popCentro('− DMG', '#60c0ff', 'clamp(22px,4vw,38px)', '0 0 20px rgba(60,180,255,0.6)');
    }
    if (/roba.*HP|absorbe.*HP/i.test(msg)) {
      const m = msg.match(/(\d+)\s*HP/);
      if (m) {
        const sel = personajeSelector(msg);
        const elC = document.querySelector(sel);
        if (elC) {
          const r = elC.getBoundingClientRect();
          const p = document.createElement('div');
          p.className = 'dmg-popup';
          p.style.left = r.left + r.width / 2 + 'px';
          p.style.top = r.top + 'px';
          p.style.color = '#50d080';
          p.style.fontSize = 'clamp(20px,3.5vw,36px)';
          p.style.textShadow = '0 0 20px rgba(60,200,80,0.8)';
          p.style.animation = 'healFloat 1s ease-out forwards';
          p.innerHTML = '+' + m[1];
          document.body.appendChild(p);
          setTimeout(() => p.remove(), 1100);
        }
      }
    }
    if (/recupera\s*\d+\s*energía/i.test(msg)) {
      const m = msg.match(/(\d+)\s*energía/);
      if (m) popPersonaje('✦ +' + m[1], '#b060e0', personajeSelector(msg));
    }
    if (/regenera\s*(\d+)\s*HP/i.test(msg)) {
      const m = msg.match(/regenera\s*(\d+)\s*HP/i);
      if (m) popPersonaje('+' + m[1] + ' HP', '#40e060', personajeSelector(msg));
    }
  }

  /* ─── STATUS ─── */
  if (tipo === 'status') {
    if (/paralizado|aturdido|frozen/i.test(msg)) {
      popCentro('❄ PARALIZADO', '#60c0ff', 'clamp(26px,4.5vw,44px)', '0 0 30px rgba(60,180,255,0.7)');
    }
    if (/sangra|sangrado|bleed/i.test(msg)) {
      const m = msg.match(/(\d+)\s*de\s*sangrado|(\d+)t\b/);
      if (m) popPersonaje('🩸 ' + (m[1] || m[2] || ''), '#cc3333', personajeSelector(msg));
    }
    if (/se desvaneció|desvaneció/i.test(msg)) {
      popCentro('✦ TERMINADO', '#888', 'clamp(20px,3.5vw,36px)', '0 0 15px rgba(100,100,100,0.5)');
    }
  }

  /* ─── MUERTE ─── */
  if (tipo === 'muerte') {
    if (/empate|empate/i.test(msg)) {
      popCentro('¡EMPATE!', '#ffcc00', 'clamp(40px,7vw,64px)', '0 0 40px rgba(255,200,0,0.9)');
    } else {
      const ganador = msg.match(/(.+?)\s*gana/);
      if (ganador) {
        popCentro('VICTORIA', '#ffcc00', 'clamp(40px,7vw,64px)', '0 0 40px rgba(255,200,0,0.9)');
      } else {
        popCentro('DERROTA', '#ff3030', 'clamp(36px,6vw,60px)', '0 0 40px rgba(255,0,0,0.8)');
      }
    }
  }
}

function forzarLogsPendientes() {
  logProcessing = false;
  while (logQueue.length > 0) {
    const data = logQueue.shift();
    agregarLog(data);
  }
}

function agregarLineaTurno() {
  const el = document.getElementById('logBatch');
  if (!el) return;
  el.innerHTML += `<div style="color:#4a3a1a;font-size:9px;text-align:center;letter-spacing:4px;margin:2px 0;">— — — — —</div>`;
  el.scrollTop = el.scrollHeight;
}

socket.on('logBatalla', (data) => {
  if (logInstantMode) {
    agregarLog(data);
    clearTimeout(instantTimer);
    instantTimer = setTimeout(() => { logInstantMode = false; }, 1500);
    return;
  }
  logQueue.push(data);
  procesarLogQueue();
});

function procesarLogQueue() {
  if (logProcessing || logQueue.length === 0) return;
  logProcessing = true;
  const data = logQueue.shift();
  agregarLog(data);

  setTimeout(() => {
    logProcessing = false;
    procesarLogQueue();
  }, 1200);
}

socket.on('actualizarEstado', (datos) => {
  const yoMio = datos.socketJ1 === socket.id;
  const miHP = yoMio ? datos.j1 : datos.j2;
  const rivalHP = yoMio ? datos.j2 : datos.j1;
  const miEnergia = yoMio ? datos.j1energia : datos.j2energia;
  const miStatus = yoMio ? (datos.j1status || {}) : (datos.j2status || {});
  const rivalStatus = yoMio ? (datos.j2status || {}) : (datos.j1status || {});

  miPJ.hp = miHP;
  rivalPJ.hp = rivalHP;
  miPJ.energia = miEnergia;
  rivalPJ.energia = yoMio ? datos.j2energia : datos.j1energia;
  miPJ.status = miStatus;
  rivalPJ.status = rivalStatus;
  accionesRestantes = datos.accionesRestantes || 0;
  const nuevoEsMiTurno = datos.turnoActual === socket.id;
  const cambioTurno = ultimoTurno !== undefined && esMiTurno !== nuevoEsMiTurno;
  ultimoTurno = nuevoEsMiTurno;
  esMiTurno = nuevoEsMiTurno;

  if (cambioTurno) {
    forzarLogsPendientes();
    agregarLineaTurno();
    logInstantMode = true;
  }

  if (datos.j1skills) misSkills = yoMio ? datos.j1skills : datos.j2skills;
  if (datos.pasivasJ1) misPasivas = yoMio ? datos.pasivasJ1 : datos.pasivasJ2;
  if (datos.inventarioJ1) miPJ.inventario = yoMio ? datos.inventarioJ1 : datos.inventarioJ2;
  if (datos.equipmentJ1) miPJ.equipment = yoMio ? datos.equipmentJ1 : datos.equipmentJ2;
  miPJ.objetosRecibidos = yoMio ? (datos.objetosRecibidosJ1 || []) : (datos.objetosRecibidosJ2 || []);
  rivalPJ.objetosRecibidos = yoMio ? (datos.objetosRecibidosJ2 || []) : (datos.objetosRecibidosJ1 || []);

  if (esPractica) {
    rivalSkills = yoMio ? (datos.j2skills || []) : (datos.j1skills || []);
    rivalPasivas = yoMio ? (datos.pasivasJ2 || []) : (datos.pasivasJ1 || []);
  }

  if (prevMiHP === undefined) { prevMiHP = miPJ.hp || 0; prevRivalHP = rivalPJ.hp || 0; }
  actualizarHP();
  actualizarCardsSkills();
  actualizarIndicadorTurno();
  actualizarEscudoVisual();
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
    const skillData = SKILL_DATA_LOOKUP[skill.id];
    return `<div class="slot-card ${cls}" style="transform:rotate(${angle}deg) translateY(${ty}px);z-index:${zIdx}" draggable="true"
      ondragstart="onCardDragStart(event, ${i})"
      ontouchstart="onCardTouchStart(event, ${i})"
      ontouchmove="onCardTouchMove(event)"
      ontouchend="onCardTouchEnd(event)"
      onclick="seleccionarCarta(${i})" id="skillCard-${i}">
      <div class="card-name">${skill.nombre}</div>
      <div class="card-desc">${skillData ? describirEfecto(skillData) : ''}</div>
      <div class="card-cost">${skill.coste} <span style="color:#2688ff;">E</span></div>
    </div>`;
  }).join('');

  if (esPractica) {
    const rivalContainer = document.getElementById('cartasSkillRival');
    if (!rivalContainer) return;
    const totalR = rivalSkills.length;
    const stepR = totalR > 1 ? Math.min(8, 40 / totalR) : 0;
    const startR = -((totalR - 1) * stepR) / 2;
    rivalContainer.innerHTML = rivalSkills.map((skill, i) => {
      const angle = startR + i * stepR;
      const ty = Math.abs(angle) * 1.3;
      const zIdx = totalR === 1 ? 5 : totalR - Math.abs(i - Math.floor((totalR - 1) / 2));
      const costOk = skill.coste <= (rivalPJ.energia || 0);
      const skillData = SKILL_DATA_LOOKUP[skill.id];
      return `<div class="slot-card ${costOk ? '' : 'disabled'}" style="transform:rotate(${angle}deg) translateY(${ty}px);z-index:${zIdx}"
        onclick="${!esMiTurno && costOk ? `usarCartaRival(${i})` : ''}" id="skillCardRival-${i}">
        <div class="card-name">${skill.nombre}</div>
        <div class="card-desc">${skillData ? describirEfecto(skillData) : ''}</div>
        <div class="card-cost">${skill.coste} <span style="color:#2688ff;">E</span></div>
      </div>`;
    }).join('');
  }
}

socket.on('finPartida', (datos) => {
  const gane = datos.ganador === socket.id;
  const empate = datos.empate === true;
  const logBatch = document.getElementById('logBatch');
  if (logBatch) {
    let msg = esPractica ? 'ENTRENAMIENTO TERMINADO' : (empate ? 'EMPATE!' : (gane ? 'VICTORIA!' : 'DERROTA'));
    logBatch.innerHTML += `<div style="color:#e0b060;font-size:13px;text-align:center;margin-top:10px;letter-spacing:2px;">${msg}</div>`;
    logBatch.scrollTop = logBatch.scrollHeight;
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
  if (esPractica) {
    overlay.innerHTML = `
      <div style="width:300px;padding:30px 20px;background:radial-gradient(ellipse at center top,#1a0e08 0%,#0a0604 100%);border:3px solid #8a6030;border-radius:8px;text-align:center;">
        <div style="font-size:22px;letter-spacing:4px;color:#e0b060;margin-bottom:20px;font-family:'Cinzel',serif;font-weight:700;">ENTRENAMIENTO TERMINADO</div>
        <button onclick="volverAlMenuDesdeCombate()" style="font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:3px;color:#fffbe8;cursor:pointer;border:none;padding:11px 30px;background:linear-gradient(180deg,#c85030 0%,#7a2010 40%,#8a2515 60%,#c04020 100%);clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%);">VOLVER AL MENU</button>
      </div>
    `;
  } else {
    overlay.innerHTML = `
      <div style="width:300px;padding:30px 20px;background:radial-gradient(ellipse at center top,#1a0e08 0%,#0a0604 100%);border:3px solid ${gane ? '#c85030' : '#4a3010'};border-radius:8px;text-align:center;">
        <div style="font-size:22px;letter-spacing:4px;color:${gane ? '#60d060' : '#c85030'};margin-bottom:6px;font-family:'Cinzel',serif;font-weight:700;">${gane ? 'VICTORIA' : 'DERROTA'}</div>
        <div style="color:#6a4018;font-size:10px;letter-spacing:2px;margin-bottom:20px;">${gane ? '+1 XP' : '+0.5 XP'}</div>
        <button onclick="volverAlMenuDesdeCombate()" style="font-family:'Cinzel',serif;font-size:13px;font-weight:700;letter-spacing:3px;color:#fffbe8;cursor:pointer;border:none;padding:11px 30px;background:linear-gradient(180deg,#c85030 0%,#7a2010 40%,#8a2515 60%,#c04020 100%);clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%);">VOLVER AL MENU</button>
      </div>
    `;
  }
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
