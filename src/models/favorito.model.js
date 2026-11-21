// Acceso a datos de la tabla favoritos. Todas las operaciones filtran por usuario_id,
// que siempre proviene del token verificado (nunca del cliente).
const pool = require('../config/db');

async function listarPorUsuario(usuarioId) {
  const { rows } = await pool.query(
    `SELECT p.id, p.nombre, p.descripcion, p.categoria, p.precio, f.creado_en AS agregado_en
       FROM favoritos f
       JOIN productos p ON p.id = f.producto_id
      WHERE f.usuario_id = $1
      ORDER BY f.creado_en DESC`,
    [usuarioId]
  );
  return rows;
}

// Devuelve la fila insertada, o null si ya existía (clave primaria compuesta).
async function agregar(usuarioId, productoId) {
  const { rows } = await pool.query(
    `INSERT INTO favoritos (usuario_id, producto_id)
     VALUES ($1, $2)
     ON CONFLICT (usuario_id, producto_id) DO NOTHING
     RETURNING usuario_id, producto_id, creado_en`,
    [usuarioId, productoId]
  );
  return rows[0] || null;
}

// Solo borra si el favorito pertenece al usuario indicado.
async function quitar(usuarioId, productoId) {
  const { rowCount } = await pool.query(
    'DELETE FROM favoritos WHERE usuario_id = $1 AND producto_id = $2',
    [usuarioId, productoId]
  );
  return rowCount > 0;
}

module.exports = { listarPorUsuario, agregar, quitar };
