const express = require('express');
const router = express.Router();
const { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  addDirectPermissions, 
  deleteUser 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Todas las rutas requieren autenticación y permisos específicos
router.use(protect);

router.route('/')
  .get(authorize('users:list'), getUsers)
  .post(authorize('users:create'), createUser);

router.route('/:id')
  .get(authorize('users:read'), getUserById)
  .put(authorize('users:update'), updateUser)
  .delete(authorize('users:delete'), deleteUser);

// Ruta para agregar permisos directos a un usuario
router.post('/:id/permissions', authorize('users:update'), addDirectPermissions);

module.exports = router;
