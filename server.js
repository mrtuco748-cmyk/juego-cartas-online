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
    personajes: [personajeSchema]
}, { timestamps: true });

const Cuenta = mongoose.model('Cuenta', cuentaSchema);

app.use(express.static('public'));
app.get('/socket.io/socket.io.js', (req, res) => {
    res.sendFile(require.resolve('socket.io/client-dist/socket.io.js'));
});

// ── ESTADO DEL SERVIDOR ──
let colaEspera = [];
let partidas = {};

io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);

    // ── LÓGICA DE COMBATE ──
    socket.on('ejecutarAccion', ({ partidaId, tipo, atacante, defensor }) => {
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
            // Limpiar poses
            partida.jugador1.pose = null;
            partida.jugador2.pose = null;

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
                foto: cuenta.foto, personajes: cuenta.personajes
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
                foto: cuenta.foto, personajes: cuenta.personajes
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
        // Notificar al rival si había partida activa
        for (const [id, partida] of Object.entries(partidas)) {
            if (partida.jugador1.socketId === socket.id || partida.jugador2.socketId === socket.id) {
                const rivalId = partida.jugador1.socketId === socket.id
                    ? partida.jugador2.socketId
                    : partida.jugador1.socketId;
                io.to(rivalId).emit('finPartida', { ganador: rivalId, motivo: 'El rival se desconectó.' });
                delete partidas[id];
            }
        }
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        console.log('❌ Cliente desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
