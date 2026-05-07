const userService = require('./user.service')
const groupService = require('./group.service')
const expenseService = require('./expense.service')
const roleService = require('./roles.service')
const userRoleService = require('./userRole.service')
const expenseShareService = require('./expenseShare.service')
const groupMemberService = require('./groupMember.service')

function registerServices(app) {
  app.registerService('user', userService(app))
  app.registerService('group', groupService(app))
  app.registerService('expense', expenseService(app))
  app.registerService('role', roleService(app))
  app.registerService('userRole', userRoleService(app))
  app.registerService('expenseShare', expenseShareService(app))
  app.registerService('groupMember', groupMemberService(app))
}

module.exports = { registerServices }
