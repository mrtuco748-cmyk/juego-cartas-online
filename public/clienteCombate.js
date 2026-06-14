// clienteCombate.js
const socket = io(); // Tu conexión ya existente
let partidaActualId = null;

// Escuchar cuando la partida inicia para guardar el ID
socket.on('rivalEncontrado', (data) => {
    partidaActualId = data.partidaId;
    // Renderizar estado inicial aquí
});

// Función para enviar acción al servidor
function enviarAccion(tipo) {
    if (!partidaActualId) return;
    
    // Suponiendo que tienes los datos del PJ en una variable global
    const datosAccion = {
        partidaId: partidaActualId,
        tipo: tipo,
        atacante: miPJ, // Debes tener esto definido en tu cliente
        defensor: rivalPJ 
    };
    
    socket.emit('ejecutarAccion', datosAccion);
    document.getElementById('menuRadial').classList.remove('active');
}

// Eventos de los botones
document.getElementById('btnAtacar').addEventListener('click', () => enviarAccion('atacar'));
document.getElementById('btnCentral').addEventListener('click', () => {
    document.getElementById('menuRadial').classList.toggle('active');
});

// Escuchar actualizaciones del servidor (Log y HP)
socket.on('logBatalla', (mensaje) => {
    const log = document.getElementById('logBatalla');
    log.innerHTML += `<p>${mensaje}</p>`;
    log.scrollTop = log.scrollHeight; // Auto-scroll
});

socket.on('actualizarEstado', (datos) => {
    // Actualizar HP en pantalla
    document.getElementById('rivalHP').innerText = datos.j2;
    document.getElementById('pjHP').innerText = datos.j1;
});
