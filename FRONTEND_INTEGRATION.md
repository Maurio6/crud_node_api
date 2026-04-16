# Guía de Integración Frontend

Esta guía muestra cómo consumir la API de permisos desde diferentes frameworks frontend.

## 📋 Respuesta de la API de Permisos

Cuando llamas a `GET /api/auth/permissions`, recibes:

```json
{
  "success": true,
  "data": {
    "all": [
      "users:list",
      "users:read", 
      "users:create",
      "products:list",
      "products:read",
      "reports:export"
    ],
    "byResource": {
      "users": ["list", "read", "create"],
      "products": ["list", "read"],
      "reports": ["export"]
    },
    "can": {
      "list": true,
      "read": true,
      "create": true,
      "update": false,
      "delete": false,
      "export": true
    }
  }
}
```

---

## ⚛️ React

### Hook Personalizado `usePermissions`

```javascript
// hooks/usePermissions.js
import { useState, useEffect, createContext, useContext } from 'react';

const PermissionsContext = createContext(null);

export function PermissionsProvider({ children }) {
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  async function loadPermissions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('No autorizado');
      
      const data = await response.json();
      setPermissions(data.data);
    } catch (error) {
      console.error('Error cargando permisos:', error);
    } finally {
      setLoading(false);
    }
  }

  // Función para verificar si tiene un permiso específico
  const hasPermission = (permissionName) => {
    return permissions?.all?.includes(permissionName) || false;
  };

  // Función para verificar si puede realizar una acción
  const can = (action) => {
    return permissions?.can?.[action] || false;
  };

  // Función para verificar permisos por recurso
  const canAccessResource = (resource, action) => {
    return permissions?.byResource?.[resource]?.includes(action) || false;
  };

  return (
    <PermissionsContext.Provider value={{ permissions, loading, hasPermission, can, canAccessResource }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  }
  return context;
}
```

### Componente Condicional `Can`

```javascript
// components/Can.jsx
import { usePermissions } from '../hooks/usePermissions';

export function Can({ perform, children, fallback = null }) {
  const { can } = usePermissions();
  
  return can(perform) ? children : fallback;
}

export function CanI({ permission, children, fallback = null }) {
  const { hasPermission } = usePermissions();
  
  return hasPermission(permission) ? children : fallback;
}
```

### Ejemplo de Uso en Componente

```javascript
// pages/UsersPage.jsx
import { usePermissions } from '../hooks/usePermissions';
import { Can, CanI } from '../components/Can';

function UsersPage() {
  const { can, canAccessResource } = usePermissions();
  
  const handleCreate = () => { /* ... */ };
  const handleExport = () => { /* ... */ };
  
  return (
    <div className="users-page">
      <h1>Gestión de Usuarios</h1>
      
      {/* Botón condicional - solo si puede crear */}
      <Can perform="create">
        <button onClick={handleCreate} className="btn-primary">
          + Nuevo Usuario
        </button>
      </Can>
      
      {/* Otra forma */}
      <CanI permission="users:delete">
        <button className="btn-danger">Eliminar Seleccionados</button>
      </CanI>
      
      {/* Tabla de usuarios */}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Email</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user._id}>
              <td>{user.name}</td>
              <td>{user.email}</td>
              <td>
                {/* Botones condicionales por fila */}
                {canAccessResource('users', 'read') && (
                  <button onClick={() => viewUser(user)}>Ver</button>
                )}
                
                {canAccessResource('users', 'update') && (
                  <button onClick={() => editUser(user)}>Editar</button>
                )}
                
                {canAccessResource('users', 'delete') && (
                  <button onClick={() => deleteUser(user)}>Eliminar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Mostrar mensaje si no tiene permisos */}
      {!can('list') && (
        <div className="no-permission">
          No tienes permisos para ver esta sección
        </div>
      )}
    </div>
  );
}
```

### Configurar Provider en App

```javascript
// App.jsx
import { PermissionsProvider } from './hooks/usePermissions';

function App() {
  return (
    <PermissionsProvider>
      <Router>
        <Routes>
          <Route path="/users" element={<UsersPage />} />
          {/* otras rutas */}
        </Routes>
      </Router>
    </PermissionsProvider>
  );
}
```

---

## 🅰️ Angular

### Servicio de Permisos

