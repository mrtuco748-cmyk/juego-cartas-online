const SKILLS_DATA = {
  activas: {
    golpe_directo: { nombre: "Golpe Directo", coste: 25, efecto: "damage_percent", valor: 0.25 },
    paralisis: { nombre: "Parálisis", coste: 35, efecto: "stun", duracion: 2 },
    cubo_perfecto: { nombre: "Cubo Perfecto", coste: 20, efecto: "cancel_attack" },
    jackpot: { nombre: "Jackpot", coste: 70, efecto: "rng_kill", rng: 6 },
    curacion_divina: { nombre: "Curación Divina", coste: 30, efecto: "heal_percent", valor: 0.40 },
    escudo_arcano: { nombre: "Escudo Arcano", coste: 25, efecto: "shield", valor: 0.30 },
    furia_berserker: { nombre: "Furia Berserker", coste: 40, efecto: "buff", stat: "fuerza", valor: 5, duracion: 3 },
    maldicion: { nombre: "Maldición", coste: 30, efecto: "debuff", stat: "resistencia", valor: 3, duracion: 3 },
    drenar_vida: { nombre: "Drenar Vida", coste: 35, efecto: "lifesteal", valor: 0.20 },
    explosion_mana: { nombre: "Explosión de Maná", coste: 50, efecto: "damage_true", valor: 35 },
    golpe_veloz: { nombre: "Golpe Veloz", coste: 15, efecto: "double_attack" },
    reflejo_magico: { nombre: "Reflejo Mágico", coste: 40, efecto: "reflect", valor: 0.50, duracion: 2 },
    tormenta: { nombre: "Tormenta", coste: 45, efecto: "aoe_damage", valor: 0.20 },
    sello_silencio: { nombre: "Sello de Silencio", coste: 30, efecto: "silence", duracion: 2 },
    sacrificio: { nombre: "Sacrificio", coste: 10, efecto: "sacrifice", valor: 0.30 },
    invocacion: { nombre: "Invocación Menor", coste: 55, efecto: "summon", valor: 0.25 },
    rafaga: { nombre: "Ráfaga", coste: 20, efecto: "damage_percent", valor: 0.15 },
    cataclismo: { nombre: "Cataclismo", coste: 80, efecto: "damage_true", valor: 60 },
    bendicion: { nombre: "Bendición", coste: 35, efecto: "buff_all", valor: 2, duracion: 2 },
    escarcha: { nombre: "Escarcha", coste: 25, efecto: "debuff", stat: "velocidad", valor: 4, duracion: 2 }
  },
  pasivas: {
    veneno: { nombre: "Veneno", efecto: "dot", valor: 0.05, trigger: "on_hit" },
    totem: { nombre: "Tótem", efecto: "survival", hp_min: 1, trigger: "on_death_blow" },
    regeneracion: { nombre: "Regeneración", efecto: "regen_hp", valor: 0.03, trigger: "on_turn_start" },
    mana_infinito: { nombre: "Maná Infinito", efecto: "regen_energy", valor: 5, trigger: "on_turn_start" },
    contraataque: { nombre: "Contraataque", efecto: "counter", valor: 0.50, trigger: "on_take_damage" },
    escudo_espinas: { nombre: "Escudo de Espinas", efecto: "thorns", valor: 0.10, trigger: "on_take_damage" },
    rapidez: { nombre: "Rapidez", efecto: "extra_action", probabilidad: 0.20, trigger: "on_turn_start" },
    ultimo_aliento: { nombre: "Último Aliento", efecto: "revive", valor: 0.30, trigger: "on_death" },
    absorcion: { nombre: "Absorción de Hechizos", efecto: "spell_vamp", valor: 0.15, trigger: "on_cast" },
    maestro_critico: { nombre: "Maestro Crítico", efecto: "crit_up", valor: 0.25, trigger: "on_attack" },
    fortaleza: { nombre: "Fortaleza", efecto: "damage_reduction", valor: 0.10, trigger: "on_take_damage" },
    vampirismo: { nombre: "Vampirismo", efecto: "life_steal", valor: 0.08, trigger: "on_hit" },
    escudo_natural: { nombre: "Escudo Natural", efecto: "auto_shield", valor: 0.15, trigger: "on_turn_start" },
    furia_interna: { nombre: "Furia Interna", efecto: "enrage", valor: 0.03, trigger: "on_hp_loss" },
    bendito: { nombre: "Bendito", efecto: "cleanse", trigger: "on_turn_start" }
  }
};

