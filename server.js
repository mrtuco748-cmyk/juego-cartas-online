const { GameProcessor, SKILLS_DATA, CLASS_DATA, MAZOS, aplicarModsClase, getMaxHP } = require('./gameEngine');
const gp = new GameProcessor();

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
    .then(() => console.log('Conectado a MongoDB Atlas'))
    .catch(err => console.error('Error MongoDB:', err.message));

const personajeSchema = new mongoose.Schema({
    nombre: String, clase: String,
    fuerza: Number, resistencia: Number, velocidad: Number, magia: Number, suerte: Number,
    hp: { type: Number, default: 100 },
    energia: { type: Number, default: 100 },
    nivel: { type: Number, default: 1 },
    experiencia: { type: Number, default: 0 },
    puntosStats: { type: Number, default: 0 },
    tas: { type: Array, default: [] },
    tps: { type: Array, default: [] },
    foto: { type: String, default: '' }
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

app.get('/dev-activar', async (req, res) => {
    const key = req.query.key;
    const user = req.query.user;
    if (key !== 'L00pDev2024Secret!') { return res.status(403).send('Clave incorrecta'); }
    try {
        const cuenta = await Cuenta.findOne({ nombre: user });
        if (!cuenta) return res.status(404).send('Usuario no encontrado');
        cuenta.dev = true;
        for (const pj of cuenta.personajes) {
            if (pj.nivel > 1 && (!pj.puntosStats || pj.puntosStats === 0)) {
                pj.puntosStats = (pj.nivel - 1) * 3;
            }
        }
        await cuenta.save();
        res.send(`Usuario "${user}" activado como dev. Personajes actualizados.`);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
});

let colaEspera = [];
let partidas = {};

function getSkillsParaClase(clase) {
    const skillsPorClase = {
        Chaman: ["golpe_directo", "curacion_divina", "escudo_arcano", "drenar_vida"],
        Sacerdote: ["curacion_divina", "bendicion", "sello_silencio", "escudo_arcano"],
        Druida: ["rafaga", "drenar_vida", "regeneracion", "escarcha"],
        Guerrero: ["golpe_directo", "golpe_veloz", "furia_berserker", "explosion_mana"],
        Paladin: ["golpe_directo", "escudo_arcano", "curacion_divina", "bendicion"],
        Berserker: ["golpe_directo", "furia_berserker", "golpe_veloz", "sacrificio"],
        Acorazado: ["escudo_arcano", "cubo_perfecto", "golpe_directo", "reflejo_magico"],
        Ogro: ["golpe_directo", "golpe_veloz", "tormenta", "sacrificio"],
        Golem: ["escudo_arcano", "cubo_perfecto", "golpe_directo", "explosion_mana"],
        Picaro: ["golpe_veloz", "golpe_directo", "drenar_vida", "cubo_perfecto"],
        Ninja: ["golpe_veloz", "golpe_directo", "drenar_vida", "sello_silencio"],
        Cazador: ["golpe_directo", "golpe_veloz", "rafaga", "escarcha"],
        Mago: ["explosion_mana", "tormenta", "escarcha", "drenar_vida"],
        MagoMaestro: ["explosion_mana", "tormenta", "cataclismo", "sello_silencio"],
        MagoGuerrero: ["golpe_directo", "explosion_mana", "escudo_arcano", "golpe_veloz"],
        SemiDios: ["cataclismo", "curacion_divina", "bendicion", "invocacion"],
        Demonio: ["sacrificio", "maldicion", "drenar_vida", "tormenta"],
        Titan: ["cataclismo", "golpe_directo", "escudo_arcano", "cubo_perfecto"]
    };
    return (skillsPorClase[clase] || ["golpe_directo", "golpe_veloz", "curacion_divina", "escudo_arcano"]).map(id => ({ ...SKILLS_DATA.activas[id], id })).filter(Boolean);
}

function getPasivasClase(clase) {
    const pasivas = {};
    const ids = gp.getPasivasPorDefecto(clase);
    ids.forEach(id => {
        if (SKILLS_DATA.pasivas[id]) pasivas[id] = SKILLS_DATA.pasivas[id];
    });
    return pasivas;
}

function getMazosCliente(jugadorPartida) {
    return {
        inventario: jugadorPartida.inventario || [],
        equipment: jugadorPartida.equipment || { arma: null, armadura: null, accesorio: null }
    };
}

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
        console.error('Error XP:', err.message);
        return null;
    }
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function partidaEmitirEstado(partidaId, partida) {
    const j1s = getSkillsParaClase(partida.jugador1.personaje.clase);
    const j2s = getSkillsParaClase(partida.jugador2.personaje.clase);

    const j1m = getMazosCliente(partida.jugador1);
    const j2m = getMazosCliente(partida.jugador2);

    io.to(partidaId).emit('actualizarEstado', {
        j1: partida.jugador1.hp, j2: partida.jugador2.hp,
        j1energia: partida.jugador1.energia, j2energia: partida.jugador2.energia,
        socketJ1: partida.jugador1.socketId,
        turnoActual: partida.turnoActual,
        accionesRestantes: partida.accionesMax - partida.accionesUsadas.length,
        j1status: partida.jugador1.status || {},
        j2status: partida.jugador2.status || {},
        j1skills: j1s, j2skills: j2s,
        pasivasJ1: Object.keys(partida.jugador1.pasivas),
        pasivasJ2: Object.keys(partida.jugador2.pasivas),
        extraActionJ1: partida.jugador1.extraAction || false,
        extraActionJ2: partida.jugador2.extraAction || false,
        objetosRecibidosJ1: partida.jugador1.objetosRecibidos || [],
        objetosRecibidosJ2: partida.jugador2.objetosRecibidos || [],
        ...(j1m.inventario ? {
            inventarioJ1: j1m.inventario,
            inventarioJ2: j2m.inventario,
            equipmentJ1: j1m.equipment,
            equipmentJ2: j2m.equipment
        } : {})
    });
}

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('ejecutarAccion', async ({ partidaId, tipo, atacante, defensor, cartaId, accionData }) => {
        const partida = partidas[partidaId];
        if (!partida) return;

        const soyJ1 = socket.id === partida.jugador1.socketId;
        const yo = soyJ1 ? partida.jugador1 : partida.jugador2;
        const rival = soyJ1 ? partida.jugador2 : partida.jugador1;

        // TA puede interrumpir incluso fuera de turno
        if (tipo === 'carta' && cartaId) {
            return procesarCarta(partidaId, partida, socket.id, yo, rival, cartaId);
        }

        if (partida.turnoActual !== socket.id) {
            socket.emit('errorAccion', 'No es tu turno.');
            return;
        }

        if (yo.status && yo.status.frozen > 0) {
            socket.emit('errorAccion', 'Estás paralizado.');
            return;
        }

        if (yo.status && yo.status.silenced > 0 && tipo !== 'atacar' && tipo !== 'descansar') {
            socket.emit('errorAccion', 'Estás silenciado.');
            return;
        }

        const accionesMax = partida.accionesMax || 2;
        if (partida.accionesUsadas.length >= accionesMax) {
            socket.emit('errorAccion', 'No te quedan acciones.');
            return;
        }

        partida.accionesUsadas.push(tipo);

        const statsYo = gp.calcularStatsConBuffs(yo);
        const statsRival = gp.calcularStatsConBuffs(rival);

        switch (tipo) {
            case 'atacar': {
                const dado = Math.floor(Math.random() * 6) + 1;
                let danoBase = Math.max(0, dado + statsYo.fuerza - statsRival.resistencia);
                let critMulti = gp.calcularCritico(statsYo.velocidad, statsRival.velocidad) + (yo.critBonus || 0);
                if (yo.critClase) critMulti = Math.max(critMulti, yo.critClase.multi);
                let danoFinal = Math.floor(danoBase * (1 + critMulti));
                if (yo.enrageBonus) danoFinal += yo.enrageBonus;

                let log = `${statsYo.nombre} ataca — ${dado}+F:${statsYo.fuerza}-R:${statsRival.resistencia}=${danoBase}`;

                if (rival.pose) {
                    if (rival.pose.tipo === 'esquivar' && rival.pose.valor > dado) {
                        io.to(partidaId).emit('logBatalla', { msg: `¡${rival.nombre} ESQUIVA!`, tipo: 'pose' });
                        rival.pose = null;
                        return partidaFinalizarAccion(partidaId, partida);
                    }
                    if (rival.pose.tipo === 'parry' && rival.pose.valor === (dado + statsYo.fuerza)) {
                        io.to(partidaId).emit('logBatalla', { msg: `¡${rival.nombre} hace PARRY! ${statsYo.nombre} pierde turno`, tipo: 'pose' });
                        partida.turnoMareado = socket.id;
                        rival.pose = null;
                        return partidaFinalizarAccion(partidaId, partida);
                    }
                    rival.pose = null;
                }

                if (rival.status && rival.status.shield > 0) {
                    const absorb = Math.min(rival.status.shield, danoFinal);
                    rival.status.shield -= absorb;
                    danoFinal -= absorb;
                    log += ` [escudo -${absorb}]`;
                }

                rival.hp -= danoFinal;

                if (yo.danoAHP) {
                    const conv = Math.min(danoFinal, yo.maxHp - yo.hp);
                    yo.hp += conv;
                    log += ` (convierte ${conv} daño a HP)`;
                }

                const pLog1 = gp.processPassives(yo.pasivas, yo, rival, 'on_hit', { damage: danoFinal, target: rival });
                const pLog2 = gp.processPassives(rival.pasivas, rival, yo, 'on_take_damage', { damage: danoFinal, target: yo });
                const pLog3 = gp.processPassives(yo.pasivas, yo, rival, 'on_attack', {});
                [...pLog1, ...pLog2, ...pLog3].forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

                log += critMulti > 0 ? ` (Crítico x${1+critMulti}) → ${danoFinal}` : ` → ${danoFinal}`;
                io.to(partidaId).emit('logBatalla', { msg: log, tipo: 'ataque' });
                break;
            }
            case 'descansar': {
                yo.hp = Math.min(yo.maxHp + (yo.hpOverflow || 0), yo.hp + 5);
                yo.energia = Math.min(100, yo.energia + 5);
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} descansa → +5 HP, +5 energía`, tipo: 'curacion' });
                break;
            }
            case 'pose': {
                const dadoPose = Math.floor(Math.random() * 6) + 1;
                if (statsYo.resistencia > statsRival.fuerza) {
                    yo.pose = { tipo: 'parry', valor: dadoPose + statsYo.resistencia };
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} prepara PARRY (${dadoPose}+R)`, tipo: 'pose' });
                } else {
                    yo.pose = { tipo: 'esquivar', valor: dadoPose };
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} prepara ESQUIVE (${dadoPose})`, tipo: 'pose' });
                }
                break;
            }
            case 'investigar': {
                const mazo = shuffleArray([...MAZOS.investigacion]);
                const carta = mazo[0];
                if (!carta) { socket.emit('errorAccion', 'No hay cartas en el mazo'); break; }
                if (carta.tipo === 'cofre') {
                    const mazoObj = MAZOS[carta.nombre.includes('Armas') ? 'armas' : 'accesorios'] || MAZOS.armas;
                    const cofre = shuffleArray([...mazoObj])[0];
                    if (cofre && gp.puedeAgregarInventario(yo.inventario, cofre)) {
                        yo.inventario.push({ ...cofre, _id: Date.now().toString() + Math.random() });
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra un cofre con: ${cofre.nombre}`, tipo: 'carta' });
                    } else {
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra un cofe pero está vacío`, tipo: 'carta' });
                    }
                } else if (carta.tipo === 'material' || carta.tipo === 'consumible') {
                    if (gp.puedeAgregarInventario(yo.inventario, carta)) {
                        yo.inventario.push({ ...carta, _id: Date.now().toString() + Math.random() });
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra: ${carta.nombre}`, tipo: 'carta' });
                    } else {
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra ${carta.nombre} pero no tiene espacio`, tipo: 'carta' });
                    }
                }
                break;
            }
            case 'crear': {
                const recetaNom = accionData && accionData.receta;
                if (!recetaNom) { socket.emit('errorAccion', 'Especificá qué crear'); break; }
                const receta = MAZOS.recetas.find(r => r.nombre === recetaNom);
                if (!receta) { socket.emit('errorAccion', 'Receta no encontrada'); break; }
                const result = gp.crearObjeto(yo.inventario, yo.inventario, receta);
                if (result.success) {
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} crea: ${receta.resultado.nombre}`, tipo: 'carta' });
                } else {
                    socket.emit('errorAccion', result.reason);
                }
                break;
            }
            case 'negociar': {
                const oferta = accionData && accionData.oferta;
                const pides = accionData && accionData.pides;
                if (!oferta || !pides) { socket.emit('errorAccion', 'Especificá oferta y petición'); break; }
                const idxOferta = yo.inventario.findIndex(o => o._id === oferta);
                const idxPides = rival.inventario.findIndex(o => o._id === pides);
                if (idxOferta === -1 || idxPides === -1) { socket.emit('errorAccion', 'Objeto no encontrado'); break; }
                const objO = yo.inventario.splice(idxOferta, 1)[0];
                const objP = rival.inventario.splice(idxPides, 1)[0];
                yo.inventario.push(objP);
                rival.inventario.push(objO);
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} negocia: ${objO.nombre} por ${objP.nombre}`, tipo: 'carta' });
                break;
            }
            case 'robar': {
                if (!rival.inventario || rival.inventario.length === 0) { socket.emit('errorAccion', 'El rival no tiene objetos'); break; }
                if (!gp.puedeAgregarInventario(yo.inventario, {})) { socket.emit('errorAccion', 'Inventario lleno'); break; }
                const rivalStats = gp.calcularStatsConBuffs(rival);
                const dadoRobo = Math.floor(Math.random() * 6) + 1 + statsYo.velocidad;
                const dificultad = rivalStats.velocidad + 3;
                if (dadoRobo > dificultad) {
                    const idx = Math.floor(Math.random() * rival.inventario.length);
                    const obj = rival.inventario.splice(idx, 1)[0];
                    yo.inventario.push(obj);
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} roba: ${obj.nombre}`, tipo: 'carta' });
                } else {
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} falló al robar`, tipo: 'carta' });
                }
                break;
            }
            case 'lanzar': {
                const objIdx = accionData && accionData.objIdx;
                if (objIdx === undefined || !yo.inventario[objIdx]) { socket.emit('errorAccion', 'Objeto inválido'); break; }
                const obj = yo.inventario[objIdx];
                const dadoL = Math.floor(Math.random() * 6) + 1;
                const danoL = Math.max(0, dadoL + (obj.peso || 0) + (obj.filo || 0));
                if (rival.status && rival.status.shield > 0) {
                    const absorb = Math.min(rival.status.shield, danoL);
                    rival.status.shield -= absorb;
                    rival.hp -= (danoL - absorb);
                } else {
                    rival.hp -= danoL;
                }
                const tirado = yo.inventario.splice(objIdx, 1)[0];
                rival.objetosRecibidos = rival.objetosRecibidos || [];
                rival.objetosRecibidos.push(tirado);
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} lanza ${obj.nombre}: ${danoL} daño`, tipo: 'ataque' });
                break;
            }
            case 'recibir': {
                if (!yo.objetosRecibidos || yo.objetosRecibidos.length === 0) { socket.emit('errorAccion', 'No hay objetos para recibir'); break; }
                const dadoRec = Math.floor(Math.random() * 6) + 1;
                const ultimoObj = yo.objetosRecibidos[yo.objetosRecibidos.length - 1];
                const dificultadRec = accionData ? (accionData.dificultad || 6) : 6;
                if (dadoRec > dificultadRec) {
                    if (gp.puedeAgregarInventario(yo.inventario, ultimoObj)) {
                        yo.inventario.push(yo.objetosRecibidos.pop());
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} atrapa ${ultimoObj.nombre}`, tipo: 'carta' });
                    } else {
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} atrapa pero no tiene espacio`, tipo: 'carta' });
                    }
                } else {
                    yo.objetosRecibidos.pop();
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} no logra atrapar el objeto`, tipo: 'carta' });
                }
                break;
            }
            case 'desviar': {
                if (!yo.objetosRecibidos || yo.objetosRecibidos.length === 0) { socket.emit('errorAccion', 'No hay objetos para desviar'); break; }
                const dadoDesv = Math.floor(Math.random() * 6) + 1;
                const dificultadDesv = accionData ? (accionData.dificultad || 6) : 6;
                if (dadoDesv > dificultadDesv) {
                    const objDesv = yo.objetosRecibidos.pop();
                    const target = accionData && accionData.redirigirA === 'rival' ? rival : null;
                    if (target) {
                        const dDesv = Math.max(0, (objDesv.peso || 0) + (objDesv.filo || 0));
                        target.hp -= dDesv;
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} desvía ${objDesv.nombre} causando ${dDesv} daño`, tipo: 'ataque' });
                    } else {
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} desvía ${objDesv.nombre} al suelo`, tipo: 'carta' });
                    }
                } else {
                    yo.objetosRecibidos.pop();
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} falla al desviar`, tipo: 'carta' });
                }
                break;
            }
            case 'reforzar': {
                if (!yo.equipment || !yo.equipment.arma) { socket.emit('errorAccion', 'No tenés arma equipada'); break; }
                const arma = yo.equipment.arma;
                arma.peso = (arma.peso || 0) + 1;
                arma.filo = (arma.filo || 0) + 1;
                yo.energia = Math.max(0, yo.energia - 5);
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} refuerza ${arma.nombre} (+1 peso, +1 filo)`, tipo: 'carta' });
                break;
            }
            case 'equipar': {
                const eqIdx = accionData && accionData.objIdx;
                if (eqIdx === undefined || !yo.inventario[eqIdx]) { socket.emit('errorAccion', 'Objeto inválido'); break; }
                const eqObj = yo.inventario[eqIdx];
                const slot = eqObj.tipo === 'arma' ? 'arma' : eqObj.tipo === 'armadura' ? 'armadura' : eqObj.tipo === 'accesorio' ? 'accesorio' : null;
                if (!slot) { socket.emit('errorAccion', 'Este objeto no se puede equipar'); break; }
                if (yo.equipment[slot]) {
                    yo.inventario.push({ ...yo.equipment[slot], _id: Date.now().toString() + Math.random() });
                }
                yo.equipment[slot] = eqObj;
                yo.inventario.splice(eqIdx, 1);
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} equipa ${eqObj.nombre}`, tipo: 'carta' });
                break;
            }
            case 'desequipar': {
                const slot = accionData && accionData.slot;
                if (!slot || !yo.equipment[slot]) { socket.emit('errorAccion', 'Nada que desequipar'); break; }
                if (gp.puedeAgregarInventario(yo.inventario, {})) {
                    yo.inventario.push({ ...yo.equipment[slot], _id: Date.now().toString() + Math.random() });
                    yo.equipment[slot] = null;
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} se quita ${slot}`, tipo: 'carta' });
                } else {
                    socket.emit('errorAccion', 'Inventario lleno');
                }
                break;
            }
            case 'usar_objeto': {
                const usarIdx = accionData && accionData.objIdx;
                if (usarIdx === undefined || !yo.inventario[usarIdx]) { socket.emit('errorAccion', 'Objeto inválido'); break; }
                const usarObj = yo.inventario[usarIdx];
                if (usarObj.efecto === 'cura') {
                    yo.hp = Math.min(yo.maxHp + (yo.hpOverflow || 0), yo.hp + usarObj.valor);
                    yo.inventario.splice(usarIdx, 1);
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} usa ${usarObj.nombre}: +${usarObj.valor} HP`, tipo: 'curacion' });
                } else if (usarObj.efecto === 'energia') {
                    yo.energia = Math.min(100, yo.energia + usarObj.valor);
                    yo.inventario.splice(usarIdx, 1);
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} usa ${usarObj.nombre}: +${usarObj.valor} energía`, tipo: 'energia' });
                } else {
                    socket.emit('errorAccion', 'Este objeto no se puede usar directamente');
                }
                break;
            }
        }

        partidaFinalizarAccion(partidaId, partida);
    });

    function procesarCarta(partidaId, partida, socketId, yo, rival, cartaId) {
        const carta = SKILLS_DATA.activas[cartaId];
        if (!carta) { io.to(socketId).emit('errorAccion', 'Carta no encontrada'); return; }

        if (yo.status && yo.status.silenced > 0) {
            io.to(socketId).emit('errorAccion', 'Estás silenciado'); return;
        }

        const ctx = { source: yo, rival };
        const result = gp.executeCard(carta, yo, rival, ctx);

        if (!result.success) {
            io.to(socketId).emit('errorAccion', result.reason);
            return;
        }

        if (result.log) io.to(partidaId).emit('logBatalla', { msg: result.log, tipo: 'carta' });

        const castCtx = { damage: result.damage || 0 };
        const spellLogs = gp.processPassives(yo.pasivas, yo, rival, 'on_cast', castCtx);
        spellLogs.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

        if (result.doubleAttack && rival.hp > 0) {
            const statsYo2 = gp.calcularStatsConBuffs(yo);
            const statsRiv2 = gp.calcularStatsConBuffs(rival);
            const dado2 = Math.floor(Math.random() * 6) + 1;
            let danoExtra = Math.max(0, dado2 + statsYo2.fuerza - statsRiv2.resistencia);
            const critExtra = gp.calcularCritico(statsYo2.velocidad, statsRiv2.velocidad);
            danoExtra = Math.floor(danoExtra * (1 + critExtra));
            if (rival.status && rival.status.shield > 0) {
                const absorb = Math.min(rival.status.shield, danoExtra);
                rival.status.shield -= absorb;
                danoExtra -= absorb;
            }
            rival.hp -= danoExtra;
            io.to(partidaId).emit('logBatalla', { msg: `Golpe extra: +${danoExtra} daño`, tipo: 'ataque' });
        }

        if (result.cancelAttack) {
            partida.accionCancelada = true;
        }

        partidaCheckMuerte(partidaId, partida);
    }

    function partidaCheckMuerte(partidaId, partida) {
        const ambos = [partida.jugador1, partida.jugador2];
        for (const j of ambos) {
            if (j.hp <= 0) {
                const reviveLogs = gp.processPassives(j.pasivas, j, null, 'on_death', {});
                reviveLogs.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });
            }
        }

        const muertos = ambos.filter(j => j.hp <= 0);
        if (muertos.length >= 1) {
            const vivos = ambos.filter(j => j.hp > 0);
            if (vivos.length >= 1) {
                const ganador = vivos[0];
                const perdedor = muertos[0];
                io.to(partidaId).emit('logBatalla', { msg: `${perdedor.nombre} ha caído. ${ganador.nombre} gana!`, tipo: 'muerte' });
                partidaEmitirEstado(partidaId, partida);

                const gSocket = ganador.socketId;
                const pSocket = perdedor.socketId;
                otorgarXP(ganador.cuenta_id, ganador.personaje._id, 1).then(c => { if (c) io.to(gSocket).emit('cuentaActualizada', c.toObject()); });
                otorgarXP(perdedor.cuenta_id, perdedor.personaje._id, 0.5).then(c => { if (c) io.to(pSocket).emit('cuentaActualizada', c.toObject()); });

                io.to(partidaId).emit('finPartida', { ganador: gSocket });
                delete partidas[partidaId];
                return true;
            }
        }
        return false;
    }

    function partidaFinalizarAccion(partidaId, partida) {
        const turnoActualSocket = partida.turnoActual;
        const yo = turnoActualSocket === partida.jugador1.socketId ? partida.jugador1 : partida.jugador2;
        const rival = turnoActualSocket === partida.jugador1.socketId ? partida.jugador2 : partida.jugador1;

        if (partidaCheckMuerte(partidaId, partida)) return;

        const accRest = partida.accionesMax - partida.accionesUsadas.length;

        if (accRest > 0 && !partida.accionCancelada) {
            partidaEmitirEstado(partidaId, partida);
            return;
        }

        partida.accionesUsadas = [];
        partida.accionCancelada = false;

        const statusLogs = [];
        [yo, rival].forEach(j => {
            gp.applyStatusEffects(j).forEach(l => statusLogs.push(l));
        });
        statusLogs.forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'status' }));

        if (partida.turnoMareado) {
            partida.turnoActual = partida.turnoMareado === partida.jugador1.socketId ? partida.jugador2.socketId : partida.jugador1.socketId;
            partida.turnoMareado = null;
            io.to(partidaId).emit('logBatalla', { msg: `Turno saltado por mareo`, tipo: 'marea' });
        } else if (yo.status && yo.status.frozen > 0) {
            partida.turnoActual = rival.socketId;
            io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} salta turno por paralisis`, tipo: 'status' });
        } else {
            partida.turnoActual = rival.socketId;
        }

        const jugTurno = partida.turnoActual === partida.jugador1.socketId ? partida.jugador1 : partida.jugador2;
        const rivTurno = partida.turnoActual === partida.jugador1.socketId ? partida.jugador2 : partida.jugador1;

        const magJug = jugTurno.personaje.magia;
        const magRiv = rivTurno.personaje.magia;
        const enRegen = gp.calcularRegeneracionEnergia(magJug, magRiv);
        jugTurno.energia = Math.min(100, jugTurno.energia + enRegen);

        const claseRegen = gp.aplicarHPRegenClase(jugTurno);
        if (claseRegen > 0) io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} regenera +${claseRegen} HP (clase)`, tipo: 'curacion' });

        if (partida.turno === 1) {
            gp.aplicarEfectosClase(jugTurno, true).forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'carta' }));
            gp.aplicarEfectosClase(rivTurno, true);
        }

        jugTurno.critBonus = 0;

        const tLogs1 = gp.processPassives(jugTurno.pasivas, jugTurno, rivTurno, 'on_turn_start', {});
        const tLogs2 = gp.processPassives(rivTurno.pasivas, rivTurno, jugTurno, 'on_turn_start', {});
        [...tLogs1, ...tLogs2].forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

        partida.accionesMax = 2 + (jugTurno.extraAction ? 1 : 0);
        jugTurno.extraAction = false;

        if (partida.turno === 1 && jugTurno.critClase) {
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre}: crítico ${jugTurno.critClase.multi * 100}% por ${jugTurno.critClase.duracion} turnos`, tipo: 'carta' });
        }

        io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} recupera ${enRegen} energía`, tipo: 'energia' });

        partida.turno++;
        partidaEmitirEstado(partidaId, partida);
    }

    socket.on('crearCuenta', async ({ nombre, password }) => {
        try {
            const existe = await Cuenta.findOne({ nombre });
            if (existe) { socket.emit('errorCuenta', 'Ya existe esa cuenta.'); return; }
            const hash = bcrypt.hashSync(password, 10);
            const cuenta = await Cuenta.create({ nombre, password: hash });
            socket.emit('cuentaCreada', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            socket.emit('errorCuenta', 'Error al crear cuenta.');
        }
    });

    socket.on('iniciarSesion', async ({ nombre, password }) => {
        try {
            const cuenta = await Cuenta.findOne({ nombre });
            if (!cuenta) { socket.emit('errorLogin', 'Cuenta no encontrada.'); return; }
            const valida = bcrypt.compareSync(password, cuenta.password);
            if (!valida) { socket.emit('errorLogin', 'Contraseña incorrecta.'); return; }
            socket.emit('loginExitoso', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes
            });
        } catch (err) {
            socket.emit('errorLogin', 'Error al iniciar sesión.');
        }
    });

    socket.on('actualizarPerfil', async ({ cuenta_id, nombre, password, foto }) => {
        try {
            const update = {};
            if (foto) update.foto = foto;
            if (nombre) update.nombre = nombre;
            if (password) update.password = bcrypt.hashSync(password, 10);
            const cuenta = await Cuenta.findByIdAndUpdate(cuenta_id, update, { new: true });
            if (!cuenta) { socket.emit('errorPerfil', 'Cuenta no encontrada.'); return; }
            socket.emit('perfilActualizado', { nombre: cuenta.nombre, foto: cuenta.foto || '' });
        } catch (err) {
            socket.emit('errorPerfil', 'Error al actualizar.');
        }
    });

    socket.on('guardarPersonaje', async (datos) => {
        const suma = datos.fuerza + datos.resistencia + datos.velocidad + datos.magia + datos.suerte;
        if (suma !== 25 || datos.fuerza < 2 || datos.resistencia < 2 || datos.velocidad < 2 || datos.magia < 2 || datos.suerte < 2) {
            socket.emit('errorPersonaje', 'Los puntos deben sumar 25 (mínimo 2 por categoría).');
            return;
        }
        const mods = CLASS_DATA[datos.clase];
        if (!mods) { socket.emit('errorPersonaje', 'Clase inválida.'); return; }
        const finales = aplicarModsClase(datos.clase, datos);
        const maxHP = getMaxHP(datos.clase);
        try {
            const cuenta = await Cuenta.findById(datos.cuenta_id);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
            cuenta.personajes.push({
                nombre: datos.nombre, clase: datos.clase,
                fuerza: finales.fuerza,
                resistencia: finales.resistencia,
                velocidad: finales.velocidad,
                magia: finales.magia,
                suerte: finales.suerte,
                hp: maxHP,
                energia: 100,
                foto: datos.foto || ''
            });
            await cuenta.save();
            const nuevoPJ = cuenta.personajes[cuenta.personajes.length - 1];
            socket.emit('personajeGuardado', nuevoPJ);
        } catch (err) {
            socket.emit('errorPersonaje', 'Error al guardar.');
        }
    });

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
            socket.emit('errorPersonaje', 'Error al eliminar.');
        }
    });

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
            socket.emit('errorPersonaje', 'Error al asignar stats.');
        }
    });

    socket.on('devComando', async ({ cuenta_id, accion, params }) => {
        try {
            const devCuenta = await Cuenta.findById(cuenta_id);
            if (!devCuenta || !devCuenta.dev) { socket.emit('errorPersonaje', 'Acceso denegado.'); return; }
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
            const targetId = params.targetId || cuenta_id;
            const cuenta = await Cuenta.findById(targetId);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta destino no encontrada.'); return; }
            if (accion === 'addDinero') {
                cuenta.dinero = Math.max(0, (cuenta.dinero || 0) + params.valor);
            } else if (accion === 'addXP') {
                const pj = cuenta.personajes.id(params.personaje_id);
                if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
                pj.experiencia = Math.max(0, (pj.experiencia || 0) + params.valor);
                while (pj.experiencia >= pj.nivel) { pj.experiencia -= pj.nivel; pj.nivel++; pj.puntosStats = (pj.puntosStats || 0) + 3; }
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
                while (pj.experiencia >= pj.nivel) { pj.experiencia -= pj.nivel; pj.nivel++; pj.puntosStats = (pj.puntosStats || 0) + 3; }
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
            socket.emit('errorPersonaje', 'Error al ejecutar comando.');
        }
    });

    socket.on('buscarPartida', ({ cuenta_id, personaje }) => {
        console.log('Buscando partida para:', personaje.nombre);
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        colaEspera.push({ socketId: socket.id, cuenta_id, personaje });
        socket.emit('esperandoRival');

        if (colaEspera.length >= 2) {
            const jugador1 = colaEspera.shift();
            const jugador2 = colaEspera.shift();
            const partidaId = `${jugador1.socketId}-${jugador2.socketId}`;

            const maxHP1 = getMaxHP(jugador1.personaje.clase);
            const maxHP2 = getMaxHP(jugador2.personaje.clase);

            const pj1Stats = aplicarModsClase(jugador1.personaje.clase, jugador1.personaje);
            const pj2Stats = aplicarModsClase(jugador2.personaje.clase, jugador2.personaje);

            const personaje1 = { ...jugador1.personaje, ...pj1Stats };
            const personaje2 = { ...jugador2.personaje, ...pj2Stats };

            const ordenTurnos = gp.calcularTurnoInicial([
                { socketId: jugador1.socketId, velocidad: personaje1.velocidad, nombre: personaje1.nombre },
                { socketId: jugador2.socketId, velocidad: personaje2.velocidad, nombre: personaje2.nombre }
            ]);
            const turnoInicial = ordenTurnos[0].socketId;

            const pasivas1 = getPasivasClase(jugador1.personaje.clase);
            const pasivas2 = getPasivasClase(jugador2.personaje.clase);

            partidas[partidaId] = {
                id: partidaId,
                jugador1: {
                    ...jugador1,
                    personaje: personaje1,
                    nombre: personaje1.nombre,
                    maxHp: maxHP1, hp: maxHP1, energia: 0,
                    pose: null, status: {}, pasivas: pasivas1,
                    extraAction: false, critBonus: 0, enrageBonus: 0,
                    summonHp: 0, inventario: [],
                    equipment: { arma: null, armadura: null, accesorio: null },
                    objetosRecibidos: []
                },
                jugador2: {
                    ...jugador2,
                    personaje: personaje2,
                    nombre: personaje2.nombre,
                    maxHp: maxHP2, hp: maxHP2, energia: 0,
                    pose: null, status: {}, pasivas: pasivas2,
                    extraAction: false, critBonus: 0, enrageBonus: 0,
                    summonHp: 0, inventario: [],
                    equipment: { arma: null, armadura: null, accesorio: null },
                    objetosRecibidos: []
                },
                turnoActual: turnoInicial,
                turno: 1,
                accionesUsadas: [],
                accionesMax: 2,
                turnoMareado: null,
                accionCancelada: false
            };

            console.log(`${personaje1.nombre} vs ${personaje2.nombre}`);

            const sJ1 = io.sockets.sockets.get(jugador1.socketId);
            const sJ2 = io.sockets.sockets.get(jugador2.socketId);
            if (sJ1) sJ1.join(partidaId);
            if (sJ2) sJ2.join(partidaId);

            const pJug = turnoInicial === jugador1.socketId ? partidas[partidaId].jugador1 : partidas[partidaId].jugador2;
            const pRiv = turnoInicial === jugador1.socketId ? partidas[partidaId].jugador2 : partidas[partidaId].jugador1;

            const enInicial = gp.calcularRegeneracionEnergia(pJug.personaje.magia, pRiv.personaje.magia);
            pJug.energia = Math.min(100, pJug.energia + enInicial);

            // Aplicar efectos de clase de primer turno
            gp.aplicarEfectosClase(pJug, false);
            gp.aplicarEfectosClase(pRiv, false);

            // Aplicar crítico de clase
            gp.aplicarCritClase(pJug);
            gp.aplicarCritClase(pRiv);

            const esJ1Primero = turnoInicial === jugador1.socketId;
            const skills1 = getSkillsParaClase(personaje1.clase);
            const skills2 = getSkillsParaClase(personaje2.clase);

            const emitirRival = (socketId, yoPj, rivalPj, esTurno) => {
                io.to(socketId).emit('rivalEncontrado', {
                    partidaId,
                    yo: {
                        nombre: yoPj.nombre, clase: yoPj.personaje.clase,
                        hp: yoPj.hp, energia: yoPj.energia,
                        maxHp: yoPj.maxHp, fuerza: yoPj.personaje.fuerza,
                        resistencia: yoPj.personaje.resistencia,
                        velocidad: yoPj.personaje.velocidad,
                        magia: yoPj.personaje.magia,
                        suerte: yoPj.personaje.suerte,
                        nivel: yoPj.personaje.nivel || 1,
                        foto: yoPj.personaje.foto || '',
                        status: yoPj.status || {},
                        inventario: yoPj.inventario || [],
                        equipment: yoPj.equipment || { arma: null, armadura: null, accesorio: null },
                        objetosRecibidos: yoPj.objetosRecibidos || []
                    },
                    rival: {
                        nombre: rivalPj.nombre, clase: rivalPj.personaje.clase,
                        hp: rivalPj.hp, energia: rivalPj.energia,
                        maxHp: rivalPj.maxHp, fuerza: rivalPj.personaje.fuerza,
                        resistencia: rivalPj.personaje.resistencia,
                        velocidad: rivalPj.personaje.velocidad,
                        magia: rivalPj.personaje.magia,
                        suerte: rivalPj.personaje.suerte,
                        nivel: rivalPj.personaje.nivel || 1,
                        status: rivalPj.status || {},
                        objetosRecibidos: rivalPj.objetosRecibidos || []
                    },
                    turnoActual: turnoInicial,
                    esmiTurno: esTurno,
                    accionesRestantes: esTurno ? 2 : 0,
                    skills: esTurno ? skills1 : skills2,
                    pasivas: Object.keys(esTurno ? pasivas1 : pasivas2),
                    recetas: MAZOS.recetas
                });
            };

            emitirRival(jugador1.socketId, partidas[partidaId].jugador1, partidas[partidaId].jugador2, esJ1Primero);
            emitirRival(jugador2.socketId, partidas[partidaId].jugador2, partidas[partidaId].jugador1, !esJ1Primero);
        }
    });

    socket.on('cancelarBusqueda', () => {
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
    });

    socket.on('disconnect', () => {
        for (const [id, partida] of Object.entries(partidas)) {
            if (partida.jugador1.socketId === socket.id || partida.jugador2.socketId === socket.id) {
                const rivalId = partida.jugador1.socketId === socket.id ? partida.jugador2.socketId : partida.jugador1.socketId;
                const rivalData = partida.jugador1.socketId === socket.id ? partida.jugador2 : partida.jugador1;
                io.to(rivalId).emit('finPartida', { ganador: rivalId, motivo: 'El rival se desconectó.' });
                otorgarXP(rivalData.cuenta_id, rivalData.personaje._id, 1).then(c => { if (c) io.to(rivalId).emit('cuentaActualizada', c.toObject()); });
                delete partidas[id];
            }
        }
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        console.log('Desconectado:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
