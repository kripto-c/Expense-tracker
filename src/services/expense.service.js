const BaseService = require('./base.service')
const prisma = require('../prisma')
const validate = require('../hooks/validate')
const { assignCreator, checkOwnership } = require('../hooks/authorize')
const { POST, PATCH } = require('../schemas/expense.schema')
const { createExpenseShares, restrictToPayer } = require('../hooks/expense.hook')
const populate = require('../hooks/populate')

class ExpenseService extends BaseService {
  constructor(app) {
    super(prisma.expense, 'expense', app)

    this.after(
      'find',
      populate({
        include: [
          {
            service: 'group',
            name: 'group',
            parentField: 'groupId',
            childField: 'id',
            query: { $select: ['id', 'name'] },
          },
          {
            service: 'user',
            name: 'payer',
            parentField: 'paidById',
            childField: 'id',
            query: { $select: ['id', 'email', 'name'] },
          },
        ],
      }),
    )

    // Hooks para create: validación + asignar creador
    this.before('create', validate(POST), assignCreator('paidById'))
    this.after('create', createExpenseShares)

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH), restrictToPayer)

    // Hooks para remove: solo verificar propiedad
    this.before('remove', restrictToPayer)
  }
}

module.exports = (app) => new ExpenseService(app)
