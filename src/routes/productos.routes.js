const { Router } = require('express');
const productos = require('../controllers/productos.controller');
const { verificarToken, requerirRol } = require('../middlewares/auth');

const router = Router();

// Consulta pública del catálogo
router.get('/', productos.listar);
router.get('/:id', productos.obtener);

// Modificación: solo administrador (primero se autentica, luego se autoriza)
router.post('/', verificarToken, requerirRol('admin'), productos.crear);
router.put('/:id', verificarToken, requerirRol('admin'), productos.actualizar);
router.delete('/:id', verificarToken, requerirRol('admin'), productos.eliminar);

module.exports = router;
