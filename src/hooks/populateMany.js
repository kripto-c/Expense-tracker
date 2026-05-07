/**
 * Hook para popular relaciones uno a muchos (ej. un grupo con sus miembros).
 * Soporta también poblado anidado (ej. popular cada miembro con su usuario).
 * Configuración:
 * {
 *   service: 'groupMember',
 *   name: 'members',
 *   parentField: 'id',
 *   childField: 'groupId',
 *   query: { $select: ['userId', 'role', 'groupId'] },
 *   populate: {                     // opcional: segundo nivel
 *     service: 'user',
 *     field: 'user',                // campo donde se añadirá el usuario
 *     foreignKey: 'userId',         // campo en groupMember que contiene el id del usuario
 *     query: { $select: ['id', 'name', 'email'] }
 *   }
 * }
 */
const populateMany = (schema) => {
  const { service: serviceName, name, parentField, childField, query = {}, populate: nestedPopulate } = schema

  return async (context) => {
    if (!context.result) return context

    if (context.params.provider === undefined) {
      return context
    }

    const isArray = Array.isArray(context.result.data)
    const items = isArray ? context.result.data : [context.result]

    const parentIds = items.map((item) => item[parentField]).filter((id) => id)
    if (parentIds.length === 0) return context

    const targetService = context.app.getService(serviceName)
    const filter = { [childField]: { in: parentIds } }
    const relatedResult = await targetService.find({ query: { ...filter, ...query } })

    // Agrupar los resultados
    const grouped = {}
    for (const item of relatedResult.data) {
      const parentId = item[childField]
      if (!grouped[parentId]) grouped[parentId] = []
      grouped[parentId].push(item)
    }

    // Si hay poblado anidado, procesarlo
    if (nestedPopulate) {
      const { service: nestedServiceName, field, foreignKey, query: nestedQuery = {} } = nestedPopulate
      const nestedService = context.app.getService(nestedServiceName)

      // Recoger todos los IDs a poblar (por ej. userId de cada groupMember)
      const allMembers = Object.values(grouped).flat()
      const foreignIds = allMembers.map((m) => m[foreignKey]).filter((id) => id)
      if (foreignIds.length) {
        const nestedFilter = { id: { in: foreignIds } }
        const nestedResult = await nestedService.find({ query: { ...nestedFilter, ...nestedQuery } })

        // Crear mapa de id -> objeto
        const nestedMap = {}
        for (const nestedItem of nestedResult.data) {
          nestedMap[nestedItem.id] = nestedItem
        }

        // Añadir el objeto poblado a cada miembro
        for (const member of allMembers) {
          member[field] = nestedMap[member[foreignKey]] || null
        }
      }
    }

    // Adjuntar los arrays a los elementos originales
    for (const item of items) {
      const parentId = item[parentField]
      item[name] = grouped[parentId] || []
    }

    if (isArray) context.result.data = items
    else context.result = items[0]

    return context
  }
}

module.exports = populateMany
