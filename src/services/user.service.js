const BaseService = require('./base.service')
const prisma = require('../prisma')
const bcrypt = require('bcrypt')
const { hashPassword, generateUserName } = require('../hooks/user.hook')

class UserService extends BaseService {
  constructor() {
    super(prisma.user, 'user', ['create']) // Excluir create de permisos automáticos

    // Hook before create: hashear password
    this.before('create', generateUserName, hashPassword)
  }

  async findByEmail(email) {
    return await this.model.findUnique({ where: { email } })
  }

  async getRoles(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    })
    return userRoles.map((ur) => {
      return {
        name: ur.role.name,
        permissions: ur.role.permissions,
      }
    })
  }
}

module.exports = new UserService()
