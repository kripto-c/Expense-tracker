const BaseService = require('./base.service')
const prisma = require('../prisma')
const validate = require('../hooks/validate')
const { assignCreator, checkOwnership } = require('../hooks/authorize')
const { addCreatorAsMember } = require('../hooks/group.hook')
const { POST, PATCH } = require('../schemas/group.schema')
const populateMany = require('../hooks/populateMany')

class GroupService extends BaseService {
  constructor(app) {
    super(prisma.group, 'groups', app)

    // Hooks para find
    this.after(
      'find',
      populateMany({
        service: 'groupMember',
        name: 'members',
        parentField: 'id',
        childField: 'groupId',
        query: { $select: ['userId', 'role', 'groupId'] },
        populate: {
          service: 'user',
          field: 'userData',
          foreignKey: 'userId',
          query: { $select: ['id', 'name', 'email'] },
        },
      }),
    )

    //Hook get
    this.after(
      'get',
      populateMany({
        service: 'groupMember',
        name: 'members',
        parentField: 'id',
        childField: 'groupId',
        query: { $select: ['userId', 'role', 'groupId'] },
        populate: {
          service: 'user',
          field: 'userData',
          foreignKey: 'userId',
          query: { $select: ['id', 'name', 'email'] },
        },
      }),
    )

    // Hooks para create: validación + asignar creador
    this.before('create', validate(POST), assignCreator('userId'))
    this.after('create', addCreatorAsMember)

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH), checkOwnership('userId'))

    // Hooks para remove: solo verificar propiedad
    this.before('remove', checkOwnership('userId'))
  }
}

module.exports = (app) => new GroupService(app)
