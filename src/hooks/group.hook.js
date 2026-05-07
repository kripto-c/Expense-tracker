const addCreatorAsMember = async (context) => {
  const { id: groupId, userId } = context.result
  const groupMemberService = context.app.getService('groupMember')
  await groupMemberService.create({ groupId, userId, role: 'admin' })
  return context
}

module.exports = { addCreatorAsMember }
