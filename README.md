```markdown
# Expense Tracker - Arquitectura Backend

## Proyecto

API REST para gestión de gastos compartidos (tipo Splitwise) con autenticación, roles y permisos.
Construida sin frameworks mágicos (Feathers, Nest, etc.) para entender las capas subyacentes.

## Stack

- Node.js + Express (sin magia)
- PostgreSQL + Prisma (con adapter para Prisma 7)
- JWT + bcrypt (manual)
- Joi (validación)
- AsyncLocalStorage (contexto por request)
- Socket.io (pendiente)

## Estructura de carpetas
```

expense-tracker/
├── readme.md
├── package.json
├── prisma.config.js # Configuración de Prisma 7 (datasource URL)
├── .env
├── prisma/
│ ├── migrations/ # Múltiples migraciones (ver lista en el árbol)
│ ├── seed.js # Datos iniciales (roles, usuarios, permisos)
│ └── schema.prisma # Modelos: User, Group, Role, UserRole, GroupMember, Expense, ExpenseShare
├── src/
│ ├── routes/
│ │ ├── auth.routes.js
│ │ ├── expense.routes.js
│ │ ├── group.routes.js
│ │ ├── roles.routes.js
│ │ └── index.js # Agrupa y exporta todas las rutas bajo /api
│ ├── generated/ # (carpeta generada por Prisma, no versionar)
│ ├── services/
│ │ ├── base.service.js # Clase BaseService con hooks, permisos automáticos, query params
│ │ ├── user.service.js
│ │ ├── group.service.js
│ │ ├── expense.service.js
│ │ └── roles.service.js
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ ├── group.controller.js
│ │ ├── expense.controller.js
│ │ └── roles.controller.js
│ ├── middlewares/
│ │ ├── auth.global.js # Verifica JWT y asigna req.user (con lista blanca)
│ │ └── context.middleware.js # Inyecta req.user en AsyncLocalStorage
│ ├── schemas/
│ │ ├── group.schema.js # Esquemas Joi para Group
│ │ ├── expense.schema.js
│ │ └── roles.schema.js
│ ├── hooks/
│ │ ├── validate.js # Hook que aplica validación Joi
│ │ ├── authorize.js # assignCreator, checkOwnership
│ │ ├── user.hook.js # generateUserName, hashPassword
│ │ ├── group.hook.js # addCreatorAsMember
│ │ ├── expense.hook.js # calculateEqualShares, createExpenseShares, restrictToPayer
│ │ └── permissions.js # getCurrentUser, checkPermission (integra AsyncLocalStorage)
│ ├── context.js # Configuración de AsyncLocalStorage (runWithContext, getCurrentUser)
│ ├── prisma.js # Cliente Prisma con adapter (para PostgreSQL)
│ └── server.js # Configura Express, middlewares, monta rutas /api
└── node_modules/

## 🔐 Autenticación y contexto

### Middleware `globalAuth`

- Extrae token JWT del header `Authorization: Bearer <token>`.
- Verifica y adjunta `req.user = { userId, email }`.
- Tiene lista blanca (`publicPaths`) para rutas públicas (login, register, health).

### Contexto con `AsyncLocalStorage`

Archivo: `src/context.js`

- `runWithContext(store, callback)` — ejecuta callback con el store (usuario) disponible.
- `getCurrentUser()` — recupera el usuario autenticado desde cualquier punto del código (sin pasarlo como parámetro).

### Middleware de contexto

`src/middlewares/context.middleware.js`

- Se ejecuta **después** de `globalAuth`.
- Llama a `runWithContext({ user: req.user }, next)`.
- A partir de aquí, todos los servicios pueden llamar a `getCurrentUser()`.

**Ventaja:** Los controladores **no necesitan pasar `{ user: req.user }`** al servicio.

## 🧠 Servicio base (BaseService)

### Características

- CRUD genérico: `find`, `get`, `create`, `patch`, `remove`.
- Sistema de hooks (before/after) por método.
- **Permisos automáticos**: según el `serviceName` (ej: 'groups', 'expenses', 'roles'), se registra `checkPermission(action, serviceName)` como primer hook before.
- Soporte para parámetros de query estilo Feathers: `$limit`, `$skip`, `$sort`, `$select`.
- El usuario autenticado se obtiene vía `getCurrentUser()` y se agrega a `context.user`.

### Ejemplo de servicio concreto (`RoleService`)

```javascript
class RoleService extends BaseService {
  constructor() {
    super(prisma.role, 'roles')
    this.before('create', validate(roleCreateSchema))
  }
}
```

