const User = require('../models/User');

/**
 * Middleware para verificar permisos
 * @param {string|string[]} permissions - Nombre del permiso o array de nombres
 * @param {boolean} requireAll - Si es true, requiere todos los permisos; si es false, basta con uno
 */
const authorize = (permissions, requireAll = false) => {
  return async (req, res, next) => {
    try {
      // Asegurarse de que permissions sea un array
      const permissionList = Array.isArray(permissions) ? permissions : [permissions];

      // Obtener todos los permisos del usuario
      const userPermissions = await req.user.getAllPermissions();
      const userPermissionNames = userPermissions.map(p => p.name);

      // Verificar permisos
      let hasAccess;
      if (requireAll) {
        // El usuario debe tener TODOS los permisos
        hasAccess = permissionList.every(perm => userPermissionNames.includes(perm));
      } else {
        // El usuario debe tener AL MENOS UNO de los permisos
        hasAccess = permissionList.some(perm => userPermissionNames.includes(perm));
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'No tienes los permisos necesarios para realizar esta acción',
          required: permissionList,
          userPermissions: userPermissionNames
        });
      }

      // Agregar permisos del usuario al request para uso posterior
      req.userPermissions = userPermissionNames;
      next();
    } catch (error) {
      console.error('Error en authorize middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

/**
 * Middleware para verificar roles
 * @param {string|string[]} roles - Nombre del rol o array de nombres
 */
const authorizeRole = (roles) => {
  return async (req, res, next) => {
    try {
      const Role = require('../models/Role');
      const roleList = Array.isArray(roles) ? roles : [roles];

      // Obtener roles del usuario
      const userRoles = await Role.find({ 
        _id: { $in: req.user.roles } 
      }).select('name');
      
      const userRoleNames = userRoles.map(r => r.name);

      // Verificar si el usuario tiene al menos uno de los roles requeridos
      const hasRole = roleList.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'No tienes el rol necesario para realizar esta acción',
          required: roleList,
          userRoles: userRoleNames
        });
      }

      next();
    } catch (error) {
      console.error('Error en authorizeRole middleware:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando roles'
      });
    }
  };
};

module.exports = { authorize, authorizeRole };