```typescript
// services/permissions.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

interface PermissionsData {
  all: string[];
  byResource: Record<string, string[]>;
  can: Record<string, boolean>;
}

@Injectable({ providedIn: 'root' })
export class PermissionsService {
  private permissionsSubject = new BehaviorSubject<PermissionsData | null>(null);
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  loadPermissions(): Observable<PermissionsData> {
    const token = localStorage.getItem('token');
    
    return new Observable((observer) => {
      this.http.get<{ data: PermissionsData }>('/api/auth/permissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).subscribe({
        next: (response) => {
          this.permissionsSubject.next(response.data);
          observer.next(response.data);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  hasPermission(permission: string): boolean {
    const permissions = this.permissionsSubject.getValue();
    return permissions?.all?.includes(permission) || false;
  }

  can(action: string): boolean {
    const permissions = this.permissionsSubject.getValue();
    return permissions?.can?.[action] || false;
  }

  canAccessResource(resource: string, action: string): boolean {
    const permissions = this.permissionsSubject.getValue();
    return permissions?.byResource?.[resource]?.includes(action) || false;
  }
}
```

### Directiva `*appCan`

```typescript
// directives/can.directive.ts
import { Directive, Input, TemplateRef, ViewContainerRef, OnInit } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';

@Directive({
  selector: '[appCan]'
})
export class CanDirective implements OnInit {
  @Input('appCan') permission: string;
  
  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private permissionsService: PermissionsService
  ) {}

  ngOnInit() {
    if (this.permissionsService.can(this.permission)) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
```

### Pipe `hasPermission`

```typescript
// pipes/has-permission.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { PermissionsService } from '../services/permissions.service';

@Pipe({ name: 'hasPermission' })
export class HasPermissionPipe implements PipeTransform {
  constructor(private permissionsService: PermissionsService) {}

  transform(permission: string): boolean {
    return this.permissionsService.hasPermission(permission);
  }
}
```

### Uso en Template

```html
<!-- users.component.html -->
<div class="users-page">
  <h1>Gestión de Usuarios</h1>
  
  <!-- Usando directiva -->
  <button *appCan="'create'" (click)="createUser()">
    Nuevo Usuario
  </button>
  
  <!-- Usando pipe con *ngIf -->
  <button *ngIf="'users:delete' | hasPermission" (click)="deleteSelected()">
    Eliminar
  </button>
  
  <!-- Tabla -->
  <table>
    <tr *ngFor="let user of users">
      <td>{{ user.name }}</td>
      <td>
        <button 
          *ngIf="permissionsService.canAccessResource('users', 'edit')"
          (click)="editUser(user)">
          Editar
        </button>
      </td>
    </tr>
  </table>
</div>
```

---

## 💚 Vue.js 3

### Composable `usePermissions`

```javascript
// composables/usePermissions.js
import { ref, computed } from 'vue';

const permissions = ref(null);
const loading = ref(true);

export function usePermissions() {
  async function loadPermissions() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('No autorizado');
      
      const data = await response.json();
      permissions.value = data.data;
    } catch (error) {
      console.error('Error cargando permisos:', error);
    } finally {
      loading.value = false;
    }
  }

  const hasPermission = computed(() => (name) => {
    return permissions.value?.all?.includes(name) || false;
  });

  const can = computed(() => (action) => {
    return permissions.value?.can?.[action] || false;
  });

  const canAccessResource = computed(() => (resource, action) => {
    return permissions.value?.byResource?.[resource]?.includes(action) || false;
  });

  return {
    permissions,
    loading,
    loadPermissions,
    hasPermission,
    can,
    canAccessResource
  };
}
```

### Directiva Global `v-can`

```javascript
// main.js
import { createApp } from 'vue';
import App from './App.vue';
import { usePermissions } from './composables/usePermissions';

const app = createApp(App);

// Inicializar permisos antes de montar
async function initApp() {
  const { loadPermissions } = usePermissions();
  await loadPermissions();
  
  // Registrar directiva
  app.directive('can', {
    mounted(el, binding) {
      const { hasPermission } = usePermissions();
      
      if (!hasPermission.value(binding.value)) {
        el.remove();
      }
    }
  });
  
  app.mount('#app');
}

initApp();
```

### Uso en Componente

