// Middlewares de autenticación (JWT) y autorización (roles).
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Usuario = require('../models/usuario.model');
const HttpError = require('../utils/httpError');

// Verifica el encabezado "Authorization: Bearer <token>".
// jwt.verify comprueba la firma (HS256 con JWT_SECRET) y la expiración (exp).
async function verificarToken(req, res, next) {
  const encabezado = req.headers.authorization || '';
  const [esquema, token] = encabezado.split(' ');

  if (esquema !== 'Bearer' || !token) {
    throw new HttpError(401, 'TOKEN_REQUERIDO', 'Debe enviar un token en el encabezado Authorization: Bearer <token>.');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new HttpError(401, 'TOKEN_EXPIRADO', 'El token ha expirado. Inicie sesión nuevamente.');
    }
    throw new HttpError(401, 'TOKEN_INVALIDO', 'El token no es válido.');
  }

  // Se consulta el usuario para usar su rol actual y confirmar que sigue existiendo.
  const usuario = await Usuario.buscarPorId(Number(payload.sub));
  if (!usuario) {
    throw new HttpError(401, 'TOKEN_INVALIDO', 'El usuario del token ya no existe.');
  }

  req.usuario = { id: usuario.id, rol: usuario.rol };
  next();
}

// Uso: requerirRol('admin'). Debe ir después de verificarToken.
function requerirRol(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      throw new HttpError(403, 'PERMISO_DENEGADO', 'No tiene permisos para realizar esta acción.');
    }
    next();
  };
}

module.exports = { verificarToken, requerirRol };
