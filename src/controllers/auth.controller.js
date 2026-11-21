// Controlador de autenticación: registro público e inicio de sesión.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Usuario = require('../models/usuario.model');
const HttpError = require('../utils/httpError');
const { validarRegistro, validarLogin } = require('../utils/validaciones');

const RONDAS_BCRYPT = 10;

// POST /api/auth/registro
async function registro(req, res) {
  const { nombre, correo, password } = validarRegistro(req.body);
  const passwordHash = await bcrypt.hash(password, RONDAS_BCRYPT);

  try {
    // El rol se fija en el servidor: el registro público SIEMPRE crea "usuario".
    const usuario = await Usuario.crear({ nombre, correo, passwordHash, rol: 'usuario' });
    res.status(201).json({ ok: true, data: usuario });
  } catch (err) {
    if (err.code === '23505') {
      throw new HttpError(409, 'CORREO_DUPLICADO', 'Ya existe un usuario registrado con ese correo.');
    }
    throw err;
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { correo, password } = validarLogin(req.body);
  const usuario = await Usuario.buscarPorCorreoConHash(correo);

  // Mismo mensaje si el correo no existe o la contraseña no coincide (no revela cuál falló).
  const coincide = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;
  if (!coincide) {
    throw new HttpError(401, 'CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos.');
  }

  const token = jwt.sign({ sub: String(usuario.id), rol: usuario.rol }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });

  res.status(200).json({
    ok: true,
    data: {
      token,
      tipo: 'Bearer',
      expiraEn: env.jwtExpiresIn,
      usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol },
    },
  });
}

module.exports = { registro, login };
