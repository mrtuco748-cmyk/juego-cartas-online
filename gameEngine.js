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
        src.hp = Math.min(src.maxHp + (src.hpOverflow || 0), src.hp + healed);
        return { healing: healed, log: `${src.nombre} se cura ${healed} HP` };
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
        src.status.buffs[card.stat] = { valor: card.valor, restante: card.duracion };
        const statNom = { fuerza: "FUE", resistencia: "RES", velocidad: "VEL", magia: "MAG", suerte: "SUE" }[card.stat] || card.stat;
        return { log: `${src.nombre} gana +${card.valor} ${statNom} por ${card.duracion} turnos` };
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
        ctx.source.energia = Math.min(100, ctx.source.energia + 40);
        return { log: `${ctx.source.nombre} sacrifica ${hpCost} HP y recupera 40 energía` };
      },
      summon: (target, card, ctx) => {
        ctx.summonHp = Math.floor(ctx.source.maxHp * card.valor);
        return { log: `${ctx.source.nombre} invoca un aliado con ${ctx.summonHp} HP` };
      },
      buff_all: (target, card, ctx) => {
        const src = ctx.source;
        const stats = ["fuerza", "resistencia", "velocidad", "magia"];
        src.status = src.status || {};
        src.status.buffs = src.status.buffs || {};
        stats.forEach(s => {
          src.status.buffs[s] = { valor: card.valor, restante: card.duracion };
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
          if (trigger === "on_death" && owner.hp <= 0) {
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
          if (trigger === "on_take_damage" && ctx.damage !== undefined) {
            const reduction = Math.floor(ctx.damage * pasiva.valor);
            ctx.damage = Math.max(0, ctx.damage - reduction);
            ctx.damageReduction = (ctx.damageReduction || 0) + reduction;
            results.push({ log: `${ownerName} reduce ${Math.floor(reduction)} de daño` });
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
            const val = Math.floor(owner.maxHp * pasiva.valor);
            owner.status.shield = (owner.status.shield || 0) + val;
            results.push({ log: `${ownerName} obtiene escudo natural +${val}` });
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
        case "reduce_energy_cost":
          if (trigger === "on_turn_start") {
            owner.reducedCost = (owner.reducedCost || 0) + pasiva.valor;
            results.push({ log: `${ownerName} concentra su energia (-${pasiva.valor} coste de cartas)` });
          }
          break;
        case "stun_chance":
          if (trigger === "on_hit" && ctx.target && Math.random() < pasiva.probabilidad) {
            ctx.target.status = ctx.target.status || {};
            ctx.target.status.frozen = (ctx.target.status.frozen || 0) + pasiva.duracion;
            results.push({ log: `${ctx.target.nombre} queda aturdido (Golpe Pesado)` });
          }
          break;
        case "thorns_resistance":
          if (trigger === "on_take_damage" && ctx.damage) {
            const thorns = Math.floor(ctx.damage * pasiva.valor);
            if (rival) rival.hp -= thorns;
            results.push({ log: `${ownerName} devuelve ${thorns} daño con Armadura Viva` });
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

    if (jugador.status.bleed && jugador.status.bleed.turns > 0) {
      const dmg = jugador.status.bleed.damage;
      jugador.hp -= dmg;
      logs.push(`${jugador.nombre} sufre ${dmg} de sangrado (${jugador.status.bleed.turns - 1}t)`);
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
          source.hp = Math.min(source.maxHp + (source.hpOverflow || 0), source.hp + efecto.valor);
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
          source.hp = source.maxHp + (source.hpOverflow || 0);
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
          jugador.hp = Math.min(jugador.maxHp + (jugador.hpOverflow || 0), jugador.hp + ef.valor);
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
              jugador.hp = Math.min(jugador.maxHp + (jugador.hpOverflow || 0), jugador.hp + ef.valor);
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

module.exports = { GameProcessor, SKILLS_DATA, CLASS_DATA, MAZOS, aplicarModsClase, getMaxHP };
