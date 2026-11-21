// Acceso a datos de la tabla usuarios. Todas las consultas son parametrizadas ($1, $2...).
const pool = require('../config/db');

// Columnas públicas: nunca se incluye password_hash.
const COLUMNAS_PUBLICAS = 'id, nombre, correo, rol, creado_en';

async function crear({ nombre, correo, passwordHash, rol = 'usuario' }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, correo, passwordHash, rol]
  );
  return rows[0];
}

// Uso interno exclusivo del login: devuelve el hash para compararlo con bcrypt.
async function buscarPorCorreoConHash(correo) {
  const { rows } = await pool.query(
    'SELECT id, nombre, correo, rol, password_hash FROM usuarios WHERE correo = $1',
    [correo]
  );
  return rows[0] || null;
}

async function buscarPorId(id) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = { crear, buscarPorCorreoConHash, buscarPorId };
