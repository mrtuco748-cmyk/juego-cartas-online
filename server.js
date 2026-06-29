const { GameProcessor, SKILLS_DATA, CLASS_DATA, MAZOS, FORTUNE_CARDS, aplicarModsClase, getMaxHP } = require('./gameEngine');
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
    activasIniciales: { type: [String], default: [] },
    activasEquipadas: { type: [String], default: [] },
    tas: { type: Array, default: [] },
    tps: { type: Array, default: [] },
    skillsCompradas: { type: [String], default: [] },
    pasivasCompradas: { type: [String], default: [] },
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
    personajes: [personajeSchema],
    inventarioSkills: { type: [String], default: [] },
    inventarioPasivas: { type: [String], default: [] }
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

const SKILL_PRICES = {
    activas: {
        golpe_directo: 500, paralisis: 700, cubo_perfecto: 600, jackpot: 2000,
        curacion_divina: 800, escudo_arcano: 600, furia_berserker: 1200,
        maldicion: 800, drenar_vida: 1000, explosion_mana: 1500,
        golpe_veloz: 400, reflejo_magico: 1200, tormenta: 1400,
        sello_silencio: 900, sacrificio: 300, invocacion: 1800,
        rafaga: 400, cataclismo: 2500, bendicion: 1000, escarcha: 600
    },
    pasivas: {
        veneno: 1000, totem: 1500, regeneracion: 800, mana_infinito: 1200,
        contraataque: 1500, escudo_espinas: 1200, rapidez: 1800,
        ultimo_aliento: 2000, absorcion: 1400, maestro_critico: 1600,
        fortaleza: 1000, vampirismo: 1500, escudo_natural: 1000,
        furia_interna: 1200, bendito: 800,
        concentracion: 1200, golpe_pesado: 1400, armadura_viva: 1000
    }
};

const BOT_PRACTICA = {
    nombre: "Entrenador",
    clase: "Berserker",
    fuerza: 8, resistencia: 6, velocidad: 4, magia: 2, suerte: 2,
    nivel: 1, foto: 'https://i.pinimg.com/736x/45/b2/30/45b230b59b7e2d215841743a47c0cf07.jpg',
    skillsCompradas: ["furia_berserker", "escudo_arcano"],
    pasivasCompradas: ["regeneracion", "fortaleza", "vampirismo"]
};

const CLASS_POOL = {
    Chaman: ["golpe_directo", "curacion_divina", "escudo_arcano", "drenar_vida", "bendicion", "maldicion", "reflejo_magico"],
    Sacerdote: ["curacion_divina", "bendicion", "sello_silencio", "escudo_arcano", "drenar_vida", "sacrificio", "reflejo_magico"],
    Druida: ["rafaga", "drenar_vida", "escudo_arcano", "escarcha", "bendicion", "curacion_divina", "golpe_directo"],
    Guerrero: ["golpe_directo", "golpe_veloz", "furia_berserker", "explosion_mana", "cubo_perfecto", "sacrificio", "escudo_arcano"],
    Paladin: ["golpe_directo", "escudo_arcano", "curacion_divina", "bendicion", "cubo_perfecto", "drenar_vida", "golpe_veloz"],
    Berserker: ["golpe_directo", "furia_berserker", "golpe_veloz", "sacrificio", "maldicion", "drenar_vida", "tormenta"],
    Acorazado: ["escudo_arcano", "cubo_perfecto", "golpe_directo", "reflejo_magico", "golpe_veloz", "drenar_vida", "sacrificio"],
    Ogro: ["golpe_directo", "golpe_veloz", "tormenta", "sacrificio", "furia_berserker", "maldicion", "cubo_perfecto"],
    Golem: ["escudo_arcano", "cubo_perfecto", "golpe_directo", "explosion_mana", "reflejo_magico", "sacrificio", "drenar_vida"],
    Picaro: ["golpe_veloz", "golpe_directo", "drenar_vida", "cubo_perfecto", "paralisis", "reflejo_magico", "maldicion"],
    Ninja: ["golpe_veloz", "golpe_directo", "drenar_vida", "sello_silencio", "paralisis", "reflejo_magico", "cubo_perfecto"],
    Cazador: ["golpe_directo", "golpe_veloz", "rafaga", "escarcha", "paralisis", "drenar_vida", "tormenta"],
    Mago: ["explosion_mana", "tormenta", "escarcha", "drenar_vida", "cubo_perfecto", "rafaga", "escudo_arcano"],
    MagoMaestro: ["explosion_mana", "tormenta", "cataclismo", "sello_silencio", "escarcha", "reflejo_magico", "bendicion"],
    MagoGuerrero: ["golpe_directo", "explosion_mana", "escudo_arcano", "golpe_veloz", "cubo_perfecto", "furia_berserker", "drenar_vida"],
    SemiDios: ["cataclismo", "curacion_divina", "bendicion", "invocacion", "escudo_arcano", "reflejo_magico", "tormenta"],
    Demonio: ["sacrificio", "maldicion", "drenar_vida", "tormenta", "furia_berserker", "cataclismo", "golpe_directo"],
    Titan: ["cataclismo", "golpe_directo", "escudo_arcano", "cubo_perfecto", "golpe_veloz", "explosion_mana", "reflejo_magico"]
};

function getSkillsParaClase(activasIniciales, inventarioSkills, activasEquipadas, equipment, claseFallback) {
    const owned = [...new Set([...(activasIniciales || []), ...(inventarioSkills || [])])];
    let equipadas;
    if (activasEquipadas && activasEquipadas.length > 0) {
        equipadas = [...activasEquipadas];
    } else if (owned.length > 0) {
        equipadas = owned.slice(0, 5);
    } else {
        equipadas = [...(CLASS_POOL[claseFallback] || [])].slice(0, 5);
    }
    if (equipment) {
        const nombresEq = Object.values(equipment).filter(Boolean).map(e => e.nombre);
        if (nombresEq.includes("Varita Común Nivel 3") && SKILLS_DATA.activas.acrio) {
            if (!equipadas.includes("acrio")) equipadas.push("acrio");
        }
    }
    return equipadas.filter((id, i, a) => a.indexOf(id) === i).map(id => ({ ...SKILLS_DATA.activas[id], id })).filter(Boolean);
}

function migrarInventario(cuenta) {
    let cambiado = false;
    if (!cuenta.inventarioSkills) { cuenta.inventarioSkills = []; cambiado = true; }
    if (!cuenta.inventarioPasivas) { cuenta.inventarioPasivas = []; cambiado = true; }
    for (const pj of cuenta.personajes) {
        if (pj.skillsCompradas && pj.skillsCompradas.length > 0) {
            for (const s of pj.skillsCompradas) {
                if (!cuenta.inventarioSkills.includes(s)) { cuenta.inventarioSkills.push(s); cambiado = true; }
            }
            pj.skillsCompradas = [];
            cambiado = true;
        }
        if (pj.pasivasCompradas && pj.pasivasCompradas.length > 0) {
            for (const s of pj.pasivasCompradas) {
                if (!cuenta.inventarioPasivas.includes(s)) { cuenta.inventarioPasivas.push(s); cambiado = true; }
            }
            pj.pasivasCompradas = [];
            cambiado = true;
        }
    }
    return cambiado;
}

function mezclarArray(arr) {
    const m = [...arr];
    for (let i = m.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [m[i], m[j]] = [m[j], m[i]];
    }
    return m;
}

function getPasivasClase(clase, compradas = []) {
    const pasivas = {};
    const ids = [...new Set([...gp.getPasivasPorDefecto(clase), ...compradas])];
    ids.forEach(id => {
        if (SKILLS_DATA.pasivas[id]) pasivas[id] = SKILLS_DATA.pasivas[id];
    });
    return pasivas;
}

