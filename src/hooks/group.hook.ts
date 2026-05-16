/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Hook que agrega al creador del grupo como miembro automáticamente
 * Se ejecuta después de crear un grupo
 * @param context - Contexto del hook
 * @returns Contexto sin modificaciones
 */
const addCreatorAsMember = async (context: HookContext): Promise<HookContext> => {
  const { id: groupId, userId } = context.result;
  const groupMemberService = context.app.getService('groupMember');

  // Agregar al creador como miembro del grupo con rol 'admin'
  await groupMemberService.create({ groupId, userId, role: 'admin' });
  return context;
};

export { addCreatorAsMember };