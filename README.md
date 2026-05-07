Aquí tienes el README actualizado con los últimos cambios: **simplificación de `GroupMember`**, **eliminación de dependencia con `Role`** y **sistema de populate** al estilo Feathers.

```markdown
# Expense Tracker - Arquitectura Backend

## Proyecto

API REST para gestión de gastos compartidos (tipo Splitwise) con autenticación, roles y permisos.
Construida **sin frameworks mágicos** (Feathers, Nest, etc.) para entender las capas subyacentes.

## Stack

- Node.js + Express (mínimo, sin magia)
- PostgreSQL + Prisma (con adapter para Prisma 7)
- JWT + bcrypt (manual)
- Joi (validación)
- AsyncLocalStorage (solo para el usuario autenticado)
- Socket.io (pendiente)

## Estructura de carpetas
```

expense-tracker/
├── readme.md
├── package.json
├── prisma.config.js # Configuración de Prisma 7 (datasource URL)
├── .env
├── prisma/
│ ├── migrations/ # Migraciones generadas
│ ├── seed.js # Datos iniciales (roles, usuarios, permisos)
│ └── schema.prisma # Modelos: User, Group, Role, UserRole, GroupMember, Expense, ExpenseShare
├── src/
│ ├── routes/
│ │ ├── auth.routes.js
│ │ ├── expense.routes.js
│ │ ├── group.routes.js
│ │ ├── role.routes.js
│ │ └── index.js # Agrupa y exporta todas las rutas bajo /api
│ ├── generated/ # (carpeta generada por Prisma, no versionar)
│ ├── services/
│ │ ├── base.service.js # Clase BaseService: hooks, permisos automáticos, query params, filtros where
│ │ ├── user.service.js
│ │ ├── group.service.js
│ │ ├── expense.service.js
│ │ ├── role.service.js
│ │ ├── groupMember.service.js # Servicio interno (sin permisos)
│ │ └── expenseShare.service.js # Servicio interno (sin permisos)
│ ├── controllers/
│ │ ├── auth.controller.js
│ │ ├── group.controller.js
│ │ ├── expense.controller.js
│ │ ├── role.controller.js
│ │ └── groupMember.controller.js # Endpoints para manejar miembros de grupo
│ ├── middlewares/
│ │ ├── setProvider.js # Asigna req.provider = 'rest'
│ │ ├── auth.global.js # Verifica JWT y asigna req.user
│ │ └── context.middleware.js # Inyecta req.user en AsyncLocalStorage (solo user)
│ ├── schemas/
│ │ ├── group.schema.js
│ │ ├── expense.schema.js
│ │ └── role.schema.js
│ ├── hooks/
│ │ ├── validate.js # Hook que aplica validación Joi
│ │ ├── authorize.js # assignCreator, checkOwnership
│ │ ├── user.hook.js # generateUserName, hashPassword, assignDefaultRole
│ │ ├── group.hook.js # addCreatorAsMember
│ │ ├── expense.hook.js # calculateEqualShares, createExpenseShares, restrictToPayer
│ │ ├── populate.js # Hook para popular relaciones usando servicios internos
│ │ └── permissions.js # checkPermission (usa provider para distinguir llamadas)
│ ├── context.js # AsyncLocalStorage: solo getCurrentUser()
│ ├── prisma.js # Cliente Prisma con adapter (PostgreSQL)
│ └── server.js # Configura Express, middlewares, monta rutas /api
└── node_modules/

````

## 🔐 Autenticación y contexto

### Middleware `setProvider`

