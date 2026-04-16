const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');

const seedDatabase = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado para seed');

    // Limpiar colecciones (opcional, comentar si no quieres borrar datos existentes)
    // await Permission.deleteMany({});
    // await Role.deleteMany({});
    // await User.deleteMany({});
    // console.log('Colecciones limpiadas');

    // ==================== CREAR PERMISOS ====================
    console.log('Creando permisos...');
    
    const permissionsData = [
      // Permisos de usuarios
      { name: 'users:list', resource: 'users', action: 'list', description: 'Listar usuarios' },
      { name: 'users:read', resource: 'users', action: 'read', description: 'Ver detalle de usuario' },
      { name: 'users:create', resource: 'users', action: 'create', description: 'Crear usuario' },
      { name: 'users:update', resource: 'users', action: 'update', description: 'Actualizar usuario' },
      { name: 'users:delete', resource: 'users', action: 'delete', description: 'Eliminar usuario' },
      
      // Permisos de roles
      { name: 'roles:list', resource: 'roles', action: 'list', description: 'Listar roles' },
      { name: 'roles:read', resource: 'roles', action: 'read', description: 'Ver detalle de rol' },
      { name: 'roles:create', resource: 'roles', action: 'create', description: 'Crear rol' },
      { name: 'roles:update', resource: 'roles', action: 'update', description: 'Actualizar rol' },
      { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Eliminar rol' },
      
      // Permisos de permisos
      { name: 'permissions:list', resource: 'permissions', action: 'list', description: 'Listar permisos' },
      { name: 'permissions:read', resource: 'permissions', action: 'read', description: 'Ver detalle de permiso' },
      { name: 'permissions:create', resource: 'permissions', action: 'create', description: 'Crear permiso' },
      { name: 'permissions:update', resource: 'permissions', action: 'update', description: 'Actualizar permiso' },
      { name: 'permissions:delete', resource: 'permissions', action: 'delete', description: 'Eliminar permiso' },
      
      // Permisos de productos (ejemplo)
      { name: 'products:list', resource: 'products', action: 'list', description: 'Listar productos' },
      { name: 'products:read', resource: 'products', action: 'read', description: 'Ver detalle de producto' },
      { name: 'products:create', resource: 'products', action: 'create', description: 'Crear producto' },
      { name: 'products:update', resource: 'products', action: 'update', description: 'Actualizar producto' },
      { name: 'products:delete', resource: 'products', action: 'delete', description: 'Eliminar producto' },
      
      // Permisos de reportes (ejemplo)
      { name: 'reports:list', resource: 'reports', action: 'list', description: 'Listar reportes' },
      { name: 'reports:export', resource: 'reports', action: 'export', description: 'Exportar reportes' },
    ];

    const createdPermissions = [];
    for (const permData of permissionsData) {
      let perm = await Permission.findOne({ name: permData.name });
      if (!perm) {
        perm = await Permission.create(permData);
        console.log(`  - Permiso creado: ${perm.name}`);
      }
      createdPermissions.push(perm);
    }

    // ==================== CREAR ROLES ====================
    console.log('Creando roles...');

    // Rol Super Admin - Todos los permisos
    let superAdminRole = await Role.findOne({ name: 'Super Admin' });
    if (!superAdminRole) {
      superAdminRole = await Role.create({
        name: 'Super Admin',
        description: 'Administrador con todos los permisos del sistema',
        permissions: createdPermissions.map(p => p._id),
        isSystem: true
      });
      console.log('  - Rol creado: Super Admin');
    }

    // Rol Admin - Permisos administrativos
    let adminRole = await Role.findOne({ name: 'Admin' });
    if (!adminRole) {
      const adminPerms = createdPermissions.filter(p => 
        !p.name.includes('delete') || p.resource === 'products'
      );
      adminRole = await Role.create({
        name: 'Admin',
        description: 'Administrador con la mayoría de permisos excepto eliminar usuarios/roles',
        permissions: adminPerms.map(p => p._id),
        isSystem: true
      });
      console.log('  - Rol creado: Admin');
    }

    // Rol Editor - Permisos de edición limitados
    let editorRole = await Role.findOne({ name: 'Editor' });
    if (!editorRole) {
      const editorPerms = createdPermissions.filter(p => 
        ['read', 'list', 'create', 'update'].includes(p.action) &&
        ['products', 'reports'].includes(p.resource)
      );
      editorRole = await Role.create({
        name: 'Editor',
        description: 'Usuario que puede crear y editar contenido',
        permissions: editorPerms.map(p => p._id),
        isSystem: false
      });
      console.log('  - Rol creado: Editor');
    }

    // Rol Viewer - Solo lectura
    let viewerRole = await Role.findOne({ name: 'Viewer' });
    if (!viewerRole) {
      const viewerPerms = createdPermissions.filter(p => 
        ['read', 'list'].includes(p.action)
      );
      viewerRole = await Role.create({
        name: 'Viewer',
        description: 'Usuario con permisos de solo lectura',
        permissions: viewerPerms.map(p => p._id),
        isSystem: false
      });
      console.log('  - Rol creado: Viewer');
    }

    // ==================== CREAR USUARIOS ====================
    console.log('Creando usuarios...');

    // Usuario Super Admin
    let superAdminUser = await User.findOne({ email: 'admin@system.com' });
    if (!superAdminUser) {
      superAdminUser = await User.create({
        name: 'Super Administrador',
        email: 'admin@system.com',
        password: await bcrypt.hash('Admin123!', 10),
        roles: [superAdminRole._id],
        isActive: true
      });
      console.log('  - Usuario creado: admin@system.com (password: Admin123!)');
    }

    // Usuario Admin
    let adminUser = await User.findOne({ email: 'manager@system.com' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Manager',
        email: 'manager@system.com',
        password: await bcrypt.hash('Manager123!', 10),
        roles: [adminRole._id],
        isActive: true
      });
      console.log('  - Usuario creado: manager@system.com (password: Manager123!)');
    }

    // Usuario Editor con permiso directo adicional
    let editorUser = await User.findOne({ email: 'editor@system.com' });
    if (!editorUser) {
      // Obtener permiso directo para exportar reportes (aunque su rol no lo tenga)
      const exportPerm = await Permission.findOne({ name: 'reports:export' });
      
      editorUser = await User.create({
        name: 'Editor Special',
        email: 'editor@system.com',
        password: await bcrypt.hash('Editor123!', 10),
        roles: [editorRole._id],
        directPermissions: exportPerm ? [exportPerm._id] : [],
        isActive: true
      });
      console.log('  - Usuario creado: editor@system.com (password: Editor123!) - Con permiso directo extra');
    }

    // Usuario Viewer
    let viewerUser = await User.findOne({ email: 'viewer@system.com' });
    if (!viewerUser) {
      viewerUser = await User.create({
        name: 'Visualizador',
        email: 'viewer@system.com',
        password: await bcrypt.hash('Viewer123!', 10),
        roles: [viewerRole._id],
        isActive: true
      });
      console.log('  - Usuario creado: viewer@system.com (password: Viewer123!)');
    }

    console.log('\n✅ Seed completado exitosamente!');
    console.log('\n📋 Resumen:');
    console.log(`   - ${createdPermissions.length} permisos creados`);
    console.log(`   - 4 roles creados (Super Admin, Admin, Editor, Viewer)`);
    console.log(`   - 4 usuarios creados`);
    console.log('\n🔐 Credenciales de prueba:');
    console.log('   admin@system.com / Admin123!');
    console.log('   manager@system.com / Manager123!');
    console.log('   editor@system.com / Editor123!');
    console.log('   viewer@system.com / Viewer123!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
};

seedDatabase();
