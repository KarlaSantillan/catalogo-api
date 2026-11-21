// Controlador de favoritos. La identidad SIEMPRE sale de req.usuario (token verificado);
// cualquier usuarioId enviado en el cuerpo o en la URL se ignora.
const Favorito = require('../models/favorito.model');
const Producto = require('../models/producto.model');
const HttpError = require('../utils/httpError');
const { validarId, exigirCampos } = require('../utils/validaciones');

// GET /api/favoritos
async function listar(req, res) {
  const favoritos = await Favorito.listarPorUsuario(req.usuario.id);
  res.status(200).json({ ok: true, total: favoritos.length, data: favoritos });
}

// POST /api/favoritos   cuerpo: { "productoId": 3 }
async function agregar(req, res) {
  exigirCampos(req.body, ['productoId']);
  const productoId = validarId(req.body.productoId, 'productoId');

  const producto = await Producto.buscarPorId(productoId);
  if (!producto) {
    throw new HttpError(404, 'PRODUCTO_NO_ENCONTRADO', 'No existe un producto con ese id.');
  }

  const favorito = await Favorito.agregar(req.usuario.id, productoId);
  if (!favorito) {
    throw new HttpError(409, 'FAVORITO_DUPLICADO', 'El producto ya está en sus favoritos.');
  }

  res.status(201).json({ ok: true, data: { ...producto, agregado_en: favorito.creado_en } });
}

// DELETE /api/favoritos/:productoId
async function quitar(req, res) {
  const productoId = validarId(req.params.productoId, 'productoId');
  const quitado = await Favorito.quitar(req.usuario.id, productoId);
  if (!quitado) {
    // También responde 404 si el favorito existe pero es de otro usuario:
    // así no se revela información de otras cuentas.
    throw new HttpError(404, 'FAVORITO_NO_ENCONTRADO', 'El producto no está en sus favoritos.');
  }
  res.status(204).send();
}

module.exports = { listar, agregar, quitar };
