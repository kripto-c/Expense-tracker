const { BadRequest } = require('../errors')
const addMember = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const { userId, role = 'member' } = req.body
    if (!userId) {
      throw new BadRequest('userId es requerido')
    }
    const groupMemberService = req.app.getService('groupMember')
    // Verificar si ya es miembro
    const existing = await groupMemberService.find({ query: { groupId, userId } })
    if (existing.data.length > 0) {
      throw new BadRequest('El usuario ya es miembro del grupo')
    }
    const member = await groupMemberService.create({ groupId, userId, role })
    res.status(201).json(member)
  } catch (error) {
    next(error)
  }
}

const getMembers = async (req, res, next) => {
  try {
    const { groupId } = req.params
    const groupMemberService = req.app.getService('groupMember')
    const members = await groupMemberService.find({ query: { groupId } })
    res.json(members)
  } catch (error) {
    next(error)
  }
}

module.exports = { addMember, getMembers }
