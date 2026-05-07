const BaseService = require('./base.service')
const prisma = require('../prisma')

class ExpenseShareService extends BaseService {
  constructor(app) {
    super(prisma.expenseShare, null, [], app) // solo interno
  }
}

module.exports = (app) => new ExpenseShareService(app)
