const GameEngine = require('./gameEngine');

const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
    path: '/socket.io/',
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://mrtSpill:p3Lr9hWAkM9iTtq5@ac-tlf2b3l-shard-00-00.mwaqd74.mongodb.net:27017,ac-tlf2b3l-shard-00-01.mwaqd74.mongodb.net:27017,ac-tlf2b3l-shard-00-02.mwaqd74.mongodb.net:27017/loop?ssl=true&replicaSet=atlas-10e4ba-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error MongoDB:', err.message));

const personajeSchema = new mongoose.Schema({
    nombre: String, clase: String,
    fuerza: Number, resistencia: Number, velocidad: Number, magia: Number, suerte: Number,
    hp: { type: Number, default: 100 },
    energia: { type: Number, default: 100 },
    nivel: { type: Number, default: 1 },
    experiencia: { type: Number, default: 0 },
    puntosStats: { type: Number, default: 0 },
    tas: { type: Array, default: [] },
    tps: { type: Array, default: [] }
});

const cuentaSchema = new mongoose.Schema({
    nombre: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    dinero: { type: Number, default: 0 },
    nivel: { type: Number, default: 1 },
    experiencia: { type: Number, default: 0 },
    foto: { type: String, default: '' },
    dev: { type: Boolean, default: false },
    personajes: [personajeSchema]
}, { timestamps: true });

const Cuenta = mongoose.model('Cuenta', cuentaSchema);

app.use(express.static('public'));
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
});

// ── RUTA TEMPORAL DE MIGRACIÓN (eliminar después de usar) ──
app.get('/dev-activar', async (req, res) => {
    const key = req.query.key;
    const user = req.query.user;
    if (key !== 'L00pDev2024Secret!') { return res.status(403).send('❌ Clave incorrecta'); }
    try {
        const cuenta = await Cuenta.findOne({ nombre: user });
        if (!cuenta) return res.status(404).send('❌ Usuario no encontrado');
        cuenta.dev = true;
        for (const pj of cuenta.personajes) {
            if (pj.nivel > 1 && (!pj.puntosStats || pj.puntosStats === 0)) {
                pj.puntosStats = (pj.nivel - 1) * 3;
            }
        }
        await cuenta.save();
        res.send(`✅ Usuario "${user}" activado como dev. Personajes actualizados.`);
    } catch (err) {
        res.status(500).send('❌ Error: ' + err.message);
    }
});

// ── ESTADO DEL SERVIDOR ──
let colaEspera = [];
let partidas = {};

