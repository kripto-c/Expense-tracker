/**
 * Interfaz para configuración de populate anidado
 */
interface NestedPopulate {
  service: string;
  field: string;
  foreignKey: string;
  query?: Record<string, unknown>;
}

/**
 * Interfaz para esquema de populateMany
 */
interface PopulateManySchema {
  service: string;
  name: string;
  parentField: string;
  childField: string;
  query?: Record<string, unknown>;
  populate?: NestedPopulate;
}

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Hook para popular relaciones uno a muchos (ej. un grupo con sus miembros).
 * Soporta también poblado anidado (ej. popular cada miembro con su usuario).
 * @param schema - Esquema de configuración
 * @returns Función de hook que-popula las relaciones
 */
const populateMany = (schema: PopulateManySchema) => {
  const { service: serviceName, name, parentField, childField, query = {}, populate: nestedPopulate } = schema;

  return async (context: HookContext): Promise<HookContext> => {
    if (!context.result) return context;

    // No ejecutar para llamadas internas (sin provider)
    if (context.params?.provider === undefined) {
      return context;
    }

    // Determinar si es un array o un solo elemento
    const isArray = Array.isArray(context.result.data);
    const items = isArray ? context.result.data : [context.result];

    // Extraer IDs padre para consulta agrupada
    const parentIds = items
      .map((item: Record<string, unknown>) => item[parentField] as string)
      .filter((id: string) => id);
    if (parentIds.length === 0) return context;

    // Obtener todos los registros relacionados en una consulta
    const targetService = context.app.getService(serviceName);
    const filter = { [childField]: { in: parentIds } };
    const relatedResult = await targetService.find({ query: { ...filter, ...query } });

    // Agrupar los resultados por ID padre
    const grouped: Record<string, unknown[]> = {};
    for (const item of relatedResult.data) {
      const parentId = item[childField] as string;
      if (!grouped[parentId]) grouped[parentId] = [];
      grouped[parentId].push(item);
    }

    // Si hay poblado anidado, procesarlo
    if (nestedPopulate) {
      const { service: nestedServiceName, field, foreignKey, query: nestedQuery = {} } = nestedPopulate;
      const nestedService = context.app.getService(nestedServiceName);

      // Recoger todos los IDs a poblar (por ej. userId de cada groupMember)
      const allMembers = Object.values(grouped).flat();
      const foreignIds = allMembers.map((m: Record<string, unknown>) => m[foreignKey] as string).filter((id) => id);

      if (foreignIds.length) {
        const nestedFilter = { id: { in: foreignIds } };
        const nestedResult = await nestedService.find({ query: { ...nestedFilter, ...nestedQuery } });

        // Crear mapa de id -> objeto
        const nestedMap: Record<string, unknown> = {};
        for (const nestedItem of nestedResult.data) {
          nestedMap[nestedItem.id as string] = nestedItem;
        }

        // Añadir el objeto poblado a cada miembro
        for (const member of allMembers) {
          (member as Record<string, unknown>)[field] = nestedMap[(member as Record<string, unknown>)[foreignKey] as string] || null;
        }
      }
    }

    // Adjuntar los arrays a los elementos originales
    for (const item of items) {
      const parentId = (item as Record<string, unknown>)[parentField] as string;
      (item as Record<string, unknown>)[name] = grouped[parentId] || [];
    }

    if (isArray) context.result.data = items;
    else context.result = items[0];

    return context;
  };
};

export default populateMany;