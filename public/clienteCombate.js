let partidaActualId = null;
let miPJ = null;
let rivalPJ = null;
let esMiTurno = false;
let accionesRestantes = 0;

const PASIVAS_POR_CLASE = {
  Chaman: { nombre: 'Espíritu Natural', desc: 'Recupera 2 HP por turno.' },
  Sacerdote: { nombre: 'Fe Inquebrantable', desc: 'Las curaciones tienen +20% efecto.' },
  Druida: { nombre: 'Piel de Corteza', desc: '+2 resistencia permanente.' },
  Guerrero: { nombre: 'Corazón de Hierro', desc: 'Recibe 10% menos daño.' },
  Paladin: { nombre: 'Escudo Sagrado', desc: '+3 resistencia contra magia.' },
  Berserker: { nombre: 'Furia de Batalla', desc: '+2 fuerza por cada 10% HP perdido.' },
  Acorazado: { nombre: 'Muro Viviente', desc: 'Los parrys tienen +3 de valor.' },
  Ogro: { nombre: 'Golpe Brutal', desc: 'Los ataques ignoran 2 de resistencia.' },
  Golem: { nombre: 'Pétreo', desc: 'Reduce todo daño en 2.' },
  Picaro: { nombre: 'Sombra Esquiva', desc: '+3 velocidad al esquivar.' },
  Ninja: { nombre: 'Sigilo', desc: 'Primer ataque cada combate es crítico.' },
  Cazador: { nombre: 'Ojo de Águila', desc: '+10% probabilidad de crítico.' },
  Mago: { nombre: 'Sabiduría Arcana', desc: 'Los hechizos cuestan 1 menos de energía.' },
  MagoMaestro: { nombre: 'Concentración', desc: 'Recupera 3 energía por turno.' },
  MagoGuerrero: { nombre: 'Canalización Marcial', desc: 'Los ataques físicos gastan 50% energía.' },
  SemiDios: { nombre: 'Aura Divina', desc: '+1 a todas las stats.' },
  Demonio: { nombre: 'Presencia Infernal', desc: 'El rival pierde 1 energía por turno.' },
  Titan: { nombre: 'Coloso', desc: '+5 HP máximo.' }
};

const HECHIZOS_POR_CLASE = {
  Chaman: [
    { nombre: 'Bola de Fuego', coste: 3, desc: 'Daño 8 de fuego.', icono: '🔥' },
    { nombre: 'Escudo de Hielo', coste: 2, desc: '+4 defensa por 1 turno.', icono: '❄️' },
    { nombre: 'Rayo', coste: 5, desc: 'Daño 12 eléctrico.', icono: '⚡' }
  ],
  Sacerdote: [
    { nombre: 'Luz Sagrada', coste: 3, desc: 'Cura 10 HP.', icono: '✨' },
    { nombre: 'Bendición', coste: 2, desc: '+2 a todas las stats 1 turno.', icono: '🙏' },
    { nombre: 'Castigo Divino', coste: 5, desc: 'Daño 10 de luz.', icono: '☀️' }
  ],
  Druida: [
    { nombre: 'Zarzas', coste: 3, desc: 'Daño 6 + ralentiza.', icono: '🌿' },
    { nombre: 'Regeneración', coste: 2, desc: 'Cura 5 HP por turno.', icono: '🍃' },
    { nombre: 'Tormenta', coste: 5, desc: 'Daño 10 a todos.', icono: '🌪️' }
  ],
  Guerrero: [
    { nombre: 'Golpe Aplastante', coste: 2, desc: 'Daño 8 físico.', icono: '⚔️' },
    { nombre: 'Grito de Guerra', coste: 3, desc: '+3 fuerza 1 turno.', icono: '🗣️' },
    { nombre: 'Tajo Profundo', coste: 4, desc: 'Daño 12 + sangrado.', icono: '🩸' }
  ],
  Mago: [
    { nombre: 'Bola de Fuego', coste: 3, desc: 'Daño 8 de fuego.', icono: '🔥' },
    { nombre: 'Escudo de Hielo', coste: 2, desc: '+4 defensa por 1 turno.', icono: '❄️' },
    { nombre: 'Rayo', coste: 5, desc: 'Daño 12 eléctrico.', icono: '⚡' }
  ],
  MagoMaestro: [
    { nombre: 'Bola de Fuego', coste: 2, desc: 'Daño 8 de fuego.', icono: '🔥' },
    { nombre: 'Rayo', coste: 4, desc: 'Daño 12 eléctrico.', icono: '⚡' },
    { nombre: 'Meteoro', coste: 7, desc: 'Daño 18 devastador.', icono: '☄️' }
  ],
  MagoGuerrero: [
    { nombre: 'Hoja Ígnea', coste: 4, desc: 'Daño 10 fuego+físico.', icono: '🗡️' },
    { nombre: 'Armadura Mágica', coste: 2, desc: '+5 defensa 1 turno.', icono: '🛡️' },
    { nombre: 'Explosión', coste: 6, desc: 'Daño 14 área.', icono: '💥' }
  ],
  SemiDios: [
    { nombre: 'Juicio Final', coste: 4, desc: 'Daño 10 divino.', icono: '⚡' },
    { nombre: 'Escudo Celestial', coste: 2, desc: 'Absorbe 8 daño.', icono: '🛡️' },
    { nombre: 'Ira Divina', coste: 6, desc: 'Daño 16 + stun.', icono: '🌩️' }
  ]
};

