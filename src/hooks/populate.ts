/**
 * Interfaz para configuración de populate
 */
interface PopulateInclude {
  service: string;
  name: string;
  parentField: string;
  childField?: string;
  query?: Record<string, unknown>;
}

/**
 * Interfaz para esquema de populate
 */
interface PopulateSchema {
  include: PopulateInclude[];
}

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Hook para popular relaciones uno a uno (ej. gasto con grupo, gasto con pagador)
 * @param schema - Esquema de configuración con relaciones a popular
 * @returns Función de hook que-popula las relaciones
 */
const populate = (schema: PopulateSchema) => {
  const { include } = schema;

  return async (context: HookContext): Promise<HookContext> => {
    if (!context.result) return context;

    // No ejecutar para llamadas internas (sin provider)
    if (context.params?.provider === undefined) {
      return context;
    }

    // Determinar si es un array o un solo elemento
    const isArray = Array.isArray(context.result.data);
    const items = isArray ? context.result.data : [context.result];

    // Popular cada relación para cada item
    for (const item of items) {
      for (const rel of include) {
        const { service: serviceName, name, parentField, childField = 'id', query = {} } = rel;
        const service = context.app.getService(serviceName);
        const parentId = item[parentField];
        if (!parentId) continue;

        // Usamos find para poder aplicar $select y otros operadores
        const relatedResult = await service.find({
          query: {
            [childField]: parentId,
            ...query,
          },
        });
        const related = relatedResult.data[0] || null;
        item[name] = related;
      }
    }

    if (isArray) context.result.data = items;
    else context.result = items[0];

    return context;
  };
};

export default populate;