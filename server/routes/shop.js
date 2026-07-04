module.exports = function(io, socket, { Cuenta, SKILLS_DATA, SKILL_PRICES, migrarInventario }) {

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

};
