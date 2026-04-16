# Sistema CRUD con RBAC y Permisos Directos

Sistema de autenticación y autorización basado en roles (RBAC) con permisos granulares y permisos directos por usuario, implementado en Node.js + Express + MongoDB.

## 🚀 Características

- **Autenticación JWT**: Login seguro con tokens JWT
- **RBAC (Role-Based Access Control)**: Roles con múltiples permisos
- **Permisos Directos**: Asignación de permisos específicos a usuarios, independientes de sus roles
- **Middleware de Autorización**: Verificación granular de permisos
- **API RESTful**: Endpoints protegidos por permisos
- **Frontend Ready**: Endpoint específico para obtener permisos del usuario actual

## 📁 Estructura del Proyecto

```
src/
├── config/
│   └── database.js          # Configuración de MongoDB
├── controllers/
│   ├── authController.js    # Autenticación y perfil
│   ├── userController.js    # CRUD de usuarios
│   ├── roleController.js    # CRUD de roles
│   └── permissionController.js # CRUD de permisos
├── middleware/
│   ├── auth.js              # Verificación JWT
│   └── authorize.js         # Verificación de permisos
├── models/
│   ├── User.js              # Modelo de usuario
│   ├── Role.js              # Modelo de rol
│   └── Permission.js        # Modelo de permiso
├── routes/
│   ├── authRoutes.js        # Rutas de autenticación
│   ├── userRoutes.js        # Rutas de usuarios
│   ├── roleRoutes.js        # Rutas de roles
│   └── permissionRoutes.js  # Rutas de permisos
├── utils/
│   ├── helpers.js           # Funciones auxiliares
│   └── seed.js              # Script para datos iniciales
└── index.js                 # Punto de entrada
```

## 🔧 Instalación

1. **Instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/crud_rbac
JWT_SECRET=tu_secreto_muy_seguro_cambialo_en_produccion
JWT_EXPIRE=1d
```

3. **Ejecutar seed de datos iniciales:**
```bash
npm run seed
```

4. **Iniciar el servidor:**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 👥 Usuarios por Defecto

Después de ejecutar el seed, tendrás estos usuarios:

| Email | Password | Rol | Permisos Especiales |
|-------|----------|-----|---------------------|
| admin@system.com | Admin123! | Super Admin | Todos los permisos |
| manager@system.com | Manager123! | Admin | La mayoría excepto eliminar usuarios/roles |
| editor@system.com | Editor123! | Editor | Lectura/edición + permiso directo para exportar reportes |
| viewer@system.com | Viewer123! | Viewer | Solo lectura |

## 📡 Endpoints de la API

### Autenticación
```
POST   /api/auth/register       - Registrar nuevo usuario
POST   /api/auth/login          - Iniciar sesión
GET    /api/auth/me             - Obtener perfil del usuario actual
GET    /api/auth/permissions    - Obtener permisos del usuario (para frontend)
```

### Usuarios
```
GET    /api/users               - Listar usuarios (permiso: users:list)
GET    /api/users/:id           - Ver usuario (permiso: users:read)
POST   /api/users               - Crear usuario (permiso: users:create)
PUT    /api/users/:id           - Actualizar usuario (permiso: users:update)
DELETE /api/users/:id           - Eliminar usuario (permiso: users:delete)
POST   /api/users/:id/permissions - Agregar permisos directos
```

### Roles
```
GET    /api/roles               - Listar roles (permiso: roles:list)
GET    /api/roles/:id           - Ver rol (permiso: roles:read)
POST   /api/roles               - Crear rol (permiso: roles:create)
PUT    /api/roles/:id           - Actualizar rol (permiso: roles:update)
DELETE /api/roles/:id           - Eliminar rol (permiso: roles:delete)
POST   /api/roles/:id/permissions - Agregar permisos al rol
```

### Permisos
```
GET    /api/permissions         - Listar permisos (permiso: permissions:list)
GET    /api/permissions/:id     - Ver permiso (permiso: permissions:read)
POST   /api/permissions         - Crear permiso (permiso: permissions:create)
PUT    /api/permissions/:id     - Actualizar permiso (permiso: permissions:update)
DELETE /api/permissions/:id     - Eliminar permiso (permiso: permissions:delete)
```

## 🔑 Ejemplos de Uso

### Login y obtención de token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@system.com", "password": "Admin123!"}'
```

Respuesta:
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "_id": "...",
    "name": "Super Administrador",
    "email": "admin@system.com",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Obtener permisos para el frontend

