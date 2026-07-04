const TAGS = { FISICO: 'fisico', TECNICO: 'tecnico', MENTAL: 'mental', INSTINTIVO: 'instintivo' };

const COMBO_SYNERGIES = {
  'fisico|fisico':     { nombre: 'Fractura',     efecto: 'Ignora 50% Resistencia rival' },
  'fisico|tecnico':    { nombre: 'Precisión',    efecto: '+20% Probabilidad de Crítico' },
  'fisico|mental':     { nombre: 'Desestabilizar', efecto: '-15 Energía al rival' },
  'fisico|instintivo': { nombre: 'Contragolpe',  efecto: 'Devuelve 30% daño recibido' },
  'tecnico|fisico':    { nombre: 'Impacto',      efecto: '+40% Daño base' },
  'tecnico|tecnico':   { nombre: 'Reflejos',     efecto: 'Esquiva automática el siguiente ataque' },
  'tecnico|mental':    { nombre: 'Silencio',     efecto: 'Cancela la próxima carta del rival' },
  'tecnico|instintivo':{ nombre: 'Respiración',  efecto: '+10 HP al instante' },
  'mental|fisico':     { nombre: 'Herida',       efecto: 'Aplica Sangrado (daño progresivo)' },
  'mental|tecnico':    { nombre: 'Transferencia', efecto: 'Intercambia energía con el rival' },
  'mental|mental':     { nombre: 'Concentración', efecto: 'Gana +20 Energía extra' },
  'mental|instintivo': { nombre: 'Sobrecarga',   efecto: 'La siguiente skill cuesta 0 energía' },
  'instintivo|fisico': { nombre: 'Sentencia',    efecto: 'Daño verdadero (ignora defensa)' },
  'instintivo|tecnico':{ nombre: 'Ventaja',      efecto: 'Gana 1 acción extra' },
  'instintivo|mental': { nombre: 'Baluarte',     efecto: '-50% daño recibido hasta próximo turno' },
  'instintivo|instintivo':{ nombre: 'Fortaleza', efecto: 'Escudo igual al 20% de HP total' }
};

function aplicarCombo(yo, rival, tag1, tag2) {
  const key = tag1 + '|' + tag2;
  const synergy = COMBO_SYNERGIES[key];
  if (!synergy) return null;
  const logs = [`${yo.nombre} activa combo [${tag1.toUpperCase()} + ${tag2.toUpperCase()}]: ${synergy.nombre} — ${synergy.efecto}`];
  const effects = { nombre: synergy.nombre, efecto: synergy.efecto };

  switch (key) {
    case 'fisico|fisico':
      yo._comboFractura = true;
      break;
    case 'fisico|tecnico':
      yo.critBonus = (yo.critBonus || 0) + 0.20;
      break;
    case 'fisico|mental':
      rival.energia = Math.max(0, (rival.energia || 0) - 15);
      logs.push(`${rival.nombre} pierde 15 energía`);
      break;
    case 'fisico|instintivo':
      yo._comboContragolpe = true;
      break;
    case 'tecnico|fisico':
      yo._comboImpacto = true;
      logs.push(`${yo.nombre} gana +40% en su próximo daño base`);
      break;
    case 'tecnico|tecnico':
      yo._comboReflejos = true;
      break;
    case 'tecnico|mental':
      rival._comboSilenciado = true;
      logs.push(`${rival.nombre} no podrá usar cartas en su próximo turno`);
      break;
    case 'tecnico|instintivo':
      yo.hp = Math.min(yo.maxHp, yo.hp + 10);
      logs.push(`${yo.nombre} recupera 10 HP`);
      break;
    case 'mental|fisico':
      rival._comboHerida = true;
      logs.push(`${rival.nombre} sufre Sangrado en su próximo turno`);
      break;
    case 'mental|tecnico': {
      const tmp = yo.energia;
      yo.energia = rival.energia;
      rival.energia = tmp;
      logs.push(`Energía intercambiada: ${yo.nombre} (${yo.energia}) ↔ ${rival.nombre} (${rival.energia})`);
      break;
    }
    case 'mental|mental':
      yo.energia = Math.min(100, (yo.energia || 0) + 20);
      logs.push(`${yo.nombre} gana 20 energía extra`);
      break;
    case 'mental|instintivo':
      yo._comboSobrecarga = true;
      logs.push(`${yo.nombre}: su próxima skill cuesta 0 energía`);
      break;
    case 'instintivo|fisico': {
      const sentenciaDmg = 15;
      rival.hp -= sentenciaDmg;
      logs.push(`${rival.nombre} recibe ${sentenciaDmg} de daño verdadero`);
      break;
    }
    case 'instintivo|tecnico':
      yo._comboVentaja = true;
      logs.push(`${yo.nombre} gana 1 acción extra`);
      break;
    case 'instintivo|mental':
      yo._comboBaluarte = true;
      break;
    case 'instintivo|instintivo': {
      const shieldVal = Math.floor(yo.maxHp * 0.20);
      if (!yo.status) yo.status = {};
      yo.status.shield = (yo.status.shield || 0) + shieldVal;
      logs.push(`${yo.nombre} obtiene escudo de ${shieldVal} HP`);
      break;
    }
  }

  return { logs, effects };
}

function procesarCombosTurno(jugador) {
  const logs = [];
  if (jugador._comboHerida) {
    const dmg = Math.floor(jugador.maxHp * 0.05);
    jugador.hp -= dmg;
    if (dmg > 0) logs.push(`${jugador.nombre} sufre ${dmg} de sangrado por Herida`);
    delete jugador._comboHerida;
  }
  if (jugador._comboSilenciado) {
    if (!jugador.status) jugador.status = {};
    jugador.status.silenced = (jugador.status.silenced || 0) + 1;
    delete jugador._comboSilenciado;
  }
  if (jugador._comboBaluarte) {
    delete jugador._comboBaluarte;
    jugador._baluarteActivo = true;
  }
  return logs;
}

module.exports = { TAGS, COMBO_SYNERGIES, aplicarCombo, procesarCombosTurno };
