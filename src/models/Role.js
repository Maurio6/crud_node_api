const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  isSystem: {
    type: Boolean,
    default: false // Los roles del sistema no se pueden eliminar
  }
}, {
  timestamps: true
});

// Método para agregar permisos al rol
roleSchema.methods.addPermissions = async function(permissionIds) {
  for (const permissionId of permissionIds) {
    if (!this.permissions.includes(permissionId)) {
      this.permissions.push(permissionId);
    }
  }
  return await this.save();
};

// Método para remover permisos del rol
roleSchema.methods.removePermissions = async function(permissionIds) {
  this.permissions = this.permissions.filter(
    permId => !permissionIds.includes(permId.toString())
  );
  return await this.save();
};

module.exports = mongoose.model('Role', roleSchema);
