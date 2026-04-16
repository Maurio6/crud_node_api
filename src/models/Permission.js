const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
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
  resource: {
    type: String,
    required: true,
    enum: ['users', 'roles', 'permissions', 'products', 'orders', 'reports']
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'list', 'export', 'import']
  },
  module: {
    type: String,
    default: 'general'
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
permissionSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('Permission', permissionSchema);