const CLASS_DATA = {
  Chaman: { tipo: "PS", mods: { magia: 3, resistencia: 2, fuerza: 2, velocidad: 4, suerte: 0 }, hpBonus: 15, hpRegen: 5, desc: "Curandero espiritual" },
  Sacerdote: { tipo: "PS", mods: { magia: 5, resistencia: 3, fuerza: 1, velocidad: 0, suerte: 0 }, hpBonus: 25, hpRegen: 3, desc: "Sanador divino" },
  Druida: { tipo: "PS", mods: { magia: 4, resistencia: 2, fuerza: 3, velocidad: 1, suerte: 0 }, hpBonus: 20, hpRegen: 4, desc: "Guardián natural" },
  Guerrero: { tipo: "Fuerza", mods: { magia: -3, resistencia: 3, fuerza: 4, velocidad: 3, suerte: 0 }, hpBonus: 0, critEfecto: { multi: 1.0, duracion: 2 }, desc: "Luchador versátil" },
  Paladin: { tipo: "Fuerza", mods: { magia: -3, resistencia: 5, fuerza: 4, velocidad: 1, suerte: 0 }, hpBonus: 0, critEfecto: { multi: 0.5, duracion: 4 }, desc: "Caballero sagrado" },
  Berserker: { tipo: "Fuerza", mods: { magia: -6, resistencia: 5, fuerza: 5, velocidad: -5, suerte: 0 }, hpBonus: 0, critEfecto: { multi: 0.25, duracion: 8 }, desc: "Guerrero furioso" },
  Acorazado: { tipo: "Resistencia", mods: { magia: 0, resistencia: 10, fuerza: -1, velocidad: -5, suerte: 0 }, hpBonus: 10, desc: "Muro andante" },
  Ogro: { tipo: "Resistencia", mods: { magia: -7, resistencia: 6, fuerza: 3, velocidad: 1, suerte: 0 }, hpBonus: 10, desc: "Bruto imparable" },
  Golem: { tipo: "Resistencia", mods: { magia: -4, resistencia: 7, fuerza: 2, velocidad: -3, suerte: 0 }, hpBonus: 15, desc: "Ser de piedra" },
  Picaro: { tipo: "Velocidad", mods: { magia: -2, resistencia: 3, fuerza: -2, velocidad: 6, suerte: 5 }, hpBonus: 0, accionesExtra1: true, desc: "Ladrón astuto" },
  Ninja: { tipo: "Velocidad", mods: { magia: -5, resistencia: -1, fuerza: -4, velocidad: 8, suerte: 2 }, hpBonus: 0, accionesExtra1: true, desc: "Asesino silencioso" },
  Cazador: { tipo: "Velocidad", mods: { magia: 0, resistencia: 2, fuerza: -3, velocidad: 7, suerte: 0 }, hpBonus: 0, accionesExtra1: true, desc: "Rastreador experto" },
  Mago: { tipo: "Magia", mods: { magia: 5, resistencia: 0, fuerza: 0, velocidad: 4, suerte: 0 }, hpBonus: 0, energiaPrimerTurno: 15, desc: "Lanzador de conjuros" },
  MagoMaestro: { tipo: "Magia", mods: { magia: 10, resistencia: -3, fuerza: -3, velocidad: -3, suerte: 0 }, hpBonus: 0, energiaPrimerTurno: 25, desc: "Archimago" },
  MagoGuerrero: { tipo: "Magia", mods: { magia: 5, resistencia: 3, fuerza: 3, velocidad: -3, suerte: 0 }, hpBonus: 0, energiaPrimerTurno: 10, desc: "Mago de batalla" },
  SemiDios: { tipo: "Especial", mods: { magia: 2, resistencia: 2, fuerza: 5, velocidad: 2, suerte: 2 }, hpBonus: 0, inmune1ronda: true, desc: "Ser divino" },
  Demonio: { tipo: "Especial", mods: { magia: 3, resistencia: 3, fuerza: 3, velocidad: 3, suerte: 3 }, hpBonus: 0, hpPenalidad: 0.20, danoAHP: true, desc: "Ente infernal" },
  Titan: { tipo: "Especial", mods: { magia: 3, resistencia: 3, fuerza: 4, velocidad: 0, suerte: 0 }, hpBonus: 10, desc: "Coloso ancestral" }
};

