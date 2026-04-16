const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingresa un email válido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // No incluir por defecto en las consultas
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }],
  directPermissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash del password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para obtener todos los permisos del usuario (roles + directos)
userSchema.methods.getAllPermissions = async function() {
  const Role = mongoose.model('Role');
  const Permission = mongoose.model('Permission');
  
  // Obtener permisos directos
  const directPerms = await Permission.find({ 
    _id: { $in: this.directPermissions } 
  }).lean();
  
  // Obtener permisos de los roles
  const roles = await Role.find({ 
    _id: { $in: this.roles } 
  }).populate('permissions').lean();
  
  const rolePerms = roles.flatMap(role => role.permissions || []);
  
  // Combinar y eliminar duplicados por _id
  const allPermissions = [...directPerms, ...rolePerms];
  const uniquePermissions = Array.from(
    new Map(allPermissions.map(p => [p._id.toString(), p])).values()
  );
  
  return uniquePermissions;
};

// Método para verificar si tiene un permiso específico
userSchema.methods.hasPermission = async function(permissionName) {
  const permissions = await this.getAllPermissions();
  return permissions.some(p => p.name === permissionName);
};

// Método para verificar si tiene algún permiso de una lista
userSchema.methods.hasAnyPermission = async function(permissionNames) {
  const permissions = await this.getAllPermissions();
  const userPermNames = permissions.map(p => p.name);
  return permissionNames.some(name => userPermNames.includes(name));
};

// Método para agregar permisos directos al usuario
userSchema.methods.addDirectPermissions = async function(permissionIds) {
  for (const permissionId of permissionIds) {
    if (!this.directPermissions.includes(permissionId)) {
      this.directPermissions.push(permissionId);
    }
  }
  return await this.save();
};

// Método para remover permisos directos del usuario
userSchema.methods.removeDirectPermissions = async function(permissionIds) {
  this.directPermissions = this.directPermissions.filter(
    permId => !permissionIds.includes(permId.toString())
  );
  return await this.save();
};

module.exports = mongoose.model('User', userSchema);
