// Validaciones del lado del servidor.
// Criterio de códigos:
//   400 Bad Request          -> la petición está mal formada: JSON inválido, faltan campos
//                               obligatorios, campos vacíos, tipo incorrecto o id no entero.
//   422 Unprocessable Entity -> la petición está bien formada pero el valor viola una regla:
//                               correo con formato inválido, contraseña corta, precio <= 0.
const HttpError = require('./httpError');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REGEX_ID = /^[1-9]\d{0,9}$/;
const PRECIO_MAXIMO = 99999999.99;

function esTextoNoVacio(valor) {
  return typeof valor === 'string' && valor.trim().length > 0;
}

// Comprueba que los campos existan y no estén vacíos. Lanza 400 si falta alguno.
function exigirCampos(cuerpo, campos) {
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    throw new HttpError(400, 'CUERPO_INVALIDO', 'El cuerpo de la petición debe ser un objeto JSON.');
  }
  const faltantes = campos.filter((campo) => {
    const valor = cuerpo[campo];
    if (valor === undefined || valor === null) return true;
    if (typeof valor === 'string' && valor.trim() === '') return true;
    return false;
  });
  if (faltantes.length > 0) {
    throw new HttpError(400, 'CAMPOS_OBLIGATORIOS', 'Faltan campos obligatorios o están vacíos.', { campos: faltantes });
  }
}

function exigirTexto(cuerpo, campo, maximo) {
  if (typeof cuerpo[campo] !== 'string') {
    throw new HttpError(400, 'TIPO_INVALIDO', `El campo "${campo}" debe ser texto.`, { campo });
  }
  if (cuerpo[campo].trim().length > maximo) {
    throw new HttpError(422, 'LONGITUD_INVALIDA', `El campo "${campo}" admite como máximo ${maximo} caracteres.`, { campo });
  }
}

// Valida un identificador recibido en la URL o en el cuerpo.
function validarId(valor, nombre = 'id') {
  const texto = typeof valor === 'number' ? String(valor) : valor;
  if (typeof texto !== 'string' || !REGEX_ID.test(texto)) {
    throw new HttpError(400, 'ID_INVALIDO', `El ${nombre} debe ser un número entero positivo.`);
  }
  return Number(texto);
}

function validarRegistro(cuerpo) {
  exigirCampos(cuerpo, ['nombre', 'correo', 'password']);
  exigirTexto(cuerpo, 'nombre', 100);
  exigirTexto(cuerpo, 'correo', 150);
  exigirTexto(cuerpo, 'password', 72); // bcrypt solo usa los primeros 72 bytes

  const correo = cuerpo.correo.trim().toLowerCase();
  if (!REGEX_CORREO.test(correo)) {
    throw new HttpError(422, 'CORREO_INVALIDO', 'El correo no tiene un formato válido.');
  }
  if (cuerpo.password.length < 8) {
    throw new HttpError(422, 'PASSWORD_DEBIL', 'La contraseña debe tener al menos 8 caracteres.');
  }
  // Solo se toman estos campos: cualquier "rol" enviado por el cliente se ignora.
  return { nombre: cuerpo.nombre.trim(), correo, password: cuerpo.password };
}

function validarLogin(cuerpo) {
  exigirCampos(cuerpo, ['correo', 'password']);
  if (typeof cuerpo.correo !== 'string' || typeof cuerpo.password !== 'string') {
    throw new HttpError(400, 'TIPO_INVALIDO', 'Correo y contraseña deben ser texto.');
  }
  return { correo: cuerpo.correo.trim().toLowerCase(), password: cuerpo.password };
}

// Valida un producto completo (POST y PUT reemplazan todos los campos).
function validarProducto(cuerpo) {
  exigirCampos(cuerpo, ['nombre', 'descripcion', 'categoria', 'precio']);
  exigirTexto(cuerpo, 'nombre', 120);
  exigirTexto(cuerpo, 'descripcion', 1000);
  exigirTexto(cuerpo, 'categoria', 60);

  const { precio } = cuerpo;
  if (typeof precio !== 'number' || !Number.isFinite(precio)) {
    throw new HttpError(400, 'TIPO_INVALIDO', 'El precio debe ser un número.', { campo: 'precio' });
  }
  if (precio <= 0) {
    throw new HttpError(422, 'PRECIO_INVALIDO', 'El precio debe ser mayor que cero.', { campo: 'precio' });
  }
  if (precio > PRECIO_MAXIMO) {
    throw new HttpError(422, 'PRECIO_INVALIDO', `El precio no puede superar ${PRECIO_MAXIMO}.`, { campo: 'precio' });
  }

  // Lista blanca de campos: se descarta todo lo demás que envíe el cliente.
  return {
    nombre: cuerpo.nombre.trim(),
    descripcion: cuerpo.descripcion.trim(),
    categoria: cuerpo.categoria.trim(),
    precio: Math.round(precio * 100) / 100,
  };
}

module.exports = {
  esTextoNoVacio,
  validarId,
  validarRegistro,
  validarLogin,
  validarProducto,
  exigirCampos,
};
