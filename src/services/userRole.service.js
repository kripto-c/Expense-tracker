const BaseService = require('./base.service')
const prisma = require('../prisma')

class UserRoleService extends BaseService {
  constructor(app) {
    super(prisma.userRole, 'userRole', app)
  }
}

module.exports = (app) => new UserRoleService(app)
