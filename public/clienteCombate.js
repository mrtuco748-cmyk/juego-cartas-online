// clienteCombate.js
// ⚠️ NO crear nuevo socket — usa el del index.html
// Este archivo debe cargarse DESPUÉS del <script> de index.html

let partidaActualId = null;
let miPJ = null;
let rivalPJ = null;
let esMiTurno = false;

// ── CUANDO SE ENCUENTRA RIVAL ──
socket.on('rivalEncontrado', (data) => {
    partidaActualId = data.partidaId;
    miPJ = data.yo;
    rivalPJ = data.rival;
    esMiTurno = data.esmiTurno;

    mostrarPantallaCombate();
    renderizarCombate();
});

// ── MOSTRAR PANTALLA DE COMBATE ──
function mostrarPantallaCombate() {
    document.querySelectorAll('.pantalla').forEach(p => p.classList.remove('activa'));
    document.getElementById('pantallaCombate').classList.add('activa');
}

// ── RENDERIZAR UI DEL COMBATE ──
function renderizarCombate() {
    document.getElementById('pantallaCombate').innerHTML = `
        <div style="
            width: 360px;
            background: radial-gradient(ellipse at center top, #1a0e08 0%, #0a0604 100%);
            border: 3px solid #4a3010;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        ">
            <!-- RIVAL -->
            <div style="padding: 12px 16px; border-bottom: 1px solid #2a1808;">
                <div style="color:#6a4018; font-size:9px; letter-spacing:2px;">RIVAL</div>
                <div style="color:#d4a060; font-size:12px; letter-spacing:2px; margin: 2px 0;">
                    ${rivalPJ.nombre} <span style="color:#6a4018; font-size:9px;">${rivalPJ.clase}</span>
                </div>
                <div style="background:#1a0e08; border:1px solid #3a2008; border-radius:3px; height:10px; margin-top:4px;">
                    <div id="barraHPRival" style="height:100%; width:100%; background:linear-gradient(90deg,#c85030,#ff6040); border-radius:3px; transition:width 0.4s;"></div>
                </div>
                <div style="color:#9a7040; font-size:9px; margin-top:2px;">
                    HP: <span id="rivalHP">${rivalPJ.hp}</span>/100
                </div>
            </div>

            <!-- LOG DE BATALLA -->
            <div id="logBatalla" style="
                height: 140px; overflow-y: auto; padding: 10px 14px;
                font-size: 10px; color: #9a7040; letter-spacing: 1px;
                border-bottom: 1px solid #2a1808; line-height: 1.8;
            "></div>

            <!-- TURNO -->
            <div id="indicadorTurno" style="
                text-align:center; padding: 6px;
                font-size: 9px; letter-spacing: 3px;
                color: ${esMiTurno ? '#60d060' : '#c85030'};
            ">
                ${esMiTurno ? '⚔ TU TURNO' : '⏳ TURNO DEL RIVAL'}
            </div>

            <!-- MI PJ -->
            <div style="padding: 12px 16px; border-top: 1px solid #2a1808;">
                <div style="color:#6a4018; font-size:9px; letter-spacing:2px;">TÚ</div>
                <div style="color:#d4a060; font-size:12px; letter-spacing:2px; margin: 2px 0;">
                    ${miPJ.nombre} <span style="color:#6a4018; font-size:9px;">${miPJ.clase}</span>
                </div>
                <div style="background:#1a0e08; border:1px solid #3a2008; border-radius:3px; height:10px; margin-top:4px;">
                    <div id="barraHPMio" style="height:100%; width:100%; background:linear-gradient(90deg,#208040,#40c060); border-radius:3px; transition:width 0.4s;"></div>
                </div>
                <div style="color:#9a7040; font-size:9px; margin-top:2px;">
                    HP: <span id="pjHP">${miPJ.hp}</span>/100
                    &nbsp;|&nbsp; Energía: <span id="pjEnergia">${miPJ.energia}</span>
                </div>
            </div>

            <!-- MENÚ RADIAL -->
            <div style="display:flex; justify-content:center; padding: 16px 0 20px;">
                <div id="menuRadial" class="radial-container">
                    <button id="btnAtacar" class="accion-btn">⚔️</button>
                    <button id="btnDef"    class="accion-btn">🛡️</button>
                    <button id="btnCarta"  class="accion-btn">🃏</button>
                    <button id="btnHab"    class="accion-btn">✨</button>
                    <button id="btnCentral" class="central-btn">ACCIÓN</button>
                </div>
            </div>
        </div>
    `;

    // Eventos botones
    document.getElementById('btnCentral').addEventListener('click', () => {
        if (!esMiTurno) return;
        document.getElementById('menuRadial').classList.toggle('active');
    });
    document.getElementById('btnAtacar').addEventListener('click', () => enviarAccion('atacar'));
    document.getElementById('btnDef').addEventListener('click',    () => enviarAccion('defender'));
    document.getElementById('btnCarta').addEventListener('click',  () => enviarAccion('carta'));
    document.getElementById('btnHab').addEventListener('click',    () => enviarAccion('habilidad'));
}

// ── ENVIAR ACCIÓN ──
function enviarAccion(tipo) {
    if (!partidaActualId || !esMiTurno) return;
    socket.emit('ejecutarAccion', {
        partidaId: partidaActualId,
        tipo,
        atacante: miPJ,
        defensor: rivalPJ
    });
    document.getElementById('menuRadial').classList.remove('active');
    esMiTurno = false;
    actualizarIndicadorTurno();
}

// ── ACTUALIZAR INDICADOR DE TURNO ──
function actualizarIndicadorTurno() {
    const el = document.getElementById('indicadorTurno');
    if (!el) return;
    el.textContent = esMiTurno ? '⚔ TU TURNO' : '⏳ TURNO DEL RIVAL';
    el.style.color  = esMiTurno ? '#60d060'    : '#c85030';
}

// ── LOG DE BATALLA ──
socket.on('logBatalla', (mensaje) => {
    const log = document.getElementById('logBatalla');
    if (!log) return;
    log.innerHTML += `<div>▸ ${mensaje}</div>`;
    log.scrollTop = log.scrollHeight;
});

// ── ACTUALIZAR HP ──
socket.on('actualizarEstado', (datos) => {
    // Identificar cuál HP es mío y cuál del rival
    const miHP    = datos.socketJ1 === socket.id ? datos.j1 : datos.j2;
    const rivalHP = datos.socketJ1 === socket.id ? datos.j2 : datos.j1;

    miPJ.hp    = miHP;
    rivalPJ.hp = rivalHP;

    document.getElementById('pjHP').textContent    = miHP;
    document.getElementById('rivalHP').textContent = rivalHP;
    document.getElementById('barraHPMio').style.width    = Math.max(0, miHP)    + '%';
    document.getElementById('barraHPRival').style.width  = Math.max(0, rivalHP) + '%';

    // Cambio de turno
    esMiTurno = datos.turnoActual === socket.id;
    actualizarIndicadorTurno();
});

// ── FIN DE PARTIDA ──
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
    // Deshabilitar botones
    esMiTurno = false;
    actualizarIndicadorTurno();
    const central = document.getElementById('btnCentral');
    if (central) central.style.opacity = '0.4';
});
