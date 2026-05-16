import BaseService from './base.service';
import prisma from '../prisma';

/**
 * Servicio de miembros de grupo
 * Maneja la relación entre usuarios y grupos
 * Servicio interno (sin permisos) - usado por group.hook y otros servicios
 */
class GroupMemberService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.groupMember as any, '', [], app);
  }
}

export default (app: unknown) => new GroupMemberService(app);