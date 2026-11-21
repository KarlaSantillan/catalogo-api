// Manejo centralizado de errores: todas las respuestas de error tienen la forma
// { ok: false, error: { codigo, mensaje, detalles? } } y nunca exponen detalles internos.
const HttpError = require('../utils/httpError');

function rutaNoEncontrada(req, res) {
  res.status(404).json({
    ok: false,
    error: { codigo: 'RUTA_NO_ENCONTRADA', mensaje: `No existe la ruta ${req.method} ${req.originalUrl}.` },
  });
}

// eslint-disable-next-line no-unused-vars
function manejadorErrores(err, req, res, next) {
  // JSON mal formado en el cuerpo de la petición.
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      ok: false,
      error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo de la petición no es un JSON válido.' },
    });
  }

  if (err instanceof HttpError) {
    const error = { codigo: err.codigo, mensaje: err.message };
    if (err.detalles) error.detalles = err.detalles;
    return res.status(err.status).json({ ok: false, error });
  }

  // Respaldo por si llega una violación de restricción de PostgreSQL no controlada.
  if (err.code === '23505') {
    return res.status(409).json({ ok: false, error: { codigo: 'DUPLICADO', mensaje: 'El registro ya existe.' } });
  }
  if (err.code === '23503') {
    return res.status(404).json({ ok: false, error: { codigo: 'REFERENCIA_INEXISTENTE', mensaje: 'El recurso referenciado no existe.' } });
  }

  // Error inesperado: se registra en el servidor y se responde un mensaje genérico.
  console.error('[ERROR]', err);
  return res.status(500).json({
    ok: false,
    error: { codigo: 'ERROR_INTERNO', mensaje: 'Ocurrió un error interno. Intente más tarde.' },
  });
}

module.exports = { rutaNoEncontrada, manejadorErrores };