```js
// src/middlewares/setProvider.js
req.provider = 'rest';
````

### Middleware `globalAuth`

- Extrae token JWT del header `Authorization: Bearer <token>`.
- Verifica y adjunta `req.user = { userId, email }`.
- Tiene lista blanca (`publicPaths`) para rutas públicas (login, register, health).

### Contexto con `AsyncLocalStorage`

**Archivo `src/context.js`**:

- `runWithContext(store, callback)` — ejecuta callback con el store.
- `getCurrentUser()` — recupera el usuario autenticado desde cualquier punto del código (sin pasarlo como parámetro).

**✅ Importante:** El `provider` **no** se guarda en `AsyncLocalStorage`. Solo se pasa explícitamente a través de los parámetros de los servicios.

### Middleware de contexto

`src/middlewares/context.middleware.js`:

```js
runWithContext({ user: req.user }, next)
```

**Ventaja:** Los servicios pueden obtener el usuario con `getCurrentUser()` sin que el controlador tenga que pasarlo manualmente.

## 🧠 Servicio base (BaseService)

### Características

- CRUD genérico: `find`, `get`, `create`, `patch`, `remove`.
- Sistema de hooks (before/after) por método.
- **Permisos automáticos**: según el `serviceName` (ej: 'groups', 'expenses', 'roles'), se registra `checkPermission(action, serviceName)` como primer hook before.
- Soporte para parámetros de query estilo Feathers: `$limit`, `$skip`, `$sort`, `$select`.
- Soporte para **filtros `where` básicos**: cualquier clave en `query` que no empiece con `$` se convierte en un filtro de igualdad en Prisma (ej: `{ name: 'user' }` → `where: { name: 'user' }`).
- El usuario autenticado se obtiene exclusivamente con `getCurrentUser()` y no se mezcla en `params`.

### Ejemplo de servicio concreto (`RoleService`)

```javascript
class RoleService extends BaseService {
  constructor(app) {
    super(prisma.role, 'roles', [], app)
    this.before('create', validate(roleCreateSchema))
    this.before('patch', validate(roleUpdateSchema))
  }
}
```

Solo necesita definir `serviceName`; los permisos se aplican automáticamente.

## 🎭 Roles y permisos (RBAC)

### Modelo `Role`

- `name` (único)
- `permissions` (JSON) — formato: `[{"actions": ["create","read"], "subject": ["groups","expenses"]}]`
  Esto permite agrupar múltiples acciones por sujeto en un solo objeto.

### Modelo `UserRole`

- Relación muchos a muchos entre `User` y `Role` (roles globales de plataforma).

### Roles dentro del grupo

- En `GroupMember` se usa un campo `role` de tipo `String` (`'admin'` o `'member'`).
  **No depende de la tabla `Role`** – simplifica y evita mezclar conceptos.

### Lógica de permisos (`src/hooks/permissions.js`)

- `getUserPermissions(userId)`: obtiene todos los roles del usuario y combina permisos en un objeto `{ subject: [actions...] }`.
- `hasPermission(perms, action, subject)`: verifica si el usuario tiene `action` sobre `subject` o `manage:subject` o `manage:all`.
- `checkPermission(action, subject)`: hook que:
  1. **Distingue llamadas internas vs externas** mediante `context.params.provider`:
     - Si `provider === undefined` → llamada interna → confía y pasa.
     - Si `provider` existe (ej. `'rest'`) → llamada externa → valida autenticación y permisos.
  2. Utiliza el usuario obtenido de `getCurrentUser()`.
  3. Cachea los permisos en `context._permissions` para la misma petición.

### Aplicación automática en `BaseService`

`_applyAutoPermissions()` mapea cada método a una acción (`find/get` → `read`, `create` → `create`, `patch` → `update`, `remove` → `delete`) y registra `checkPermission(action, serviceName)` como primer hook `before`.

## 🔄 Flujo de autorización (resumen)

1. Petición → `setProvider` asigna `req.provider = 'rest'`.
2. `globalAuth` → asigna `req.user`.
3. `contextMiddleware` → inyecta `req.user` en `AsyncLocalStorage` (el **provider** no se guarda).
4. El controlador llama al servicio **pasando explícitamente** `{ provider: req.provider, user: req.user }` (o solo `provider` si el usuario lo obtiene del contexto).
5. `BaseService.create` → obtiene el usuario con `getCurrentUser()` y lo añade a `context.user`; los `params` recibidos se usan tal cual (sin mezclar).
6. Se ejecutan hooks:
   - `checkPermission` evalúa `context.params.provider`: si es `'rest'`, exige autenticación y permisos; si es `undefined` (llamada interna), confía.
   - Otros hooks (validación, `assignCreator`, etc.) se ejecutan después.
7. Si la llamada es externa y supera los permisos, se ejecuta la operación de BD.

## 🧩 Sistema de `populate` (similar a Feathers)

Se implementó un hook genérico `populate` que permite enriquecer los resultados de un servicio con datos de otros servicios (relaciones).
El hook se configura en el servicio hijo (ej. `ExpenseService`) y se ejecuta en `after('get')` y/o `after('find')`.

### Uso básico

```javascript
const populate = require('../hooks/populate')