async function otorgarXP(cuentaId, personajeId, xp) {
    try {
        if (!cuentaId || !personajeId) return null;
        const cuenta = await Cuenta.findById(cuentaId);
        if (!cuenta) return null;
        const pj = cuenta.personajes.id(personajeId);
        if (!pj) return null;
        pj.experiencia = (pj.experiencia || 0) + xp;
        while (pj.experiencia >= pj.nivel) {
            pj.experiencia -= pj.nivel;
            pj.nivel++;
            pj.puntosStats = (pj.puntosStats || 0) + 3;
        }
        await cuenta.save();
        return cuenta;
    } catch (err) {
        console.error('Error al otorgar XP:', err.message);
        return null;
    }
}

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    // ── LÓGICA DE COMBATE ──
    socket.on('ejecutarAccion', async ({ partidaId, tipo, atacante, defensor }) => {
        const partida = partidas[partidaId];
        if (!partida || partida.turnoActual !== socket.id) return;

        const soyJ1 = socket.id === partida.jugador1.socketId;
        const yo = soyJ1 ? partida.jugador1 : partida.jugador2;
        const rival = soyJ1 ? partida.jugador2 : partida.jugador1;

        if (partida.accionesUsadas.includes(tipo) && tipo !== 'ta') {
            socket.emit('errorAccion', 'Ya usaste esa acción este turno.');
            return;
        }

        partida.accionesUsadas.push(tipo);

        // ── ATACAR ──
        if (tipo === 'atacar') {
            const dado = Math.floor(Math.random() * 6) + 1;
            let danoFinal = Math.max(0, dado + atacante.fuerza - defensor.resistencia);
            let logMsg = `${atacante.nombre} ataca — Dado: ${dado} + F:${atacante.fuerza} - R:${defensor.resistencia} = ${danoFinal}`;

            // Revisar si el rival tiene pose activa
            if (rival.pose) {
                const { tipo: poseTipo, valor: poseValor } = rival.pose;
                if (poseTipo === 'esquivar') {
                    if (poseValor > dado) {
                        danoFinal = 0;
                        logMsg += ` — ¡${rival.personaje.nombre} ESQUIVA!`;
                    }
                } else if (poseTipo === 'parry') {
                    if (poseValor === (dado + atacante.fuerza)) {
                        danoFinal = 0;
                        partida.turnoMareado = socket.id;
                        logMsg += ` — ¡${rival.personaje ? rival.personaje.nombre : defensor.nombre} hace PARRY! ${atacante.nombre} pierde 1 turno.`;
                    }
                }
                rival.pose = null;
            }

            const multi = GameEngine.calcularCritico(atacante.velocidad, defensor.velocidad);
            const dano = Math.floor(danoFinal * (1 + multi));

            rival.hp -= dano;

            logMsg += multi > 0 ? ` (¡Crítico x${1+multi}!) → ${dano} daño` : ` → ${dano} daño`;
            io.to(partidaId).emit('logBatalla', logMsg);
        }

        // ── DESCANSAR ──
        if (tipo === 'descansar') {
            yo.hp = Math.min(100, yo.hp + 5);
            yo.energia = Math.min(100, yo.energia + 5);
            io.to(partidaId).emit('logBatalla', `${atacante.nombre} descansa → +5 HP, +5 energía`);
        }

        // ── POSE (esquivar / parry) ──
        if (tipo === 'pose') {
            const dadoPose = Math.floor(Math.random() * 6) + 1;
            if (atacante.resistencia > defensor.fuerza) {
                yo.pose = { tipo: 'parry', valor: dadoPose + atacante.resistencia };
                io.to(partidaId).emit('logBatalla', `${atacante.nombre} prepara PARRY (total: ${dadoPose}+R) — si iguala el ataque rival, lo marea`);
            } else {
                yo.pose = { tipo: 'esquivar', valor: dadoPose };
                io.to(partidaId).emit('logBatalla', `${atacante.nombre} prepara ESQUIVE (dado: ${dadoPose})`);
            }
        }

        // ── VERIFICAR FIN DE PARTIDA ──
        if (rival.hp <= 0) {
            io.to(partidaId).emit('logBatalla', `💀 ${defensor.nombre} ha caído. ¡${atacante.nombre} gana!`);
            io.to(partidaId).emit('actualizarEstado', {
                j1: partida.jugador1.hp, j2: partida.jugador2.hp,
                j1energia: partida.jugador1.energia, j2energia: partida.jugador2.energia,
                socketJ1: partida.jugador1.socketId,
                turnoActual: partida.turnoActual,
                accionesRestantes: 0
            });

            const ganadorSocket = socket.id;
            const perdedorSocket = ganadorSocket === partida.jugador1.socketId ? partida.jugador2.socketId : partida.jugador1.socketId;
            const ganadorData = ganadorSocket === partida.jugador1.socketId ? partida.jugador1 : partida.jugador2;
            const perdedorData = ganadorSocket === partida.jugador1.socketId ? partida.jugador2 : partida.jugador1;

            const [cuentaWinner, cuentaLoser] = await Promise.all([
                otorgarXP(ganadorData.cuenta_id, ganadorData.personaje._id, 1),
                otorgarXP(perdedorData.cuenta_id, perdedorData.personaje._id, 0.5)
            ]);

            if (cuentaWinner) io.to(ganadorSocket).emit('cuentaActualizada', cuentaWinner.toObject());
            if (cuentaLoser) io.to(perdedorSocket).emit('cuentaActualizada', cuentaLoser.toObject());

            io.to(partidaId).emit('finPartida', { ganador: socket.id });
            delete partidas[partidaId];
            return;
        }

        // ── CAMBIO DE TURNO ──
        const accionesRestantes = 2 - partida.accionesUsadas.length;

        if (accionesRestantes > 0) {
            io.to(partidaId).emit('actualizarEstado', {
                j1: partida.jugador1.hp, j2: partida.jugador2.hp,
                j1energia: partida.jugador1.energia, j2energia: partida.jugador2.energia,
                socketJ1: partida.jugador1.socketId,
                turnoActual: partida.turnoActual,
                accionesRestantes
            });
        } else {
            partida.accionesUsadas = [];
            // Si hay mareo, el jugador mareado pierde su turno
            if (partida.turnoMareado) {
                const mareado = partida.turnoMareado;
                partida.turnoMareado = null;
                const otroSocket = mareado === partida.jugador1.socketId
                    ? partida.jugador2.socketId : partida.jugador1.socketId;
                partida.turnoActual = otroSocket;
                io.to(partidaId).emit('logBatalla', `⏭ ${partida.turnoActual === partida.jugador1.socketId ? partida.jugador1.personaje.nombre : partida.jugador2.personaje.nombre} pierde el turno por mareo.`);
            } else {
                partida.turnoActual = soyJ1 ? partida.jugador2.socketId : partida.jugador1.socketId;
            }
            // Regenerar energía al jugador que inicia su turno
            const jugadorTurno = partida.turnoActual === partida.jugador1.socketId
                ? partida.jugador1 : partida.jugador2;
            const rivalTurno = partida.turnoActual === partida.jugador1.socketId
                ? partida.jugador2 : partida.jugador1;
            const energiaRegen = GameEngine.calcularRegeneracionEnergia(
                jugadorTurno.personaje.magia, rivalTurno.personaje.magia
            );
            jugadorTurno.energia = Math.min(100, jugadorTurno.energia + energiaRegen);
            io.to(partidaId).emit('logBatalla', `${jugadorTurno.personaje.nombre} recupera ${energiaRegen} de energía.`);
            io.to(partidaId).emit('actualizarEstado', {
                j1: partida.jugador1.hp, j2: partida.jugador2.hp,
                j1energia: partida.jugador1.energia, j2energia: partida.jugador2.energia,
                socketJ1: partida.jugador1.socketId,
                turnoActual: partida.turnoActual,
                accionesRestantes: 2
            });
        }
    });

    // ── CREAR CUENTA ──
    socket.on('crearCuenta', async ({ nombre, password }) => {
        console.log('📝 Intento de crear cuenta:', nombre);
        try {
            const existe = await Cuenta.findOne({ nombre });
            if (existe) { socket.emit('errorCuenta', 'Ya existe una cuenta con ese nombre.'); return; }
            const hash = bcrypt.hashSync(password, 10);
            const cuenta = await Cuenta.create({ nombre, password: hash });
            console.log('✅ Cuenta creada:', nombre);
            socket.emit('cuentaCreada', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            console.error('❌ Error al crear cuenta:', err.message);
            socket.emit('errorCuenta', 'Error al crear la cuenta.');
        }
    });

    // ── INICIAR SESIÓN ──
    socket.on('iniciarSesion', async ({ nombre, password }) => {
        console.log('🔑 Intento de login:', nombre);
        try {
            const cuenta = await Cuenta.findOne({ nombre });
            if (!cuenta) { socket.emit('errorLogin', 'Cuenta no encontrada.'); return; }
            const valida = bcrypt.compareSync(password, cuenta.password);
            if (!valida) { socket.emit('errorLogin', 'Contraseña incorrecta.'); return; }
            console.log('✅ Login exitoso:', nombre);
            socket.emit('loginExitoso', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            console.error('❌ Error en login:', err.message);
            socket.emit('errorLogin', 'Error al iniciar sesión.');
        }
    });

    // ── ACTUALIZAR PERFIL ──
    socket.on('actualizarPerfil', async ({ cuenta_id, nombre, password, foto }) => {
        try {
            const update = {};
            if (foto) update.foto = foto;
            if (nombre) update.nombre = nombre;
            if (password) update.password = bcrypt.hashSync(password, 10);
            const cuenta = await Cuenta.findByIdAndUpdate(cuenta_id, update, { new: true });
            if (!cuenta) { socket.emit('errorPerfil', 'Cuenta no encontrada.'); return; }
            console.log('✅ Perfil actualizado:', cuenta.nombre);
            socket.emit('perfilActualizado', { nombre: cuenta.nombre, foto: cuenta.foto || '' });
        } catch (err) {
            console.error('❌ Error actualizando perfil:', err.message);
            socket.emit('errorPerfil', 'Error al actualizar el perfil.');
        }
    });

    // ── GUARDAR PERSONAJE ──
    socket.on('guardarPersonaje', async (datos) => {
        console.log('📨 Personaje recibido de', socket.id, ':', datos.nombre);
        const suma = datos.fuerza + datos.resistencia + datos.velocidad + datos.magia + datos.suerte;
        if (suma !== 25 || datos.fuerza < 2 || datos.resistencia < 2 || datos.velocidad < 2 || datos.magia < 2 || datos.suerte < 2) {
            socket.emit('errorPersonaje', 'Los puntos deben sumar 25 (mínimo 2 por categoría).');
            return;
        }
        try {
            const cuenta = await Cuenta.findById(datos.cuenta_id);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
            cuenta.personajes.push({
                nombre: datos.nombre, clase: datos.clase,
                fuerza: datos.fuerza, resistencia: datos.resistencia,
                velocidad: datos.velocidad, magia: datos.magia, suerte: datos.suerte
            });
            await cuenta.save();
            const nuevoPJ = cuenta.personajes[cuenta.personajes.length - 1];
            console.log('✅ Personaje guardado:', datos.nombre);
            socket.emit('personajeGuardado', nuevoPJ);
        } catch (err) {
            console.error('❌ Error guardando personaje:', err.message);
            socket.emit('errorPersonaje', 'Error al guardar el personaje.');
        }
    });

    // ── ELIMINAR PERSONAJE ──
    socket.on('eliminarPersonaje', async ({ cuenta_id, personaje_id }) => {
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
            cuenta.personajes.pull(personaje_id);
            await cuenta.save();
            socket.emit('personajeEliminado', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            console.error('❌ Error eliminando personaje:', err.message);
            socket.emit('errorPersonaje', 'Error al eliminar el personaje.');
        }
    });

    // ── ASIGNAR STATS ──
    socket.on('asignarStats', async ({ cuenta_id, personaje_id, stats }) => {
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
            const pj = cuenta.personajes.id(personaje_id);
            if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }

            const pts = pj.puntosStats || 0;
            const usados = (stats.fuerza - pj.fuerza) + (stats.resistencia - pj.resistencia) +
                           (stats.velocidad - pj.velocidad) + (stats.magia - pj.magia) +
                           (stats.suerte - pj.suerte);
            if (usados > pts) { socket.emit('errorPersonaje', 'No tenés suficientes puntos.'); return; }
            if (stats.fuerza < 2 || stats.resistencia < 2 || stats.velocidad < 2 || stats.magia < 2 || stats.suerte < 2) {
                socket.emit('errorPersonaje', 'Mínimo 2 puntos por estadística.'); return;
            }

            pj.fuerza = stats.fuerza;
            pj.resistencia = stats.resistencia;
            pj.velocidad = stats.velocidad;
            pj.magia = stats.magia;
            pj.suerte = stats.suerte;
            pj.puntosStats = pts - usados;

            await cuenta.save();
            socket.emit('statsAsignados', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            console.error('❌ Error asignando stats:', err.message);
            socket.emit('errorPersonaje', 'Error al asignar stats.');
        }
    });

    // ── COMANDO DEV ──
    socket.on('devComando', async ({ cuenta_id, accion, params }) => {
        try {
            const devCuenta = await Cuenta.findById(cuenta_id);
            if (!devCuenta || !devCuenta.dev) { socket.emit('errorPersonaje', 'Acceso denegado.'); return; }

            // Buscar otro usuario
            if (accion === 'buscarUsuario') {
                const target = await Cuenta.findOne({ nombre: params.username });
                if (!target) { socket.emit('errorPersonaje', 'Usuario no encontrado.'); return; }
                socket.emit('devUsuarioEncontrado', {
                    id: target._id, nombre: target.nombre, dinero: target.dinero,
                    nivel: target.nivel, experiencia: target.experiencia,
                    foto: target.foto, personajes: target.personajes
                });
                return;
            }

            // Cuenta destino: por defecto la propia, o la que se pasa como targetId
            const targetId = params.targetId || cuenta_id;
            const cuenta = await Cuenta.findById(targetId);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta destino no encontrada.'); return; }

            if (accion === 'addDinero') {
                cuenta.dinero = Math.max(0, (cuenta.dinero || 0) + params.valor);
            } else if (accion === 'addXP') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                pj.experiencia = Math.max(0, (pj.experiencia || 0) + params.valor);
                while (pj.experiencia >= pj.nivel) {
                    pj.experiencia -= pj.nivel;
                    pj.nivel++;
                    pj.puntosStats = (pj.puntosStats || 0) + 3;
                }
            } else if (accion === 'addPuntosStats') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                pj.puntosStats = Math.max(0, (pj.puntosStats || 0) + params.valor);
            } else if (accion === 'eliminarPJ') {
                cuenta.personajes.pull(params.personaje_id);
            } else if (accion === 'setXP') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                pj.experiencia = Math.max(0, params.valor);
                while (pj.experiencia >= pj.nivel) {
                    pj.experiencia -= pj.nivel;
                    pj.nivel++;
                    pj.puntosStats = (pj.puntosStats || 0) + 3;
                }
            } else if (accion === 'setPuntosStats') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                pj.puntosStats = Math.max(0, params.valor);
            } else if (accion === 'setNivel') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                pj.nivel = Math.max(1, params.valor);
            } else if (accion === 'setStats') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                if (params.fuerza !== undefined) pj.fuerza = Math.max(2, params.fuerza);
                if (params.resistencia !== undefined) pj.resistencia = Math.max(2, params.resistencia);
                if (params.velocidad !== undefined) pj.velocidad = Math.max(2, params.velocidad);
                if (params.magia !== undefined) pj.magia = Math.max(2, params.magia);
                if (params.suerte !== undefined) pj.suerte = Math.max(2, params.suerte);
            } else {
                socket.emit('errorPersonaje', 'Comando desconocido.'); return;
            }

            await cuenta.save();
            socket.emit('devResultado', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            console.error('❌ Error en comando dev:', err.message);
            socket.emit('errorPersonaje', 'Error al ejecutar comando.');
        }
    });

    // ── BUSCAR PARTIDA ──
    socket.on('buscarPartida', ({ cuenta_id, personaje }) => {
    console.log('🔍 Buscando partida para:', personaje.nombre);
    colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
    colaEspera.push({ socketId: socket.id, cuenta_id, personaje });
    socket.emit('esperandoRival');

    if (colaEspera.length >= 2) {
        const jugador1 = colaEspera.shift();
        const jugador2 = colaEspera.shift();
        const partidaId = `${jugador1.socketId}-${jugador2.socketId}`;

        // Orden de turno: mayor velocidad empieza
        const ordenTurnos = GameEngine.calcularTurnoInicial([
            { socketId: jugador1.socketId, velocidad: jugador1.personaje.velocidad },
            { socketId: jugador2.socketId, velocidad: jugador2.personaje.velocidad }
        ]);
        const turnoInicial = ordenTurnos[0].socketId;

        partidas[partidaId] = {
            id: partidaId,
            jugador1: { ...jugador1, hp: 40, energia: 0, pose: null },
            jugador2: { ...jugador2, hp: 40, energia: 0, pose: null },
            turnoActual: turnoInicial,
            turno: 1,
            accionesUsadas: [],
            turnoMareado: null
        };

        console.log(`⚔️ Partida iniciada: ${jugador1.personaje.nombre} vs ${jugador2.personaje.nombre}`);

        const socketJ1 = io.sockets.sockets.get(jugador1.socketId);
        const socketJ2 = io.sockets.sockets.get(jugador2.socketId);
        if (socketJ1) socketJ1.join(partidaId);
        if (socketJ2) socketJ2.join(partidaId);

        // Energía inicial al primer jugador
        const primerJugador = turnoInicial === jugador1.socketId ? partidas[partidaId].jugador1 : partidas[partidaId].jugador2;
        const rivalJugador = turnoInicial === jugador1.socketId ? partidas[partidaId].jugador2 : partidas[partidaId].jugador1;
        const energiaInicial = GameEngine.calcularRegeneracionEnergia(
            primerJugador.personaje.magia, rivalJugador.personaje.magia
        );
        primerJugador.energia = Math.min(100, primerJugador.energia + energiaInicial);

        const esJ1Primero = turnoInicial === jugador1.socketId;

        io.to(jugador1.socketId).emit('rivalEncontrado', {
            partidaId,
            yo: { ...jugador1.personaje, hp: 40, energia: 0 },
            rival: {
                nombre: jugador2.personaje.nombre,
                clase: jugador2.personaje.clase,
                hp: 40, energia: 0,
                fuerza: jugador2.personaje.fuerza,
                resistencia: jugador2.personaje.resistencia,
                velocidad: jugador2.personaje.velocidad,
                magia: jugador2.personaje.magia,
                suerte: jugador2.personaje.suerte
            },
            turnoActual: turnoInicial,
            esmiTurno: esJ1Primero,
            accionesRestantes: esJ1Primero ? 2 : 0
        });

        io.to(jugador2.socketId).emit('rivalEncontrado', {
            partidaId,
            yo: { ...jugador2.personaje, hp: 40, energia: 0 },
            rival: {
                nombre: jugador1.personaje.nombre,
                clase: jugador1.personaje.clase,
                hp: 40, energia: 0,
                fuerza: jugador1.personaje.fuerza,
                resistencia: jugador1.personaje.resistencia,
                velocidad: jugador1.personaje.velocidad,
                magia: jugador1.personaje.magia,
                suerte: jugador1.personaje.suerte
            },
            turnoActual: turnoInicial,
            esmiTurno: !esJ1Primero,
            accionesRestantes: !esJ1Primero ? 2 : 0
        });
    }
});

    // ── CANCELAR BÚSQUEDA ──
    socket.on('cancelarBusqueda', () => {
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        console.log('❌ Búsqueda cancelada:', socket.id);
    });

    socket.on('disconnect', () => {
        for (const [id, partida] of Object.entries(partidas)) {
            if (partida.jugador1.socketId === socket.id || partida.jugador2.socketId === socket.id) {
                const rivalId = partida.jugador1.socketId === socket.id
                    ? partida.jugador2.socketId
                    : partida.jugador1.socketId;
                const rivalData = partida.jugador1.socketId === socket.id
                    ? partida.jugador2
                    : partida.jugador1;
                io.to(rivalId).emit('finPartida', { ganador: rivalId, motivo: 'El rival se desconectó.' });

                otorgarXP(rivalData.cuenta_id, rivalData.personaje._id, 1).then(cuenta => {
                    if (cuenta) io.to(rivalId).emit('cuentaActualizada', cuenta.toObject());
                });

                delete partidas[id];
            }
        }
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        console.log('❌ Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