function aplicarModsClase(clase, statsBase) {
  const info = CLASS_DATA[clase];
  if (!info) return statsBase;
  const finales = {};
  for (const s of ["fuerza", "resistencia", "velocidad", "magia", "suerte"]) {
    finales[s] = Math.max(1, (statsBase[s] || 5) + (info.mods[s] || 0));
  }
  return finales;
}

function getMaxHP(clase) {
  const info = CLASS_DATA[clase];
  return 40 + (info ? info.hpBonus || 0 : 0);
}

const MAZOS = {
  investigacion: [
    { nombre: "Madera", tipo: "material", desc: "Material básico para crear" },
    { nombre: "Hierro", tipo: "material", desc: "Metal resistente" },
    { nombre: "Piedra", tipo: "material", desc: "Roca sólida" },
    { nombre: "Cuero", tipo: "material", desc: "Piel curtida" },
    { nombre: "Tela", tipo: "material", desc: "Fibra textil" },
    { nombre: "Gemas", tipo: "material", desc: "Gemas brillantes" },
    { nombre: "Cuerda", tipo: "material", desc: "Fibra trenzada" },
    { nombre: "Hueso", tipo: "material", desc: "Restos óseos" },
    { nombre: "Poción Menor", tipo: "consumible", desc: "Cura 10 HP", efecto: "cura", valor: 10 },
    { nombre: "Poción de Energía", tipo: "consumible", desc: "Recupera 10 energía", efecto: "energia", valor: 10 },
    { nombre: "Vendas", tipo: "consumible", desc: "Cura 5 HP", efecto: "cura", valor: 5 },
    { nombre: "Cofre de Armas", tipo: "cofre", desc: "Saca una carta del mazo de armas" },
    { nombre: "Cofre de Accesorios", tipo: "cofre", desc: "Saca una carta del mazo de accesorios" }
  ],
  armas: [
    { nombre: "Espada Corta", tipo: "arma", peso: 2, filo: 3, desc: "Daño +2 peso +3 filo" },
    { nombre: "Hacha", tipo: "arma", peso: 4, filo: 2, desc: "Daño +4 peso +2 filo" },
    { nombre: "Daga", tipo: "arma", peso: 1, filo: 4, desc: "Daño +1 peso +4 filo" },
    { nombre: "Lanza", tipo: "arma", peso: 3, filo: 3, desc: "Daño +3 peso +3 filo" },
    { nombre: "Martillo", tipo: "arma", peso: 5, filo: 1, desc: "Daño +5 peso +1 filo" },
    { nombre: "Bastón", tipo: "arma", peso: 2, filo: 1, desc: "Daño +2 peso +1 filo, +2 magia" }
  ],
  accesorios: [
    { nombre: "Anillo de Protección", tipo: "accesorio", desc: "+2 resistencia", stat: "resistencia", valor: 2 },
    { nombre: "Amuleto de Poder", tipo: "accesorio", desc: "+2 fuerza", stat: "fuerza", valor: 2 },
    { nombre: "Capa de Sombras", tipo: "accesorio", desc: "+2 velocidad", stat: "velocidad", valor: 2 },
    { nombre: "Grimorio", tipo: "accesorio", desc: "+2 magia", stat: "magia", valor: 2 },
    { nombre: "Trébol", tipo: "accesorio", desc: "+2 suerte", stat: "suerte", valor: 2 },
    { nombre: "Armadura Ligera", tipo: "armadura", desc: "+3 resistencia", stat: "resistencia", valor: 3 }
  ],
  armaduras: [
    { nombre: "Armadura de Cuero", tipo: "armadura", desc: "+3 resistencia", stat: "resistencia", valor: 3 },
    { nombre: "Armadura de Placas", tipo: "armadura", desc: "+5 resistencia, -1 velocidad", stat: "resistencia", valor: 5, penalidad: { velocidad: -1 } },
    { nombre: "Túnica Mágica", tipo: "armadura", desc: "+2 resistencia, +2 magia", stat: "resistencia", valor: 2 }
  ],
  recetas: [
    { nombre: "Espada Corta", requiere: ["Madera", "Hierro"], resultado: { nombre: "Espada Corta", tipo: "arma", peso: 2, filo: 3 } },
    { nombre: "Hacha", requiere: ["Madera", "Hierro", "Piedra"], resultado: { nombre: "Hacha", tipo: "arma", peso: 4, filo: 2 } },
    { nombre: "Daga", requiere: ["Hierro", "Hueso"], resultado: { nombre: "Daga", tipo: "arma", peso: 1, filo: 4 } },
    { nombre: "Lanza", requiere: ["Madera", "Hierro", "Cuerda"], resultado: { nombre: "Lanza", tipo: "arma", peso: 3, filo: 3 } },
    { nombre: "Martillo", requiere: ["Madera", "Piedra", "Hierro"], resultado: { nombre: "Martillo", tipo: "arma", peso: 5, filo: 1 } },
    { nombre: "Bastón", requiere: ["Madera", "Gemas"], resultado: { nombre: "Bastón", tipo: "arma", peso: 2, filo: 1 } },
    { nombre: "Vendas", requiere: ["Tela"], resultado: { nombre: "Vendas", tipo: "consumible", efecto: "cura", valor: 5 } },
    { nombre: "Poción Menor", requiere: ["Gemas", "Hierro"], resultado: { nombre: "Poción Menor", tipo: "consumible", efecto: "cura", valor: 10 } },
    { nombre: "Poción de Energía", requiere: ["Gemas", "Cuero"], resultado: { nombre: "Poción de Energía", tipo: "consumible", efecto: "energia", valor: 10 } },
    { nombre: "Armadura de Cuero", requiere: ["Cuero", "Cuerda"], resultado: { nombre: "Armadura de Cuero", tipo: "armadura", stat: "resistencia", valor: 3 } },
    { nombre: "Armadura de Placas", requiere: ["Hierro", "Hierro", "Cuero"], resultado: { nombre: "Armadura de Placas", tipo: "armadura", stat: "resistencia", valor: 5 } },
    { nombre: "Anillo de Protección", requiere: ["Gemas", "Hierro"], resultado: { nombre: "Anillo de Protección", tipo: "accesorio", stat: "resistencia", valor: 2 } },
    { nombre: "Amuleto de Poder", requiere: ["Gemas", "Cuero"], resultado: { nombre: "Amuleto de Poder", tipo: "accesorio", stat: "fuerza", valor: 2 } }
  ]
};