function obtenerPasiva(clase) {
  return PASIVAS_POR_CLASE[clase] || { nombre: 'Instinto de Supervivencia', desc: '+1 resistencia en apuros.' };
}

function obtenerHechizos(clase) {
  return HECHIZOS_POR_CLASE[clase] || [
    { nombre: 'Golpe', coste: 2, desc: 'Daño 6 físico.', icono: '👊' },
    { nombre: 'Defensa', coste: 1, desc: '+3 defensa 1 turno.', icono: '🛡️' },
    { nombre: 'Ataque Rápido', coste: 3, desc: 'Daño 9 veloz.', icono: '⚡' }
  ];
}

socket.on('rivalEncontrado', (data) => {
  partidaActualId = data.partidaId;
  miPJ = data.yo;
  rivalPJ = data.rival;
  esMiTurno = data.esmiTurno;
  accionesRestantes = data.accionesRestantes || 0;

  mostrarPantallaCombate();
  renderizarCombate();
});

function mostrarPantallaCombate() {
  document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
  document.getElementById('pantallaCombate').classList.add('activa');
}

function renderizarCombate() {
  const pasiva = obtenerPasiva(miPJ.clase);
  const hechizos = obtenerHechizos(miPJ.clase);
  const maxHP = 40;
  const rivalHPct = Math.round(rivalPJ.hp / maxHP * 100);
  const miHPct = Math.round(miPJ.hp / maxHP * 100);

  document.getElementById('pantallaCombate').innerHTML = `
    <div class="combate-container">
      <div class="combate-superior">
        <div class="combate-lateral">
          <div class="silueta">
            <div class="silueta-figura">${rivalPJ.foto ? `<img src="${rivalPJ.foto}" alt="">` : '<span class="sil-icono">☠</span>'}</div>
          </div>
          <div class="panel-stats">
            <div class="stat-nombre">${rivalPJ.nombre}</div>
            <div class="stat-clase">${rivalPJ.clase} · Lv.${rivalPJ.nivel || 1}</div>
            <div class="stat-hp-bar">
              <div class="stat-hp-fill" id="barraHPRival" style="width:${rivalHPct}%"></div>
            </div>
            <div class="stat-hp-texto">HP <span id="rivalHP">${rivalPJ.hp}</span>/${maxHP}</div>
            <div class="stat-grid-chico">
              <span>FUE ${rivalPJ.fuerza}</span><span>RES ${rivalPJ.resistencia}</span>
              <span>VEL ${rivalPJ.velocidad}</span><span>MAG ${rivalPJ.magia}</span>
              <span>SUE ${rivalPJ.suerte}</span><span>ENE ${rivalPJ.energia || 0}</span>
            </div>
          </div>
        </div>
        <div class="combate-log" id="logBatalla">
          <div style="color:#6a4018;font-size:8px;letter-spacing:3px;text-align:center;margin-bottom:6px;">✦ BITÁCORA DE BATALLA ✦</div>
        </div>
        <div class="combate-lateral">
          <div class="silueta">
            <div class="silueta-figura">${miPJ.foto ? `<img src="${miPJ.foto}" alt="">` : '<span class="sil-icono">⚔</span>'}</div>
          </div>
          <div class="panel-stats">
            <div class="stat-nombre">${miPJ.nombre}</div>
            <div class="stat-clase">${miPJ.clase} · Lv.${miPJ.nivel || 1}</div>
            <div class="stat-hp-bar">
              <div class="stat-hp-fill" id="barraHPMio" style="width:${miHPct}%"></div>
            </div>
            <div class="stat-hp-texto">HP <span id="pjHP">${miPJ.hp}</span>/${maxHP}</div>
            <div class="stat-grid-chico">
              <span>FUE ${miPJ.fuerza}</span><span>RES ${miPJ.resistencia}</span>
              <span>VEL ${miPJ.velocidad}</span><span>MAG ${miPJ.magia}</span>
              <span>SUE ${miPJ.suerte}</span><span>ENE <span id="pjEnergia">${miPJ.energia || 0}</span></span>
            </div>
          </div>
        </div>
      </div>

      <div class="combate-accion-row">
        <div class="accion-botones">
          <button class="btn-accion" id="btnAccion1" onclick="clickAccion(0)" title="Usar acción">A<br>C<br>C<br>I<br>Ó<br>N</button>
          <button class="btn-accion" id="btnAccion2" onclick="clickAccion(1)" title="Usar acción">A<br>C<br>C<br>I<br>Ó<br>N</button>
        </div>
        <div class="turno-indicador" id="indicadorTurno" style="color:${esMiTurno ? '#60d060' : '#c85030'};">
          ${esMiTurno ? `⚔ TU TURNO (${accionesRestantes}/2)` : '⏳ RIVAL'}
        </div>
      </div>

      <div class="combate-cartas">
        <div class="cartas-propia">
          ${hechizos.map(h => `
            <div class="carta-hechizo">
              <div class="ch-icono">${h.icono}</div>
              <div class="ch-nombre">${h.nombre}</div>
              <div class="ch-coste">⚡${h.coste}</div>
              <div class="ch-desc">${h.desc}</div>
            </div>
          `).join('')}
        </div>
        <div class="carta-pasiva">
          <div class="cp-tag">PASIVA</div>
          <div class="cp-nombre">${pasiva.nombre}</div>
          <div class="cp-desc">${pasiva.desc}</div>
        </div>
      </div>

      <div id="menuRadial" class="radial-container" style="display:none;">
        <button id="btnAtacar" class="accion-btn" title="Atacar">⚔️</button>
        <button id="btnDescansar" class="accion-btn" title="Descansar">💤</button>
        <button id="btnPose" class="accion-btn" title="Pose">🛡️</button>
        <button id="btnCarta" class="accion-btn" title="Carta">🃏</button>
        <button id="btnHab" class="accion-btn" title="Habilidad">✨</button>
        <button id="btnCentral" class="central-btn">ACCIÓN</button>
      </div>
    </div>
  `;

  actualizarIndicadorTurno();
  document.getElementById('btnCentral').addEventListener('click', () => {
    if (!esMiTurno) return;
    document.getElementById('menuRadial').classList.toggle('active');
  });
  document.getElementById('btnAtacar').addEventListener('click', () => enviarAccion('atacar'));
  document.getElementById('btnDescansar').addEventListener('click', () => enviarAccion('descansar'));
  document.getElementById('btnPose').addEventListener('click', () => enviarAccion('pose'));
  document.getElementById('btnCarta').addEventListener('click', () => enviarAccion('carta'));
  document.getElementById('btnHab').addEventListener('click', () => enviarAccion('habilidad'));
}

