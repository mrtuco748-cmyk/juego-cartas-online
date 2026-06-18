// gameEngine.js
const GameEngine = {
    calcularCritico: (velAtacante, velDefensor) => {
        const diff = velAtacante - velDefensor;
        if (diff <= 0) return 0;
        const ratio = diff / velDefensor;
        if (ratio > 2.0) return 2.0;
        if (ratio > 1.5) return 1.5;
        if (ratio > 1.0) return 1.0;
        if (ratio > 0.5) return 0.5;
        return 0.25;
    },
    calcularRegeneracionEnergia: (magJugador, magRival) => {
        const diff = magJugador - magRival;
        if (diff <= 0) return 10;
        const ratio = diff / magRival;
        if (ratio > 1.5) return 25;
        if (ratio > 1.0) return 20;
        return 15;
    },
    calcularDanoAtaque: (fuerzaAtacante, resistenciaDefensor) => {
        const dado = Math.floor(Math.random() * 6) + 1;
        return Math.max(0, dado + fuerzaAtacante - resistenciaDefensor);
    },
    calcularDanoObjeto: (peso, filo) => {
        const dado = Math.floor(Math.random() * 6) + 1;
        return Math.max(0, dado + (peso || 0) + (filo || 0));
    },
    calcularEsquivar: (dadoAtacante, dadoDefensor) => {
        return dadoDefensor > dadoAtacante;
    },
    calcularParry: (defensaDefensor, fuerzaAtacante, totalAtacante, totalDefensor) => {
        if (defensaDefensor <= fuerzaAtacante) return false;
        return totalDefensor === totalAtacante;
    },
    calcularTurnoInicial: (jugadores) => {
        return [...jugadores].sort((a, b) => b.velocidad - a.velocidad);
    }
};
module.exports = GameEngine;
// gameEngine.js
const GameEngine = {
    calcularCritico: (velAtacante, velDefensor) => {
        const diff = velAtacante - velDefensor;
        if (diff <= 0) return 0;
        const ratio = diff / velDefensor;
        if (ratio > 2.0) return 2.0;
        if (ratio > 1.5) return 1.5;
        if (ratio > 1.0) return 1.0;
        if (ratio > 0.5) return 0.5;
        return 0.25;
    },
    calcularRegeneracionEnergia: (magJugador, magRival) => {
        const diff = magJugador - magRival;
        if (diff <= 0) return 10;
        const ratio = diff / magRival;
        if (ratio > 1.5) return 25;
        if (ratio > 1.0) return 20;
        return 15;
    },
    calcularDanoAtaque: (fuerzaAtacante, resistenciaDefensor) => {
        const dado = Math.floor(Math.random() * 6) + 1;
        return Math.max(0, dado + fuerzaAtacante - resistenciaDefensor);
    },
    calcularDanoObjeto: (peso, filo) => {
        const dado = Math.floor(Math.random() * 6) + 1;
        return Math.max(0, dado + (peso || 0) + (filo || 0));
    },
    calcularEsquivar: (dadoAtacante, dadoDefensor) => {
        return dadoDefensor > dadoAtacante;
    },
    calcularParry: (defensaDefensor, fuerzaAtacante, totalAtacante, totalDefensor) => {
        if (defensaDefensor <= fuerzaAtacante) return false;
        return totalDefensor === totalAtacante;
    },
    calcularTurnoInicial: (jugadores) => {
        return [...jugadores].sort((a, b) => b.velocidad - a.velocidad);
    }
};
module.exports = GameEngine;
// gameEngine.js
const GameEngine = {
    calcularCritico: (velAtacante, velDefensor) => {
        const diff = velAtacante - velDefensor;
        if (diff <= 0) return 0;
        const ratio = diff / velDefensor;
        if (ratio > 2.0) return 2.0;
        if (ratio > 1.5) return 1.5;
        if (ratio > 1.0) return 1.0;
        if (ratio > 0.5) return 0.5;
        return 0.25;
    },
    calcularRegeneracionEnergia: (magJugador, magRival) => {
        const diff = magJugador - magRival;
        if (diff <= 0) return 10;
        const ratio = diff / magRival;
        if (ratio > 1.5) return 25;
        if (ratio > 1.0) return 20;
        return 15;
    },
    calcularDanoAtaque: (fuerzaAtacante, resistenciaDefensor) => {
        const dado = Math.floor(Math.random() * 6) + 1;
        return Math.max(0, dado + fuerzaAtacante - resistenciaDefensor);
    },
    calcularDanoObjeto: (peso, filo) => {
        const dado = Math.floor(Math.random() * 6) + 1;
        return Math.max(0, dado + (peso || 0) + (filo || 0));
    },
    calcularEsquivar: (dadoAtacante, dadoDefensor) => {
        return dadoDefensor > dadoAtacante;
    },
    calcularParry: (defensaDefensor, fuerzaAtacante, totalAtacante, totalDefensor) => {
        if (defensaDefensor <= fuerzaAtacante) return false;
        return totalDefensor === totalAtacante;
    },
    calcularTurnoInicial: (jugadores) => {
        return [...jugadores].sort((a, b) => b.velocidad - a.velocidad);
    }
};
module.exports = GameEngine;
