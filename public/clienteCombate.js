// clienteCombate.js
let partidaActualId = null;
let miPJ = null;
let rivalPJ = null;
let esMiTurno = false;
let accionesRestantes = 0;

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
    document.getElementById('pantallaCombate').innerHTML = `
        <div style="
            width: 360px;
            background: radial-gradient(ellipse at center top, #1a0e08 0%, #0a0604 100%);
            border: 3px solid #4a3010;
            border-radius: 8px;
            overflow: hidden;
            position: relative;
        ">
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

            <div id="logBatalla" style="
                height: 140px; overflow-y: auto; padding: 10px 14px;
                font-size: 10px; color: #9a7040; letter-spacing: 1px;
                border-bottom: 1px solid #2a1808; line-height: 1.8;
            "></div>

            <div id="indicadorTurno" style="
                text-align:center; padding: 6px;
                font-size: 9px; letter-spacing: 3px;
                color: ${esMiTurno ? '#60d060' : '#c85030'};
            ">
                ${esMiTurno ? `⚔ TU TURNO (acciones: ${accionesRestantes})` : '⏳ TURNO DEL RIVAL'}
            </div>

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

            <div style="display:flex; justify-content:center; padding: 16px 0 20px;">
                <div id="menuRadial" class="radial-container">
                    <button id="btnAtacar" class="accion-btn">⚔️</button>
                    <button id="btnDescansar" class="accion-btn">💤</button>
                    <button id="btnPose" class="accion-btn">🛡️</button>
                    <button id="btnCarta" class="accion-btn">🃏</button>
                    <button id="btnHab" class="accion-btn">✨</button>
                    <button id="btnCentral" class="central-btn">${esMiTurno ? `ACCIÓN\n(${accionesRestantes}/2)` : 'ESPERA'}</button>
                </div>
            </div>
        </div>
    `;

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

function enviarAccion(tipo) {
    if (!partidaActualId || !esMiTurno || accionesRestantes <= 0) return;
    document.getElementById('menuRadial').classList.remove('active');
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
    el.textContent = esMiTurno
        ? `⚔ TU TURNO (acciones: ${accionesRestantes})`
        : '⏳ TURNO DEL RIVAL';
    el.style.color = esMiTurno ? '#60d060' : '#c85030';
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

socket.on('logBatalla', (mensaje) => {
    const log = document.getElementById('logBatalla');
    if (!log) return;
    log.innerHTML += `<div>▸ ${mensaje}</div>`;
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
    document.getElementById('barraHPMio').style.width = Math.max(0, miHP) + '%';
    document.getElementById('barraHPRival').style.width = Math.max(0, rivalHP) + '%';

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
});
