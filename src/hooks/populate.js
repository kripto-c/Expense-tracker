const populate = (schema) => {
  const { include } = schema

  return async (context) => {
    if (!context.result) return context

    if (context.params.provider === undefined) {
      return context
    }

    const isArray = Array.isArray(context.result.data)
    const items = isArray ? context.result.data : [context.result]

    for (const item of items) {
      for (const rel of include) {
        const { service: serviceName, name, parentField, childField = 'id', query = {} } = rel
        const service = context.app.getService(serviceName)
        const parentId = item[parentField]
        if (!parentId) continue

        // Usamos find para poder aplicar $select y otros operadores
        const relatedResult = await service.find({
          query: {
            [childField]: parentId,
            ...query,
          },
        })
        const related = relatedResult.data[0] || null
        item[name] = related
      }
    }

    if (isArray) context.result.data = items
    else context.result = items[0]

    return context
  }
}

module.exports = populate
