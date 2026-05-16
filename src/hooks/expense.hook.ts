import { NotAuthenticated, NotFound, Forbidden } from '../errors';

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Interfaz para share de gasto
 */
interface ExpenseShare {
  userId: string;
  amount: number;
  settled: boolean;
}

/**
 * Hook que calcula partes iguales para un gasto
 * Divide el monto total entre todos los miembros del grupo
 * @param context - Contexto del hook
 * @returns Array de shares con usuario, monto y estado de liquidación
 */
const calculateEqualShares = async (context: HookContext): Promise<ExpenseShare[]> => {
  const { groupId, amount } = context.result;
  const groupMemberService = context.app.getService('groupMember');

  const members = await groupMemberService.find({ query: { groupId } });
  if (members.data.length === 0) {
    throw new Error('El grupo no tiene miembros para dividir el gasto');
  }

  const shareAmount = amount / members.data.length;
  return members.data.map((member: { userId: string }) => ({
    userId: member.userId,
    amount: shareAmount,
    settled: false,
  }));
};

/**
 * Hook que crea las participaciones de gasto después de crear un gasto
 * Itera sobre los shares calculados y los persiste en la base de datos
 * @param context - Contexto del hook
 * @returns Contexto con los shares agregados al resultado
 */
const createExpenseShares = async (context: HookContext): Promise<HookContext> => {
  const shares = await calculateEqualShares(context);
  const expenseShareService = context.app.getService('expenseShare');

  // Crear los shares y guardar los objetos creados (con su id)
  const createdShares = [];
  for (const share of shares) {
    const created = await expenseShareService.create({
      expenseId: context.result.id,
      userId: share.userId,
      amount: share.amount,
      settled: share.settled,
    });
    createdShares.push(created);
  }

  // Modificar directamente el resultado para que incluya los shares
  context.result.shares = createdShares;
  return context;
};

/**
 * Hook que verifica que solo el pagador pueda modificar o eliminar un gasto
 * @param context - Contexto del hook
 * @returns Contexto si el usuario es el pagador
 * @throws NotAuthenticated si no hay usuario
 * @throws NotFound si el gasto no existe
 * @throws Forbidden si el usuario no es el pagador
 */
const restrictToPayer = async (context: HookContext): Promise<HookContext> => {
  const userId = context.user?.userId;
  if (!userId) throw new NotAuthenticated('Usuario no autenticado');

  const expenseService = context.app.getService('expense');
  const expense = await expenseService.find({ query: { id: context.id, $select: ['paidById'] } });

  if (!expense || !expense.data[0]) throw new NotFound('Gasto no encontrado');

  if (expense.data[0].paidById !== userId) {
    throw new Forbidden('No tienes permiso para modificar o eliminar este gasto');
  }
  return context;
};

export { createExpenseShares, restrictToPayer };