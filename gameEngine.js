// gameEngine.js

const GameEngine = {

    /**
     * Calcula el multiplicador de daño crítico basado en la diferencia de velocidad.
     * Mecánica: Por cada 50% de velocidad extra sobre el rival, +50% de crítico.
     */
    calcularCritico: (velAtacante, velDefensor) => {
        if (velAtacante <= velDefensor) return 0;
        
        const ratio = (velAtacante - velDefensor) / velDefensor;
        
        if (ratio >= 2.0) return 2.0; // +200%
        if (ratio >= 1.5) return 1.5; // +150%
        if (ratio >= 1.0) return 1.0; // +100%
        if (ratio >= 0.5) return 0.5; // +50%
        return 0; // Menos de 50% extra no genera bono de crítico según regla
    },

    /**
     * Calcula la regeneración de energía por turno basada en la magia.
     * Mecánica: Base 10. +5 por cada 50% de magia extra sobre el rival.
     */
    calcularRegeneracionEnergia: (magJugador, magRival) => {
        let energia = 10; 
        if (magJugador <= magRival) return energia;

        const ratio = (magJugador - magRival) / magRival;
        
        if (ratio >= 1.5) energia += 15;
        else if (ratio >= 1.0) energia += 10;
        else if (ratio > 0) energia += 5;
        
        return energia;
    }
};

module.exports = GameEngine;
