import BaseService from './base.service';
import prisma from '../prisma';

/**
 * Servicio de relación usuario-rol
 * Maneja la asignación de roles a usuarios (sistema RBAC)
 * Servicio interno utilizado por otros servicios
 */
class UserRoleService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.userRole as any, 'userRole', app);
  }
}

export default (app: unknown) => new UserRoleService(app);