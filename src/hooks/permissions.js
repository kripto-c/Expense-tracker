const prisma = require('../prisma')
const { Forbidden, NotAuthenticated } = require('../errors')

async function getUserPermissions(userId) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  })
  // Combinar permisos de múltiples roles (si un usuario tiene varios)
  const combined = new Map() // key: subject → Set de actions
  for (const ur of userRoles) {
    const perms = ur.role.permissions || []
    for (const item of perms) {
      const actions = item.actions || []
      const subjects = item.subject || []
      for (const subject of subjects) {
        if (!combined.has(subject)) combined.set(subject, new Set())
        const actionSet = combined.get(subject)
        for (const action of actions) {
          actionSet.add(action)
        }
      }
    }
  }
  // Convertir a objeto plano { subject: [actions] }
  const result = {}
  for (const [subject, actionSet] of combined.entries()) {
    result[subject] = Array.from(actionSet)
  }
  return result
}

function hasPermission(perms, action, subject) {
  // Permiso comodín 'all' con 'manage'
  if (perms.all && perms.all.includes('manage')) return true
  const subjectPerms = perms[subject]
  if (!subjectPerms) return false
  return subjectPerms.includes(action) || subjectPerms.includes('manage')
}

function checkPermission(action, subject) {
  return async (context) => {
    // Permitir acceso sin permisos para llamadas internas (sin provider)
    if (context.params.provider === undefined) {
      return context
    }
    //  Accedemos directamente a context.user.userId
    const userId = context.user?.userId
    if (!userId) throw new NotAuthenticated('No autenticado')

    //  Cache en el propio contexto (no en params)
    if (!context._permissions) {
      context._permissions = await getUserPermissions(userId)
    }

    if (!hasPermission(context._permissions, action, subject)) {
      throw new Forbidden(`Permiso denegado: se requiere ${action} sobre ${subject}`)
    }
    return context
  }
}

module.exports = { checkPermission }
