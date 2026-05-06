const prisma = require('../prisma')

// Calcula los shares para división igualitaria (función pura)
const calculateEqualShares = async (context) => {
  const { groupId, amount } = context.result
  const members = await prisma.groupMember.findMany({
    where: { groupId },
    select: { userId: true },
  })
  if (members.length === 0) {
    throw new Error('El grupo no tiene miembros para dividir el gasto')
  }
  const shareAmount = amount / members.length
  return members.map((m) => ({
    userId: m.userId,
    amount: shareAmount,
    settled: false,
  }))
}

// Hook after create: crea los shares y recarga el gasto
const createExpenseShares = async (context) => {
  const shares = await calculateEqualShares(context)
  await prisma.expenseShare.createMany({
    data: shares.map((share) => ({
      expenseId: context.result.id,
      userId: share.userId,
      amount: share.amount,
      settled: share.settled,
    })),
  })
  // Recargar el gasto incluyendo sus shares
  context.result = await prisma.expense.findUnique({
    where: { id: context.result.id },
    include: { shares: true },
  })
  return context
}

// Hook para restringir modificaciones solo al pagador
const restrictToPayer = async (context) => {
  const expense = await context.service.model.findUnique({
    where: { id: context.id },
  })
  if (!expense) throw new Error('Gasto no encontrado')
  if (expense.paidById !== context.params.user.userId) {
    throw new Error('No tienes permiso para modificar o eliminar este gasto')
  }
  return context
}

module.exports = { createExpenseShares, restrictToPayer }
