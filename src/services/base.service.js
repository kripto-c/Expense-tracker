const { getCurrentUser } = require('../context')
const { checkPermission } = require('../hooks/permissions')

const methodToAction = {
  create: 'create',
  update: 'update',
  patch: 'update',
  remove: 'delete',
  find: 'read',
  get: 'read',
}

class BaseService {
  constructor(model, serviceName = '', app, excludeMethods = []) {
    this.model = model
    this.serviceName = serviceName
    this.app = app
    // Metodos a excluir de los permisos automáticos
    this.excludeMethods = excludeMethods
    this.beforeHooks = {
      find: [],
      get: [],
      create: [],
      patch: [],
      remove: [],
    }
    this.afterHooks = {
      find: [],
      get: [],
      create: [],
      patch: [],
      remove: [],
    }

    this.errorHooks = {
      find: [],
      get: [],
      create: [],
      patch: [],
      remove: [],
    }

    this._applyAutoPermissions()
  }

  // Aplicar permisos como hooks antes de cada método
  _applyAutoPermissions() {
    const methodToAction = {
      create: 'create',
      update: 'update',
      patch: 'update',
      remove: 'delete',
      find: 'read',
      get: 'read',
    }
    for (const method of Object.keys(this.beforeHooks)) {
      if (this.excludeMethods.includes(method)) continue
      const action = methodToAction[method]
      if (action) {
        this.before(method, checkPermission(action, this.serviceName))
      }
    }
  }
  // Registrar hooks (pueden ser funciones o arrays)
  before(method, ...fns) {
    this.beforeHooks[method].push(...fns)
  }

  after(method, ...fns) {
    this.afterHooks[method].push(...fns)
  }

  error(method, ...fns) {
    this.errorHooks[method].push(...fns)
  }

  async _runHooks(hooks, context) {
    for (const hook of hooks) {
      context = await hook(context)
      if (!context) throw new Error(`Hook must return context`)
    }
    return context
  }

  async _runErrorHooks(method, error, originalContext) {
    let ctx = { error, method, originalContext, service: this, app: this.app }
    for (const hook of this.errorHooks[method]) {
      try {
        ctx = await hook(ctx)
        // el hook puede modificar ctx.error
      } catch (hookErr) {
        console.error(`Error en hook de error para ${method}:`, hookErr)
      }
    }
    throw ctx.error // relanza el error (puede ser el original o modificado)
  }

  async find(params = {}) {
    try {
      const user = getCurrentUser()
      let context = { method: 'find', params, service: this, result: null, user: user, app: this.app }
      context = await this._runHooks(this.beforeHooks.find, context)

      // extraer params
      const query = context.params.query || {}
      const { $limit, $skip, $select } = query
      let $sort = null

      if (query) {
        const sortKeys = Object.keys(query).filter((k) => k.startsWith('$sort[') && k.endsWith(']'))
        if (sortKeys.length) {
          $sort = {}
          for (const key of sortKeys) {
            const field = key.match(/\$sort\[(.*?)\]/)?.[1]
            if (field) {
              $sort[field] = parseInt(query[key])
            }
          }
        } else if (query.$sort && typeof query.$sort === 'object') {
          // También permitir formato JSON string? (opcional)
          $sort = query.$sort
        }
      }

      //options prisma
      const prismaOptions = {}

      if ($limit !== undefined) {
        prismaOptions.take = parseInt($limit)
      }
      if ($skip !== undefined) {
        prismaOptions.skip = parseInt($skip)
      }
      if ($sort && typeof $sort === 'object') {
        prismaOptions.orderBy = Object.entries($sort).map(([field, order]) => ({
          [field]: order === 1 ? 'asc' : 'desc',
        }))
      }
      if ($select && Array.isArray($select)) {
        prismaOptions.select = $select.reduce((acc, field) => {
          acc[field] = true
          return acc
        }, {})
      }

      // ejecutar consulta con opciones
      const result = await this.model.findMany(prismaOptions)

      const total = await this.model.count()

      const objectResponse = {
        data: result,
        total,
      }

      if ($limit !== undefined) objectResponse.limit = parseInt($limit)
      if ($skip !== undefined) objectResponse.skip = parseInt($skip)

      context.result = {
        ...objectResponse,
      }

      context = await this._runHooks(this.afterHooks.find, context)
      return context.result
    } catch (error) {
      await this._runErrorHooks('find', error, { params })
    }
  }

  async get(id, params = {}) {
    try {
      const user = getCurrentUser()
      let context = { method: 'get', id, params, service: this, result: null, user: user, app: this.app }
      context = await this._runHooks(this.beforeHooks.get, context)
      const record = await this.model.findUnique({ where: { id } })
      if (!record) throw new Error(`Record with id ${id} not found`)
      context.result = record
      context = await this._runHooks(this.afterHooks.get, context)
      return context.result
    } catch (error) {
      await this._runErrorHooks('get', error, { id, params })
    }
  }

  async create(data, params = {}) {
    try {
      const user = getCurrentUser()
      let context = { method: 'create', data, params, service: this, result: null, user: user, app: this.app }
      context = await this._runHooks(this.beforeHooks.create, context)
      const result = await this.model.create({ data: context.data })
      context.result = result
      context = await this._runHooks(this.afterHooks.create, context)
      return context.result
    } catch (error) {
      await this._runErrorHooks('create', error, { data, params })
    }
  }

  async patch(id, data, params = {}) {
    try {
      const user = getCurrentUser()
      let context = { method: 'patch', id, data, params, service: this, result: null, user: user, app: this.app }
      context = await this._runHooks(this.beforeHooks.patch, context)
      const result = await this.model.update({ where: { id }, data: context.data })
      context.result = result
      context = await this._runHooks(this.afterHooks.patch, context)
      return context.result
    } catch (error) {
      await this._runErrorHooks('patch', error, { id, data, params })
    }
  }

  async remove(id, params = {}) {
    try {
      const user = getCurrentUser()
      let context = { method: 'remove', id, params, service: this, result: null, user: user, app: this.app }
      context = await this._runHooks(this.beforeHooks.remove, context)
      const record = await this.model.findUnique({ where: { id } })
      if (!record) throw new Error(`Record with id ${id} not found`)
      const result = await this.model.delete({ where: { id } })
      context.result = result
      context = await this._runHooks(this.afterHooks.remove, context)
      return context.result
    } catch (error) {
      await this._runErrorHooks('remove', error, { id, params })
    }
  }
}

module.exports = BaseService
