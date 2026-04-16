const User = require('../models/User');
const Role = require('../models/Role');
const { sendError, sendSuccess } = require('../utils/helpers');

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Privado (requiere permiso: users:list)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('roles', 'name description');
    
    sendSuccess(res, users);
  } catch (error) {
    console.error('Error en getUsers:', error);
    sendError(res, 'Error al obtener usuarios', 500);
  }
};

// @desc    Obtener un usuario por ID
// @route   GET /api/users/:id
// @access  Privado (requiere permiso: users:read)
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('roles', 'name description permissions');
    
    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }
    
    sendSuccess(res, user);
  } catch (error) {
    console.error('Error en getUserById:', error);
    sendError(res, 'Error al obtener usuario', 500);
  }
};

// @desc    Crear un nuevo usuario
// @route   POST /api/users
// @access  Privado (requiere permiso: users:create)
const createUser = async (req, res) => {
  try {
    const { name, email, password, roles, directPermissions } = req.body;

    // Validar campos requeridos
    if (!name || !email || !password) {
      return sendError(res, 'Nombre, email y password son requeridos', 400);
    }

    // Verificar si el usuario ya existe
    const exists = await User.findOne({ email });
    if (exists) {
      return sendError(res, 'El email ya está registrado', 400);
    }

    // Si se proporcionan roles, verificar que existan
    let roleIds = [];
    if (roles && roles.length > 0) {
      const validRoles = await Role.find({ 
        _id: { $in: roles } 
      });
      
      if (validRoles.length !== roles.length) {
        return sendError(res, 'Algunos IDs de roles no son válidos', 400);
      }
      
      roleIds = validRoles.map(r => r._id);
    }

    // Si se proporcionan permisos directos, verificar que existan
    let permissionIds = [];
    if (directPermissions && directPermissions.length > 0) {
      const Permission = require('../models/Permission');
      const validPermissions = await Permission.find({ 
        _id: { $in: directPermissions } 
      });
      
      if (validPermissions.length !== directPermissions.length) {
        return sendError(res, 'Algunos IDs de permisos no son válidos', 400);
      }
      
      permissionIds = validPermissions.map(p => p._id);
    }

    const user = await User.create({
      name,
      email,
      password,
      roles: roleIds,
      directPermissions: permissionIds
    });

    const userPopulated = await User.findById(user._id)
      .select('-password')
      .populate('roles', 'name description');
    
    sendSuccess(res, userPopulated, 'Usuario creado exitosamente', 201);
  } catch (error) {
    console.error('Error en createUser:', error);
    sendError(res, 'Error al crear usuario', 500);
  }
};

// @desc    Actualizar un usuario
// @route   PUT /api/users/:id
// @access  Privado (requiere permiso: users:update)
const updateUser = async (req, res) => {
  try {
    const { name, email, password, roles, directPermissions, isActive } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    // Actualizar password si se proporciona
    if (password) {
      user.password = password;
    }

    // Actualizar roles si se proporcionan
    if (roles) {
      if (roles.length === 0) {
        user.roles = [];
      } else {
        const validRoles = await Role.find({ 
          _id: { $in: roles } 
        });
        
        if (validRoles.length !== roles.length) {
          return sendError(res, 'Algunos IDs de roles no son válidos', 400);
        }
        
        user.roles = validRoles.map(r => r._id);
      }
    }

    // Actualizar permisos directos si se proporcionan
    if (directPermissions !== undefined) {
      if (directPermissions.length === 0) {
        user.directPermissions = [];
      } else {
        const Permission = require('../models/Permission');
        const validPermissions = await Permission.find({ 
          _id: { $in: directPermissions } 
        });
        
        if (validPermissions.length !== directPermissions.length) {
          return sendError(res, 'Algunos IDs de permisos no son válidos', 400);
        }
        
        user.directPermissions = validPermissions.map(p => p._id);
      }
    }

    await user.save();

    const userPopulated = await User.findById(user._id)
      .select('-password')
      .populate('roles', 'name description');
    
    sendSuccess(res, userPopulated, 'Usuario actualizado exitosamente');
  } catch (error) {
    console.error('Error en updateUser:', error);
    sendError(res, 'Error al actualizar usuario', 500);
  }
};

// @desc    Agregar permisos directos a un usuario
// @route   POST /api/users/:id/permissions
// @access  Privado (requiere permiso: users:update)
const addDirectPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }

    if (!permissions || !Array.isArray(permissions)) {
      return sendError(res, 'Debe proporcionar un array de IDs de permisos', 400);
    }

    const Permission = require('../models/Permission');
    const validPermissions = await Permission.find({ 
      _id: { $in: permissions } 
    });
    
    if (validPermissions.length !== permissions.length) {
      return sendError(res, 'Algunos IDs de permisos no son válidos', 400);
    }

    await user.addDirectPermissions(validPermissions.map(p => p._id));

    const userPopulated = await User.findById(user._id)
      .select('-password')
      .populate('roles', 'name description');
    
    sendSuccess(res, userPopulated, 'Permisos directos agregados al usuario');
  } catch (error) {
    console.error('Error en addDirectPermissions:', error);
    sendError(res, 'Error al agregar permisos directos', 500);
  }
};

// @desc    Eliminar un usuario
// @route   DELETE /api/users/:id
// @access  Privado (requiere permiso: users:delete)
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return sendError(res, 'Usuario no encontrado', 404);
    }

    await user.deleteOne();

    sendSuccess(res, {}, 'Usuario eliminado exitosamente');
  } catch (error) {
    console.error('Error en deleteUser:', error);
    sendError(res, 'Error al eliminar usuario', 500);
  }
};

module.exports = { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  addDirectPermissions, 
  deleteUser 
};