const botonesAccion = [false, false];
function clickAccion(idx) {
  if (!esMiTurno || accionesRestantes <= 0) return;
  document.getElementById('menuRadial').style.display = 'block';
  setTimeout(() => {
    document.getElementById('menuRadial').classList.add('active');
  }, 10);
}

function enviarAccion(tipo) {
  if (!partidaActualId || !esMiTurno || accionesRestantes <= 0) return;
  document.getElementById('menuRadial').classList.remove('active');
  document.getElementById('menuRadial').style.display = 'none';
  socket.emit('ejecutarAccion', {
    partidaId: partidaActualId,
    tipo,
    atacante: miPJ,
    defensor: rivalPJ
  });
}

function actualizarIndicadorTurno() {
  const el = document.getElementById('indicadorTurno');
  if (!el) return;
  el.innerHTML = esMiTurno
    ? `⚔ TU TURNO (${accionesRestantes}/2)`
    : '⏳ RIVAL';
  el.style.color = esMiTurno ? '#60d060' : '#c85030';
  [document.getElementById('btnAccion1'), document.getElementById('btnAccion2')].forEach(btn => {
    if (!btn) return;
    if (esMiTurno && accionesRestantes > 0) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'all';
    } else {
      btn.style.opacity = '0.3';
      btn.style.pointerEvents = 'none';
    }
  });
}

