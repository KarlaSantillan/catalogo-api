// Crea (o actualiza) el usuario administrador con los datos de .env:
// ADMIN_NOMBRE, ADMIN_EMAIL y ADMIN_PASSWORD.
// Es la ÚNICA forma de obtener el rol admin: el registro público siempre crea "usuario".
// Uso: npm run crear-admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function main() {
  const nombre = (process.env.ADMIN_NOMBRE || 'Administrador').trim();
  const correo = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
    throw new Error('ADMIN_EMAIL no está definido o no es un correo válido.');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.');
  }

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, correo, password_hash, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (correo)
     DO UPDATE SET nombre = EXCLUDED.nombre, password_hash = EXCLUDED.password_hash, rol = 'admin'
     RETURNING id, correo, rol`,
    [nombre, correo, hash]
  );
  console.log(`Administrador listo: id=${rows[0].id}, correo=${rows[0].correo}, rol=${rows[0].rol}`);
}

main()
  .catch((err) => {
    console.error('No se pudo crear el administrador:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
