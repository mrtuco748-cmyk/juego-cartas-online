// gameEngine.js
const GameEngine = {
    calcularCritico: (velAtacante, velDefensor) => {
        const diff = velAtacante - velDefensor;
        if (diff <= 0) return 0;
        const ratio = diff / velDefensor;
        if (ratio >= 2.0) return 2.0;
        if (ratio >= 1.5) return 1.5;
        if (ratio >= 1.0) return 1.0;
        if (ratio >= 0.5) return 0.5;
        return 0.25;
    },
    calcularRegeneracionEnergia: (magJugador, magRival) => {
        let energia = 10;
        const diff = magJugador - magRival;
        if (diff > 0) {
            const ratio = diff / magRival;
            if (ratio >= 1.5) energia += 15;
            else if (ratio >= 1.0) energia += 10;
            else if (ratio > 0) energia += 5;
        }
        return energia;
    }
};
module.exports = GameEngine;
