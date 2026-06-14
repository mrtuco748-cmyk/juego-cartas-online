const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
 
// ── CONEXIÓN MONGODB ──


const MONGO_URI = process.env.MONGO_URI || 'mongodb://mrtSpill:p3Lr9hWAkM9iTtq5@ac-tlf2b3l-shard-00-00.mwaqd74.mongodb.net:27017,ac-tlf2b3l-shard-00-01.mwaqd74.mongodb.net:27017,ac-tlf2b3l-shard-00-02.mwaqd74.mongodb.net:27017/loop?ssl=true&replicaSet=atlas-10e4ba-shard-0&authSource=admin&retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado a MongoDB Atlas'))
    .catch(err => console.error('❌ Error MongoDB:', err.message));
 
// ── ESQUEMAS ──
const personajeSchema = new mongoose.Schema({
    nombre: String,
    clase: String,
    fuerza: Number,
    resistencia: Number,
    velocidad: Number,
    magia: Number,
    suerte: Number,
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
    personajes: [personajeSchema]
}, { timestamps: true });
 
const Cuenta = mongoose.model('Cuenta', cuentaSchema);
 
app.use(express.static('public'));
 
let players = [];
 
io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado:', socket.id);
 
    // ── CREAR CUENTA ──
    socket.on('crearCuenta', async ({ nombre, password }) => {
        console.log('📝 Intento de crear cuenta:', nombre);
        try {
            const existe = await Cuenta.findOne({ nombre });
            if (existe) {
                socket.emit('errorCuenta', 'Ya existe una cuenta con ese nombre.');
                return;
            }
            const hash = bcrypt.hashSync(password, 10);
            const cuenta = await Cuenta.create({ nombre, password: hash });
            console.log('✅ Cuenta creada:', nombre);
            socket.emit('cuentaCreada', {
                id: cuenta._id,
                nombre: cuenta.nombre,
                dinero: cuenta.dinero,
                nivel: cuenta.nivel,
                experiencia: cuenta.experiencia,
                personajes: cuenta.personajes
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
            if (!cuenta) {
                socket.emit('errorLogin', 'Cuenta no encontrada.');
                return;
            }
            const valida = bcrypt.compareSync(password, cuenta.password);
            if (!valida) {
                socket.emit('errorLogin', 'Contraseña incorrecta.');
                return;
            }
            console.log('✅ Login exitoso:', nombre);
            socket.emit('loginExitoso', {
                id: cuenta._id,
                nombre: cuenta.nombre,
                dinero: cuenta.dinero,
                nivel: cuenta.nivel,
                experiencia: cuenta.experiencia,
                personajes: cuenta.personajes
            });
        } catch (err) {
            console.error('❌ Error en login:', err.message);
            socket.emit('errorLogin', 'Error al iniciar sesión.');
        }
    });
 
    // ── GUARDAR PERSONAJE ──
    socket.on('guardarPersonaje', async (datos) => {
        console.log('📨 Personaje recibido de', socket.id, ':', datos);
 
        const suma = datos.fuerza + datos.resistencia + datos.velocidad + datos.magia + datos.suerte;
        if (suma !== 25 || datos.fuerza < 2 || datos.resistencia < 2 || datos.velocidad < 2 || datos.magia < 2 || datos.suerte < 2) {
            console.log('❌ Stats inválidos, suma:', suma);
            socket.emit('errorPersonaje', 'Los puntos deben sumar 25 (mínimo 2 por categoría).');
            return;
        }
 
        try {
            if (datos.cuenta_id) {
                const cuenta = await Cuenta.findById(datos.cuenta_id);
                if (cuenta) {
                    cuenta.personajes.push({
                        nombre: datos.nombre,
                        clase: datos.clase,
                        fuerza: datos.fuerza,
                        resistencia: datos.resistencia,
                        velocidad: datos.velocidad,
                        magia: datos.magia,
                        suerte: datos.suerte
                    });
                    await cuenta.save();
                    console.log('✅ Personaje guardado en cuenta:', cuenta.nombre);
                    socket.emit('personajeGuardado', datos);
                }
            }
 
            // Lógica original de partida
            const player = players.find(p => p.id === socket.id);
            if (player) {
                player.personaje = datos;
                socket.emit('confirmacion', 'Personaje guardado. Esperando al oponente...');
                if (players.length === 2 && players[0].personaje && players[1].personaje) {
                    io.emit('partidaLista', '¡Ambos personajes listos! La partida comienza.');
                }
            }
        } catch (err) {
            console.error('❌ Error guardando personaje:', err.message);
            socket.emit('errorPersonaje', 'Error al guardar el personaje.');
        }
    });
 
    // ── LÓGICA ORIGINAL DE PARTIDA ──
    if (players.length < 2) {
        const rol = players.length === 0 ? 'Jugador 1' : 'Jugador 2';
        players.push({ id: socket.id, role: rol, personaje: null });
        socket.emit('asignarRol', rol);
    }
 
    socket.on('disconnect', () => {
        players = players.filter(p => p.id !== socket.id);
        console.log('❌ Cliente desconectado:', socket.id);
    });
});
 
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