function getMazosCliente(jugadorPartida) {
    return {
        inventario: jugadorPartida.inventario || [],
        equipment: jugadorPartida.equipment || { mano1: null, mano2: null, armadura: null, accesorio: null }
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

function removerHPBonusItem(jugador, item) {
    if (item && item.hpBonus) {
        jugador.maxHp = Math.max(1, jugador.maxHp - item.hpBonus);
        jugador.hp = Math.min(jugador.hp, jugador.maxHp);
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
    const p1 = partida.jugador1, p2 = partida.jugador2;
    const j1s = getSkillsParaClase(p1.personaje?.activasIniciales, p1.skillsCompradas || [], p1.personaje?.activasEquipadas, p1.equipment, p1.personaje?.clase);
    const j2s = getSkillsParaClase(p2.personaje?.activasIniciales, p2.skillsCompradas || [], p2.personaje?.activasEquipadas, p2.equipment, p2.personaje?.clase);

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
        summonJ1: partida.jugador1.summon || null,
        summonJ2: partida.jugador2.summon || null,
        ...(j1m.inventario ? {
            inventarioJ1: j1m.inventario,
            inventarioJ2: j2m.inventario,
            equipmentJ1: j1m.equipment,
            equipmentJ2: j2m.equipment
        } : {})
    });
}

const socketNombres = new Map();

io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    socket.on('ejecutarAccion', async ({ partidaId, tipo, atacante, defensor, cartaId, accionData, actuandoComoRival }) => {
        const partida = partidas[partidaId];
        if (!partida) return;

        let soyJ1 = socket.id === partida.jugador1.socketId;
        let yo, rival;
        if (partida.esPractica && actuandoComoRival) {
            yo = soyJ1 ? partida.jugador2 : partida.jugador1;
            rival = soyJ1 ? partida.jugador1 : partida.jugador2;
        } else {
            yo = soyJ1 ? partida.jugador1 : partida.jugador2;
            rival = soyJ1 ? partida.jugador2 : partida.jugador1;
        }

        if (!partida.esPractica && partida.turnoActual !== socket.id) {
            if (tipo !== 'carta') {
                socket.emit('errorAccion', 'No es tu turno.');
                return;
            }
        }

        if (yo.status && yo.status.frozen > 0) {
            socket.emit('errorAccion', 'Estás paralizado.');
            return;
        }

        if (yo.status && yo.status.silenced > 0 && tipo !== 'atacar' && tipo !== 'descansar' && tipo !== 'summon_attack') {
            socket.emit('errorAccion', 'Estás silenciado.');
            return;
        }

        const accionesMax = partida.accionesMax || 2;
        const esFueraDeTurno = partida.turnoActual !== socket.id;
        if (tipo !== 'carta' || !esFueraDeTurno) {
            if (partida.accionesUsadas.length >= accionesMax) {
                socket.emit('errorAccion', 'No te quedan acciones.');
                return;
            }
            if (tipo !== 'carta' && tipo !== 'ataque_penalizado' && partida.accionesUsadas.includes(tipo)) {
                socket.emit('errorAccion', `${socketNombres.get(socket.id) || yo.nombre}: no se pueden repetir acciones en el mismo turno.`);
                return;
            }
            partida.accionesUsadas.push(tipo);
        }

        const statsYo = gp.calcularStatsConBuffs(yo);
        const statsRival = gp.calcularStatsConBuffs(rival);

        // Snapshot HP for on_hp_loss triggers
        const hpAntesYo = yo.hp;
        const hpAntesRival = rival.hp;

        // Wrapper for processPassives with reversePassives support
        const pp = (pasivas, owner, rival2, trigger, ctx) => {
            const reverse = (partida.fortunaStatus || {}).reversePassives > 0;
            return gp.processPassives(pasivas, owner, rival2, trigger, ctx, reverse);
        };

        // Wrapper for dice rolls with chaosFog support
        const diceRoll = (valor) => {
            if ((partida.fortunaStatus || {}).chaosFog > 0) {
                io.to(partidaId).emit('logBatalla', { msg: 'Dados ocultos por la niebla del caos', tipo: 'fortuna' });
            } else {
                io.to(partidaId).emit('diceRoll', { valor });
            }
        };

        switch (tipo) {
            case 'carta': {
                const carta = SKILLS_DATA.activas[cartaId];
                if (!carta) { socket.emit('errorAccion', 'Carta no encontrada'); break; }
                if (carta.requiereItem) {
                    const tieneItem = Object.values(yo.equipment || {}).some(eq => eq && eq.nombre === carta.requiereItem);
                    if (!tieneItem) { socket.emit('errorAccion', 'Necesitás ' + carta.requiereItem + ' para usar esta carta'); break; }
                }
                if (yo.energia < carta.coste) {
                    socket.emit('errorAccion', `Energía insuficiente (${yo.energia}/${carta.coste})`); break;
                }

                const fsCarta = partida.fortunaStatus || {};

                const ctx = { source: yo, rival };
                const result = gp.executeCard(carta, yo, rival, ctx);

                if (!result.success) {
                    socket.emit('errorAccion', result.reason);
                    break;
                }

                if (result.diceRoll) diceRoll(result.diceRoll);
                if (result.log) io.to(partidaId).emit('logBatalla', { msg: result.log, tipo: 'carta' });

                // Cubo Perfecto: negate spell damage to defender
                if (result.damage > 0 && rival.status && rival.status.perfectCube) {
                    delete rival.status.perfectCube;
                    io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} evade el daño del hechizo con su Cubo Perfecto`, tipo: 'carta' });
                    result.damage = 0;
                }

                // swapHealDamage: if this card healed, convert to damage; if it damaged, convert to heal
                if (fsCarta.swapHealDamage) {
                    if (result.healing > 0) {
                        const dmgSwap = result.healing;
                        rival.hp -= dmgSwap;
                        io.to(partidaId).emit('logBatalla', { msg: `[Caos] La curación se convierte en daño: ${rival.nombre} recibe ${dmgSwap}`, tipo: 'fortuna' });
                        result.healing = 0;
                    }
                    if (result.damage > 0) {
                        const healSwap = result.damage;
                        rival.hp = Math.min(rival.maxHp, rival.hp + healSwap);
                        io.to(partidaId).emit('logBatalla', { msg: `[Caos] El daño se convierte en curación: ${rival.nombre} recupera ${healSwap} HP`, tipo: 'fortuna' });
                        result.damage = 0;
                    }
                }

                // sacredGround after spell damage
                if (result.damage > 0 && fsCarta.sacredGround > 0 && rival.hp < 1) {
                    rival.hp = 1;
                    io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' });
                }

                // mirrorDamage from spells
                if (result.damage > 0 && fsCarta.mirrorDamage > 0) {
                    yo.hp -= result.damage;
                    io.to(partidaId).emit('logBatalla', { msg: `[Espejo] ${yo.nombre} recibe ${result.damage} de daño reflejado`, tipo: 'fortuna' });
                    if (fsCarta.sacredGround > 0 && yo.hp < 1) { yo.hp = 1; io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' }); }
                }

                if (result.summon) {
                    yo.summon = result.summon;
                    io.to(partidaId).emit('logBatalla', { msg: `${result.summon.nombre} aparece en el campo de batalla`, tipo: 'carta' });
                }

                const castCtx = { damage: result.damage || 0 };
                const spellLogs = pp(yo.pasivas, yo, rival, 'on_cast', castCtx);
                spellLogs.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

                if (result.doubleAttack && rival.hp > 0) {
                    const pLogAtk2 = pp(yo.pasivas, yo, rival, 'on_attack', {});
                    pLogAtk2.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });
                    const statsYo2 = gp.calcularStatsConBuffs(yo);
                    const statsRiv2 = gp.calcularStatsConBuffs(rival);
                    const dado2 = Math.floor(Math.random() * 6) + 1;
                    diceRoll(dado2);
                    let danoExtra = Math.max(0, dado2 + statsYo2.fuerza - statsRiv2.resistencia);
                    if (yo.enrageBonus) danoExtra += yo.enrageBonus;
                    const critExtra = Math.max(statsYo2.critClaseMulti || 0, gp.calcularCritico(statsYo2.velocidad, statsRiv2.velocidad) + (statsYo2.critBonus || 0));
                    danoExtra = Math.floor(danoExtra * (1 + critExtra));
                    if (rival.status && rival.status.shield > 0) {
                        const absorb = Math.min(rival.status.shield, danoExtra);
                        rival.status.shield -= absorb;
                        danoExtra -= absorb;
                    }
                    rival.hp -= danoExtra;
                    io.to(partidaId).emit('logBatalla', { msg: `Golpe extra: +${danoExtra} daño`, tipo: 'ataque' });
                    // Process on_hit for the extra attack
                    const pHit2 = pp(yo.pasivas, yo, rival, 'on_hit', { damage: danoExtra, target: rival });
                    [...pHit2].forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });
                    gp.procesarEfectosOnHit(yo, rival).forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'ataque' }));
                }

                break;
            }
            case 'atacar': {
                const fs = partida.fortunaStatus || {};

                // clumsy: 50% fail
                if (fs.clumsy > 0 && Math.random() < 0.5) {
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} falla por torpeza`, tipo: 'fortuna' });
                    break;
                }

                // pacifism: no direct attacks
                if (fs.pacifism > 0) {
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} no puede atacar (pacifismo forzado)`, tipo: 'fortuna' });
                    break;
                }

                // noAttack: strongest can't attack
                if (fs.noAttack > 0) {
                    const statsRivNoAtk = gp.calcularStatsConBuffs(rival);
                    if (statsYo.fuerza >= statsRivNoAtk.fuerza) {
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} no puede atacar (ego destruido)`, tipo: 'fortuna' });
                        break;
                    }
                }

                // Cubo Perfecto: negate entire attack if defender has it active
                if (rival.status && rival.status.perfectCube) {
                    delete rival.status.perfectCube;
                    io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} evade todo daño con su Cubo Perfecto`, tipo: 'carta' });
                    break;
                }

                // Process on_attack passives FIRST so critBonus from passives applies this turn
                const pLogAtk = pp(yo.pasivas, yo, rival, 'on_attack', {});
                pLogAtk.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

                const statsYoAtk = gp.calcularStatsConBuffs(yo);
                const statsRivAtk = gp.calcularStatsConBuffs(rival);

                let dado = Math.floor(Math.random() * 6) + 1;
                diceRoll(dado);

                // beastNumber: 6 on dice = 30 self damage
                if (fs.beastNumber > 0 && dado === 6) {
                    yo.hp -= 30;
                    io.to(partidaId).emit('logBatalla', { msg: `¡${statsYoAtk.nombre} sacó 6 y recibe 30 de daño (Número de la Bestia)!`, tipo: 'fortuna' });
                }

                // antiStrength: more strength = less damage
                let fuerzaEfectiva = statsYoAtk.fuerza;
                if (fs.antiStrength > 0) {
                    fuerzaEfectiva = Math.max(0, 6 - Math.floor(statsYoAtk.fuerza / 2));
                }

                // invertResistance: resistance adds to damage instead of reducing
                let resistenciaEfectiva = statsRivAtk.resistencia;
                if (fs.invertResistance > 0) {
                    resistenciaEfectiva = 0;
                }

                let danoBase = Math.max(0, dado + fuerzaEfectiva - resistenciaEfectiva);
                if (fs.invertResistance > 0) {
                    danoBase += statsRivAtk.resistencia;
                }

                let critMulti = Math.max(statsYoAtk.critClaseMulti || 0, gp.calcularCritico(statsYoAtk.velocidad, statsRivAtk.velocidad) + (statsYoAtk.critBonus || 0));
                let danoFinal = Math.floor(danoBase * (1 + critMulti));
                if (yo.enrageBonus) danoFinal += yo.enrageBonus;

                let log = `${statsYoAtk.nombre} ataca — ${dado}+F:${statsYoAtk.fuerza}-R:${statsRivAtk.resistencia}=${danoBase}`;

                if (rival.pose) {
                    let poseFallida = false;
                    if (rival.pose.tipo === 'esquivar' && (rival.pose.valor + (statsRivAtk.dodgeBonus || 0)) > dado) {
                        io.to(partidaId).emit('logBatalla', { msg: `¡${rival.nombre} ESQUIVA!`, tipo: 'pose' });
                        rival.pose = null;
                        return partidaFinalizarAccion(partidaId, partida);
                    } else if (rival.pose.tipo === 'parry' && dado >= rival.pose.min && dado <= rival.pose.max) {
                        const reflectedDmg = Math.max(1, Math.floor(statsRivAtk.resistencia * 0.5));
                        yo.hp -= reflectedDmg;
                        yo.mareado = true;
                        io.to(partidaId).emit('logBatalla', { msg: `¡${rival.nombre} hace PARRY! ${statsYoAtk.nombre} recibe ${reflectedDmg} de contraataque y queda mareado`, tipo: 'pose' });
                        rival.pose = null;
                        // Check sacredGround after parry damage
                        if (yo.hp < 1 && fs.sacredGround > 0) { yo.hp = 1; io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' }); }
                        return partidaFinalizarAccion(partidaId, partida);
                    } else {
                        poseFallida = true;
                    }
                    // electricField: failed pose deals 8 damage
                    if (poseFallida && fs.electricField) {
                        rival.hp -= 8;
                        io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} recibe 8 de daño por campo eléctrico`, tipo: 'fortuna' });
                        if (fs.sacredGround > 0 && rival.hp < 1) { rival.hp = 1; io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' }); }
                    }
                    rival.pose = null;
                }

                // swapHealDamage: damage heals instead
                if (fs.swapHealDamage) {
                    const healAmt = danoFinal;
                    rival.hp = Math.min(rival.maxHp, rival.hp + healAmt);
                    danoFinal = 0;
                    io.to(partidaId).emit('logBatalla', { msg: `[Caos] El daño se convierte en curación: +${healAmt} HP a ${rival.nombre}`, tipo: 'fortuna' });
                }

                // Process on_take_damage BEFORE applying damage so fortaleza etc works (skip if swapHealDamage nullified it)
                if (danoFinal > 0) {
                    const dmgCtx = { damage: danoFinal, target: yo };
                    const pLogDef = pp(rival.pasivas, rival, yo, 'on_take_damage', dmgCtx);
                    danoFinal = Math.max(0, dmgCtx.damage);
                    pLogDef.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });
                }

                if (rival.status && rival.status.shield > 0 && danoFinal > 0) {
                    const absorb = Math.min(rival.status.shield, danoFinal);
                    rival.status.shield -= absorb;
                    danoFinal -= absorb;
                    log += ` [escudo -${absorb}]`;
                }

                if (yo.danoAHP && danoFinal > 0) {
                    const conv = Math.min(danoFinal, yo.maxHp - yo.hp);
                    yo.hp += conv;
                    log += ` (convierte ${conv} daño a HP)`;
                }

                rival.hp -= danoFinal;

                // sacredGround: clamp HP to 1
                if (fs.sacredGround > 0 && rival.hp < 1) {
                    rival.hp = 1;
                    io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' });
                }

                // mirrorDamage: same damage to attacker
                if (fs.mirrorDamage > 0 && danoFinal > 0) {
                    yo.hp -= danoFinal;
                    io.to(partidaId).emit('logBatalla', { msg: `[Espejo] ${yo.nombre} recibe ${danoFinal} de daño reflejado`, tipo: 'fortuna' });
                    if (fs.sacredGround > 0 && yo.hp < 1) { yo.hp = 1; io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' }); }
                }

                if (danoFinal > 0) {
                    const pLog1 = pp(yo.pasivas, yo, rival, 'on_hit', { damage: danoFinal, target: rival });
                    [...pLog1].forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

                    gp.procesarEfectosOnHit(yo, rival).forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'ataque' }));
                }

                log += critMulti > 0 ? ` (Crítico x${1+critMulti}) → ${danoFinal}` : ` → ${danoFinal}`;
                io.to(partidaId).emit('logBatalla', { msg: log, tipo: 'ataque' });

                // reflejo magico: check if target has reflect status
                if (rival.status && rival.status.reflect && danoFinal > 0) {
                    const reflected = Math.floor(danoFinal * rival.status.reflect.valor);
                    if (reflected > 0) {
                        yo.hp -= reflected;
                        io.to(partidaId).emit('logBatalla', { msg: `${rival.nombre} refleja ${reflected} de daño (Reflejo Mágico)`, tipo: 'carta' });
                        if (fs.sacredGround > 0 && yo.hp < 1) { yo.hp = 1; io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' }); }
                    }
                }

                if (statsYoAtk.ataquePenalty > 0) {
                    for (let p = 0; p < statsYoAtk.ataquePenalty; p++) {
                        partida.accionesUsadas.push('ataque_penalizado');
                    }
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYoAtk.nombre} pierde ${statsYoAtk.ataquePenalty} accion(es) extra por el peso del arma`, tipo: 'ataque' });
                }
                break;
            }
            case 'descansar': {
                const fsDesc = partida.fortunaStatus || {};
                let hpGain = Math.floor(Math.random() * 5) + 1;
                let enGain = Math.floor(Math.random() * 5) + 1;

                // warZone: cap at 1 each
                if (fsDesc.warZone) {
                    hpGain = Math.min(hpGain, 1);
                    enGain = Math.min(enGain, 1);
                }

                // bloodthirstyRest: descansar hace daño en vez de curar
                if (fsDesc.bloodthirstyRest > 0) {
                    yo.hp -= hpGain;
                    yo.energia = Math.min(100, yo.energia + enGain);
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} descansa pero sufre ${hpGain} de daño (sed de sangre)`, tipo: 'fortuna' });
                    if (fsDesc.sacredGround > 0 && yo.hp < 1) { yo.hp = 1; io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} se aferra a la vida (Tierra Sagrada)`, tipo: 'fortuna' }); }
                } else {
                    yo.hp = Math.min(yo.maxHp, yo.hp + hpGain);
                    yo.energia = Math.min(100, yo.energia + enGain);
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} descansa → +${hpGain} HP, +${enGain} energía`, tipo: 'curacion' });
                }
                break;
            }
            case 'pose': {
                const tipoPose = (accionData && accionData.tipo) || (statsYo.resistencia > statsRival.fuerza ? 'parry' : 'esquivar');
                const dadoPose = Math.floor(Math.random() * 6) + 1;
                diceRoll(dadoPose);
                if (tipoPose === 'parry') {
                    const maxDado = 6;
                    const rangoParry = 2;
                    const minRango = dadoPose;
                    const maxRango = Math.min(dadoPose + rangoParry, maxDado);
                    yo.pose = { tipo: 'parry', min: minRango, max: maxRango };
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} prepara PARRY [${minRango}-${maxRango}]`, tipo: 'pose' });
                } else {
                    yo.pose = { tipo: 'esquivar', valor: dadoPose };
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} prepara ESQUIVE (${dadoPose})`, tipo: 'pose' });
                }
                break;
            }
            case 'investigar': {
                const totalProb = MAZOS.investigacion.reduce((s, i) => s + i.probabilidad, 0);
                let r = Math.random() * totalProb;
                let carta = null;
                for (const item of MAZOS.investigacion) {
                    r -= item.probabilidad;
                    if (r <= 0) { carta = item; break; }
                }
                if (!carta) { socket.emit('errorAccion', 'No hay cartas en el mazo'); break; }
                if (carta.tipo === 'cofre') {
                    const totalProb = MAZOS.cofres.reduce((s, i) => s + i.probabilidad, 0);
                    let r = Math.random() * totalProb;
                    let cofre = null;
                    for (const item of MAZOS.cofres) {
                        r -= item.probabilidad;
                        if (r <= 0) { cofre = item; break; }
                    }
                    if (cofre) cofre = { ...cofre };
                    if (cofre && gp.puedeAgregarInventario(yo.inventario, cofre)) {
                        cofre._id = Date.now().toString() + Math.random();
                        yo.inventario.push(cofre);
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra un cofre con: ${cofre.nombre}`, tipo: 'carta' });
                    } else {
                        io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra un cofre pero está vacío`, tipo: 'carta' });
                    }
                } else if (carta.tipo === 'nada') {
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} no encuentra nada útil`, tipo: 'carta' });
                } else if (gp.puedeAgregarInventario(yo.inventario, carta)) {
                    yo.inventario.push({ ...carta, _id: Date.now().toString() + Math.random() });
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra: ${carta.nombre}`, tipo: 'carta' });
                } else {
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} encuentra ${carta.nombre} pero no tiene espacio`, tipo: 'carta' });
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
                if ((partida.fortunaStatus || {}).mute > 0) {
                    socket.emit('errorAccion', 'Estás mudo, no podés negociar'); break;
                }
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
                diceRoll(dadoRobo - statsYo.velocidad);
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
                if ((partida.fortunaStatus || {}).heavyGravity) {
                    socket.emit('errorAccion', 'Gravedad extrema: no podés lanzar objetos'); break;
                }
                const objIdx = accionData && accionData.objIdx;
                if (objIdx === undefined || !yo.inventario[objIdx]) { socket.emit('errorAccion', 'Objeto inválido'); break; }
                const obj = yo.inventario[objIdx];
                const dadoL = Math.floor(Math.random() * 6) + 1;
                diceRoll(dadoL);
                const dañoStats = (obj.stats ? (obj.stats.dañoDirecto || 0) + (obj.stats.peso || 0) : 0);
                const danoL = Math.max(0, dadoL + (obj.peso || 0) + (obj.filo || 0) + dañoStats);
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
                // butterHands: auto-fail
                if ((partida.fortunaStatus || {}).butterHands > 0) {
                    yo.objetosRecibidos.pop();
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} deja caer el objeto (manos de manteca)`, tipo: 'fortuna' });
                    break;
                }
                const dadoRec = Math.floor(Math.random() * 6) + 1;
                diceRoll(dadoRec);
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
                diceRoll(dadoDesv);
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
                const armaEq = yo.equipment && (yo.equipment.mano1 || yo.equipment.mano2);
                if (!armaEq) { socket.emit('errorAccion', 'No tenés arma equipada'); break; }
                const armaRef = yo.equipment.mano1 || yo.equipment.mano2;
                armaRef.stats = armaRef.stats || {};
                armaRef.stats.dañoDirecto = (armaRef.stats.dañoDirecto || 0) + 1;
                armaRef.stats.peso = (armaRef.stats.peso || 0) + 1;
                yo.energia = Math.max(0, yo.energia - 5);
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} refuerza ${armaRef.nombre} (+1 daño, +1 peso)`, tipo: 'carta' });
                break;
            }
            case 'equipar': {
                const eqIdx = accionData && accionData.objIdx;
                if (eqIdx === undefined || !yo.inventario[eqIdx]) { socket.emit('errorAccion', 'Objeto inválido'); break; }
                const eqObj = yo.inventario[eqIdx];
                const slotMap = { arma: 'mano1', armadura: 'armadura', accesorio: 'accesorio' };
                let slot = slotMap[eqObj.tipo] || null;
                if (!slot) { socket.emit('errorAccion', 'Este objeto no se puede equipar'); break; }
                const manos = eqObj.manos || 1;
                const repushSlot = (s) => {
                    const old = yo.equipment[s];
                    if (old && gp.puedeAgregarInventario(yo.inventario, {})) {
                        removerHPBonusItem(yo, old);
                        yo.inventario.push({ ...old, _id: Date.now().toString() + Math.random() });
                    }
                };
                if (slot === 'mano1' && manos === 2) {
                    repushSlot('mano1');
                    repushSlot('mano2');
                    yo.equipment.mano1 = null;
                    yo.equipment.mano2 = null;
                    yo.equipment.mano1 = eqObj;
                    yo.equipment.mano2 = eqObj;
                } else if (slot === 'mano1') {
                    if (yo.equipment.mano2 && yo.equipment.mano2 === yo.equipment.mano1) {
                        repushSlot('mano1');
                        yo.equipment.mano1 = null;
                        yo.equipment.mano2 = null;
                    }
                    repushSlot('mano1');
                    yo.equipment.mano1 = eqObj;
                } else {
                    repushSlot(slot);
                    yo.equipment[slot] = eqObj;
                }
                yo.inventario.splice(eqIdx, 1);
                if (eqObj.hpBonus) {
                    yo.maxHp = (yo.maxHp || 50) + eqObj.hpBonus;
                    yo.hp = Math.min(yo.hp + eqObj.hpBonus, yo.maxHp);
                }
                io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} equipa ${eqObj.nombre}`, tipo: 'carta' });
                break;
            }
            case 'desequipar': {
                const slot = accionData && accionData.slot;
                if (!slot) { socket.emit('errorAccion', 'Especificá qué desequipar'); break; }
                if (slot === 'mano1') {
                    if (!yo.equipment.mano1) { socket.emit('errorAccion', 'Nada que desequipar'); break; }
                    if (!gp.puedeAgregarInventario(yo.inventario, {})) { socket.emit('errorAccion', 'Inventario lleno'); break; }
                    if (yo.equipment.mano1 === yo.equipment.mano2) {
                        removerHPBonusItem(yo, yo.equipment.mano1);
                        yo.inventario.push({ ...yo.equipment.mano1, _id: Date.now().toString() + Math.random() });
                        yo.equipment.mano1 = null;
                        yo.equipment.mano2 = null;
                    } else {
                        removerHPBonusItem(yo, yo.equipment.mano1);
                        yo.inventario.push({ ...yo.equipment.mano1, _id: Date.now().toString() + Math.random() });
                        yo.equipment.mano1 = null;
                    }
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} se quita ${slot}`, tipo: 'carta' });
                } else if (slot === 'mano2') {
                    if (!yo.equipment.mano2) { socket.emit('errorAccion', 'Nada que desequipar'); break; }
                    if (!gp.puedeAgregarInventario(yo.inventario, {})) { socket.emit('errorAccion', 'Inventario lleno'); break; }
                    if (yo.equipment.mano1 === yo.equipment.mano2) {
                        removerHPBonusItem(yo, yo.equipment.mano1);
                        yo.inventario.push({ ...yo.equipment.mano1, _id: Date.now().toString() + Math.random() });
                        yo.equipment.mano1 = null;
                        yo.equipment.mano2 = null;
                    } else {
                        removerHPBonusItem(yo, yo.equipment.mano2);
                        yo.inventario.push({ ...yo.equipment.mano2, _id: Date.now().toString() + Math.random() });
                        yo.equipment.mano2 = null;
                    }
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} se quita ${slot}`, tipo: 'carta' });
                } else {
                    if (!yo.equipment[slot]) { socket.emit('errorAccion', 'Nada que desequipar'); break; }
                    if (!gp.puedeAgregarInventario(yo.inventario, {})) { socket.emit('errorAccion', 'Inventario lleno'); break; }
                    removerHPBonusItem(yo, yo.equipment[slot]);
                    yo.inventario.push({ ...yo.equipment[slot], _id: Date.now().toString() + Math.random() });
                    yo.equipment[slot] = null;
                    io.to(partidaId).emit('logBatalla', { msg: `${statsYo.nombre} se quita ${slot}`, tipo: 'carta' });
                }
                break;
            }
            case 'usar_objeto': {
                const usarIdx = accionData && accionData.objIdx;
                if (usarIdx === undefined || !yo.inventario[usarIdx]) { socket.emit('errorAccion', 'Objeto inválido'); break; }
                const usarObj = yo.inventario[usarIdx];
                if (usarObj.tipo !== 'consumible' && usarObj.tipo !== 'especial') { socket.emit('errorAccion', 'Este objeto no se puede usar directamente'); break; }
                if (!usarObj.efectos) { socket.emit('errorAccion', 'Este objeto no tiene efecto'); break; }
                const logsAplicados = gp.aplicarEfectosConsumible(usarObj, yo, rival);
                logsAplicados.forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'curacion' }));
                yo.inventario.splice(usarIdx, 1);
                break;
            }
            case 'summon_attack': {
                if (!yo.summon || yo.summon.hp <= 0) { socket.emit('errorAccion', 'No tenés invocación activa'); break; }
                const statsYoSum = gp.calcularStatsConBuffs(yo);
                const statsRivSum = gp.calcularStatsConBuffs(rival);
                const dadoSum = Math.floor(Math.random() * 6) + 1;
                diceRoll(dadoSum);
                const statSum = yo.summon.stats || { fuerza: 3, resistencia: 2, velocidad: 2, magia: 1 };
                let danoSum = Math.max(0, dadoSum + statSum.fuerza - statsRivSum.resistencia);
                if (rival.status && rival.status.shield > 0) {
                    const absorb = Math.min(rival.status.shield, danoSum);
                    rival.status.shield -= absorb;
                    danoSum -= absorb;
                }
                rival.hp -= danoSum;
                io.to(partidaId).emit('logBatalla', { msg: `${yo.summon.nombre} ataca causando ${danoSum} daño`, tipo: 'ataque' });
                break;
            }
        }

        // Trigger on_hp_loss for any player who lost HP
        if (yo.hp < hpAntesYo) {
            const perdidaYo = hpAntesYo - Math.max(0, yo.hp);
            const hl1 = pp(yo.pasivas, yo, rival, 'on_hp_loss', { hpLost: perdidaYo });
            hl1.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });
        }
        if (rival.hp < hpAntesRival) {
            const perdidaRi = hpAntesRival - Math.max(0, rival.hp);
            const hl2 = pp(rival.pasivas, rival, yo, 'on_hp_loss', { hpLost: perdidaRi });
            hl2.forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });
        }

        partidaFinalizarAccion(partidaId, partida);
    });

    function partidaCheckMuerte(partidaId, partida) {
        const ambos = [partida.jugador1, partida.jugador2];
        for (const j of ambos) {
            if (j.hp <= 0) {
                j.summon = null;
                const reviveLogs = pp(j.pasivas, j, null, 'on_death', {});
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
                if (!partida.esPractica) {
                    otorgarXP(ganador.cuenta_id, ganador.personaje._id, 1).then(c => { if (c) io.to(gSocket).emit('cuentaActualizada', c.toObject()); });
                    otorgarXP(perdedor.cuenta_id, perdedor.personaje._id, 0.5).then(c => { if (c) io.to(pSocket).emit('cuentaActualizada', c.toObject()); });
                }

                io.to(partidaId).emit('finPartida', { ganador: gSocket });
            } else {
                io.to(partidaId).emit('logBatalla', { msg: `Ambos jugadores han caído. ¡Empate!`, tipo: 'muerte' });
                partidaEmitirEstado(partidaId, partida);
                io.to(partidaId).emit('finPartida', { ganador: null, empate: true });
            }
            delete partidas[partidaId];
            return true;
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

        const peLogs = [];
        [yo, rival].forEach(j => {
            gp.procesarEfectosPersistentes(j).forEach(l => peLogs.push(l));
            gp.procesarEfectosEquipados(j).forEach(l => peLogs.push(l));
        });
        peLogs.forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'curacion' }));

        // ----- fortune status decrement -----
        const fsTurno = partida.fortunaStatus || {};
        const turnosToDecrement = ['swapHealDamage', 'swapStats', 'reversePassives', 'slowFast', 'antiStrength', 'mirrorDamage', 'pacifism', 'bloodthirstyRest', 'invertResistance', 'sharedTurn', 'statLottery', 'beastNumber', 'butterHands', 'clumsy', 'mute', 'wasteAction', 'noAttack', 'sacredGround', 'chaosFog', 'possession', 'clone', 'ghost', 'amnesia'];
        turnosToDecrement.forEach(k => {
            if (typeof fsTurno[k] === 'number' && fsTurno[k] > 0) {
                fsTurno[k]--;
                if (fsTurno[k] <= 0) delete fsTurno[k];
            }
        });
        // statLottery revert when timer expires
        if (partida._statLotteryTimer !== undefined) {
            partida._statLotteryTimer--;
            if (partida._statLotteryTimer <= 0) {
                delete partida._statLotteryTimer;
                [partida.jugador1, partida.jugador2].forEach(j => {
                    const orig = j._statsOriginales;
                    if (orig) {
                        j.personaje.fuerza = orig.fuerza;
                        j.personaje.resistencia = orig.resistencia;
                        j.personaje.velocidad = orig.velocidad;
                        j.personaje.magia = orig.magia;
                        j.personaje.suerte = orig.suerte;
                        delete j._statsOriginales;
                        io.to(partidaId).emit('logBatalla', { msg: `${j.nombre} recupera sus stats originales (lotería terminó)`, tipo: 'fortuna' });
                    }
                });
            }
        }
        if (partida._swapStatsTimer !== undefined) {
            partida._swapStatsTimer--;
            if (partida._swapStatsTimer <= 0) {
                delete partida._swapStatsTimer;
                [partida.jugador1, partida.jugador2].forEach(j => {
                    const swap = j._statsOriginales;
                    if (swap) {
                        j.personaje.fuerza = swap.fuerza;
                        j.personaje.resistencia = swap.resistencia;
                        j.personaje.velocidad = swap.velocidad;
                        j.personaje.magia = swap.magia;
                        j.personaje.suerte = swap.suerte;
                        delete j._statsOriginales;
                        io.to(partidaId).emit('logBatalla', { msg: `${j.nombre} recupera sus estadísticas originales`, tipo: 'fortuna' });
                    }
                });
            }
        }

        // ----- frozen check -----
        if (yo.status && yo.status.frozen > 0) {
            partida.turnoActual = rival.socketId;
            io.to(partidaId).emit('logBatalla', { msg: `${yo.nombre} salta turno por paralisis`, tipo: 'status' });
        } else {
            partida.turnoActual = rival.socketId;
        }

        partida.turno++;
        if (!partida._fortunaTriggered || (partida.turno > 0 && partida.turno % 7 === 0)) {
          const card = FORTUNE_CARDS[Math.floor(Math.random() * FORTUNE_CARDS.length)];
          const flogs = gp.aplicarFortuna(card, partida, partida.jugador1, partida.jugador2);
          flogs.forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'fortuna' }));
          io.to(partidaId).emit('fortunaCard', {
            id: card.id, nombre: card.nombre, categoria: card.categoria,
            desc: card.desc, efecto: card.efecto
          });
          partida._fortunaTriggered = true;
          if (flogs.some(l => l.includes('muere') || l.includes('aniquilado'))) {
            if (partidaCheckMuerte(partidaId, partida)) return;
          }
        }

        const jugTurno = partida.turnoActual === partida.jugador1.socketId ? partida.jugador1 : partida.jugador2;
        const rivTurno = partida.turnoActual === partida.jugador1.socketId ? partida.jugador2 : partida.jugador1;

        // ----- slowFast: fastest player skips turn -----
        if (fsTurno.slowFast && jugTurno.turnosJugados > rivTurno.turnosJugados) {
            if (rivTurno.status && rivTurno.status.frozen > 0) {
                partida.turnoActual = jugTurno.socketId;
                io.to(partidaId).emit('logBatalla', { msg: `${rivTurno.nombre} salta turno por paralisis`, tipo: 'status' });
            } else {
                partida.turnoActual = rivTurno.socketId;
            }
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} salta su turno (slowFast)`, tipo: 'fortuna' });
            partidaEmitirEstado(partidaId, partida);
            return;
        }

        // ----- wasteAction: fastest player wastes 1 action -----
        if (fsTurno.wasteAction && jugTurno.turnosJugados > rivTurno.turnosJugados) {
            partida.accionesMax = Math.max(1, partida.accionesMax - 1);
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} pierde una acción (desperdicio)`, tipo: 'fortuna' });
        }

        // ----- clone: fastest attacks self -----
        if (fsTurno.clone && jugTurno.turnosJugados > rivTurno.turnosJugados) {
            const statsClone = gp.calcularStatsConBuffs(jugTurno);
            const statsCloneDef = gp.calcularStatsConBuffs(jugTurno);
            const dadoClone = Math.floor(Math.random() * 6) + 1;
            let dmgClone = Math.max(0, dadoClone + statsClone.fuerza - statsCloneDef.resistencia);
            if (jugTurno.status && jugTurno.status.shield > 0) {
                const abs = Math.min(jugTurno.status.shield, dmgClone);
                jugTurno.status.shield -= abs;
                dmgClone -= abs;
            }
            jugTurno.hp -= dmgClone;
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} ataca su propio clon: -${dmgClone} HP`, tipo: 'fortuna' });
            if (partidaCheckMuerte(partidaId, partida)) return;
        }

        // ----- ghost: phantom attack on rival -----
        if (fsTurno.ghost > 0) {
            const statsGhostAtk = gp.calcularStatsConBuffs(jugTurno);
            const statsGhostDef = gp.calcularStatsConBuffs(rivTurno);
            const dadoGhost = Math.floor(Math.random() * 6) + 1;
            let dmgGhost = Math.max(0, dadoGhost + statsGhostAtk.fuerza - statsGhostDef.resistencia);
            if (rivTurno.status && rivTurno.status.shield > 0) {
                const abs = Math.min(rivTurno.status.shield, dmgGhost);
                rivTurno.status.shield -= abs;
                dmgGhost -= abs;
            }
            rivTurno.hp -= dmgGhost;
            io.to(partidaId).emit('logBatalla', { msg: `Ataque fantasma: ${dmgGhost} de daño a ${rivTurno.nombre}`, tipo: 'fortuna' });
            if (partidaCheckMuerte(partidaId, partida)) return;
        }

        // ----- amnesia: forget random skill (pasiva) -----
        if (fsTurno.amnesia > 0 && jugTurno.pasivas && jugTurno.pasivas.length > 0) {
            const idxAmnesia = Math.floor(Math.random() * jugTurno.pasivas.length);
            const olvidada = jugTurno.pasivas.splice(idxAmnesia, 1)[0];
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} olvida ${olvidada.nombre || olvidada} (amnesia)`, tipo: 'fortuna' });
        }
        // sharedTurn: rival gets extra action
        if (fsTurno.sharedTurn > 0) {
            rivTurno.extraAction = true;
            io.to(partidaId).emit('logBatalla', { msg: `${rivTurno.nombre} gana una acción extra (turno compartido)`, tipo: 'fortuna' });
        }

        const magJug = jugTurno.personaje.magia;
        const magRiv = rivTurno.personaje.magia;
        const enRegen = gp.calcularRegeneracionEnergia(magJug, magRiv);
        jugTurno.energia = Math.min(100, jugTurno.energia + enRegen);

        const claseRegen = gp.aplicarHPRegenClase(jugTurno);
        if (claseRegen > 0) io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} regenera +${claseRegen} HP (clase)`, tipo: 'curacion' });

        // First-turn class bonuses for whoever is starting their first turn
        const esPrimerTurnoJ1 = partida.primerTurnoJ1 && jugTurno === partida.jugador1;
        const esPrimerTurnoJ2 = partida.primerTurnoJ2 && jugTurno === partida.jugador2;
        if (esPrimerTurnoJ1) {
            gp.aplicarEfectosClase(jugTurno, true).forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'carta' }));
            partida.primerTurnoJ1 = false;
        }
        if (esPrimerTurnoJ2) {
            gp.aplicarEfectosClase(jugTurno, true).forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'carta' }));
            partida.primerTurnoJ2 = false;
        }

        jugTurno.critBonus = 0;
        jugTurno.reducedCost = 0;
        jugTurno.enrageBonus = 0;

        const tLogs1 = pp(jugTurno.pasivas, jugTurno, rivTurno, 'on_turn_start', {});
        const tLogs2 = pp(rivTurno.pasivas, rivTurno, jugTurno, 'on_turn_start', {});
        [...tLogs1, ...tLogs2].forEach(r => { if (r.log) io.to(partidaId).emit('logBatalla', { msg: r.log, tipo: 'pasiva' }); });

        partida.accionesMax = 2 + (jugTurno.extraAction ? 1 : 0);
        jugTurno.extraAction = false;
        if (jugTurno.mareado) {
            partida.accionesMax = Math.max(1, partida.accionesMax - 1);
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} está mareado — pierde 1 acción`, tipo: 'marea' });
            jugTurno.mareado = false;
        }

        if (jugTurno.critClase) {
            jugTurno.critClase.duracion--;
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre}: crítico ${jugTurno.critClase.multi * 100}% por ${jugTurno.critClase.duracion} turnos`, tipo: 'carta' });
            if (jugTurno.critClase.duracion <= 0) {
                delete jugTurno.critClase;
                io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre}: efecto crítico de clase expiró`, tipo: 'carta' });
            }
        }

        // _fortunaTA: El Elegido extra action
        if (jugTurno._fortunaTA) {
            partida.accionesMax++;
            io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} recibe una acción extra (El Elegido)`, tipo: 'fortuna' });
        }

        // wasteAction: decrement actionsMax (after wasted action was recorded)
        if (fsTurno.wasteAction && partida.accionesUsadas.filter(a => a === 'waste').length > 0) {
            // already accounted for above
        }

        jugTurno.turnosJugados = (jugTurno.turnosJugados || 0) + 1;

        io.to(partidaId).emit('logBatalla', { msg: `${jugTurno.nombre} recupera ${enRegen} energía`, tipo: 'energia' });
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
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
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
            socketNombres.set(socket.id, cuenta.nombre);
            socket.emit('loginExitoso', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
            });
        } catch (err) {
            socket.emit('errorLogin', 'Error al iniciar sesión.');
        }
    });

    socket.on('reconectarCuenta', async ({ cuenta_id }) => {
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (!cuenta) { socket.emit('errorReconexion', 'Cuenta no encontrada.'); return; }
            socketNombres.set(socket.id, cuenta.nombre);
            socket.emit('loginExitoso', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
            });
        } catch (err) {
            socket.emit('errorReconexion', 'Error al reconectar.');
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
        if (suma !== 20 || datos.fuerza < 3 || datos.resistencia < 3 || datos.velocidad < 3 || datos.magia < 3 || datos.suerte < 3) {
            if (suma !== 20) {
                socket.emit('errorPersonaje', 'Los puntos deben sumar 20.');
            } else {
                socket.emit('errorPersonaje', 'Cada estadística debe tener al menos 3 puntos.');
            }
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
                foto: datos.foto || '',
                activasIniciales: datos.activasIniciales || []
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
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
            });
        } catch (err) {
            socket.emit('errorPersonaje', 'Error al eliminar.');
        }
    });

    socket.on('actualizarFotoPJ', async ({ cuenta_id, personaje_id, foto }) => {
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
            const pj = cuenta.personajes.id(personaje_id);
            if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
            pj.foto = foto || '';
            await cuenta.save();
            socket.emit('loadoutGuardado', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
            });
        } catch (err) {
            socket.emit('errorPersonaje', 'Error al actualizar foto.');
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
            if (stats.fuerza < 0 || stats.resistencia < 0 || stats.velocidad < 0 || stats.magia < 0 || stats.suerte < 0) {
                socket.emit('errorPersonaje', 'Mínimo 0 puntos por estadística.'); return;
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
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
            });
        } catch (err) {
            socket.emit('errorPersonaje', 'Error al asignar stats.');
        }
    });

    socket.on('guardarLoadout', async ({ cuenta_id, personaje_id, activas }) => {
        try {
            if (!Array.isArray(activas) || activas.length > 5) {
                socket.emit('errorPersonaje', 'Máximo 5 activas equipadas.'); return;
            }
            const cuenta = await Cuenta.findById(cuenta_id);
            if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
            const pj = cuenta.personajes.id(personaje_id);
            if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
            pj.activasEquipadas = activas;
            await cuenta.save();
            socket.emit('loadoutGuardado', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills,
                inventarioPasivas: cuenta.inventarioPasivas
            });
        } catch (err) {
            socket.emit('errorPersonaje', 'Error al guardar loadout.');
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
            if (accion === 'listarUsuarios') {
                const usuarios = await Cuenta.find({}, 'nombre dinero nivel personajes');
                const lista = usuarios.map(u => ({
                    id: u._id,
                    nombre: u.nombre,
                    dinero: u.dinero,
                    nivel: u.nivel,
                    personajesCount: u.personajes ? u.personajes.length : 0
                }));
                socket.emit('devListaUsuarios', lista);
                return;
            }
            if (accion === 'obtenerUsuario') {
                const target = await Cuenta.findById(params.userId);
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
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills || [],
                inventarioPasivas: cuenta.inventarioPasivas || []
            });
        } catch (err) {
            socket.emit('errorPersonaje', 'Error al ejecutar comando.');
        }
    });

    socket.on('buscarPartida', async ({ cuenta_id, personaje }) => {
        console.log('Buscando partida para:', personaje.nombre);
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (cuenta) {
                const migrado = migrarInventario(cuenta);
                if (migrado) await cuenta.save();
                colaEspera.push({ socketId: socket.id, cuenta_id, personaje, _invSkills: cuenta.inventarioSkills || [], _invPas: cuenta.inventarioPasivas || [] });
            } else {
                colaEspera.push({ socketId: socket.id, cuenta_id, personaje, _invSkills: [], _invPas: [] });
            }
        } catch {
            colaEspera.push({ socketId: socket.id, cuenta_id, personaje, _invSkills: [], _invPas: [] });
        }
        socket.emit('esperandoRival');

        if (colaEspera.length >= 2) {
            const jugador1 = colaEspera.shift();
            const jugador2 = colaEspera.shift();
            const partidaId = `${jugador1.socketId}-${jugador2.socketId}`;

            const maxHP1 = getMaxHP(jugador1.personaje.clase);
            const maxHP2 = getMaxHP(jugador2.personaje.clase);

            const personaje1 = { ...jugador1.personaje };
            const personaje2 = { ...jugador2.personaje };

            const ordenTurnos = gp.calcularTurnoInicial([
                { socketId: jugador1.socketId, velocidad: personaje1.velocidad, nombre: personaje1.nombre },
                { socketId: jugador2.socketId, velocidad: personaje2.velocidad, nombre: personaje2.nombre }
            ]);
            const turnoInicial = ordenTurnos[0].socketId;

            const comp1 = jugador1._invSkills || [];
            const comp2 = jugador2._invSkills || [];
            const pasivasComp1 = jugador1._invPas || [];
            const pasivasComp2 = jugador2._invPas || [];

            const pasivas1 = getPasivasClase(jugador1.personaje.clase, pasivasComp1);
            const pasivas2 = getPasivasClase(jugador2.personaje.clase, pasivasComp2);

            partidas[partidaId] = {
                id: partidaId,
                jugador1: {
                    ...jugador1,
                    personaje: personaje1,
                    nombre: personaje1.nombre,
                    maxHp: maxHP1, hp: maxHP1, energia: 0,
                    pose: null, status: {}, pasivas: pasivas1,
                    extraAction: false, critBonus: 0, enrageBonus: 0,
                    mareado: false,
                    summon: null, inventario: [],
                    equipment: { mano1: null, mano2: null, armadura: null, accesorio: null },
                    objetosRecibidos: [],
                    skillsCompradas: comp1,
                    pasivasCompradas: pasivasComp1,
                    persistentEffects: [],
                    contadores: {},
                    turnosJugados: 0
                },
                jugador2: {
                    ...jugador2,
                    personaje: personaje2,
                    nombre: personaje2.nombre,
                    maxHp: maxHP2, hp: maxHP2, energia: 0,
                    pose: null, status: {}, pasivas: pasivas2,
                    extraAction: false, critBonus: 0, enrageBonus: 0,
                    mareado: false,
                    summon: null, inventario: [],
                    equipment: { mano1: null, mano2: null, armadura: null, accesorio: null },
                    objetosRecibidos: [],
                    skillsCompradas: comp2,
                    pasivasCompradas: pasivasComp2,
                    persistentEffects: [],
                    contadores: {},
                    turnosJugados: 0
                },
                turnoActual: turnoInicial,
                turno: 0,
                primerTurnoJ1: true,
                primerTurnoJ2: true,
                accionesUsadas: [],
                accionesMax: 2,
                accionCancelada: false,
                fortunaStatus: {},
                _hpIniciales: { j1: { maxHp: maxHP1 }, j2: { maxHp: maxHP2 } }
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
            const skills1 = getSkillsParaClase(personaje1.activasIniciales, comp1, personaje1.activasEquipadas, partidas[partidaId].jugador1.equipment, personaje1.clase);
            const skills2 = getSkillsParaClase(personaje2.activasIniciales, comp2, personaje2.activasEquipadas, partidas[partidaId].jugador2.equipment, personaje2.clase);

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
                        equipment: yoPj.equipment || { mano1: null, mano2: null, armadura: null, accesorio: null },
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
                        foto: rivalPj.personaje.foto || '',
                        status: rivalPj.status || {},
                        objetosRecibidos: rivalPj.objetosRecibidos || []
                    },
                    turnoActual: turnoInicial,
                    esmiTurno: esTurno,
                    accionesRestantes: esTurno ? 2 : 0,
                    skills: esTurno ? skills1 : skills2,
                    pasivas: Object.keys(esTurno ? pasivas1 : pasivas2),
                    pasivasRival: esTurno ? Object.keys(pasivas2) : Object.keys(pasivas1),
                    recetas: MAZOS.recetas
                });
            };

            emitirRival(jugador1.socketId, partidas[partidaId].jugador1, partidas[partidaId].jugador2, esJ1Primero);
            emitirRival(jugador2.socketId, partidas[partidaId].jugador2, partidas[partidaId].jugador1, !esJ1Primero);

            // Initial fortune card
            const cardInicial = FORTUNE_CARDS[Math.floor(Math.random() * FORTUNE_CARDS.length)];
            const flogsInicial = gp.aplicarFortuna(cardInicial, partidas[partidaId], partidas[partidaId].jugador1, partidas[partidaId].jugador2);
            setTimeout(() => {
                flogsInicial.forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'fortuna' }));
                io.to(partidaId).emit('fortunaCard', {
                    id: cardInicial.id, nombre: cardInicial.nombre, categoria: cardInicial.categoria,
                    desc: cardInicial.desc, efecto: cardInicial.efecto
                });
                partidas[partidaId]._fortunaTriggered = true;
            }, 500);
        }
    });

    socket.on('buscarPractica', async ({ cuenta_id, personaje }) => {
        const botId = 'bot-' + socket.id;
        const partidaId = socket.id + '-vs-practica';

        let invSkills = [];
        let invPas = [];
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (cuenta) {
                const migrado = migrarInventario(cuenta);
                if (migrado) await cuenta.save();
                invSkills = cuenta.inventarioSkills || [];
                invPas = cuenta.inventarioPasivas || [];
            }
        } catch {}

        const maxHPJ = getMaxHP(personaje.clase);
        const maxHPB = getMaxHP(BOT_PRACTICA.clase);

        const pj = { ...personaje };
        const botPj = { ...BOT_PRACTICA };

        const orden = gp.calcularTurnoInicial([
            { socketId: socket.id, velocidad: pj.velocidad, nombre: pj.nombre },
            { socketId: botId, velocidad: botPj.velocidad, nombre: botPj.nombre }
        ]);
        const turnoInicial = orden[0].socketId;

        const comp1 = invSkills;
        const comp2 = botPj.skillsCompradas || [];
        const pComp1 = invPas;
        const pComp2 = botPj.pasivasCompradas || [];

        const pas1 = getPasivasClase(pj.clase, pComp1);
        const pas2 = getPasivasClase(botPj.clase, pComp2);

        partidas[partidaId] = {
            id: partidaId,
            jugador1: {
                socketId: socket.id, cuenta_id,
                personaje: pj,
                nombre: pj.nombre, maxHp: maxHPJ, hp: maxHPJ, energia: 0,
                pose: null, status: {}, pasivas: pas1,
                extraAction: false, critBonus: 0, enrageBonus: 0,
                mareado: false,
                summon: null, inventario: [],
                equipment: { mano1: null, mano2: null, armadura: null, accesorio: null },
                objetosRecibidos: [], skillsCompradas: comp1,
                pasivasCompradas: pComp1, persistentEffects: [], contadores: {},
                turnosJugados: 0
            },
            jugador2: {
                socketId: botId, cuenta_id: null,
                personaje: botPj,
                nombre: botPj.nombre, maxHp: maxHPB, hp: maxHPB, energia: 0,
                pose: null, status: {}, pasivas: pas2,
                extraAction: false, critBonus: 0, enrageBonus: 0,
                mareado: false,
                summon: null, inventario: [],
                equipment: { mano1: null, mano2: null, armadura: null, accesorio: null },
                objetosRecibidos: [], skillsCompradas: comp2,
                pasivasCompradas: pComp2, persistentEffects: [], contadores: {},
                turnosJugados: 0
            },
            turnoActual: turnoInicial, turno: 0,
            primerTurnoJ1: true, primerTurnoJ2: true,
            accionesUsadas: [], accionesMax: 2,
            accionCancelada: false, esPractica: true,
            fortunaStatus: {},
            _hpIniciales: { j1: { maxHp: maxHPJ }, j2: { maxHp: maxHPB } }
        };

        const s = io.sockets.sockets.get(socket.id);
        if (s) s.join(partidaId);

        const pJug = turnoInicial === socket.id ? partidas[partidaId].jugador1 : partidas[partidaId].jugador2;
        const pRiv = turnoInicial === socket.id ? partidas[partidaId].jugador2 : partidas[partidaId].jugador1;

        pJug.energia = Math.min(100, pJug.energia + gp.calcularRegeneracionEnergia(pJug.personaje.magia, pRiv.personaje.magia));
        gp.aplicarEfectosClase(pJug, false);
        gp.aplicarEfectosClase(pRiv, false);
        gp.aplicarCritClase(pJug);
        gp.aplicarCritClase(pRiv);

        const esJugPrimero = turnoInicial === socket.id;
        const sJug = getSkillsParaClase(pj.activasIniciales, comp1, pj.activasEquipadas, partidas[partidaId].jugador1.equipment, pj.clase);
        const sRival = getSkillsParaClase(botPj.activasIniciales, comp2, botPj.activasEquipadas, partidas[partidaId].jugador2.equipment, botPj.clase);

        socket.emit('rivalEncontrado', {
            partidaId,
            yo: {
                nombre: pJug.nombre, clase: pJug.personaje.clase,
                hp: pJug.hp, energia: pJug.energia, maxHp: pJug.maxHp,
                fuerza: pJug.personaje.fuerza, resistencia: pJug.personaje.resistencia,
                velocidad: pJug.personaje.velocidad, magia: pJug.personaje.magia,
                suerte: pJug.personaje.suerte, nivel: pJug.personaje.nivel || 1,
                foto: pJug.personaje.foto || '', status: pJug.status || {},
                inventario: pJug.inventario || [],
                equipment: pJug.equipment || { mano1: null, mano2: null, armadura: null, accesorio: null },
                objetosRecibidos: pJug.objetosRecibidos || []
            },
            rival: {
                nombre: pRiv.nombre, clase: pRiv.personaje.clase,
                hp: pRiv.hp, energia: pRiv.energia, maxHp: pRiv.maxHp,
                fuerza: pRiv.personaje.fuerza, resistencia: pRiv.personaje.resistencia,
                velocidad: pRiv.personaje.velocidad, magia: pRiv.personaje.magia,
                suerte: pRiv.personaje.suerte, nivel: pRiv.personaje.nivel || 1,
                foto: pRiv.personaje.foto || '', status: pRiv.status || {},
                objetosRecibidos: pRiv.objetosRecibidos || []
            },
            turnoActual: turnoInicial,
            esmiTurno: esJugPrimero,
            accionesRestantes: esJugPrimero ? 2 : 0,
            skills: sJug,
            pasivas: Object.keys(pas1),
            skillsRival: sRival,
            pasivasRival: Object.keys(pas2),
            esPractica: true,
            recetas: MAZOS.recetas
        });

        // Initial fortune card
        const cardInicial = FORTUNE_CARDS[Math.floor(Math.random() * FORTUNE_CARDS.length)];
        const flogsInicial = gp.aplicarFortuna(cardInicial, partidas[partidaId], partidas[partidaId].jugador1, partidas[partidaId].jugador2);
        setTimeout(() => {
            flogsInicial.forEach(l => io.to(partidaId).emit('logBatalla', { msg: l, tipo: 'fortuna' }));
            io.to(partidaId).emit('fortunaCard', {
                id: cardInicial.id, nombre: cardInicial.nombre, categoria: cardInicial.categoria,
                desc: cardInicial.desc, efecto: cardInicial.efecto
            });
            partidas[partidaId]._fortunaTriggered = true;
        }, 500);
    });

    socket.on('cancelarBusqueda', () => {
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
    });

    socket.on('obtenerTienda', async ({ cuenta_id }) => {
        const cuenta = await Cuenta.findById(cuenta_id);
        if (!cuenta) return;
        const migrado = migrarInventario(cuenta);
        if (migrado) await cuenta.save();
        socket.emit('tiendaData', {
            skills: Object.entries(SKILLS_DATA.activas).map(([id, s]) => ({ id, ...s, precio: SKILL_PRICES.activas[id] || 500 })),
            pasivas: Object.entries(SKILLS_DATA.pasivas).map(([id, s]) => ({ id, ...s, precio: SKILL_PRICES.pasivas[id] || 800 })),
            inventarioSkills: cuenta.inventarioSkills || [],
            inventarioPasivas: cuenta.inventarioPasivas || []
        });
    });

    socket.on('comprarCarta', async ({ cuenta_id, tipo, skillId }) => {
        try {
            const cuenta = await Cuenta.findById(cuenta_id);
            if (!cuenta) { socket.emit('errorTienda', 'Cuenta no encontrada'); return; }
            migrarInventario(cuenta);

            const precio = tipo === 'activa' ? (SKILL_PRICES.activas[skillId] || 500) : (SKILL_PRICES.pasivas[skillId] || 800);
            if (cuenta.dinero < precio) { socket.emit('errorTienda', 'No tenes suficiente oro'); return; }

            if (tipo === 'activa') {
                const yaTiene = (cuenta.inventarioSkills || []).includes(skillId);
                if (yaTiene) { socket.emit('errorTienda', 'Ya tenes esta carta'); return; }
                if (cuenta.inventarioSkills) { cuenta.inventarioSkills.push(skillId); }
                else { cuenta.inventarioSkills = [skillId]; }
            } else {
                const yaTiene = (cuenta.inventarioPasivas || []).includes(skillId);
                if (yaTiene) { socket.emit('errorTienda', 'Ya tenes esta pasiva'); return; }
                if (cuenta.inventarioPasivas) { cuenta.inventarioPasivas.push(skillId); }
                else { cuenta.inventarioPasivas = [skillId]; }
            }

            cuenta.dinero -= precio;
            await cuenta.save();
            socket.emit('compraExitosa', {
                id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
                nivel: cuenta.nivel, experiencia: cuenta.experiencia,
                foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
                inventarioSkills: cuenta.inventarioSkills,
                inventarioPasivas: cuenta.inventarioPasivas
            });
        } catch (err) {
            socket.emit('errorTienda', 'Error al comprar: ' + err.message);
        }
    });

    socket.on('disconnect', () => {
        for (const [id, partida] of Object.entries(partidas)) {
            if (partida.jugador1.socketId === socket.id || partida.jugador2.socketId === socket.id) {
                const rivalId = partida.jugador1.socketId === socket.id ? partida.jugador2.socketId : partida.jugador1.socketId;
                const rivalData = partida.jugador1.socketId === socket.id ? partida.jugador2 : partida.jugador1;
                io.to(rivalId).emit('finPartida', { ganador: rivalId, motivo: 'El rival se desconectó.' });
                if (!partida.esPractica) {
                    otorgarXP(rivalData.cuenta_id, rivalData.personaje._id, 1).then(c => { if (c) io.to(rivalId).emit('cuentaActualizada', c.toObject()); });
                }
                delete partidas[id];
            }
        }
        colaEspera = colaEspera.filter(j => j.socketId !== socket.id);
        socketNombres.delete(socket.id);
        console.log('Desconectado:', socket.id);
    });
});

// Periodically clean up stale matches (safety net)
setInterval(() => {
  for (const [id, partida] of Object.entries(partidas)) {
    const j1ok = io.sockets.sockets.has(partida.jugador1.socketId);
    const j2ok = partida.jugador2.socketId && io.sockets.sockets.has(partida.jugador2.socketId);
    if (!j1ok || (!j2ok && !partida.esPractica)) {
      delete partidas[id];
    }
  }
}, 60000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Servidor en http://localhost:${PORT}`));
