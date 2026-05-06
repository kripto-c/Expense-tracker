const bcrypt = require('bcrypt')
const { NotFound } = require('../errors')
const generateUserName = async (context) => {
  const email = context.data.email
  if (!email) return context
  let base = email
    .split('@')[0]
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase()
  context.data.name = base
  return context
}

const hashPassword = async (context) => {
  if (context.data.password) {
    const salt = await bcrypt.genSalt(10)
    context.data.password = await bcrypt.hash(context.data.password, salt)
  }
  return context
}

const assignDefaultRole = async (context, role = 'user') => {
  // Obtener el servicio de roles y el de userRole desde el contexto
  const roleService = context.app.getService('role')
  const userRoleService = context.app.getService('userRole')

  const defaultRole = await roleService.find({ query: { name: role, $select: ['id'] } })
  if (defaultRole.data.length === 0) {
    throw new NotFound(`Rol por defecto "${role}" no encontrado`, 500)
  }
  const roleId = defaultRole.data[0].id

  await userRoleService.create({
    userId: context.result.id,
    roleId: roleId,
  })

  // agregar rol al resultado
  context.result.roles = [role]
  return context
}

module.exports = { generateUserName, hashPassword, assignDefaultRole }
