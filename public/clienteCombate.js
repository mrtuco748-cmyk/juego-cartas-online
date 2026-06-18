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
        <div class="combate-container" style="
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
                    HP: <span id="rivalHP">${rivalPJ.hp}</span>/40
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
                    HP: <span id="pjHP">${miPJ.hp}</span>/40
                    &nbsp;|&nbsp; Energía: <span id="pjEnergia">${miPJ.energia}</span>
                </div>
            </div>

            <div style="display:flex; justify-content:center; padding: 16px 0 20px;">
                <div id="menuRadial" class="radial-container">
                    <button id="btnAtacar" class="accion-btn" title="Atacar">⚔️</button>
                    <button id="btnDescansar" class="accion-btn" title="Descansar">💤</button>
                    <button id="btnPose" class="accion-btn" title="Pose">🛡️</button>
                    <button id="btnCarta" class="accion-btn" title="Carta">🃏</button>
                    <button id="btnHab" class="accion-btn" title="Habilidad">✨</button>
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
    document.getElementById('barraHPMio').style.width = (Math.max(0, miHP) / 40 * 100) + '%';
    document.getElementById('barraHPRival').style.width = (Math.max(0, rivalHP) / 40 * 100) + '%';

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
