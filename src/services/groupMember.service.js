const BaseService = require('./base.service')
const prisma = require('../prisma')

class GroupMemberService extends BaseService {
  constructor(app) {
    super(prisma.groupMember, null, [], app) // sin permisos (solo interno)
  }
}

module.exports = (app) => new GroupMemberService(app)
