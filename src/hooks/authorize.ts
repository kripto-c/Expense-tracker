import { Forbidden, NotAuthenticated, NotFound } from '../errors';

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Hook que asigna automáticamente el userId del usuario autenticado a un campo
 * Se usa para establecer el creador de un recurso
 * @param field - Nombre del campo donde se asignará el userId (default: 'userId')
 * @returns Función de hook que asigna el creador
 */
const assignCreator = (field = 'userId') => {
  return async (ctx: HookContext): Promise<HookContext> => {
    const userId = ctx.user?.userId;
    if (!userId) throw new NotAuthenticated('Usuario no autenticado');
    ctx.data[field] = userId;
    return ctx;
  };
};

/**
 * Hook que verifica que el usuario autenticado sea el propietario del registro
 * Se usa para proteger recursos que solo el creador puede modificar/eliminar
 * @param field - Nombre del campo que contiene el ID del creador (default: 'userId')
 * @returns Función de hook que verifica propiedad
 */
const checkOwnership = (field = 'userId') => {
  return async (ctx: HookContext): Promise<HookContext> => {
    const userId = ctx.user?.userId;
    if (!userId) throw new NotAuthenticated('Usuario no autenticado');

    const record = await ctx.service.model.findUnique({ where: { id: ctx.id } });
    if (!record) throw new NotFound('Registro no encontrado');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((record as any)[field] !== userId) {
      throw new Forbidden('No tienes permiso para modificar este recurso');
    }
    return ctx;
  };
};

export { assignCreator, checkOwnership };