this.after(
  'get',
  populate({
    include: [
      {
        service: 'group', // servicio registrado
        name: 'group', // campo donde se adjuntará el objeto
        parentField: 'groupId', // campo en el resultado original
        childField: 'id', // campo en el servicio relacionado (por defecto 'id')
        query: { $select: ['id', 'name'] }, // proyección de campos
      },
    ],
  }),
)
```

### Implementación interna

- El hook `populate` itera sobre los elementos del resultado (`context.result.data` o `context.result`).
- Para cada relación, obtiene el servicio mediante `context.app.getService()`.
- Realiza una llamada interna (`provider: undefined`) a `service.find` filtrando por `childField` y aplicando la `query` (soporta `$select`, etc.).
- Adjunta el objeto relacionado en el campo `name`.

### Ventajas

- No usa Prisma directamente, se apoya en los servicios existentes.
- Respeta la arquitectura y los permisos (las llamadas internas confían).
- Fácil de extender y configurar.
- Permite seleccionar campos específicos (`$select`) para evitar sobrecarga.

## 📦 Módulos implementados

| Servicio                            | Subject (permisos)        | Hooks adicionales                                                                            |
| ----------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| `UserService` (solo registro/login) | `user` (excluye `create`) | `generateUserName`, `hashPassword`, `assignDefaultRole` (after)                              |
| `GroupService`                      | `groups`                  | `assignCreator`, `checkOwnership`, `addCreatorAsMember`                                      |
| `ExpenseService`                    | `expenses`                | `assignCreator` (paidById), `calculateEqualShares`, `createExpenseShares`, `restrictToPayer` |
| `RoleService`                       | `roles`                   | `validate` (Joi)                                                                             |
| `GroupMemberService`                | (ninguno, interno)        | (servicio sin permisos)                                                                      |
| `ExpenseShareService`               | (ninguno, interno)        | (servicio sin permisos)                                                                      |

## ✅ Estado actual (verificado)

- Autenticación JWT funcionando.
- Contexto `AsyncLocalStorage` **solo para el usuario** (sin contaminación de `provider`).
- Controladores pasan explícitamente `provider: req.provider` y `user: req.user`.
- `BaseService.find` soporta filtros `where` a partir de `query` (ej. `{ name: 'user' }`).
- Llamadas internas (desde hooks) no llevan `provider`, por lo que `checkPermission` las considera internas y no exige autenticación.
- CRUD de grupos protegido (solo creador puede modificar).
- CRUD de gastos con división igualitaria automática (soporta múltiples miembros).
- CRUD de roles protegido con permiso `manage:roles`.
- Parámetros de query (`$limit`, `$skip`, `$sort`, `$select`) probados.
- Sistema de `populate` implementado y funcionando.
- El sistema de permisos es automático para cualquier nuevo servicio que herede de `BaseService`.

## 🧪 Próximos pasos (no implementados aún)

- [ ] Endpoint `POST /api/users/:userId/roles` (asignar roles globales).
- [ ] Real-time con Socket.io (eventos automáticos desde `BaseService`).
- [ ] Frontend básico (HTML/JS).
- [ ] Logging estructurado (pino/winston).

## 📚 Notas para el desarrollador

- **Diferencia entre roles globales y roles de grupo**:
  _Roles globales_ (tabla `UserRole`) → permisos en toda la plataforma.
  _Roles de grupo_ (`GroupMember.role`) → solo para distinguir administradores de miembros dentro de un grupo. No utilizan el sistema de permisos global.
- **Permisos**: se basan en `subject`. Usa los mismos nombres de sujeto que los servicios (`groups`, `expenses`, `roles`, `users`).
- **Cómo añadir un nuevo servicio**:
  1. Crear modelo en Prisma.
  2. Crear servicio heredando de `BaseService` con el `serviceName` adecuado.
  3. Registrar el servicio en `src/services/index.js`.
  4. Crear controlador que obtenga el servicio mediante `req.app.getService('...')` y pase explícitamente `provider: req.provider` (y `user: req.user` si es necesario).
  5. Definir rutas.
  6. Los permisos se aplican automáticamente según el `serviceName`.
- **Llamadas internas**: desde hooks o desde otros servicios, **no pases `provider`**. El `BaseService` ya se encarga de que `params.provider === undefined`, y `checkPermission` lo tratará como interno.
- **Populate**: configúralo en los servicios que necesiten enriquecer resultados. Utiliza los servicios internos para obtener relaciones y evita acceder directamente a Prisma desde los hooks.

---

_Última actualización: 2026-05-06_
