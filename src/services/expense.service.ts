import BaseService from './base.service';
import prisma from '../prisma';
import validate from '../hooks/validate';
import { assignCreator } from '../hooks/authorize';
import { POST, PATCH } from '../schemas/expense.schema';
import { createExpenseShares, restrictToPayer } from '../hooks/expense.hook';
import populate from '../hooks/populate';

/**
 * Servicio de gastos
 * Maneja operaciones CRUD para gastos en grupos
 * Incluye populate de grupo y pagador después de find
 */
class ExpenseService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.expense as any, 'expenses', app);

    // Hook after find:populate para incluir información de grupo y pagador
    this.after(
      'find',
      populate({
        include: [
          {
            service: 'group',
            name: 'group',
            parentField: 'groupId',
            childField: 'id',
            query: { $select: ['id', 'name'] },
          },
          {
            service: 'user',
            name: 'payer',
            parentField: 'paidById',
            childField: 'id',
            query: { $select: ['id', 'email', 'name'] },
          },
        ],
      }),
    );

    // Hooks para create: validación + asignar pagador + crear shares
    this.before('create', validate(POST), assignCreator('paidById'));
    this.after('create', createExpenseShares);

    // Hooks para patch: validación + verificar que solo el pagador puede modificar
    this.before('patch', validate(PATCH), restrictToPayer);

    // Hooks para remove: verificar que solo el pagador puede eliminar
    this.before('remove', restrictToPayer);
  }
}

export default (app: unknown) => new ExpenseService(app);