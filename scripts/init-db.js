// Crea las tablas e inserta los productos de ejemplo ejecutando db/schema.sql.
// Uso: npm run db:init
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(sql);
  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM productos');
  console.log(`Base de datos inicializada. Productos en el catálogo: ${rows[0].total}`);
}

main()
  .catch((err) => {
    console.error('Error al inicializar la base de datos:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
