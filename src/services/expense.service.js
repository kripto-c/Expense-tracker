const BaseService = require('./base.service')
const prisma = require('../prisma')
const validate = require('../hooks/validate')
const { assignCreator, checkOwnership } = require('../hooks/authorize')
const { POST, PATCH } = require('../schemas/expense.schema')
const { createExpenseShares, restrictToPayer } = require('../hooks/expense.hook')

class ExpenseService extends BaseService {
  constructor() {
    super(prisma.expense, 'expense')

    // Hooks para create: validación + asignar creador
    this.before('create', validate(POST), assignCreator('paidById'))
    this.after('create', createExpenseShares)

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH), restrictToPayer)

    // Hooks para remove: solo verificar propiedad
    this.before('remove', restrictToPayer)
  }
}

module.exports = new ExpenseService()
