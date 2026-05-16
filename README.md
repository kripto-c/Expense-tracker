# Expense Tracker - Arquitectura Backend

## Proyecto

API REST para gestión de gastos compartidos (tipo Splitwise) con autenticación, roles y permisos.
Construida **sin frameworks mágicos** (Feathers, Nest, etc.) para entender las capas subyacentes.

## Stack

- Node.js + Express (mínimo, sin magia)
- TypeScript
- PostgreSQL + Prisma (con adapter para Prisma 7)
- JWT + bcrypt (manual)
- Joi (validación)
- AsyncLocalStorage (solo para el usuario autenticado)
- pnpm (gestor de paquetes)
- Socket.io (pendiente)

## Primeros pasos

```bash
# Instalar dependencias
pnpm install

# Generar cliente Prisma
pnpm db:generate

# Aplicar migraciones a la base de datos
pnpm db:push

# Poblar la base de datos con datos iniciales (roles, usuarios)
pnpm db:seed

# Iniciar en desarrollo (con nodemon + ts-node)
pnpm dev

# Compilar TypeScript
pnpm build

# Iniciar producción (desde dist/)
pnpm start
```

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia el servidor en modo desarrollo |
| `pnpm build` | Compila TypeScript a JavaScript en `dist/` |
| `pnpm start` | Inicia el servidor desde `dist/` |
| `pnpm db:generate` | Genera el cliente Prisma |
| `pnpm db:push` | Aplica los cambios del schema a la DB |
| `pnpm db:seed` | Ejecuta el seed para crear datos iniciales |

## Estructura de carpetas

```
expense-tracker/
├── readme.md
├── package.json
├── tsconfig.json
├── prisma.config.js
├── .env
├── prisma/
│   ├── migrations/
│   ├── seed.js
│   └── schema.prisma
├── src/
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── expense.routes.ts
│   │   ├── group.routes.ts
│   │   ├── role.routes.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── base.service.ts
│   │   ├── user.service.ts
│   │   ├── group.service.ts
│   │   ├── expense.service.ts
│   │   ├── role.service.ts
│   │   ├── groupMember.service.ts
│   │   ├── expenseShare.service.ts
│   │   ├── userRole.service.ts
│   │   └── index.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── group.controller.ts
│   │   ├── expense.controller.ts
│   │   ├── role.controller.ts
│   │   └── groupMember.controller.ts
│   ├── middlewares/
│   │   ├── setProvider.middleware.ts
│   │   ├── auth.global.ts
│   │   ├── context.middleware.ts
│   │   ├── attachServices.middleware.ts
│   │   └── error.middleware.ts
│   ├── schemas/
│   │   ├── group.schema.ts
│   │   ├── expense.schema.ts
│   │   └── roles.schema.ts
│   ├── hooks/
│   │   ├── validate.ts
│   │   ├── authorize.ts
│   │   ├── user.hook.ts
│   │   ├── group.hook.ts
│   │   ├── expense.hook.ts
│   │   ├── populate.ts
│   │   ├── populateMany.ts
│   │   └── permissions.ts
│   ├── types/
│   │   ├── context.ts
│   │   ├── errors.ts
│   │   ├── express.ts
│   │   ├── services.ts
│   │   └── index.ts
│   ├── app.ts
│   ├── context.ts
│   ├── errors.ts
│   ├── prisma.ts
│   └── server.ts
├── dist/              # Compilación TypeScript (no versionar)
└── node_modules/
```

## 🔐 Autenticación y contexto

### Middleware `setProvider`

```typescript
// src/middlewares/setProvider.middleware.ts
req.provider = 'rest';
```

### Middleware `globalAuth`

- Extrae token JWT del header `Authorization: Bearer <token>`.
- Verifica y adjunta `req.user = { userId, email }`.
- Tiene lista blanca (`publicPaths`) para rutas públicas (login, register, health).

### Contexto con `AsyncLocalStorage`

**Archivo `src/context.ts`**:

- `runWithContext(store, callback)` — ejecuta callback con el store.
- `getCurrentUser()` — recupera el usuario autenticado desde cualquier punto del código (sin pasarlo como parámetro).

**✅ Importante:** El `provider` **no** se guarda en `AsyncLocalStorage`. Solo se pasa explícitamente a través de los parámetros de los servicios.

### Middleware de contexto

`src/middlewares/context.middleware.ts`:

```typescript
runWithContext({ user: req.user }, next)
```

**Ventaja:** Los servicios pueden obtener el usuario con `getCurrentUser()` sin que el controlador tenga que pasarlo manualmente.
**Nota:** El `provider` se inyecta manualmente en los controladores (o mediante `attachServices`) porque no debe persistir globalmente para no contaminar llamadas internas.

## 🧠 Servicio base (BaseService)

### Características

- CRUD genérico: `find`, `get`, `create`, `patch`, `remove`.
- Sistema de hooks (before/after) por método.
- **Permisos automáticos**: según el `serviceName` (ej: 'groups', 'expenses', 'roles'), se registra `checkPermission(action, serviceName)` como primer hook before.
- Soporte para parámetros de query estilo Feathers: `$limit`, `$skip`, `$sort`, `$select`.
- Soporte para **filtros `where` básicos**: cualquier clave en `query` que no empiece con `$` se convierte en un filtro de igualdad en Prisma (ej: `{ name: 'user' }` → `where: { name: 'user' }`).
- El usuario autenticado se obtiene exclusivamente con `getCurrentUser()` y no se mezcla en `params`.

### Ejemplo de servicio concreto (`RoleService`)

