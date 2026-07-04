module.exports = function(io, socket, { Cuenta, CLASS_DATA, aplicarModsClase, getMaxHP }) {

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

  socket.on('guardarPasivasSeleccionadas', async ({ cuenta_id, personaje_id, pasivas }) => {
    try {
      if (!Array.isArray(pasivas) || pasivas.length > 4) {
        socket.emit('errorPersonaje', 'Máximo 4 pasivas.'); return;
      }
      const cuenta = await Cuenta.findById(cuenta_id);
      if (!cuenta) { socket.emit('errorPersonaje', 'Cuenta no encontrada.'); return; }
      const pj = cuenta.personajes.id(personaje_id);
      if (!pj) { socket.emit('errorPersonaje', 'Personaje no encontrado.'); return; }
      pj.pasivasSeleccionadas = pasivas;
      await cuenta.save();
      socket.emit('loadoutGuardado', {
        id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
        nivel: cuenta.nivel, experiencia: cuenta.experiencia,
        foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
        inventarioSkills: cuenta.inventarioSkills,
        inventarioPasivas: cuenta.inventarioPasivas
      });
    } catch (err) {
      socket.emit('errorPersonaje', 'Error al guardar pasivas.');
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

};
