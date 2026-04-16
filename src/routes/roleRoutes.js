const express = require('express');
const router = express.Router();
const { 
  getRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  addPermissionsToRole, 
  deleteRole 
} = require('../controllers/roleController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Todas las rutas requieren autenticación y permisos específicos
router.use(protect);

router.route('/')
  .get(authorize('roles:list'), getRoles)
  .post(authorize('roles:create'), createRole);

router.route('/:id')
  .get(authorize('roles:read'), getRoleById)
  .put(authorize('roles:update'), updateRole)
  .delete(authorize('roles:delete'), deleteRole);

// Ruta para agregar permisos a un rol
router.post('/:id/permissions', authorize('roles:update'), addPermissionsToRole);

module.exports = router;
