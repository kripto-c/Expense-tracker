const { NotAuthenticated, NotFound, Forbidden } = require('../errors')

const calculateEqualShares = async (context) => {
  const { groupId, amount } = context.result
  const groupMemberService = context.app.getService('groupMember')
  const members = await groupMemberService.find({ query: { groupId } })
  if (members.data.length === 0) {
    throw new Error('El grupo no tiene miembros para dividir el gasto')
  }
  const shareAmount = amount / members.data.length
  return members.data.map((member) => ({
    userId: member.userId,
    amount: shareAmount,
    settled: false,
  }))
}

const createExpenseShares = async (context) => {
  const shares = await calculateEqualShares(context)
  const expenseShareService = context.app.getService('expenseShare')

  // Crear los shares y guardar los objetos creados (con su id)
  const createdShares = []
  for (const share of shares) {
    const created = await expenseShareService.create({
      expenseId: context.result.id,
      userId: share.userId,
      amount: share.amount,
      settled: share.settled,
    })
    createdShares.push(created)
  }

  // Modificar directamente el resultado para que incluya los shares
  context.result.shares = createdShares
  return context
}

const restrictToPayer = async (context) => {
  const userId = context.user?.userId
  if (!userId) throw new NotAuthenticated('Usuario no autenticado')
  const expense = await context.app.getService('expense').find({ query: { id: context.id, $select: ['paidById'] } })
  if (!expense) throw new NotFound('Gasto no encontrado')
  if (expense.paidById !== userId) {
    throw new Forbidden('No tienes permiso para modificar o eliminar este gasto')
  }
  return context
}

module.exports = { createExpenseShares, restrictToPayer }
