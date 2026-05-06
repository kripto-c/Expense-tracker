const BaseService = require('./base.service')
const prisma = require('../prisma')
const validate = require('../hooks/validate')
const { assignCreator } = require('../hooks/authorize')
const { POST, PATCH } = require('../schemas/roles.schema')
const { checkPermission } = require('../hooks/permissions')

class RolesService extends BaseService {
  constructor() {
    super(prisma.role, 'roles')

    // Hooks para create: validación
    this.before('create', validate(POST))

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH))
  }
}

module.exports = new RolesService()
