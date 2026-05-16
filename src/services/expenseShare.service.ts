import BaseService from './base.service';
import prisma from '../prisma';

/**
 * Servicio de participación en gastos
 * Maneja las partes de cada gasto que corresponde a cada usuario
 * Servicio interno (sin permisos) - usado por expense.hook para crear shares automáticamente
 */
class ExpenseShareService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.expenseShare as any, '', [], app);
  }
}

export default (app: unknown) => new ExpenseShareService(app);