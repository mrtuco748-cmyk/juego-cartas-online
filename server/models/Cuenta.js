const mongoose = require('mongoose');

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
    foto: { type: String, default: '' },
    pasivasSeleccionadas: { type: [String], default: [] }
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

module.exports = { Cuenta, personajeSchema, cuentaSchema };
