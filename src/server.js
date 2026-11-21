// Punto de entrada: comprueba la base de datos y levanta el servidor HTTP.
const env = require('./config/env');
const pool = require('./config/db');
const app = require('./app');

async function iniciar() {
  try {
    await pool.query('SELECT 1');
    console.log('Conexión a PostgreSQL establecida.');
  } catch (err) {
    console.error('No se pudo conectar a PostgreSQL. Revise las variables PG* o DATABASE_URL en .env.');
    console.error(err.message);
    process.exit(1);
  }

  const servidor = app.listen(env.port, () => {
    console.log(`API escuchando en http://localhost:${env.port}/api`);
  });

  // Cierre ordenado (Ctrl + C) para demostrar el reinicio sin dejar conexiones abiertas.
  const cerrar = () => {
    console.log('\nCerrando servidor...');
    servidor.close(() => pool.end().then(() => process.exit(0)));
  };
  process.on('SIGINT', cerrar);
  process.on('SIGTERM', cerrar);
}

iniciar();
