import BaseService from './base.service';
import prisma from '../prisma';
import validate from '../hooks/validate';
import { POST, PATCH } from '../schemas/roles.schema';

/**
 * Servicio de roles
 * Maneja operaciones CRUD para roles del sistema
 * Los roles definen permisos para usuarios (sistema RBAC)
 */
class RolesService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.role as any, 'roles', app);

    // Hooks para create: validación de datos
    this.before('create', validate(POST));

    // Hooks para patch: validación de datos
    this.before('patch', validate(PATCH));
  }
}

export default (app: unknown) => new RolesService(app);