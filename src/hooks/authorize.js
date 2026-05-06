// Asigna automáticamente el userId del usuario autenticado (ahora desde context.user)
const assignCreator =
  (field = 'userId') =>
  async (ctx) => {
    const userId = ctx.user?.userId
    if (!userId) throw new Error('Usuario no autenticado')
    ctx.data[field] = userId
    return ctx
  }

// Verifica que el usuario autenticado sea el propietario del registro
const checkOwnership =
  (field = 'userId') =>
  async (ctx) => {
    const userId = ctx.user?.userId
    if (!userId) throw new Error('Usuario no autenticado')
    const record = await ctx.service.model.findUnique({ where: { id: ctx.id } })
    if (!record) throw new Error('Registro no encontrado')
    if (record[field] !== userId) {
      throw new Error('No tienes permiso para modificar este recurso')
    }
    return ctx
  }

module.exports = { assignCreator, checkOwnership }