Solo necesita definir el `serviceName`; los permisos se aplican automáticamente.

## 🎭 Roles y permisos (RBAC)

### Modelo `Role`

- `name` (único)
- `permissions` (JSON) — formato: `[{"actions": ["create","read"], "subject": ["groups","expenses"]}]`
  Esto permite agrupar múltiples acciones por sujeto en un solo objeto.

### Modelo `UserRole`

- Relación muchos a muchos entre `User` y `Role` (roles globales de plataforma).

### Lógica de permisos (`src/hooks/permissions.js`)

- `getUserPermissions(userId)`: obtiene todos los roles del usuario y combina permisos en un objeto `{ subject: [actions...] }`.
- `hasPermission(perms, action, subject)`: verifica si el usuario tiene `action` sobre `subject` o `manage:subject` o `manage:all`.
- `checkPermission(action, subject)`: hook que:
  1. Obtiene usuario actual con `getCurrentUser()`.
  2. Cachea los permisos en `context._permissions`.
  3. Lanza error si no tiene permiso.

### Aplicación automática en BaseService

`_applyAutoPermissions()` mapea cada método a una acción (`find/get` → `read`, `create` → `create`, `patch` → `update`, `remove` → `delete`) y registra `checkPermission(action, serviceName)` como primer hook before.

## 🚀 Ejemplos de uso

### Crear rol (requiere permiso `manage:roles` o `create:roles` si se hubiera definido)

```bash
curl -X POST /api/roles -H "Authorization: Bearer <token>" -d '{"name":"moderator","permissions":[{"actions":["read"],"subject":["groups"]}]}'
```

### Asignar rol a usuario (pendiente de implementar)

Endpoint sugerido: `POST /api/users/:userId/roles` con body `{ roleId }`. Implementar usando `UserRole` y verificando permiso `manage:roles`.

## 🔄 Flujo de autorización (resumen)

1. Petición → `globalAuth` → `req.user` asignado.
2. `contextMiddleware` → inyecta `req.user` en AsyncLocalStorage.
3. Llega al controlador (no pasa usuario manualmente).
4. Controlador llama a `service.create(data)`.
5. `BaseService.create` → `getCurrentUser()` obtiene usuario, lo añade a `context.user`.
6. Se ejecutan hooks (primero `checkPermission`, luego validación Joi, etc.).
7. Si pasa los permisos, se ejecuta la operación de BD.

## 📦 Módulos implementados

| Servicio                            | Subject (permisos)            | Hooks adicionales                                                             |
| ----------------------------------- | ----------------------------- | ----------------------------------------------------------------------------- |
| `UserService` (solo registro/login) | (no usa permisos automáticos) | `generateUserName`, `hashPassword`                                            |
| `GroupService`                      | `groups`                      | `assignCreator`, `checkOwnership`, `addCreatorAsMember`                       |
| `ExpenseService`                    | `expenses`                    | `assignCreator` (paidById), `calculateEqualShares` (after), `restrictToPayer` |
| `RoleService`                       | `roles`                       | `validate` (Joi)                                                              |

## ✅ Estado actual (verificado)

- Autenticación JWT funcionando.
- Contexto AsyncLocalStorage operativo.
- CRUD de grupos protegido (solo creador puede modificar).
- CRUD de gastos con división igualitaria automática.
- CRUD de roles protegido con permiso `manage:roles`.
- Parámetros de query (`$limit`, `$sort`, `$select`) probados.
- El sistema de permisos es automático para cualquier nuevo servicio que herede de `BaseService`.

## 🧪 Próximos pasos (no implementados aún)

- [ ] Endpoint `POST /api/users/:userId/roles` (asignar roles globales).
- [ ] Real-time con Socket.io (eventos automáticos desde BaseService).
- [ ] Middleware de errores global.
- [ ] Logging estructurado (pino/winston).
- [ ] Frontend básico (HTML/JS).

## 📚 Notas para el desarrollador

- No confundir los roles globales (tabla `UserRole`) con los roles dentro de grupos (`GroupMember.roleId`). Ambos usan la misma tabla `Role` pero conceptualmente son distintos.
- Los permisos se basan en `subject`; se recomienda usar los mismos nombres de sujeto que los servicios (`groups`, `expenses`, `roles`, `users`).
- Para añadir un nuevo servicio:
  1. Crear modelo en Prisma.
  2. Crear servicio heredando de `BaseService` con el `serviceName` adecuado.
  3. Registrar rutas y controladores (estos no necesitan pasar usuario manualmente).
  4. Los permisos se aplicarán automáticamente.

---

_Última actualización: 2026-05-05_
