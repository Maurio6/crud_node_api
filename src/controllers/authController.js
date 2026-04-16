const User = require('../models/User');
const { generateToken, sendError, sendSuccess } = require('../utils/helpers');

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Público (o requiere permiso según configuración)
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validar campos requeridos
    if (!name || !email || !password) {
      return sendError(res, 'Por favor completa todos los campos requeridos', 400);
    }

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'El email ya está registrado', 400);
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password
    });

    // Generar token
    const token = generateToken(user._id);

    sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    }, 'Usuario registrado exitosamente', 201);
  } catch (error) {
    console.error('Error en register:', error);
    sendError(res, 'Error al registrar usuario', 500);
  }
};

// @desc    Autenticar usuario
// @route   POST /api/auth/login
// @access  Público
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos
    if (!email || !password) {
      return sendError(res, 'Por favor proporciona email y password', 400);
    }

    // Buscar usuario e incluir password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return sendError(res, 'Credenciales inválidas', 401);
    }

    // Verificar si el usuario está activo
    if (!user.isActive) {
      return sendError(res, 'Usuario inactivo. Contacta al administrador', 403);
    }

    // Verificar password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return sendError(res, 'Credenciales inválidas', 401);
    }

    // Actualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Generar token
    const token = generateToken(user._id);

    sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    }, 'Login exitoso');
  } catch (error) {
    console.error('Error en login:', error);
    sendError(res, 'Error al autenticar', 500);
  }
};

// @desc    Obtener perfil del usuario actual
// @route   GET /api/auth/me
// @access  Privado
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('roles', 'name description');
    
    // Obtener todos los permisos del usuario
    const permissions = await user.getAllPermissions();
    
    sendSuccess(res, {
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      permissions: permissions.map(p => ({
        _id: p._id,
        name: p.name,
        resource: p.resource,
        action: p.action,
        module: p.module
      }))
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    sendError(res, 'Error al obtener perfil', 500);
  }
};

// @desc    Obtener permisos del usuario para el frontend
// @route   GET /api/auth/permissions
// @access  Privado
const getMyPermissions = async (req, res) => {
  try {
    const permissions = await req.user.getAllPermissions();
    
    // Estructurar permisos para fácil consumo en frontend
    const structuredPermissions = {
      all: permissions.map(p => p.name),
      byResource: {},
      can: {}
    };

    // Agrupar por recurso
    permissions.forEach(perm => {
      if (!structuredPermissions.byResource[perm.resource]) {
        structuredPermissions.byResource[perm.resource] = [];
      }
      structuredPermissions.byResource[perm.resource].push(perm.action);
      
      // Crear atajos tipo can: { create: true, delete: false }
      structuredPermissions.can[perm.action] = true;
    });

    sendSuccess(res, structuredPermissions);
  } catch (error) {
    console.error('Error en getMyPermissions:', error);
    sendError(res, 'Error al obtener permisos', 500);
  }
};

module.exports = { register, login, getMe, getMyPermissions };
