const BaseService = require('./base.service')
const prisma = require('../prisma')
const validate = require('../hooks/validate')
const { assignCreator } = require('../hooks/authorize')
const { POST, PATCH } = require('../schemas/roles.schema')

class RolesService extends BaseService {
  constructor(app) {
    super(prisma.role, 'roles', app)

    // Hooks para create: validación
    this.before('create', validate(POST))

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH))
  }
}

module.exports = (app) => new RolesService(app)