```bash
curl -X GET http://localhost:3000/api/auth/permissions \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

Respuesta estructurada:
```json
{
  "success": true,
  "data": {
    "all": ["users:list", "users:read", "users:create", ...],
    "byResource": {
      "users": ["list", "read", "create", "update", "delete"],
      "products": ["list", "read", "create"]
    },
    "can": {
      "list": true,
      "read": true,
      "create": true,
      "update": true,
      "delete": true,
      "export": false
    }
  }
}
```

### Crear un nuevo usuario (requiere permiso)

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nuevo Usuario",
    "email": "nuevo@ejemplo.com",
    "password": "Password123!",
    "roles": ["ID_DEL_ROL_EDITOR"]
  }'
```

## 🎨 Integración con Frontend

### Ejemplo en React/Vue/Angular

```javascript
// Servicio para obtener permisos
async function loadUserPermissions() {
  const response = await fetch('/api/auth/permissions', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const data = await response.json();
  return data.data;
}

// Hook personalizado (React)
function usePermissions() {
  const [permissions, setPermissions] = useState(null);
  
  useEffect(() => {
    loadUserPermissions().then(setPermissions);
  }, []);
  
  const can = (action) => permissions?.can?.[action] || false;
  const hasPermission = (name) => permissions?.all?.includes(name) || false;
  
  return { permissions, can, hasPermission };
}

// Componente condicional
function UserList() {
  const { can } = usePermissions();
  
  return (
    <div>
      <h1>Usuarios</h1>
      
      {can('create') && (
        <button onClick={handleCreate}>Nuevo Usuario</button>
      )}
      
      {can('export') && (
        <button onClick={handleExport}>Exportar</button>
      )}
      
      {/* Tabla de usuarios */}
    </div>
  );
}
```

### Ejemplo de directiva en Vue

```javascript
// main.js
app.directive('can', {
  mounted(el, binding) {
    const permissions = store.state.user.permissions;
    if (!permissions.all.includes(binding.value)) {
      el.remove();
    }
  }
});

// Template
<template>
  <button v-can="'users:create'">Nuevo Usuario</button>
  <button v-can="'users:delete'">Eliminar</button>
</template>
```

## 🔒 Modelo de Datos

### Usuario
- `name`: Nombre del usuario
- `email`: Email único
- `password`: Hash bcrypt
- `roles`: Array de ObjectId referencing Role
- `directPermissions`: Array de ObjectId referencing Permission
- `isActive`: Boolean

### Rol
- `name`: Nombre único
- `description`: Descripción
- `permissions`: Array de ObjectId referencing Permission
- `isSystem`: Boolean (roles del sistema no eliminables)

### Permiso
- `name`: Nombre único (ej: `users:create`)
- `resource`: Recurso (users, roles, permissions, products, etc.)
- `action`: Acción (create, read, update, delete, list, export, import)
- `module`: Módulo al que pertenece
- `description`: Descripción

## 🏗️ Arquitectura de Autorización

### Flujo de verificación:

1. **Autenticación**: Middleware `protect` verifica JWT y carga usuario
2. **Autorización**: Middleware `authorize` verifica permisos
3. **Lógica de negocio**: Controller ejecuta la acción

### Jerarquía de permisos:

```
Usuario
├── Roles
│   └── Permisos del Rol 1
│   └── Permisos del Rol 2
└── Permisos Directos
```

**Los permisos directos tienen prioridad y se suman a los de los roles.**

## 🛡️ Mejores Prácticas Implementadas

1. **Passwords encriptados**: bcrypt con salt rounds
2. **JWT con expiración**: Tokens temporales renovables
3. **Validación de datos**: Verificación de campos requeridos
4. **Manejo de errores**: Respuestas consistentes
5. **Roles del sistema**: Protección contra eliminación accidental
6. **Índices en BD**: Optimización de consultas
7. **Selectividad de campos**: No exponer password en queries
8. **CORS configurado**: Seguridad en peticiones cross-origin

## 📈 Escalabilidad y Mantenibilidad

### Para agregar nuevos permisos:

1. Crear el permiso vía API o seed:
```javascript
await Permission.create({
  name: 'products:import',
  resource: 'products',
  action: 'import',
  description: 'Importar productos desde CSV'
});
```

2. Asignar a roles existentes o nuevos

3. Proteger endpoint con middleware:
```javascript
router.post('/import', authorize('products:import'), importController);
```

4. El frontend automáticamente lo recibirá en `/api/auth/permissions`

### Para agregar nuevos recursos:

1. Actualizar enum en modelo Permission
2. Crear permisos para el nuevo recurso
3. Asignar a roles correspondientes

## 🧪 Testing

```bash
# Probar health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@system.com", "password": "Admin123!"}'

# Guardar token y probar endpoint protegido
TOKEN="TU_TOKEN"
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

## 📝 Licencia

ISC