```vue
<!-- UsersPage.vue -->
<template>
  <div class="users-page">
    <h1>Gestión de Usuarios</h1>
    
    <!-- Directiva v-can -->
    <button v-can="'users:create'" @click="createUser">
      Nuevo Usuario
    </button>
    
    <!-- Usando composable -->
    <button v-if="can('export')" @click="exportData">
      Exportar
    </button>
    
    <table>
      <tr v-for="user in users" :key="user._id">
        <td>{{ user.name }}</td>
        <td>
          <button 
            v-if="canAccessResource('users', 'update')"
            @click="editUser(user)"
          >
            Editar
          </button>
          
          <button 
            v-if="hasPermission('users:delete')"
            @click="deleteUser(user)"
          >
            Eliminar
          </button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions';
import { ref, onMounted } from 'vue';

const { hasPermission, can, canAccessResource } = usePermissions();
const users = ref([]);

onMounted(async () => {
  // Cargar usuarios...
});
</script>
```

---

## 🔐 Patrón de Componente de Ruta Protegida

### React Router

```javascript
// components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

export function ProtectedRoute({ children, requiredPermission }) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Uso en router
<Route 
  path="/users" 
  element={
    <ProtectedRoute requiredPermission="users:list">
      <UsersPage />
    </ProtectedRoute>
  } 
/>
```

### Vue Router

```javascript
// router/index.js
import { usePermissions } from '@/composables/usePermissions';

const routes = [
  {
    path: '/users',
    component: UsersPage,
    meta: { requiresPermission: 'users:list' }
  }
];

router.beforeEach((to, from, next) => {
  const { hasPermission } = usePermissions();
  
  if (to.meta.requiresPermission && !hasPermission(to.meta.requiresPermission)) {
    next('/unauthorized');
  } else {
    next();
  }
});
```

---

## 🎯 Mejores Prácticas

### 1. **Cargar permisos al inicio**
```javascript
// En el login exitoso
async function handleLogin(credentials) {
  const response = await login(credentials);
  localStorage.setItem('token', response.data.token);
  await loadPermissions(); // Cargar inmediatamente
}
```

### 2. **Actualizar permisos después de cambios**
```javascript
// Después de asignar nuevo rol o permiso
async function updateUserPermissions(userId, newPermissions) {
  await api.updateUser(userId, { directPermissions: newPermissions });
  await loadPermissions(); // Recargar si es el usuario actual
}
```

### 3. **Manejar estado de carga**
```javascript
if (loading) {
  return <Spinner />;
}

if (!can('list')) {
  return <NoPermission />;
}
```

### 4. **Ocultar vs Deshabilitar**
```javascript
// Ocultar completamente (recomendado para seguridad)
{can('delete') && <DeleteButton />}

// O deshabilitar (mejor UX en algunos casos)
<button disabled={!can('delete')}>Eliminar</button>
```

### 5. **Fallback UI**
```javascript
<Can perform="create" fallback={<NoPermissionMessage />}>
  <CreateButton />
</Can>
```

---

## 🧪 Testing de Permisos

```javascript
// __tests__/permissions.test.js
describe('Permissions', () => {
  it('debe mostrar botón de crear solo si tiene permiso', () => {
    mockPermissions(['users:list', 'users:read']);
    render(<UsersPage />);
    
    expect(screen.queryByText('Nuevo Usuario')).not.toBeInTheDocument();
  });

  it('debe mostrar botón de crear cuando tiene permiso', async () => {
    mockPermissions(['users:list', 'users:create']);
    render(<UsersPage />);
    
    expect(screen.getByText('Nuevo Usuario')).toBeInTheDocument();
  });
});
```

---

## 📊 Estructura Recomendada del Store (Redux/Zustand/Pinia)

```javascript
// store/slices/permissionsSlice.js
const permissionsSlice = {
  state: {
    all: [],
    byResource: {},
    can: {},
    loaded: false
  },
  
  actions: {
    setPermissions(data) {
      this.state = { ...data, loaded: true };
    },
    
    clearPermissions() {
      this.state = { all: [], byResource: {}, can: {}, loaded: false };
    }
  },
  
  getters: {
    hasPermission: (state) => (name) => state.all.includes(name),
    can: (state) => (action) => state.can[action] || false
  }
};
```

---

Esta guía te proporciona todas las herramientas necesarias para integrar el sistema de permisos en tu frontend de manera segura y escalable.
