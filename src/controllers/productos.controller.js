// Controlador del catálogo de productos.
const Producto = require('../models/producto.model');
const HttpError = require('../utils/httpError');
const { validarId, validarProducto } = require('../utils/validaciones');

function noEncontrado() {
  return new HttpError(404, 'PRODUCTO_NO_ENCONTRADO', 'No existe un producto con ese id.');
}

// GET /api/productos?categoria=Tecnologia  (público)
async function listar(req, res) {
  let { categoria } = req.query;
  if (categoria !== undefined) {
    if (typeof categoria !== 'string' || categoria.trim() === '') {
      throw new HttpError(400, 'FILTRO_INVALIDO', 'El parámetro "categoria" no puede estar vacío.');
    }
    categoria = categoria.trim();
  }
  const productos = await Producto.listar({ categoria });
  res.status(200).json({ ok: true, total: productos.length, data: productos });
}

// GET /api/productos/:id  (público)
async function obtener(req, res) {
  const id = validarId(req.params.id);
  const producto = await Producto.buscarPorId(id);
  if (!producto) throw noEncontrado();
  res.status(200).json({ ok: true, data: producto });
}

// POST /api/productos  (admin)
async function crear(req, res) {
  const datos = validarProducto(req.body);
  const producto = await Producto.crear(datos);
  res.status(201).json({ ok: true, data: producto });
}

// PUT /api/productos/:id  (admin)
async function actualizar(req, res) {
  const id = validarId(req.params.id);
  const datos = validarProducto(req.body);
  const producto = await Producto.actualizar(id, datos);
  if (!producto) throw noEncontrado();
  res.status(200).json({ ok: true, data: producto });
}

// DELETE /api/productos/:id  (admin)
async function eliminar(req, res) {
  const id = validarId(req.params.id);
  const eliminado = await Producto.eliminar(id);
  if (!eliminado) throw noEncontrado();
  res.status(204).send();
}

module.exports = { listar, obtener, crear, actualizar, eliminar };
