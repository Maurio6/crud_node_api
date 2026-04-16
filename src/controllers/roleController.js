const Role = require('../models/Role');
const Permission = require('../models/Permission');
const { sendError, sendSuccess } = require('../utils/helpers');

// @desc    Obtener todos los roles
// @route   GET /api/roles
// @access  Privado (requiere permiso: roles:list)
const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().populate('permissions', 'name resource action');
    
    sendSuccess(res, roles);
  } catch (error) {
    console.error('Error en getRoles:', error);
    sendError(res, 'Error al obtener roles', 500);
  }
};

// @desc    Obtener un rol por ID
// @route   GET /api/roles/:id
// @access  Privado (requiere permiso: roles:read)
const getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('permissions', 'name resource action module');
    
    if (!role) {
      return sendError(res, 'Rol no encontrado', 404);
    }
    
    sendSuccess(res, role);
  } catch (error) {
    console.error('Error en getRoleById:', error);
    sendError(res, 'Error al obtener rol', 500);
  }
};

// @desc    Crear un nuevo rol
// @route   POST /api/roles
// @access  Privado (requiere permiso: roles:create)
const createRole = async (req, res) => {
  try {
    const { name, description, permissions, isSystem } = req.body;

    // Validar campos requeridos
    if (!name) {
      return sendError(res, 'El nombre del rol es requerido', 400);
    }

    // Verificar si ya existe un rol con el mismo nombre
    const exists = await Role.findOne({ name });
    if (exists) {
      return sendError(res, 'Ya existe un rol con ese nombre', 400);
    }

    // Si se proporcionan permisos, verificar que existan
    let permissionIds = [];
    if (permissions && permissions.length > 0) {
      const validPermissions = await Permission.find({ 
        _id: { $in: permissions } 
      });
      
      if (validPermissions.length !== permissions.length) {
        return sendError(res, 'Algunos IDs de permisos no son válidos', 400);
      }
      
      permissionIds = validPermissions.map(p => p._id);
    }

    const role = await Role.create({
      name,
      description,
      permissions: permissionIds,
      isSystem: isSystem || false
    });

    const rolePopulated = await Role.findById(role._id).populate('permissions', 'name resource action');
    
    sendSuccess(res, rolePopulated, 'Rol creado exitosamente', 201);
  } catch (error) {
    console.error('Error en createRole:', error);
    sendError(res, 'Error al crear rol', 500);
  }
};

// @desc    Actualizar un rol
// @route   PUT /api/roles/:id
// @access  Privado (requiere permiso: roles:update)
const updateRole = async (req, res) => {
  try {
    const { name, description, permissions, isSystem } = req.body;

    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return sendError(res, 'Rol no encontrado', 404);
    }

    // No permitir editar roles del sistema (opcional)
    if (role.isSystem && isSystem === false) {
      return sendError(res, 'No se puede modificar el atributo isSystem de un rol del sistema', 403);
    }

    role.name = name || role.name;
    role.description = description || role.description;
    role.isSystem = isSystem !== undefined ? isSystem : role.isSystem;

    // Actualizar permisos si se proporcionan
    if (permissions) {
      if (permissions.length === 0) {
        role.permissions = [];
      } else {
        const validPermissions = await Permission.find({ 
          _id: { $in: permissions } 
        });
        
        if (validPermissions.length !== permissions.length) {
          return sendError(res, 'Algunos IDs de permisos no son válidos', 400);
        }
        
        role.permissions = validPermissions.map(p => p._id);
      }
    }

    await role.save();

    const rolePopulated = await Role.findById(role._id).populate('permissions', 'name resource action');
    
    sendSuccess(res, rolePopulated, 'Rol actualizado exitosamente');
  } catch (error) {
    console.error('Error en updateRole:', error);
    sendError(res, 'Error al actualizar rol', 500);
  }
};

// @desc    Agregar permisos a un rol
// @route   POST /api/roles/:id/permissions
// @access  Privado (requiere permiso: roles:update)
const addPermissionsToRole = async (req, res) => {
  try {
    const { permissions } = req.body;

    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return sendError(res, 'Rol no encontrado', 404);
    }

    if (!permissions || !Array.isArray(permissions)) {
      return sendError(res, 'Debe proporcionar un array de IDs de permisos', 400);
    }

    const validPermissions = await Permission.find({ 
      _id: { $in: permissions } 
    });
    
    if (validPermissions.length !== permissions.length) {
      return sendError(res, 'Algunos IDs de permisos no son válidos', 400);
    }

    await role.addPermissions(validPermissions.map(p => p._id));

    const rolePopulated = await Role.findById(role._id).populate('permissions', 'name resource action');
    
    sendSuccess(res, rolePopulated, 'Permisos agregados al rol');
  } catch (error) {
    console.error('Error en addPermissionsToRole:', error);
    sendError(res, 'Error al agregar permisos al rol', 500);
  }
};

// @desc    Eliminar un rol
// @route   DELETE /api/roles/:id
// @access  Privado (requiere permiso: roles:delete)
const deleteRole = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    
    if (!role) {
      return sendError(res, 'Rol no encontrado', 404);
    }

    // No permitir eliminar roles del sistema
    if (role.isSystem) {
      return sendError(res, 'No se pueden eliminar roles del sistema', 403);
    }

    await role.deleteOne();

    sendSuccess(res, {}, 'Rol eliminado exitosamente');
  } catch (error) {
    console.error('Error en deleteRole:', error);
    sendError(res, 'Error al eliminar rol', 500);
  }
};

module.exports = { 
  getRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  addPermissionsToRole, 
  deleteRole 
};