```typescript
class RoleService extends BaseService {
  constructor(app: Application) {
    super(prisma.role, 'roles', app)
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

### Lógica de permisos (`src/hooks/permissions.ts`)

- `getUserPermissions(userId)`: obtiene todos los roles del usuario y combina permisos en un objeto `{ subject: [actions...] }`.
- `hasPermission(perms, action, subject)`: verifica si el usuario tiene `action` sobre `subject` o `manage:all`.
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
4. El controlador llama al servicio **pasando explícitamente** `provider: req.provider` (y `user: req.user` si no se usa `getCurrentUser`).
   O, alternativamente, se usa un middleware `attachServices` que inyecta estos valores automáticamente (sin necesidad de repetirlos en cada controlador).
5. `BaseService.create` → obtiene el usuario con `getCurrentUser()` y lo añade a `context.user`; los `params` recibidos se usan tal cual (sin mezclar).
6. Se ejecutan hooks:
   - `checkPermission` evalúa `context.params.provider`: si es `'rest'`, exige autenticación y permisos; si es `undefined` (llamada interna), confía.
   - Otros hooks (validación, `assignCreator`, etc.) se ejecutan después.
7. Si la llamada es externa y supera los permisos, se ejecuta la operación de BD.

## 🧩 Sistema de `populate` (similar a Feathers)

Se implementaron hooks genéricos para popular relaciones:

- `populate`: para relaciones uno a uno (ej. obtener el grupo de un gasto).
- `populateMany`: para relaciones uno a muchos (ej. obtener los miembros de un grupo).

### Uso básico en `ExpenseService`

```typescript
import populate from '../hooks/populate'

this.after(
  'find',
  populate({
    include: [
      {
        service: 'group',
        name: 'group',
        parentField: 'groupId',
        childField: 'id',
        query: { $select: ['id', 'name'] },
      },
      {
        service: 'user',
        name: 'payer',
        parentField: 'paidById',
        childField: 'id',
        query: { $select: ['id', 'email', 'name'] },
      },
    ],
  }),
)
```

### Uso de `populateMany` en `GroupService`

```typescript
import populateMany from '../hooks/populateMany'

this.after(
  'find',
  populateMany({
    service: 'groupMember',
    name: 'members',
    parentField: 'id',
    childField: 'groupId',
    query: { $select: ['userId', 'role'] },
    nestedPopulate: {
      // opcional: segundo nivel
      service: 'user',
      field: 'user',
      foreignKey: 'userId',
      query: { $select: ['id', 'name', 'email'] },
    },
  }),
)
```

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
- Controladores pasan explícitamente `provider: req.provider` y `user: req.user` (o usan `attachServices` para inyección automática).
- `BaseService.find` soporta filtros `where` a partir de `query` (ej. `{ name: 'user' }`).
- Llamadas internas (desde hooks) no llevan `provider`, por lo que `checkPermission` las considera internas y no exige autenticación.
- CRUD de grupos protegido (solo creador puede modificar).
- CRUD de gastos con división igualitaria automática (soporta múltiples miembros).
- CRUD de roles protegido con permiso `manage:roles` o `manage:all`.
- Parámetros de query (`$limit`, `$skip`, `$sort`, `$select`) probados.
- Sistema de `populate` implementado y funcionando (incluye relaciones anidadas).
- El sistema de permisos es automático para cualquier nuevo servicio que herede de `BaseService`.
- Proyecto migrated a TypeScript.
- Sistema de tipos organizado en `src/types/`.

## 🧪 Próximos pasos (no implementados aún)

- [ ] Endpoint `POST /api/users/:userId/roles` (asignar roles globales).
- [ ] Real-time con Socket.io (eventos automáticos desde `BaseService`).
- [ ] Frontend básico (HTML/JS).
- [ ] Logging estructurado (pino/winston).

## 📚 Notas para el desarrollador

- **Diferencia entre roles globales y roles de grupo**:
  _Roles globales_ (tabla `UserRole`) → permisos en toda la plataforma.
  _Roles de grupo_ (`GroupMember.role`) → solo para distinguir administradores de miembros dentro de un grupo. No utilizan el sistema de permisos global.
- **Permisos especiales**: El rol `superadmin` tiene `actions: ["manage"]` y `subject: ["all"]`, lo que otorga acceso total sin necesidad de permisos específicos.
- **Permisos**: se basan en `subject`. Usa los mismos nombres de sujeto que los servicios (`groups`, `expenses`, `roles`, `users`).
- **Cómo añadir un nuevo servicio**:
  1. Crear modelo en Prisma.
  2. Crear servicio heredando de `BaseService` con el `serviceName` adecuado.
  3. Registrar el servicio en `src/services/index.ts`.
  4. Crear controlador que obtenga el servicio mediante `req.app.getService('...')` y pase explícitamente `provider: req.provider` (y `user: req.user` si es necesario).
  5. Definir rutas.
  6. Los permisos se aplican automáticamente según el `serviceName`.
- **Llamadas internas**: desde hooks o desde otros servicios, **no pases `provider`**. El `BaseService` ya se encarga de que `params.provider === undefined`, y `checkPermission` lo tratará como interno.
- **Populate**: configúralo en los servicios que necesiten enriquecer resultados. Utiliza los servicios internos para obtener relaciones y evita acceder directamente a Prisma desde los hooks.
- **TypeScript**: Los tipos se encuentran organizados en `src/types/`. Evita usar `any` a menos que sea estrictamente necesario.

---

_Ultima actualización: 2026-05-16_