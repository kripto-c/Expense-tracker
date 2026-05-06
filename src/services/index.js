const userService = require('./user.service')
const groupService = require('./group.service')
const expenseService = require('./expense.service')
const roleService = require('./roles.service')

function registerServices(app) {
  app.registerService('user', userService(app))
  app.registerService('group', groupService(app))
  app.registerService('expense', expenseService(app))
  app.registerService('role', roleService(app))
}

module.exports = { registerServices }