class GameProcessor {
  constructor() {
    this.effects = {
      damage_percent: (target, card, ctx) => {
        const dmg = Math.floor(target.maxHp * card.valor);
        target.hp -= dmg;
        return { damage: dmg, log: `${target.nombre} recibe ${dmg} de daño (${card.nombre})` };
      },
      damage_true: (target, card) => {
        target.hp -= card.valor;
        return { damage: card.valor, log: `${target.nombre} recibe ${card.valor} de daño verdadero` };
      },
      heal_percent: (target, card, ctx) => {
        const healed = Math.floor(target.maxHp * card.valor);
        target.hp = Math.min(target.maxHp + (target.hpOverflow || 0), target.hp + healed);
        return { healing: healed, log: `${target.nombre} se cura ${healed} HP` };
      },
      stun: (target, card) => {
        target.status = target.status || {};
        target.status.frozen = (target.status.frozen || 0) + card.duracion;
        return { log: `${target.nombre} queda paralizado por ${card.duracion} turnos` };
      },
      cancel_attack: (target, card, ctx) => {
        ctx.cancelAttack = true;
        return { log: `El ataque entrante ha sido cancelado` };
      },
      rng_kill: (target, card) => {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll === card.rng) {
          target.hp = 0;
          return { damage: 9999, log: `¡${target.nombre} ha sido aniquilado por Jackpot!` };
        }
        return { log: `Jackpot falló (dado: ${roll})` };
      },
      shield: (target, card) => {
        target.status = target.status || {};
        target.status.shield = (target.status.shield || 0) + Math.floor(target.maxHp * card.valor);
        return { log: `${target.nombre} obtiene escudo de ${Math.floor(target.maxHp * card.valor)}` };
      },
      buff: (target, card) => {
        target.status = target.status || {};
        target.status.buffs = target.status.buffs || {};
        target.status.buffs[card.stat] = { valor: card.valor, restante: card.duracion };
        const statNom = { fuerza: "FUE", resistencia: "RES", velocidad: "VEL", magia: "MAG", suerte: "SUE" }[card.stat] || card.stat;
        return { log: `${target.nombre} gana +${card.valor} ${statNom} por ${card.duracion} turnos` };
      },
      debuff: (target, card) => {
        target.status = target.status || {};
        target.status.debuffs = target.status.debuffs || {};
        target.status.debuffs[card.stat] = { valor: card.valor, restante: card.duracion };
        const statNom = { fuerza: "FUE", resistencia: "RES", velocidad: "VEL", magia: "MAG", suerte: "SUE" }[card.stat] || card.stat;
        return { log: `${target.nombre} pierde ${card.valor} ${statNom} por ${card.duracion} turnos` };
      },
      lifesteal: (target, card, ctx) => {
        const dmg = Math.floor(target.maxHp * card.valor);
        target.hp -= dmg;
        ctx.source.hp = Math.min(ctx.source.maxHp + (ctx.source.hpOverflow || 0), ctx.source.hp + dmg);
        return { damage: dmg, healing: dmg, log: `${ctx.source.nombre} drena ${dmg} HP de ${target.nombre}` };
      },
      double_attack: (target, card, ctx) => {
        ctx.doubleAttack = true;
        return { log: `${ctx.source.nombre} se prepara para atacar dos veces` };
      },
      reflect: (target, card) => {
        target.status = target.status || {};
        target.status.reflect = { valor: card.valor, restante: card.duracion };
        return { log: `${target.nombre} reflejará ${card.valor * 100}% del daño por ${card.duracion} turnos` };
      },
      aoe_damage: (target, card, ctx) => {
        const dmg = Math.floor(target.maxHp * card.valor);
        target.hp -= dmg;
        if (ctx.rival) ctx.rival.hp -= dmg;
        return { damage: dmg, log: `Tormenta causa ${dmg} de daño a todos` };
      },
      silence: (target, card) => {
        target.status = target.status || {};
        target.status.silenced = (target.status.silenced || 0) + card.duracion;
        return { log: `${target.nombre} ha sido silenciado por ${card.duracion} turnos` };
      },
      sacrifice: (target, card, ctx) => {
        const hpCost = Math.floor(ctx.source.maxHp * card.valor);
        ctx.source.hp -= hpCost;
        ctx.source.energia = Math.min(100, ctx.source.energia + 40);
        return { log: `${ctx.source.nombre} sacrifica ${hpCost} HP y recupera 40 energía` };
      },
      summon: (target, card, ctx) => {
        ctx.summonHp = Math.floor(ctx.source.maxHp * card.valor);
        return { log: `${ctx.source.nombre} invoca un aliado con ${ctx.summonHp} HP` };
      },
      buff_all: (target, card) => {
        const stats = ["fuerza", "resistencia", "velocidad", "magia"];
        target.status = target.status || {};
        target.status.buffs = target.status.buffs || {};
        stats.forEach(s => {
          target.status.buffs[s] = { valor: card.valor, restante: card.duracion };
        });
        return { log: `${target.nombre} recibe +${card.valor} a todas las stats por ${card.duracion} turnos` };
      }
    };
  }

  executeCard(card, source, target, ctx = {}) {
    ctx.source = source;
    ctx.rival = target;
    ctx.cancelAttack = false;

    if (source.energia < card.coste) {
      return { success: false, reason: "Energía insuficiente", log: `Energía insuficiente (${source.energia}/${card.coste})` };
    }

    source.energia -= card.coste;
    const effectFn = this.effects[card.efecto];
    if (!effectFn) {
      return { success: false, reason: `Efecto desconocido: ${card.efecto}` };
    }

    const result = effectFn(target, card, ctx);

    return {
      success: true,
      cancelAttack: ctx.cancelAttack,
      doubleAttack: ctx.doubleAttack,
      summonHp: ctx.summonHp || 0,
      ...result
    };
  }

  processPassives(pasivas, owner, rival, trigger, ctx = {}) {
    const results = [];
    const ownerName = owner.nombre || (owner.personaje ? owner.personaje.nombre : 'Alguien');
    const rivalName = rival && rival.nombre ? rival.nombre : (rival && rival.personaje ? rival.personaje.nombre : '');

    for (const [id, pasiva] of Object.entries(pasivas)) {
      if (pasiva.trigger !== trigger) continue;

      switch (pasiva.efecto) {
        case "dot":
          if (trigger === "on_hit" && ctx.target) {
            const dmg = Math.floor(ctx.target.maxHp * pasiva.valor);
            ctx.target.hp -= dmg;
            results.push({ log: `${ctx.target.nombre} sufre ${dmg} de daño por veneno` });
          }
          break;
        case "survival":
          if (trigger === "on_death_blow" && owner.hp <= 0) {
            owner.hp = pasiva.hp_min;
            results.push({ log: `${ownerName} sobrevive con ${pasiva.hp_min} HP (Tótem)` });
          }
          break;
        case "regen_hp":
          if (trigger === "on_turn_start") {
            const healed = Math.floor(owner.maxHp * pasiva.valor);
            owner.hp = Math.min(owner.maxHp + (owner.hpOverflow || 0), owner.hp + healed);
            results.push({ log: `${ownerName} regenera ${healed} HP` });
          }
          break;
        case "regen_energy":
          if (trigger === "on_turn_start") {
            owner.energia = Math.min(100, owner.energia + pasiva.valor);
            results.push({ log: `${ownerName} recupera ${pasiva.valor} energía` });
          }
          break;
        case "counter":
          if (trigger === "on_take_damage" && ctx.damage) {
            const counterDmg = Math.floor(ctx.damage * pasiva.valor);
            if (rival) rival.hp -= counterDmg;
            results.push({ log: `${ownerName} contraataca causando ${counterDmg} daño` });
          }
          break;
        case "thorns":
          if (trigger === "on_take_damage" && ctx.damage) {
            const thornsDmg = Math.floor(ctx.damage * pasiva.valor);
            if (rival) rival.hp -= thornsDmg;
            results.push({ log: `Espinas causan ${thornsDmg} daño` });
          }
          break;
        case "extra_action":
          if (trigger === "on_turn_start" && Math.random() < pasiva.probabilidad) {
            owner.extraAction = true;
            results.push({ log: `${ownerName} obtiene acción extra (Rapidez)` });
          }
          break;
        case "revive":
          if (trigger === "on_death" && owner.hp <= 0) {
            owner.hp = Math.floor(owner.maxHp * pasiva.valor);
            results.push({ log: `${ownerName} revive con ${owner.hp} HP` });
          }
          break;
        case "spell_vamp":
          if (trigger === "on_cast" && ctx.damage) {
            const vamp = Math.floor(ctx.damage * pasiva.valor);
            owner.hp = Math.min(owner.maxHp + (owner.hpOverflow || 0), owner.hp + vamp);
            results.push({ log: `${ownerName} absorbe ${vamp} HP del hechizo` });
          }
          break;
        case "crit_up":
          if (trigger === "on_attack") owner.critBonus = (owner.critBonus || 0) + pasiva.valor;
          break;
        case "damage_reduction":
          if (trigger === "on_take_damage" && ctx.damage) {
            const reduction = Math.floor(ctx.damage * pasiva.valor);
            ctx.damageReduction = (ctx.damageReduction || 0) + reduction;
          }
          break;
        case "life_steal":
          if (trigger === "on_hit" && ctx.damage) {
            const steal = Math.floor(ctx.damage * pasiva.valor);
            owner.hp = Math.min(owner.maxHp + (owner.hpOverflow || 0), owner.hp + steal);
            results.push({ log: `${ownerName} roba ${steal} HP` });
          }
          break;
        case "auto_shield":
          if (trigger === "on_turn_start") {
            owner.status = owner.status || {};
            owner.status.shield = (owner.status.shield || 0) + Math.floor(owner.maxHp * pasiva.valor);
            results.push({ log: `${ownerName} obtiene escudo natural` });
          }
          break;
        case "enrage":
          if (trigger === "on_hp_loss" && ctx.hpLost) {
            owner.enrageBonus = (owner.enrageBonus || 0) + Math.floor(ctx.hpLost * pasiva.valor);
          }
          break;
        case "cleanse":
          if (trigger === "on_turn_start" && owner.status) {
            owner.status.debuffs = {};
            owner.status.frozen = 0;
            owner.status.silenced = 0;
            results.push({ log: `${ownerName} se purifica` });
          }
          break;
      }
    }
    return results;
  }

  aplicarHPRegenClase(jugador) {
    const info = CLASS_DATA[jugador.personaje.clase];
    if (!info || !info.hpRegen) return 0;
    const healed = info.hpRegen;
    jugador.hp = Math.min(jugador.maxHp + (jugador.hpOverflow || 0), jugador.hp + healed);
    return healed;
  }

  aplicarEfectosClase(jugador, esPrimerTurno) {
    const info = CLASS_DATA[jugador.personaje.clase];
    if (!info) return [];
    const logs = [];

    if (esPrimerTurno && info.energiaPrimerTurno) {
      jugador.energia = Math.min(100, jugador.energia + info.energiaPrimerTurno);
      logs.push(`${jugador.nombre} recibe ${info.energiaPrimerTurno} energía extra (1er turno)`);
    }

    if (esPrimerTurno && info.accionesExtra1) {
      jugador.extraAction = true;
      logs.push(`${jugador.nombre} tiene acciones extra este turno`);
    }

    if (esPrimerTurno && info.inmune1ronda) {
      jugador.status = jugador.status || {};
      jugador.status.inmune = true;
      logs.push(`${jugador.nombre} es inmune por 1 ronda`);
    }

    if (info.danoAHP && esPrimerTurno) {
      jugador.danoAHP = true;
      logs.push(`${jugador.nombre}: el daño causado se convierte en HP`);
    }

    if (info.hpPenalidad) {
      const penalidad = Math.floor(jugador.maxHp * info.hpPenalidad);
      jugador.hp -= penalidad;
      jugador.hp = Math.max(1, jugador.hp);
      logs.push(`${jugador.nombre} tiene -${penalidad} HP (penalidad de clase)`);
    }

    return logs;
  }

  aplicarCritClase(jugador) {
    const info = CLASS_DATA[jugador.personaje.clase];
    if (!info || !info.critEfecto) return 0;
    jugador.critClase = info.critEfecto;
    return info.critEfecto.multi;
  }

  applyStatusEffects(jugador) {
    if (!jugador.status) return [];
    const logs = [];

    if (jugador.status.frozen && jugador.status.frozen > 0) {
      jugador.status.frozen--;
      if (jugador.status.frozen > 0) logs.push(`${jugador.nombre} está paralizado (${jugador.status.frozen}t)`);
    }
    if (jugador.status.silenced && jugador.status.silenced > 0) {
      jugador.status.silenced--;
    }
    if (jugador.status.shield && jugador.status.shield < 0) jugador.status.shield = 0;

    if (jugador.status.inmune) {
      logs.push(`${jugador.nombre} ya no es inmune`);
      jugador.status.inmune = false;
    }

    if (jugador.status.buffs) {
      for (const [stat, buff] of Object.entries(jugador.status.buffs)) {
        buff.restante--;
        if (buff.restante <= 0) {
          delete jugador.status.buffs[stat];
          logs.push(`Buff de ${stat} de ${jugador.nombre} se desvaneció`);
        }
      }
    }
    if (jugador.status.debuffs) {
      for (const [stat, debuff] of Object.entries(jugador.status.debuffs)) {
        debuff.restante--;
        if (debuff.restante <= 0) {
          delete jugador.status.debuffs[stat];
          logs.push(`Debuff de ${stat} de ${jugador.nombre} se desvaneció`);
        }
      }
    }

    return logs;
  }

  calcularStatsConBuffs(jugador) {
    const pj = jugador.personaje;
    const stats = {
      nombre: jugador.nombre || pj.nombre,
      fuerza: pj.fuerza,
      resistencia: pj.resistencia,
      velocidad: pj.velocidad,
      magia: pj.magia,
      suerte: pj.suerte
    };

    if (jugador.equipment) {
      for (const eq of Object.values(jugador.equipment)) {
        if (eq && eq.stat && stats[eq.stat] !== undefined) {
          stats[eq.stat] += eq.valor || 0;
        }
        if (eq && eq.penalidad) {
          for (const [s, v] of Object.entries(eq.penalidad)) {
            if (stats[s] !== undefined) stats[s] += v;
          }
        }
      }
    }

    if (jugador.status) {
      if (jugador.status.buffs) {
        for (const [stat, buff] of Object.entries(jugador.status.buffs)) {
          if (stats[stat] !== undefined) stats[stat] += buff.valor;
        }
      }
      if (jugador.status.debuffs) {
        for (const [stat, debuff] of Object.entries(jugador.status.debuffs)) {
          if (stats[stat] !== undefined) stats[stat] -= debuff.valor;
        }
      }
    }

    return stats;
  }

  calcularRegeneracionEnergia(magJugador, magRival) {
    const diff = magJugador - magRival;
    if (diff <= 0) return 10;
    const ratio = diff / Math.max(magRival, 1);
    if (ratio > 1.5) return 25;
    if (ratio > 1.0) return 20;
    if (ratio > 0.5) return 15;
    return 10;
  }

  calcularTurnoInicial(jugadores) {
    return [...jugadores].sort((a, b) => b.velocidad - a.velocidad);
  }

  objetosIguales(a, b) {
    return a.nombre === b.nombre;
  }

  puedeAgregarInventario(inventario, objeto) {
    const count = inventario.filter(o => !o._equipado).length;
    return count < 5;
  }

  crearObjeto(inventario, materiales, receta) {
    for (const mat of receta.requiere) {
      const idx = inventario.findIndex(o => o.tipo === "material" && o.nombre === mat);
      if (idx === -1) return { success: false, reason: `Falta material: ${mat}` };
      inventario.splice(idx, 1);
    }
    if (!this.puedeAgregarInventario(inventario, receta.resultado)) {
      return { success: false, reason: "Inventario lleno" };
    }
    inventario.push({ ...receta.resultado, _id: Date.now().toString() });
    return { success: true };
  }

  tirarObjeto(inventario, idx) {
    if (idx < 0 || idx >= inventario.length) return null;
    const obj = inventario[idx];
    inventario.splice(idx, 1);
    return obj;
  }

  tieneHabilidadInterruptor(jugador, cartaId) {
    return jugador.skills && jugador.skills.some(s => s.id === cartaId && s.interrupt);
  }

  getPasivasPorDefecto(clase) {
    const mapa = {
      Chaman: ["regeneracion", "veneno"],
      Sacerdote: ["regeneracion", "bendito"],
      Druida: ["regeneracion", "escudo_natural"],
      Guerrero: ["fortaleza", "vampirismo"],
      Paladin: ["fortaleza", "bendito"],
      Berserker: ["furia_interna", "vampirismo"],
      Acorazado: ["fortaleza", "escudo_espinas"],
      Ogro: ["fortaleza", "furia_interna"],
      Golem: ["fortaleza", "escudo_natural"],
      Picaro: ["rapidez", "contraataque"],
      Ninja: ["rapidez", "maestro_critico"],
      Cazador: ["maestro_critico", "vampirismo"],
      Mago: ["mana_infinito", "absorcion"],
      MagoMaestro: ["mana_infinito", "absorcion"],
      MagoGuerrero: ["mana_infinito", "vampirismo"],
      SemiDios: ["bendito", "ultimo_aliento"],
      Demonio: ["vampirismo", "furia_interna"],
      Titan: ["fortaleza", "ultimo_aliento"]
    };
    return mapa[clase] || ["regeneracion", "fortaleza"];
  }
}

module.exports = { GameProcessor, SKILLS_DATA, CLASS_DATA, MAZOS, aplicarModsClase, getMaxHP };