function actualizarCentral() {
  const btnCentral = document.getElementById('btnCentral');
  if (!btnCentral) return;
  if (esMiTurno) {
    btnCentral.textContent = `ACCIÓN\n(${accionesRestantes}/2)`;
    btnCentral.style.opacity = '1';
  } else {
    btnCentral.textContent = 'ESPERA';
    btnCentral.style.opacity = '0.4';
  }
}

function estiloLog(data) {
  const estilos = {
    ataque: 'color:#e89838;font-size:11px;font-weight:600;',
    curacion: 'color:#40c060;font-size:11px;',
    pose: 'color:#60a0d0;font-size:11px;',
    muerte: 'color:#ff4422;font-size:14px;font-weight:700;letter-spacing:1px;',
    marea: 'color:#a060d0;font-size:11px;',
    energia: 'color:#60d0d0;font-size:11px;'
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
  log.innerHTML += `<div style="${estilo}">▸ ${colorearNombres(msg)}</div>`;
  log.scrollTop = log.scrollHeight;
});

socket.on('actualizarEstado', (datos) => {
  const miHP = datos.socketJ1 === socket.id ? datos.j1 : datos.j2;
  const rivalHP = datos.socketJ1 === socket.id ? datos.j2 : datos.j1;
  const miEnergia = datos.socketJ1 === socket.id ? datos.j1energia : datos.j2energia;

  miPJ.hp = miHP;
  rivalPJ.hp = rivalHP;
  accionesRestantes = datos.accionesRestantes || 0;
  esMiTurno = datos.turnoActual === socket.id;

  document.getElementById('pjHP').textContent = miHP;
  document.getElementById('rivalHP').textContent = rivalHP;
  document.getElementById('pjEnergia').textContent = miEnergia;
  const barraMia = document.getElementById('barraHPMio');
  const barraRival = document.getElementById('barraHPRival');
  if (barraMia) barraMia.style.width = (Math.max(0, miHP) / 40 * 100) + '%';
  if (barraRival) barraRival.style.width = (Math.max(0, rivalHP) / 40 * 100) + '%';

  actualizarIndicadorTurno();
  actualizarCentral();
});

socket.on('finPartida', (datos) => {
  const gane = datos.ganador === socket.id;
  const log = document.getElementById('logBatalla');
  if (log) {
    log.innerHTML += `
      <div style="color:${gane ? '#60d060' : '#c85030'}; font-size:13px; text-align:center; margin-top:10px; letter-spacing:2px;">
        ${gane ? '🏆 ¡VICTORIA!' : '💀 DERROTA'}
      </div>`;
    log.scrollTop = log.scrollHeight;
  }
  esMiTurno = false;
  accionesRestantes = 0;
  actualizarIndicadorTurno();
  actualizarCentral();
  mostrarPantallaFinPartida(gane);
});

function mostrarPantallaFinPartida(gane) {
  const existing = document.getElementById('finPartidaOverlay');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'finPartidaOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);';
  overlay.innerHTML = `
    <div style="
      width:300px;padding:30px 20px;
      background:radial-gradient(ellipse at center top,#1a0e08 0%,#0a0604 100%);
      border:3px solid ${gane ? '#c85030' : '#4a3010'};
      border-radius:8px;text-align:center;
    ">
      <div style="font-size:42px;margin-bottom:10px;">${gane ? '🏆' : '💀'}</div>
      <div style="font-size:22px;letter-spacing:4px;color:${gane ? '#60d060' : '#c85030'};margin-bottom:6px;font-family:'Cinzel',serif;font-weight:700;">
        ${gane ? 'VICTORIA' : 'DERROTA'}
      </div>
      <div style="color:#6a4018;font-size:10px;letter-spacing:2px;margin-bottom:20px;">
        ${gane ? '+1 XP' : '+0.5 XP'}
      </div>
      <button onclick="volverAlMenuDesdeCombate()" style="
        font-family:'Cinzel',serif;font-size:13px;font-weight:700;
        letter-spacing:3px;color:#fffbe8;cursor:pointer;
        border:none;padding:11px 30px;
        background:linear-gradient(180deg,#c85030 0%,#7a2010 40%,#8a2515 60%,#c04020 100%);
        clip-path:polygon(12px 0%,calc(100% - 12px) 0%,100% 50%,calc(100% - 12px) 100%,12px 100%,0% 50%);
      ">VOLVER AL MENÚ</button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function volverAlMenuDesdeCombate() {
  const overlay = document.getElementById('finPartidaOverlay');
  if (overlay) overlay.remove();
  partidaActualId = null;
  mostrarPantalla('menu');
  mostrarSeccionMenu('pantallaMenu');
}
