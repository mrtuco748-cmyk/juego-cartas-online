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
    sacrificio: { nombre: "Sacrificio", coste: 15, efecto: "sacrifice", valor: 0.45 },
    invocacion: { nombre: "Invocación Menor", coste: 55, efecto: "summon", valor: 0.25 },
    rafaga: { nombre: "Ráfaga", coste: 20, efecto: "damage_percent", valor: 0.15 },
    cataclismo: { nombre: "Cataclismo", coste: 80, efecto: "damage_true", valor: 20 },
    bendicion: { nombre: "Bendición", coste: 35, efecto: "buff_all", valor: 2, duracion: 2 },
    escarcha: { nombre: "Escarcha", coste: 25, efecto: "debuff", stat: "velocidad", valor: 4, duracion: 2 },
    acrio: { nombre: "Acrio", coste: 30, efecto: "damage_true", valor: 15, requiereItem: "Varita Común Nivel 3" }
  },
  pasivas: {
    veneno: { nombre: "Veneno", efecto: "dot", valor: 0.05, trigger: "on_hit" },
    totem: { nombre: "Tótem", efecto: "survival", hp_min: 1, trigger: "on_death" },
    regeneracion: { nombre: "Regeneración", efecto: "regen_hp", valor: 0.015, trigger: "on_turn_start" },
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
    bendito: { nombre: "Bendito", efecto: "cleanse", trigger: "on_turn_start" },
    concentracion: { nombre: "Concentración", efecto: "reduce_energy_cost", valor: 3, trigger: "on_turn_start" },
    golpe_pesado: { nombre: "Golpe Pesado", efecto: "stun_chance", probabilidad: 0.15, duracion: 1, trigger: "on_hit" },
    armadura_viva: { nombre: "Armadura Viva", efecto: "thorns_resistance", valor: 0.08, trigger: "on_take_damage" }
  }
};

const CLASS_DATA = {
  Chaman: { tipo: "PS", mods: { magia: 3, resistencia: 2, fuerza: 2, velocidad: 4, suerte: 0 }, hpBonus: 15, hpRegen: 2, desc: "Curandero espiritual" },
  Sacerdote: { tipo: "PS", mods: { magia: 5, resistencia: 3, fuerza: 1, velocidad: 0, suerte: 0 }, hpBonus: 25, hpRegen: 1, desc: "Sanador divino" },
  Druida: { tipo: "PS", mods: { magia: 4, resistencia: 2, fuerza: 3, velocidad: 1, suerte: 0 }, hpBonus: 20, hpRegen: 2, desc: "Guardián natural" },
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
    finales[s] = Math.max(1, (statsBase[s] || 0) + (info.mods[s] || 0));
  }
  return finales;
}

function getMaxHP(clase) {
  const info = CLASS_DATA[clase];
  return 40 + (info ? info.hpBonus || 0 : 0);
}

