const bcrypt = require('bcryptjs');

module.exports = function(io, socket, { Cuenta, socketNombres }) {

  socket.on('crearCuenta', async ({ nombre, password }) => {
    try {
      const existe = await Cuenta.findOne({ nombre });
      if (existe) { socket.emit('errorCuenta', 'Ya existe esa cuenta.'); return; }
      const hash = bcrypt.hashSync(password, 10);
      const cuenta = await Cuenta.create({ nombre, password: hash });
      socket.emit('cuentaCreada', {
        id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
        nivel: cuenta.nivel, experiencia: cuenta.experiencia,
        foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
        inventarioSkills: cuenta.inventarioSkills || [],
        inventarioPasivas: cuenta.inventarioPasivas || []
      });
    } catch (err) {
      socket.emit('errorCuenta', 'Error al crear cuenta.');
    }
  });

  socket.on('iniciarSesion', async ({ nombre, password }) => {
    try {
      const cuenta = await Cuenta.findOne({ nombre });
      if (!cuenta) { socket.emit('errorLogin', 'Cuenta no encontrada.'); return; }
      const valida = bcrypt.compareSync(password, cuenta.password);
      if (!valida) { socket.emit('errorLogin', 'Contraseña incorrecta.'); return; }
      socketNombres.set(socket.id, cuenta.nombre);
      socket.emit('loginExitoso', {
        id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
        nivel: cuenta.nivel, experiencia: cuenta.experiencia,
        foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
        inventarioSkills: cuenta.inventarioSkills || [],
        inventarioPasivas: cuenta.inventarioPasivas || []
      });
    } catch (err) {
      socket.emit('errorLogin', 'Error al iniciar sesión.');
    }
  });

  socket.on('reconectarCuenta', async ({ cuenta_id }) => {
    try {
      const cuenta = await Cuenta.findById(cuenta_id);
      if (!cuenta) { socket.emit('errorReconexion', 'Cuenta no encontrada.'); return; }
      socketNombres.set(socket.id, cuenta.nombre);
      socket.emit('loginExitoso', {
        id: cuenta._id, nombre: cuenta.nombre, dinero: cuenta.dinero,
        nivel: cuenta.nivel, experiencia: cuenta.experiencia,
        foto: cuenta.foto, dev: cuenta.dev || false, personajes: cuenta.personajes,
        inventarioSkills: cuenta.inventarioSkills || [],
        inventarioPasivas: cuenta.inventarioPasivas || []
      });
    } catch (err) {
      socket.emit('errorReconexion', 'Error al reconectar.');
    }
  });

  socket.on('actualizarPerfil', async ({ cuenta_id, nombre, password, foto }) => {
    try {
      const update = {};
      if (foto) update.foto = foto;
      if (nombre) update.nombre = nombre;
      if (password) update.password = bcrypt.hashSync(password, 10);
      const cuenta = await Cuenta.findByIdAndUpdate(cuenta_id, update, { new: true });
      if (!cuenta) { socket.emit('errorPerfil', 'Cuenta no encontrada.'); return; }
      socket.emit('perfilActualizado', { nombre: cuenta.nombre, foto: cuenta.foto || '' });
    } catch (err) {
      socket.emit('errorPerfil', 'Error al actualizar.');
    }
  });

};
