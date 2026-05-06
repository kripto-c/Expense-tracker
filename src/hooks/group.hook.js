const prisma = require('../prisma')

const addCreatorAsMember = async (context) => {
  const { id: groupId, userId } = context.result
  await prisma.groupMember.create({
    data: {
      groupId,
      userId,
      role: 'admin',
    },
  })
  return context
}

module.exports = { addCreatorAsMember }