const MAZOS = {
  investigacion: [
    { nombre: "Rama", probabilidad: 20, tipo: "material", desc: "Útil para crafteo" },
    { nombre: "Piedra", probabilidad: 20, tipo: "material", desc: "Útil para crafteo" },
    { nombre: "Basura", probabilidad: 30, tipo: "consumible", desc: "Inmundicia apestosa", efectos: [{ tipo: "consumir", efecto: "basura" }] },
    { nombre: "Nada", probabilidad: 10, tipo: "nada", desc: "No encontraste nada" },
    { nombre: "Pierna", probabilidad: 5, tipo: "consumible", desc: "Una pierna putrefacta", efectos: [{ tipo: "consumir", efecto: "pierna" }] },
    { nombre: "Carne Podrida", probabilidad: 5, tipo: "consumible", desc: "Carne en mal estado", efectos: [{ tipo: "consumir", efecto: "carne_podrida" }] },
    { nombre: "Lingote de Hierro", probabilidad: 10, tipo: "material", desc: "Metal resistente para crafteo" },
    { nombre: "Cuerda", probabilidad: 15, tipo: "material", desc: "Fibra trenzada útil" },
    { nombre: "Huesos", probabilidad: 15, tipo: "material", desc: "Restos óseos" },
    { nombre: "Polvo Mágico", probabilidad: 10, tipo: "consumible", desc: "Brilla con energía arcana", efectos: [{ tipo: "consumir", efecto: "stat_boost", stat: "magia", valor: 3 }] },
    { nombre: "Gema", probabilidad: 8, tipo: "material", desc: "Gema brillante", valorVenta: 100 },
    { nombre: "Cuerno", probabilidad: 10, tipo: "arma", desc: "Cuerno de bestia", manos: 1, stats: { dañoDirecto: 8 }, efectos: [{ tipo: "turn_start", efecto: "damage_self", valor: 4 }] },
    { nombre: "Botella", probabilidad: 11, tipo: "material", desc: "Botella de vidrio vacía" },
    { nombre: "Pesas", probabilidad: 8, tipo: "accesorio", desc: "Pesas de entrenamiento", manos: 1, stats: { velocidad: -2 }, efectos: [{ tipo: "cada_6_turnos", efecto: "stat_boost", stat: "fuerza", valor: 4 }], contadorId: "pesas" },
    { nombre: "Espejo", probabilidad: 7, tipo: "material", desc: "Espejo antiguo" },
    { nombre: "Tela", probabilidad: 12, tipo: "material", desc: "Fibra textil" },
    { nombre: "Sombrero de Mago", probabilidad: 5, tipo: "armadura", desc: "Sombrero puntiagudo", stats: { magia: 4 }, efectos: [{ tipo: "turn_start", efecto: "energia", valor: 5 }] },
    { nombre: "Cofre", probabilidad: 5, tipo: "cofre", desc: "Un cofre misterioso" },
    { nombre: "1 Moneda", probabilidad: 7, tipo: "moneda", desc: "Moneda de oro antiguo", valorVenta: 1 },
    { nombre: "Runa Energética", probabilidad: 7, tipo: "consumible", desc: "Runa pulsante de energía", efectos: [
      { tipo: "consumir", efecto: "energia", valor: 20 },
      { tipo: "persistente", efecto: "regen_energy", valor: 5, id: "runa_energetica" }
    ] },
    { nombre: "La Copa", probabilidad: 5, tipo: "arma", desc: "Copa que ansía almas", manos: 1, efectos: [{ tipo: "invocar_asesinatos", valor: 3 }] },
    { nombre: "Libro Maldito", probabilidad: 8, tipo: "especial", desc: "Libro de maldiciones", efectos: [{ tipo: "aplicar_enemigo", efecto: "maldicion" }] },
    { nombre: "Ojo de Orus", probabilidad: 5, tipo: "accesorio", desc: "Ojo místico", efectos: [
      { tipo: "pasivo", efecto: "crit_mult", valor: 0.50 },
      { tipo: "pasivo", efecto: "dodge_bonus", valor: 3 }
    ] },
    { nombre: "Pata de Conejo", probabilidad: 5, tipo: "accesorio", desc: "Pata de conejo de la suerte", stats: { suerte: 7 } },
    { nombre: "Venda", probabilidad: 5, tipo: "consumible", desc: "Vendas limpias", efectos: [
      { tipo: "consumir", efecto: "cura", valor: 7 },
      { tipo: "persistente", efecto: "regen_hp", valor: 2, duracion: 5, id: "venda_regen" }
    ] },
    { nombre: "Ambrosía", probabilidad: 1, tipo: "consumible", desc: "Néctar divino", efectos: [
      { tipo: "consumir", efecto: "stat_boost_all", valor: 4 },
      { tipo: "persistente", efecto: "regen_hp", valor: 5, id: "ambrosia_hp" },
      { tipo: "persistente", efecto: "regen_energy", valor: 5, id: "ambrosia_en" }
    ] },
    { nombre: "Piedra Sintamani", probabilidad: 2, tipo: "consumible", desc: "Piedra de poder", efectos: [
      { tipo: "consumir", efecto: "cura", valor: 10 },
      { tipo: "consumir", efecto: "max_hp_up", valor: 20 },
      { tipo: "consumir", efecto: "stat_boost", stat: "suerte", valor: 5 }
    ] },
    { nombre: "Semilla del Sabio", probabilidad: 1, tipo: "consumible", desc: "Semilla ancestral", efectos: [
      { tipo: "consumir", efecto: "full_heal" },
      { tipo: "consumir", efecto: "energia", valor: 20 }
    ] },
    { nombre: "Runa Divina", probabilidad: 1, tipo: "consumible", desc: "Runa celestial", efectos: [
      { tipo: "consumir", efecto: "cura", valor: 10 },
      { tipo: "consumir", efecto: "energia", valor: 20 },
      { tipo: "consumir", efecto: "stat_boost", stat: "velocidad", valor: 5 },
      { tipo: "persistente", efecto: "regen_energy", valor: 5, id: "runa_divina_en" }
    ] },
    { nombre: "Totem", probabilidad: 0.5, tipo: "accesorio", desc: "Tótem de resurrección", efectos: [{ tipo: "pasivo", efecto: "revive", valor: 1/3 }] },
    { nombre: "Hidromiel", probabilidad: 2, tipo: "consumible", desc: "Hidromiel de los dioses", efectos: [
      { tipo: "consumir", efecto: "stat_boost_all", valor: 3 },
      { tipo: "consumir", efecto: "cura", valor: 20 },
      { tipo: "consumir", efecto: "energia", valor: 20 },
      { tipo: "consumir", efecto: "stat_boost", stat: "magia", valor: 7 },
      { tipo: "persistente", efecto: "regen_hp", valor: 5, id: "hidromiel_hp" },
      { tipo: "persistente", efecto: "regen_energy", valor: 5, id: "hidromiel_en" }
    ] }
  ],
  cofres: [
    { nombre: "Varita Común Nivel 1", probabilidad: 10, tipo: "arma", desc: "Varita básica", manos: 1, stats: {}, efectos: [{ tipo: "turn_start", efecto: "energia", valor: 10 }] },
    { nombre: "Varita Común Nivel 2", probabilidad: 10, tipo: "arma", desc: "Varita mejorada", manos: 1, stats: { magia: 4 }, efectos: [{ tipo: "turn_start", efecto: "energia", valor: 5 }] },
    { nombre: "Varita Común Nivel 3", probabilidad: 10, tipo: "arma", desc: "Varita poderosa", manos: 1, stats: { magia: 8 }, efectos: [{ tipo: "turn_start_skip", efecto: "energia", valor: 10, intervalo: 2 }] },
    { nombre: "Varita de Chamán", probabilidad: 5, tipo: "arma", desc: "Varita chamánica", manos: 1, stats: { magia: 5 }, efectos: [
      { tipo: "turn_start", efecto: "regen_hp", valor: 4 },
      { tipo: "turn_start", efecto: "energia", valor: 10 }
    ] },
    { nombre: "Varita de Merlín", probabilidad: 3, tipo: "arma", desc: "Varita legendaria", manos: 1, stats: { magia: 8, velocidad: 4, resistencia: 3 } },
    { nombre: "Pinchobola", probabilidad: 10, tipo: "arma", desc: "Arma punzante", manos: 1, stats: { dañoDirecto: 5, fuerza: 3 } },
    { nombre: "Mjolnir", probabilidad: 1, tipo: "arma", desc: "Martillo divino", manos: 1, stats: { fuerza: 7, magia: 9, velocidad: 5 }, efectos: [{ tipo: "on_hit", efecto: "bleed", valor: 3, duracion: 2 }] },
    { nombre: "Armadura de Hierro Nivel 1", probabilidad: 15, tipo: "armadura", desc: "Armadura básica", stats: { resistencia: 4, velocidad: 4 } },
    { nombre: "Armadura de Hierro Nivel 2", probabilidad: 14, tipo: "armadura", desc: "Armadura reforzada", stats: { resistencia: 6 } },
    { nombre: "Armadura de Hierro Nivel 3", probabilidad: 10, tipo: "armadura", desc: "Armadura maestra", stats: { resistencia: 5, velocidad: 3 } },
    { nombre: "Armadura Pesada", probabilidad: 8, tipo: "armadura", desc: "Armadura de titán", stats: { resistencia: 10, velocidad: -5 }, hpBonus: 15 },
    { nombre: "Espada Nivel 1", probabilidad: 18, tipo: "arma", desc: "Espada básica", manos: 1, stats: { fuerza: 5, velocidad: 1 } },
    { nombre: "Espada Nivel 2", probabilidad: 15, tipo: "arma", desc: "Espada afilada", manos: 1, stats: { fuerza: 5, velocidad: 1 }, efectos: [{ tipo: "on_hit", efecto: "bleed", valor: 5, duracion: 1 }] },
    { nombre: "Espada Nivel 3", probabilidad: 10, tipo: "arma", desc: "Espada maestra", manos: 1, stats: { dañoDirecto: 4, velocidad: 1 }, efectos: [{ tipo: "on_hit", efecto: "bleed", valor: 6, duracion: 2 }] },
    { nombre: "Espada Desafilada", probabilidad: 20, tipo: "arma", desc: "Espada vieja", manos: 1, stats: { dañoDirecto: 2 }, efectos: [{ tipo: "on_hit", efecto: "bleed_permanent", valor: 1 }] },
    { nombre: "Espada Pesada", probabilidad: 12, tipo: "arma", desc: "Espada de dos manos", manos: 2, stats: { dañoDirecto: 18, velocidad: -5 }, ataquePenalty: 1 },
    { nombre: "Excalibur", probabilidad: 5, tipo: "arma", desc: "Espada legendaria", manos: 2, stats: { dañoDirecto: 5, velocidad: 2, magia: 4, suerte: 2, resistencia: -2 }, critBonus: 0.25 },
    { nombre: "Espada de Héroe Rota", probabilidad: 10, tipo: "arma", desc: "Espada de campeón", manos: 2, stats: { dañoDirecto: 4, velocidad: 1, resistencia: 4 }, hpBonus: 10, efectos: [{ tipo: "on_hit", efecto: "bleed", valor: 1, duracion: 2 }] },
    { nombre: "Espada de Orus", probabilidad: 8, tipo: "arma", desc: "Espada mística", manos: 1, stats: { dañoDirecto: 5 }, critBonus: 1.0, dodgeBonus: 4 }
  ],
  recetas: [
    { nombre: "Tablón de Madera", requiere: ["Rama", "Rama", "Rama"], resultado: { nombre: "Tablón de Madera", tipo: "material", desc: "Madera procesada" } },
    { nombre: "Varita Común Nivel 1", requiere: ["Rama", "Polvo Mágico"], resultado: { nombre: "Varita Común Nivel 1", tipo: "arma", manos: 1, stats: {}, efectos: [{ tipo: "turn_start", efecto: "energia", valor: 10 }] } },
    { nombre: "Varita Común Nivel 2", requiere: ["Rama", "Polvo Mágico"], resultado: { nombre: "Varita Común Nivel 2", tipo: "arma", manos: 1, stats: { magia: 4 }, efectos: [{ tipo: "turn_start", efecto: "energia", valor: 5 }] } },
    { nombre: "Varita Común Nivel 3", requiere: ["Rama", "Polvo Mágico"], resultado: { nombre: "Varita Común Nivel 3", tipo: "arma", manos: 1, stats: { magia: 8 }, efectos: [{ tipo: "turn_start_skip", efecto: "energia", valor: 10, intervalo: 2 }] } },
    { nombre: "Varita de Chamán", requiere: ["Runa Energética"], resultado: { nombre: "Varita de Chamán", tipo: "arma", manos: 1, stats: { magia: 5 }, efectos: [{ tipo: "turn_start", efecto: "regen_hp", valor: 4 }, { tipo: "turn_start", efecto: "energia", valor: 10 }] } },
    { nombre: "Varita de Merlín (v1)", requiere: ["Varita de Chamán", "Runa Energética"], resultado: { nombre: "Varita de Merlín", tipo: "arma", manos: 1, stats: { magia: 8, velocidad: 4, resistencia: 3 } } },
    { nombre: "Varita de Merlín (v2)", requiere: ["Runa Energética", "Polvo Mágico"], resultado: { nombre: "Varita de Merlín", tipo: "arma", manos: 1, stats: { magia: 8, velocidad: 4, resistencia: 3 } } },
    { nombre: "Armadura de Hierro Nivel 1", requiere: ["Lingote de Hierro", "Lingote de Hierro", "Lingote de Hierro", "Cuerda", "Rama"], resultado: { nombre: "Armadura de Hierro Nivel 1", tipo: "armadura", stats: { resistencia: 4, velocidad: 4 } } },
    { nombre: "Armadura de Hierro Nivel 2", requiere: ["Lingote de Hierro", "Lingote de Hierro", "Lingote de Hierro", "Cuerda", "Rama"], resultado: { nombre: "Armadura de Hierro Nivel 2", tipo: "armadura", stats: { resistencia: 6 } } },
    { nombre: "Armadura de Hierro Nivel 3", requiere: ["Lingote de Hierro", "Lingote de Hierro", "Lingote de Hierro", "Cuerda", "Rama"], resultado: { nombre: "Armadura de Hierro Nivel 3", tipo: "armadura", stats: { resistencia: 5, velocidad: 3 } } },
    { nombre: "Espada Nivel 1", requiere: ["Rama", "Cuerda", "Lingote de Hierro"], resultado: { nombre: "Espada Nivel 1", tipo: "arma", manos: 1, stats: { fuerza: 5, velocidad: 1 } } },
    { nombre: "Espada Nivel 2", requiere: ["Rama", "Cuerda", "Lingote de Hierro"], resultado: { nombre: "Espada Nivel 2", tipo: "arma", manos: 1, stats: { fuerza: 5, velocidad: 1 }, efectos: [{ tipo: "on_hit", efecto: "bleed", valor: 5, duracion: 1 }] } },
    { nombre: "Espada Nivel 3", requiere: ["Rama", "Cuerda", "Lingote de Hierro"], resultado: { nombre: "Espada Nivel 3", tipo: "arma", manos: 1, stats: { dañoDirecto: 4, velocidad: 1 }, efectos: [{ tipo: "on_hit", efecto: "bleed", valor: 6, duracion: 2 }] } },
    { nombre: "Espada Pesada", requiere: ["Tablón de Madera", "Lingote de Hierro", "Lingote de Hierro", "Lingote de Hierro"], resultado: { nombre: "Espada Pesada", tipo: "arma", manos: 2, stats: { dañoDirecto: 18, velocidad: -5 }, ataquePenalty: 1 } }
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
        const src = ctx.source;
        const healed = Math.floor(src.maxHp * card.valor);
        src.hp = Math.min(src.maxHp, src.hp + healed);
        return { healing: healed, log: `${src.nombre} se cura ${healed} HP` };
      },
      stun: (target, card) => {
        target.status = target.status || {};
        target.status.frozen = (target.status.frozen || 0) + card.duracion;
        return { log: `${target.nombre} queda paralizado por ${card.duracion} turnos` };
      },
      cancel_attack: (target, card, ctx) => {
        ctx.source.status = ctx.source.status || {};
        ctx.source.status.perfectCube = 1;
        return { log: `${ctx.source.nombre} se envuelve en un Cubo Perfecto — el próximo ataque será anulado` };
      },
      rng_kill: (target, card) => {
        const roll = Math.floor(Math.random() * 6) + 1;
        if (roll === card.rng) {
          target.hp = 0;
          return { damage: 9999, log: `¡${target.nombre} ha sido aniquilado por Jackpot!`, diceRoll: roll };
        }
        return { log: `Jackpot falló (dado: ${roll})`, diceRoll: roll };
      },
      shield: (target, card, ctx) => {
        const src = ctx.source;
        src.status = src.status || {};
        src.status.shield = (src.status.shield || 0) + Math.floor(src.maxHp * card.valor);
        return { log: `${src.nombre} obtiene escudo de ${Math.floor(src.maxHp * card.valor)}` };
      },
      buff: (target, card, ctx) => {
        const src = ctx.source;
        src.status = src.status || {};
        src.status.buffs = src.status.buffs || {};
        src.status.buffs[card.stat] = { valor: card.valor, restante: card.duracion, fuente: card.nombre };
        const statNom = { fuerza: "FUE", resistencia: "RES", velocidad: "VEL", magia: "MAG", suerte: "SUE" }[card.stat] || card.stat;
        return { log: `${src.nombre} gana +${card.valor} ${statNom} por ${card.duracion} turnos` };
      },
      debuff: (target, card) => {
        target.status = target.status || {};
        target.status.debuffs = target.status.debuffs || {};
        target.status.debuffs[card.stat] = { valor: card.valor, restante: card.duracion, fuente: card.nombre };
        const statNom = { fuerza: "FUE", resistencia: "RES", velocidad: "VEL", magia: "MAG", suerte: "SUE" }[card.stat] || card.stat;
        return { log: `${target.nombre} pierde ${card.valor} ${statNom} por ${card.duracion} turnos` };
      },
      lifesteal: (target, card, ctx) => {
        const dmg = Math.floor(target.maxHp * card.valor);
        target.hp -= dmg;
        ctx.source.hp = Math.min(ctx.source.maxHp, ctx.source.hp + dmg);
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
        const selfDmg = ctx.source ? Math.floor(ctx.source.maxHp * card.valor * 0.5) : 0;
        target.hp -= dmg;
        if (ctx.source) ctx.source.hp -= selfDmg;
        return { damage: dmg, log: `Tormenta causa ${dmg} de daño al rival y ${selfDmg} al lanzador` };
      },
      silence: (target, card) => {
        target.status = target.status || {};
        target.status.silenced = (target.status.silenced || 0) + card.duracion;
        return { log: `${target.nombre} ha sido silenciado por ${card.duracion} turnos` };
      },
      sacrifice: (target, card, ctx) => {
        const hpCost = Math.floor(ctx.source.maxHp * card.valor);
        ctx.source.hp -= hpCost;
        ctx.source.energia = Math.min(100, ctx.source.energia + 35);
        return { log: `${ctx.source.nombre} sacrifica ${hpCost} HP y recupera 35 energía` };
      },
      summon: (target, card, ctx) => {
        const hp = Math.floor(ctx.source.maxHp * card.valor);
        const fuenteStats = ctx.source.statsFinales || { fuerza: 3, resistencia: 2, velocidad: 2, magia: 1, suerte: 0 };
        ctx.summon = {
          nombre: card.nombre,
          hp, maxHp: hp,
          stats: {
            fuerza: Math.max(1, Math.floor(fuenteStats.fuerza * 0.6)),
            resistencia: Math.max(1, Math.floor(fuenteStats.resistencia * 0.6)),
            velocidad: Math.max(1, Math.floor(fuenteStats.velocidad * 0.6)),
            magia: Math.max(1, Math.floor(fuenteStats.magia * 0.6))
          }
        };
        return { log: `${ctx.source.nombre} invoca a ${card.nombre} con ${hp} HP` };
      },
      buff_all: (target, card, ctx) => {
        const src = ctx.source;
        const stats = ["fuerza", "resistencia", "velocidad", "magia"];
        src.status = src.status || {};
        src.status.buffs = src.status.buffs || {};
        stats.forEach(s => {
          src.status.buffs[s] = { valor: card.valor, restante: card.duracion, fuente: card.nombre };
        });
        return { log: `${src.nombre} recibe +${card.valor} a todas las stats por ${card.duracion} turnos` };
      }
    };
  }

  executeCard(card, source, target, ctx = {}) {
    ctx.source = source;
    ctx.rival = target;
    ctx.cancelAttack = false;

    const costeFinal = Math.max(0, card.coste - (source.reducedCost || 0));
    if (source.energia < costeFinal) {
      return { success: false, reason: "Energía insuficiente", log: `Energía insuficiente (${source.energia}/${costeFinal})` };
    }

    source.energia -= costeFinal;
    const effectFn = this.effects[card.efecto];
    if (!effectFn) {
      return { success: false, reason: `Efecto desconocido: ${card.efecto}` };
    }

    ctx.source.statsFinales = this.calcularStatsConBuffs(ctx.source);
    const result = effectFn(target, card, ctx);

    return {
      success: true,
      cancelAttack: ctx.cancelAttack,
      doubleAttack: ctx.doubleAttack,
      summon: ctx.summon || null,
      ...result
    };
  }

  processPassives(pasivas, owner, rival, trigger, ctx = {}, reverse = false) {
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
          if (trigger === "on_death" && owner.hp <= 0) {
            owner.hp = pasiva.hp_min;
            results.push({ log: `${ownerName} sobrevive con ${pasiva.hp_min} HP (Tótem)` });
          }
          break;
        case "regen_hp":
          if (trigger === "on_turn_start") {
            const healed = Math.floor(owner.maxHp * pasiva.valor);
            owner.hp = Math.min(owner.maxHp, owner.hp + healed);
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
            if (reverse) {
              if (rival) rival.hp += thornsDmg;
              results.push({ log: `${ownerName} CURA a ${rivalName} (pasiva invertida)` });
            } else {
              if (rival) rival.hp -= thornsDmg;
              results.push({ log: `Espinas causan ${thornsDmg} daño` });
            }
          }
          break;
        case "extra_action":
          if (trigger === "on_turn_start" && Math.random() < pasiva.probabilidad) {
            owner.extraAction = true;
            results.push({ log: `${ownerName} obtiene acción extra (Rapidez)` });
          }
          break;
        case "revive":
          if (trigger === "on_death" && owner.hp <= 0 && !owner._revived) {
            owner.hp = Math.floor(owner.maxHp * pasiva.valor);
            owner._revived = true;
            results.push({ log: `${ownerName} revive con ${owner.hp} HP` });
          }
          break;
        case "spell_vamp":
          if (trigger === "on_cast" && ctx.damage) {
            const vamp = Math.floor(ctx.damage * pasiva.valor);
            if (reverse) {
              owner.hp -= vamp;
              results.push({ log: `${ownerName} pierde ${vamp} HP (pasiva invertida)` });
            } else {
              owner.hp = Math.min(owner.maxHp, owner.hp + vamp);
              results.push({ log: `${ownerName} absorbe ${vamp} HP del hechizo` });
            }
          }
          break;
        case "crit_up":
          if (trigger === "on_attack") {
            if (reverse) {
              owner.critBonus = (owner.critBonus || 0) - pasiva.valor;
            } else {
              owner.critBonus = (owner.critBonus || 0) + pasiva.valor;
            }
          }
          break;
        case "damage_reduction":
          if (trigger === "on_take_damage" && ctx.damage !== undefined) {
            const reduction = Math.floor(ctx.damage * pasiva.valor);
            if (reverse) {
              ctx.damage += reduction;
              ctx.damageReduction = (ctx.damageReduction || 0) - reduction;
              results.push({ log: `${ownerName} AMPLIFICA ${reduction} de daño (pasiva invertida)` });
            } else {
              ctx.damage = Math.max(0, ctx.damage - reduction);
              ctx.damageReduction = (ctx.damageReduction || 0) + reduction;
              results.push({ log: `${ownerName} reduce ${Math.floor(reduction)} de daño` });
            }
          }
          break;
        case "life_steal":
          if (trigger === "on_hit" && ctx.damage) {
            const steal = Math.floor(ctx.damage * pasiva.valor);
            if (reverse) {
              owner.hp -= steal;
              results.push({ log: `${ownerName} PIERDE ${steal} HP por vampirismo invertido` });
            } else {
              owner.hp = Math.min(owner.maxHp, owner.hp + steal);
              results.push({ log: `${ownerName} roba ${steal} HP` });
            }
          }
          break;
        case "auto_shield":
          if (trigger === "on_turn_start") {
            owner.status = owner.status || {};
            const val = Math.floor(owner.maxHp * pasiva.valor);
            if (reverse) {
              owner.status.shield = Math.max(0, (owner.status.shield || 0) - val);
              results.push({ log: `${ownerName} PIERDE escudo (pasiva invertida)` });
            } else {
              owner.status.shield = (owner.status.shield || 0) + val;
              results.push({ log: `${ownerName} obtiene escudo natural +${val}` });
            }
          }
          break;
        case "enrage":
          if (trigger === "on_hp_loss" && ctx.hpLost) {
            if (reverse) {
              owner.enrageBonus = Math.max(0, (owner.enrageBonus || 0) - Math.floor(ctx.hpLost * pasiva.valor));
            } else {
              owner.enrageBonus = (owner.enrageBonus || 0) + Math.floor(ctx.hpLost * pasiva.valor);
            }
          }
          break;
        case "cleanse":
          if (trigger === "on_turn_start" && owner.status) {
            if (reverse) {
              owner.status.debuffs = owner.status.debuffs || {};
              owner.status.frozen = (owner.status.frozen || 0) + 1;
              owner.status.silenced = (owner.status.silenced || 0) + 1;
              results.push({ log: `${ownerName} se CORROMPE (pasiva invertida)` });
            } else {
              owner.status.debuffs = {};
              owner.status.frozen = 0;
              owner.status.silenced = 0;
              results.push({ log: `${ownerName} se purifica` });
            }
          }
          break;
        case "reduce_energy_cost":
          if (trigger === "on_turn_start") {
            if (reverse) {
              owner.reducedCost = (owner.reducedCost || 0) - pasiva.valor;
              results.push({ log: `${ownerName} desperdicia energia (+${pasiva.valor} coste de cartas)` });
            } else {
              owner.reducedCost = (owner.reducedCost || 0) + pasiva.valor;
              results.push({ log: `${ownerName} concentra su energia (-${pasiva.valor} coste de cartas)` });
            }
          }
          break;
        case "stun_chance":
          if (trigger === "on_hit" && ctx.target && Math.random() < pasiva.probabilidad) {
            if (reverse) {
              owner.status = owner.status || {};
              owner.status.frozen = (owner.status.frozen || 0) + pasiva.duracion;
              results.push({ log: `${ownerName} se aturde a sí mismo (pasiva invertida)` });
            } else {
              ctx.target.status = ctx.target.status || {};
              ctx.target.status.frozen = (ctx.target.status.frozen || 0) + pasiva.duracion;
              results.push({ log: `${ctx.target.nombre} queda aturdido (Golpe Pesado)` });
            }
          }
          break;
        case "thorns_resistance":
          if (trigger === "on_take_damage" && ctx.damage) {
            const thorns = Math.floor(ctx.damage * pasiva.valor);
            if (reverse) {
              if (rival) rival.hp += thorns;
              results.push({ log: `${ownerName} CURA a ${rivalName} (pasiva invertida)` });
            } else {
              if (rival) rival.hp -= thorns;
              results.push({ log: `${ownerName} devuelve ${thorns} daño con Armadura Viva` });
            }
          }
          break;
        case "extra_action":
          if (trigger === "on_turn_start" && Math.random() < pasiva.probabilidad) {
            if (reverse) {
              owner.extraAction = false;
              results.push({ log: `${ownerName} PIERDE acción extra (pasiva invertida)` });
            } else {
              owner.extraAction = true;
              results.push({ log: `${ownerName} obtiene acción extra (Rapidez)` });
            }
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
    jugador.hp = Math.min(jugador.maxHp, jugador.hp + healed);
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

    if (jugador.status.bleed && jugador.status.bleed.turns > 0) {
      const dmg = jugador.status.bleed.damage;
      jugador.hp -= dmg;
      const restantes = jugador.status.bleed.turns - 1;
      if (restantes > 0) logs.push(`${jugador.nombre} sufre ${dmg} de sangrado (${restantes}t)`);
      else logs.push(`${jugador.nombre} sufre ${dmg} de sangrado (último tick)`);
      jugador.status.bleed.turns--;
      if (jugador.status.bleed.turns <= 0) delete jugador.status.bleed;
    }

    if (jugador.status.bleedPermanent && jugador.status.bleedPermanent > 0) {
      jugador.hp -= jugador.status.bleedPermanent;
      logs.push(`${jugador.nombre} sufre ${jugador.status.bleedPermanent} de sangrado permanente`);
    }

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
      suerte: pj.suerte,
      critBonus: jugador.critBonus || 0,
      critClaseMulti: jugador.critClase ? jugador.critClase.multi : 0,
      dodgeBonus: jugador.dodgeBonus || 0,
      ataquePenalty: 0
    };

    if (jugador.equipment) {
      for (const eq of Object.values(jugador.equipment)) {
        if (!eq) continue;
        if (eq.stat && stats[eq.stat] !== undefined) {
          stats[eq.stat] += eq.valor || 0;
        }
        if (eq.stats) {
          for (const [s, v] of Object.entries(eq.stats)) {
            if (stats[s] !== undefined) stats[s] += v;
          }
        }
        if (eq.penalidad) {
          for (const [s, v] of Object.entries(eq.penalidad)) {
            if (stats[s] !== undefined) stats[s] += v;
          }
        }
        if (eq.critBonus) stats.critBonus += eq.critBonus;
        if (eq.dodgeBonus) stats.dodgeBonus += eq.dodgeBonus;
        if (eq.ataquePenalty) stats.ataquePenalty += eq.ataquePenalty;
        if (eq.hpBonus) stats.hpBonus = (stats.hpBonus || 0) + eq.hpBonus;
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
    if (ratio > 1.5) return 30;
    if (ratio > 1.0) return 25;
    if (ratio > 0.5) return 20;
    return 15;
  }

  calcularCritico(velJugador, velRival) {
    if (velJugador <= velRival) return 0;
    const ratio = (velJugador - velRival) / Math.max(velRival, 1);
    const tiers = Math.floor(ratio / 0.5) + 1;
    return Math.min(tiers * 0.25, 1.25);
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
      Berserker: ["furia_interna", "golpe_pesado"],
      Acorazado: ["fortaleza", "armadura_viva"],
      Ogro: ["fortaleza", "furia_interna"],
      Golem: ["fortaleza", "escudo_natural"],
      Picaro: ["rapidez", "contraataque"],
      Ninja: ["rapidez", "maestro_critico"],
      Cazador: ["maestro_critico", "vampirismo"],
      Mago: ["mana_infinito", "absorcion"],
      MagoMaestro: ["mana_infinito", "absorcion"],
      MagoGuerrero: ["concentracion", "vampirismo"],
      SemiDios: ["bendito", "ultimo_aliento"],
      Demonio: ["vampirismo", "furia_interna"],
      Titan: ["fortaleza", "ultimo_aliento"]
    };
    return mapa[clase] || ["regeneracion", "fortaleza"];
  }

  aplicarEfectosConsumible(obj, source, rival) {
    const logs = [];
    if (!obj.efectos) return logs;
    for (const efecto of obj.efectos) {
      switch (efecto.efecto) {
        case "cura":
          source.hp = Math.min(source.maxHp, source.hp + efecto.valor);
          logs.push(`${source.nombre} usa ${obj.nombre}: +${efecto.valor} HP`);
          break;
        case "energia":
          source.energia = Math.min(100, source.energia + efecto.valor);
          logs.push(`${source.nombre} usa ${obj.nombre}: +${efecto.valor} energía`);
          break;
        case "basura":
          source.hp = Math.max(1, source.hp - 5);
          logs.push(`${source.nombre} come basura: -5 HP`);
          break;
        case "pierna":
          source.hp = Math.max(1, source.hp - 10);
          logs.push(`${source.nombre} muerde una pierna podrida: -10 HP`);
          break;
        case "carne_podrida":
          source.hp = Math.max(1, source.hp - 3);
          logs.push(`${source.nombre} come carne podrida: -3 HP`);
          break;
        case "stat_boost":
          source.personaje[efecto.stat] += efecto.valor;
          logs.push(`${source.nombre} gana +${efecto.valor} ${efecto.stat}`);
          break;
        case "stat_boost_all":
          for (const s of ["fuerza", "resistencia", "velocidad", "magia", "suerte"]) {
            source.personaje[s] += efecto.valor;
          }
          logs.push(`${source.nombre} gana +${efecto.valor} a todas las stats`);
          break;
        case "full_heal":
          source.hp = source.maxHp;
          logs.push(`${source.nombre} recupera todo su HP`);
          break;
        case "max_hp_up":
          source.maxHp += efecto.valor;
          source.hp += efecto.valor;
          logs.push(`${source.nombre} aumenta su HP máximo en ${efecto.valor}`);
          break;
        case "persistente":
          source.persistentEffects = source.persistentEffects || [];
          if (!source.persistentEffects.find(e => e.id === efecto.id)) {
            source.persistentEffects.push({ ...efecto, restante: efecto.duracion || -1 });
            logs.push(`${source.nombre} obtiene efecto persistente: ${efecto.id}`);
          }
          break;
        case "aplicar_enemigo":
          if (rival) {
            rival.status = rival.status || {};
            rival.status.maldicion = (rival.status.maldicion || 0) + 1;
            logs.push(`${source.nombre} maldice a ${rival.nombre} con ${obj.nombre}`);
          }
          break;
      }
    }
    return logs;
  }

  procesarEfectosPersistentes(jugador) {
    const logs = [];
    if (!jugador.persistentEffects) return logs;
    for (let i = jugador.persistentEffects.length - 1; i >= 0; i--) {
      const ef = jugador.persistentEffects[i];
      switch (ef.efecto) {
        case "regen_hp":
          jugador.hp = Math.min(jugador.maxHp, jugador.hp + ef.valor);
          logs.push(`${jugador.nombre} regenera +${ef.valor} HP (${ef.id})`);
          break;
        case "regen_energy":
          jugador.energia = Math.min(100, jugador.energia + ef.valor);
          logs.push(`${jugador.nombre} recupera +${ef.valor} energía (${ef.id})`);
          break;
        case "damage_self":
          jugador.hp -= ef.valor;
          logs.push(`${jugador.nombre} recibe ${ef.valor} de daño (${ef.id})`);
          break;
      }
      if (ef.restante > 0) {
        ef.restante--;
        if (ef.restante === 0) {
          jugador.persistentEffects.splice(i, 1);
          logs.push(`Efecto ${ef.id} se desvaneció`);
        }
      }
    }
    if (jugador.contadores) {
      for (const [key, cont] of Object.entries(jugador.contadores)) {
        cont.valor = (cont.valor || 0) + 1;
        if (cont.valor >= (cont.intervalo || 6)) {
          cont.valor = 0;
          cont.callback(jugador, logs);
        }
      }
    }
    return logs;
  }

  procesarEfectosEquipados(jugador) {
    const logs = [];
    if (!jugador.equipment) return logs;
    const equipados = new Set();
    for (const eq of Object.values(jugador.equipment)) {
      if (eq) equipados.add(eq);
    }
    for (const eq of equipados) {
      if (!eq.efectos) continue;
      for (const ef of eq.efectos) {
        if (ef.tipo === 'turn_start') {
          switch (ef.efecto) {
            case "damage_self":
              jugador.hp -= ef.valor;
              logs.push(`${jugador.nombre} recibe ${ef.valor} daño de ${eq.nombre}`);
              break;
            case "energia":
              jugador.energia = Math.min(100, jugador.energia + ef.valor);
              logs.push(`${jugador.nombre} recupera +${ef.valor} energía de ${eq.nombre}`);
              break;
            case "regen_hp":
              jugador.hp = Math.min(jugador.maxHp, jugador.hp + ef.valor);
              logs.push(`${jugador.nombre} regenera +${ef.valor} HP de ${eq.nombre}`);
              break;
          }
        } else if (ef.tipo === 'turn_start_skip') {
          jugador.contadores = jugador.contadores || {};
          const cId = eq.nombre + '_skip';
          if (!jugador.contadores[cId]) {
            jugador.contadores[cId] = { valor: 0, intervalo: ef.intervalo || 2, callback: (j, logArr) => {
              if (ef.efecto === 'energia') {
                j.energia = Math.min(100, j.energia + ef.valor);
                logArr.push(`${j.nombre} recupera +${ef.valor} energía de ${eq.nombre}`);
              }
            }};
          }
        } else if (ef.tipo === 'cada_6_turnos') {
          jugador.contadores = jugador.contadores || {};
          const cId = eq.contadorId || eq.nombre;
          if (!jugador.contadores[cId]) {
            jugador.contadores[cId] = { valor: 0, intervalo: 6, callback: (j, logArr) => {
              j.personaje[ef.stat] += ef.valor;
              logArr.push(`${j.nombre} gana +${ef.valor} ${ef.stat} permanente de ${eq.nombre}`);
            }};
          }
        } else if (ef.tipo === 'pasivo') {
          if (ef.efecto === 'revive' && !jugador._totemUsed) {
            if (jugador.hp <= 0 && Math.random() < ef.valor) {
              jugador.hp = Math.floor(jugador.maxHp * 0.5);
              jugador._totemUsed = true;
              logs.push(`${jugador.nombre} revive gracias a ${eq.nombre}`);
            }
          }
          if (ef.efecto === 'crit_mult') {
            jugador.critBonus = (jugador.critBonus || 0) + ef.valor;
          }
          if (ef.efecto === 'dodge_bonus') {
            jugador.dodgeBonus = (jugador.dodgeBonus || 0) + ef.valor;
          }
        }
      }
    }
    return logs;
  }

  aplicarFortuna(card, partida, jugador1, jugador2) {
    const logs = [];
    const hpIniciales = partida._hpIniciales || { j1: { ...jugador1 }, j2: { ...jugador2 } };

    switch (card.efecto) {
      case 'swap_heal_damage':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.swapHealDamage = true;
        logs.push(`[Caos] ¡El mundo al revés! Curar causa daño y daño cura`);
        break;
      case 'swap_stats':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.swapStats = card.duracion;
        if (!partida._swapStatsTimer) {
          [jugador1, jugador2].forEach(j => {
            j._statsOriginales = {
              fuerza: j.personaje.fuerza,
              resistencia: j.personaje.resistencia,
              velocidad: j.personaje.velocidad,
              magia: j.personaje.magia,
              suerte: j.personaje.suerte
            };
          });
          for (const s of ['fuerza','resistencia','velocidad','magia','suerte']) {
            const tmp = jugador1.personaje[s];
            jugador1.personaje[s] = jugador2.personaje[s];
            jugador2.personaje[s] = tmp;
          }
          partida._swapStatsTimer = card.duracion;
        }
        logs.push(`[Caos] ¡Identidad robada! Stats intercambiados por ${card.duracion} turnos`);
        break;
      case 'reverse_passives':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.reversePassives = card.duracion;
        logs.push(`[Caos] ¡El traidor! Las pasivas trabajarán en contra por ${card.duracion} turnos`);
        break;
      case 'slow_fast':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.slowFast = card.duracion;
        logs.push(`[Caos] ¡Velocidad maldita! El más rápido pierde turno por ${card.duracion} turnos`);
        break;
      case 'anti_strength':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.antiStrength = card.duracion;
        logs.push(`[Caos] ¡Antifuerza! A más fuerza, menos daño por ${card.duracion} turnos`);
        break;
      case 'russian_roulette': {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        partida._fortunaRolls = partida._fortunaRolls || [];
        partida._fortunaRolls.push({ j1: d1, j2: d2 });
        if (d1 < d2) { jugador1.hp = 0; logs.push(`[Muerte] ${jugador1.nombre} pierde la ruleta rusa (${d1} vs ${d2})`); }
        else if (d2 < d1) { jugador2.hp = 0; logs.push(`[Muerte] ${jugador2.nombre} pierde la ruleta rusa (${d2} vs ${d1})`); }
        else logs.push(`[Muerte] Ruleta rusa: empate (${d1} vs ${d2}), nada pasa`);
        break;
      }
      case 'divine_judgment': {
        const st1 = (jugador1.personaje?.fuerza||0)+(jugador1.personaje?.resistencia||0)+(jugador1.personaje?.velocidad||0)+(jugador1.personaje?.magia||0)+(jugador1.personaje?.suerte||0);
        const st2 = (jugador2.personaje?.fuerza||0)+(jugador2.personaje?.resistencia||0)+(jugador2.personaje?.velocidad||0)+(jugador2.personaje?.magia||0)+(jugador2.personaje?.suerte||0);
        if (st1 > st2) { jugador1.hp = Math.floor(jugador1.hp/2); logs.push(`[Muerte] ${jugador1.nombre} pierde mitad de HP (juicio divino)`); }
        else if (st2 > st1) { jugador2.hp = Math.floor(jugador2.hp/2); logs.push(`[Muerte] ${jugador2.nombre} pierde mitad de HP (juicio divino)`); }
        else logs.push(`[Muerte] Juicio divino: stats empatados, nada pasa`);
        break;
      }
      case 'chosen_one': {
        const objetivo = jugador1.hp <= jugador2.hp ? jugador1 : jugador2;
        const ids = Object.keys(SKILLS_DATA.activas);
        const ta = SKILLS_DATA.activas[ids[Math.floor(Math.random()*ids.length)]];
        objetivo._fortunaTA = ta;
        logs.push(`[Muerte] ¡${objetivo.nombre} es el elegido! Recibe ${ta.nombre} permanentemente`);
        break;
      }
      case 'destruct_equipment':
        for (const j of [jugador1, jugador2]) {
          for (const slot of Object.keys(j.equipment || {})) {
            if (j.equipment[slot]) j.equipment[slot] = null;
          }
        }
        logs.push(`[Muerte] ¡Extinción! Todos los objetos equipados fueron destruidos`);
        break;
      case 'reset_hp':
        if (hpIniciales.j1?.maxHp) jugador1.hp = hpIniciales.j1.maxHp;
        if (hpIniciales.j2?.maxHp) jugador2.hp = hpIniciales.j2.maxHp;
        logs.push(`[Muerte] ¡Reset! Ambos vuelven al HP inicial`);
        break;
      case 'mirror_damage':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.mirrorDamage = card.duracion;
        logs.push(`[Ilusion] ¡Modo espejo! Daño reflejado por ${card.duracion} turnos`);
        break;
      case 'pacifism':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.pacifism = card.duracion;
        logs.push(`[Ilusion] ¡Pacifismo forzado! No se puede atacar por ${card.duracion} turnos`);
        break;
      case 'bloodthirsty_rest':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.bloodthirstyRest = card.duracion;
        logs.push(`[Ilusion] ¡Sed de sangre! Descansar daña por ${card.duracion} turnos`);
        break;
      case 'invert_resistance':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.invertResistance = card.duracion;
        logs.push(`[Ilusion] ¡Gravedad invertida! Resistencia suma daño por ${card.duracion} turnos`);
        break;
      case 'shared_turn':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.sharedTurn = card.duracion;
        logs.push(`[Ilusion] ¡Turno compartido! Ambos eligen la misma acción por ${card.duracion} turnos`);
        break;
      case 'god_dice': {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        partida._fortunaRolls = partida._fortunaRolls || [];
        partida._fortunaRolls.push({ j1: d1, j2: d2 });
        const dmg1 = d1 * 10, dmg2 = d2 * 10;
        jugador1.hp -= dmg1; jugador2.hp -= dmg2;
        logs.push(`[Azar] ¡Dado de dios! ${jugador1.nombre} recibe ${dmg1}, ${jugador2.nombre} recibe ${dmg2}`);
        break;
      }
      case 'stat_lottery':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.statLottery = card.duracion;
        if (!partida._statLotteryTimer) {
          [jugador1, jugador2].forEach(j => {
            j._statsOriginales = j._statsOriginales || {
              fuerza: j.personaje.fuerza,
              resistencia: j.personaje.resistencia,
              velocidad: j.personaje.velocidad,
              magia: j.personaje.magia,
              suerte: j.personaje.suerte
            };
          });
          const statsKeys = ['fuerza','resistencia','velocidad','magia','suerte'];
          [jugador1, jugador2].forEach(j => {
            const total = statsKeys.reduce((s, k) => s + j.personaje[k], 0);
            let remaining = total;
            const newStats = {};
            for (let i = 0; i < statsKeys.length - 1; i++) {
              newStats[statsKeys[i]] = Math.floor(Math.random() * remaining);
              remaining -= newStats[statsKeys[i]];
            }
            newStats[statsKeys[statsKeys.length - 1]] = remaining;
            statsKeys.forEach(k => { j.personaje[k] = newStats[k]; });
          });
          partida._statLotteryTimer = card.duracion;
        }
        logs.push(`[Azar] ¡Lotería de stats! Stats redistribuidas por ${card.duracion} turnos`);
        break;
      case 'coin_flip': {
        const moneda = Math.random() < 0.5;
        const perdedor = moneda ? jugador1 : jugador2;
        for (const s of ['fuerza','resistencia','velocidad','magia','suerte']) {
          perdedor[s] = Math.floor((perdedor[s]||5)/2);
          if (perdedor.personaje) perdedor.personaje[s] = Math.floor((perdedor.personaje[s]||5)/2);
        }
        logs.push(`[Azar] ¡La moneda! ${perdedor.nombre} pierde la mitad de sus stats`);
        break;
      }
      case 'beast_number':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.beastNumber = card.duracion;
        logs.push(`[Azar] ¡Número de la bestia! Sacar 6 en un dado causa 30 daño por ${card.duracion} turnos`);
        break;
      case 'butter_hands':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.butterHands = card.duracion;
        logs.push(`[Farsa] ¡Manos de manteca! Atrapar objetos falla automáticamente por ${card.duracion} turnos`);
        break;
      case 'clumsy':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.clumsy = card.duracion;
        logs.push(`[Farsa] ¡El torpe! 50% de fallar por ${card.duracion} turnos`);
        break;
      case 'mute':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.mute = card.duracion;
        logs.push(`[Farsa] ¡Mudez! No se puede negociar por ${card.duracion} turnos`);
        break;
      case 'waste_action':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.wasteAction = card.duracion;
        logs.push(`[Farsa] ¡El payaso! El más rápido desperdicia su primera acción por ${card.duracion} turnos`);
        break;
      case 'no_attack':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.noAttack = card.duracion;
        logs.push(`[Farsa] ¡Ego destruido! El más fuerte no puede atacar por ${card.duracion} turnos`);
        break;
      case 'war_zone':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.warZone = true;
        logs.push(`[Mundo] ¡Zona de guerra! Descansar solo recupera 1 HP y 1 energía`);
        break;
      case 'sacred_ground':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.sacredGround = card.duracion;
        logs.push(`[Mundo] ¡Tierra sagrada! Nadie puede morir por ${card.duracion} turnos`);
        break;
      case 'chaos_fog':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.chaosFog = card.duracion;
        logs.push(`[Mundo] ¡Niebla del caos! Dados ocultos por ${card.duracion} turnos`);
        break;
      case 'electric_field':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.electricField = true;
        logs.push(`[Mundo] ¡Campo eléctrico! Pose fallida hace 8 de daño`);
        break;
      case 'heavy_gravity':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.heavyGravity = true;
        logs.push(`[Mundo] ¡Gravedad extrema! Lanzar objetos prohibido`);
        break;
      case 'possession':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.possession = card.duracion;
        logs.push(`[Oculto] ¡Posesión! Controlas las acciones del rival por ${card.duracion} turno(s)`);
        break;
      case 'clone':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.clone = card.duracion;
        logs.push(`[Oculto] ¡Clon! Aparecen clones que atacan automáticamente por ${card.duracion} turnos`);
        break;
      case 'ghost':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.ghost = card.duracion;
        logs.push(`[Oculto] ¡El fantasma! El de menos HP es intocable pero no ataca por ${card.duracion} turnos`);
        break;
      case 'time_loop':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.timeLoop = true;
        logs.push(`[Oculto] ¡Bucle temporal! El turno anterior se repite`);
        break;
      case 'amnesia':
        partida.fortunaStatus = partida.fortunaStatus || {};
        partida.fortunaStatus.amnesia = card.duracion;
        logs.push(`[Oculto] ¡Amnesia total! Stats y pasivas olvidadas por ${card.duracion} turnos`);
        break;
    }
    return logs;
  }

  procesarEfectosOnHit(atacante, target) {
    const logs = [];
    if (!atacante.equipment) return logs;
    const equipados = new Set();
    for (const eq of Object.values(atacante.equipment)) {
      if (eq) equipados.add(eq);
    }
    for (const eq of equipados) {
      if (!eq.efectos) continue;
      for (const ef of eq.efectos) {
        if (ef.tipo !== 'on_hit') continue;
        target.status = target.status || {};
        switch (ef.efecto) {
          case "bleed":
            target.status.bleed = { damage: ef.valor, turns: ef.duracion };
            logs.push(`${target.nombre} sangra por ${ef.valor} durante ${ef.duracion} turno(s) (${eq.nombre})`);
            break;
          case "bleed_permanent":
            target.status.bleedPermanent = (target.status.bleedPermanent || 0) + ef.valor;
            logs.push(`${target.nombre} empieza a sangrar permanentemente por ${ef.valor} (${eq.nombre})`);
            break;
        }
      }
    }
    return logs;
  }
}

