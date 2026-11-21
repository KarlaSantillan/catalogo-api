// Carga y valida las variables de entorno una sola vez.
require('dotenv').config();

const env = {
  port: Number(process.env.PORT) || 3000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

if (!env.jwtSecret || env.jwtSecret.length < 32) {
  console.error('Falta JWT_SECRET en .env o tiene menos de 32 caracteres.');
  process.exit(1);
}

module.exports = env;
