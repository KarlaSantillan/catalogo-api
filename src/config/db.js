// Pool de conexiones a PostgreSQL.
// pg lee PGHOST, PGPORT, PGDATABASE, PGUSER y PGPASSWORD automáticamente;
// si existe DATABASE_URL, se usa esa cadena.
require('dotenv').config();
const { Pool, types } = require('pg');

// NUMERIC (OID 1700) llega como texto por defecto; lo convertimos a número
// para que el precio se devuelva como 19.99 y no como "19.99".
types.setTypeParser(1700, (valor) => parseFloat(valor));

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool();

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = pool;