const FORTUNE_CARDS = [
  { id: 'mundo_al_reves', nombre: 'El mundo al revés', categoria: 'Caos', desc: 'Permanente hasta la próxima fortuna: curar hace daño y el daño cura', efecto: 'swap_heal_damage' },
  { id: 'identidad_robada', nombre: 'Identidad robada', categoria: 'Caos', desc: 'Ambos jugadores intercambian todos sus stats por 5 turnos', efecto: 'swap_stats', duracion: 5 },
  { id: 'el_traidor', nombre: 'El traidor', categoria: 'Caos', desc: 'Las pasivas de ambos jugadores trabajan en contra suya por 3 turnos', efecto: 'reverse_passives', duracion: 3 },
  { id: 'velocidad_maldita', nombre: 'Velocidad maldita', categoria: 'Caos', desc: 'El jugador MÁS rápido pierde su turno por 3 turnos. El lento va primero', efecto: 'slow_fast', duracion: 3 },
  { id: 'antifuerza', nombre: 'Antifuerza', categoria: 'Caos', desc: 'Por 4 turnos, a más fuerza tengas, menos daño hacés', efecto: 'anti_strength', duracion: 4 },
  { id: 'ruleta_rusa', nombre: 'Ruleta rusa', categoria: 'Muerte', desc: 'Ambos tiran un dado en secreto. El que saque menos muere instantáneamente. Si empatan, nada pasa', efecto: 'russian_roulette' },
  { id: 'juicio_divino', nombre: 'Juicio divino', categoria: 'Muerte', desc: 'El jugador con más stats totales pierde la mitad de su HP ahora mismo', efecto: 'divine_judgment' },
  { id: 'el_elegido', nombre: 'El elegido', categoria: 'Muerte', desc: 'El jugador con menos HP recibe una TA aleatoria extremadamente poderosa permanentemente', efecto: 'chosen_one' },
  { id: 'extincion', nombre: 'Extinción', categoria: 'Muerte', desc: 'Todos los objetos equipados de ambos jugadores se destruyen para siempre', efecto: 'destruct_equipment' },
  { id: 'reset', nombre: 'Reset', categoria: 'Muerte', desc: 'Ambos jugadores vuelven al HP con el que empezaron la partida. Stats no cambian', efecto: 'reset_hp' },
  { id: 'modo_espejo', nombre: 'Modo espejo', categoria: 'Ilusion', desc: 'Por 3 turnos, cada vez que alguien recibe daño, el rival recibe exactamente lo mismo también', efecto: 'mirror_damage', duracion: 3 },
  { id: 'pacifismo_forzado', nombre: 'Pacifismo forzado', categoria: 'Ilusion', desc: 'Por 2 turnos nadie puede atacar directamente. Solo TAs, poses y descanso', efecto: 'pacifism', duracion: 2 },
  { id: 'sed_de_sangre', nombre: 'Sed de sangre', categoria: 'Ilusion', desc: 'Por 4 turnos descansar hace daño en vez de curar', efecto: 'bloodthirsty_rest', duracion: 4 },
  { id: 'gravedad_invertida', nombre: 'Gravedad invertida', categoria: 'Ilusion', desc: 'Por 3 turnos la resistencia suma al daño en vez de restarlo', efecto: 'invert_resistance', duracion: 3 },
  { id: 'turno_compartido', nombre: 'Turno compartido', categoria: 'Ilusion', desc: 'Por 2 turnos ambos jugadores deben elegir la misma acción o ninguno puede actuar', efecto: 'shared_turn', duracion: 2 },
  { id: 'dado_de_dios', nombre: 'Dado de dios', categoria: 'Azar', desc: 'Ambos tiran un dado. Multiplican su resultado por 10 y eso es el daño que reciben', efecto: 'god_dice' },
  { id: 'loteria_de_stats', nombre: 'Lotería de stats', categoria: 'Azar', desc: 'Se redistribuyen aleatoriamente todos los puntos de habilidad de ambos jugadores por 5 turnos', efecto: 'stat_lottery', duracion: 5 },
  { id: 'la_moneda', nombre: 'La moneda', categoria: 'Azar', desc: 'Se lanza una moneda. El perdedor pierde la mitad de todos sus stats para siempre', efecto: 'coin_flip' },
  { id: 'numero_bestia', nombre: 'Número de la bestia', categoria: 'Azar', desc: 'Si alguien saca 6 en cualquier dado durante los próximos 3 turnos, recibe 30 de daño instantáneo', efecto: 'beast_number', duracion: 3 },
  { id: 'manos_manteca', nombre: 'Manos de manteca', categoria: 'Farsa', desc: 'Por 3 turnos, cada vez que alguien intente atrapar un objeto lanzado, automáticamente falla', efecto: 'butter_hands', duracion: 3 },
  { id: 'el_torpe', nombre: 'El torpe', categoria: 'Farsa', desc: 'Por 2 turnos, cada acción que hagas tiene 50% de chance de fallar completamente', efecto: 'clumsy', duracion: 2 },
  { id: 'mudez', nombre: 'Mudez', categoria: 'Farsa', desc: 'Por 3 turnos ningún jugador puede negociar ni comunicarse para coordinar nada', efecto: 'mute', duracion: 3 },
  { id: 'el_payaso', nombre: 'El payaso', categoria: 'Farsa', desc: 'El jugador con más velocidad debe desperdiciar su primera acción de cada turno durante 3 turnos', efecto: 'waste_action', duracion: 3 },
  { id: 'ego_destruido', nombre: 'Ego destruido', categoria: 'Farsa', desc: 'El jugador con más fuerza no puede atacar directamente por 2 turnos', efecto: 'no_attack', duracion: 2 },
  { id: 'zona_de_guerra', nombre: 'Zona de guerra', categoria: 'Mundo', desc: 'Permanente: descansar solo recupera 1 HP y 1 energía en vez de 5', efecto: 'war_zone' },
  { id: 'tierra_sagrada', nombre: 'Tierra sagrada', categoria: 'Mundo', desc: 'Por 5 turnos nadie puede morir. Si llegan a 0 HP quedan en 1', efecto: 'sacred_ground', duracion: 5 },
  { id: 'niebla_caos', nombre: 'Niebla del caos', categoria: 'Mundo', desc: 'Por 4 turnos todos los dados se tiran con los ojos cerrados y no se puede ver el resultado del rival', efecto: 'chaos_fog', duracion: 4 },
  { id: 'campo_electrico', nombre: 'Campo eléctrico', categoria: 'Mundo', desc: 'Permanente hasta la próxima fortuna: cada pose fallida hace 8 de daño al que la intentó', efecto: 'electric_field' },
  { id: 'gravedad_extrema', nombre: 'Gravedad extrema', categoria: 'Mundo', desc: 'Permanente: lanzar objetos está prohibido, son demasiado pesados', efecto: 'heavy_gravity' },
  { id: 'posesion', nombre: 'Posesión', categoria: 'Oculto', desc: 'Por 1 turno, cada jugador controla las acciones del otro', efecto: 'possession', duracion: 1 },
  { id: 'clon', nombre: 'Clon', categoria: 'Oculto', desc: 'Aparece un clon de ambos jugadores con la mitad de sus stats que ataca de forma automática cada turno por 3 turnos', efecto: 'clone', duracion: 3 },
  { id: 'el_fantasma', nombre: 'El fantasma', categoria: 'Oculto', desc: 'El jugador con menos HP se vuelve intocable por 2 turnos pero tampoco puede atacar', efecto: 'ghost', duracion: 2 },
  { id: 'bucle_temporal', nombre: 'Bucle temporal', categoria: 'Oculto', desc: 'El turno anterior se repite exactamente igual, con los mismos dados y las mismas acciones', efecto: 'time_loop', duracion: 1 },
  { id: 'amnesia_total', nombre: 'Amnesia total', categoria: 'Oculto', desc: 'Ambos jugadores olvidan sus pasivas y sus stats por 3 turnos. Combaten como personajes nivel 1 con 5 en todo', efecto: 'amnesia', duracion: 3 },
];

module.exports = { GameProcessor, SKILLS_DATA, CLASS_DATA, MAZOS, FORTUNE_CARDS, aplicarModsClase, getMaxHP };
