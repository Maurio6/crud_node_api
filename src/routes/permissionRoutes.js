const express = require('express');
const router = express.Router();
const { 
  getPermissions, 
  getPermissionById, 
  createPermission, 
  updatePermission, 
  deletePermission 
} = require('../controllers/permissionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Todas las rutas requieren autenticación y permisos específicos
router.use(protect);

router.route('/')
  .get(authorize('permissions:list'), getPermissions)
  .post(authorize('permissions:create'), createPermission);

router.route('/:id')
  .get(authorize('permissions:read'), getPermissionById)
  .put(authorize('permissions:update'), updatePermission)
  .delete(authorize('permissions:delete'), deletePermission);

module.exports = router;
