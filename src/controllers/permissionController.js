const Permission = require('../models/Permission');
const { sendError, sendSuccess } = require('../utils/helpers');

// @desc    Obtener todos los permisos
// @route   GET /api/permissions
// @access  Privado (requiere permiso: permissions:list)
const getPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ resource: 1, action: 1 });
    
    sendSuccess(res, permissions);
  } catch (error) {
    console.error('Error en getPermissions:', error);
    sendError(res, 'Error al obtener permisos', 500);
  }
};

// @desc    Obtener un permiso por ID
// @route   GET /api/permissions/:id
// @access  Privado (requiere permiso: permissions:read)
const getPermissionById = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return sendError(res, 'Permiso no encontrado', 404);
    }
    
    sendSuccess(res, permission);
  } catch (error) {
    console.error('Error en getPermissionById:', error);
    sendError(res, 'Error al obtener permiso', 500);
  }
};

// @desc    Crear un nuevo permiso
// @route   POST /api/permissions
// @access  Privado (requiere permiso: permissions:create)
const createPermission = async (req, res) => {
  try {
    const { name, description, resource, action, module } = req.body;

    // Validar campos requeridos
    if (!name || !resource || !action) {
      return sendError(res, 'Nombre, recurso y acción son requeridos', 400);
    }

    // Verificar si ya existe un permiso con el mismo nombre
    const exists = await Permission.findOne({ name });
    if (exists) {
      return sendError(res, 'Ya existe un permiso con ese nombre', 400);
    }

    const permission = await Permission.create({
      name,
      description,
      resource,
      action,
      module: module || 'general'
    });

    sendSuccess(res, permission, 'Permiso creado exitosamente', 201);
  } catch (error) {
    console.error('Error en createPermission:', error);
    sendError(res, 'Error al crear permiso', 500);
  }
};

// @desc    Actualizar un permiso
// @route   PUT /api/permissions/:id
// @access  Privado (requiere permiso: permissions:update)
const updatePermission = async (req, res) => {
  try {
    const { name, description, resource, action, module } = req.body;

    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return sendError(res, 'Permiso no encontrado', 404);
    }

    permission.name = name || permission.name;
    permission.description = description || permission.description;
    permission.resource = resource || permission.resource;
    permission.action = action || permission.action;
    permission.module = module !== undefined ? module : permission.module;

    await permission.save();

    sendSuccess(res, permission, 'Permiso actualizado exitosamente');
  } catch (error) {
    console.error('Error en updatePermission:', error);
    sendError(res, 'Error al actualizar permiso', 500);
  }
};

// @desc    Eliminar un permiso
// @route   DELETE /api/permissions/:id
// @access  Privado (requiere permiso: permissions:delete)
const deletePermission = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id);
    
    if (!permission) {
      return sendError(res, 'Permiso no encontrado', 404);
    }

    await permission.deleteOne();

    sendSuccess(res, {}, 'Permiso eliminado exitosamente');
  } catch (error) {
    console.error('Error en deletePermission:', error);
    sendError(res, 'Error al eliminar permiso', 500);
  }
};

module.exports = { 
  getPermissions, 
  getPermissionById, 
  createPermission, 
  updatePermission, 
  deletePermission 
};
