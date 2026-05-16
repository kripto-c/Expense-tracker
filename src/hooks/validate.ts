import { Schema } from 'joi';

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Hook de validación usando Joi
 * Valida los datos de entrada según el schema proporcionado
 * @param schema - Schema de Joi para validar los datos
 * @returns Función de hook que valida el contexto
 */
const validate = (schema: Schema) => {
  return async (context: HookContext): Promise<HookContext> => {
    // Aplicamos validación al `context.data` (para create/update) o a `context.params.query` (para find)
    const dataToValidate = context.method === 'find' ? context.params?.query : context.data;

    const { error, value } = schema.validate(dataToValidate, { abortEarly: false });
    if (error) {
      throw new Error(`Validation error: ${error.details.map((d) => d.message).join(', ')}`);
    }

    // Reemplazamos los datos con los validados (por si Joi transformó algo)
    if (context.method === 'find') {
      context.params.query = value;
    } else {
      context.data = value;
    }

    return context;
  };
};

export default validate;