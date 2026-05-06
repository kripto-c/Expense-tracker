const BaseService = require('./base.service')
const prisma = require('../prisma')
const validate = require('../hooks/validate')
const { assignCreator, checkOwnership } = require('../hooks/authorize')
const { POST, PATCH } = require('../schemas/group.schema')

class GroupService extends BaseService {
  constructor(app) {
    super(prisma.group, 'group', app)

    // Hooks para create: validación + asignar creador
    this.before('create', validate(POST), assignCreator('userId'))

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH), checkOwnership('userId'))

    // Hooks para remove: solo verificar propiedad
    this.before('remove', checkOwnership('userId'))
  }
}

module.exports = (app) => new GroupService(app)
