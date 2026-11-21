// Genera un JWT firmado con JWT_SECRET pero YA VENCIDO (exp hace 1 hora),
// para probar en Postman que la API responde 401 TOKEN_EXPIRADO.
// Uso: npm run token:vencido -- <idUsuario>   (por defecto usa el id 1)
// Copia el resultado en la variable "token_vencido" del entorno de Postman (valor actual).
require('dotenv').config();
const jwt = require('jsonwebtoken');

const secreto = process.env.JWT_SECRET;
if (!secreto) {
  console.error('Falta JWT_SECRET en .env');
  process.exit(1);
}

const idUsuario = process.argv[2] || '1';
const ahora = Math.floor(Date.now() / 1000);
const token = jwt.sign(
  { sub: String(idUsuario), rol: 'usuario', iat: ahora - 7200, exp: ahora - 3600 },
  secreto,
  { algorithm: 'HS256' }
);

console.log(token);
