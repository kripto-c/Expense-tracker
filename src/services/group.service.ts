import BaseService from './base.service';
import prisma from '../prisma';
import validate from '../hooks/validate';
import { assignCreator, checkOwnership } from '../hooks/authorize';
import { addCreatorAsMember } from '../hooks/group.hook';
import { POST, PATCH } from '../schemas/group.schema';
import populateMany from '../hooks/populateMany';

/**
 * Servicio de grupos
 * Maneja operaciones CRUD para grupos de gastos compartidos
 * Incluye populate de miembros después de find/get
 */
class GroupService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.group as any, 'groups', app);

    // Hook after find:populateMany para incluir miembros del grupo
    this.after(
      'find',
      populateMany({
        service: 'groupMember',
        name: 'members',
        parentField: 'id',
        childField: 'groupId',
        query: { $select: ['userId', 'role', 'groupId'] },
        populate: {
          service: 'user',
          field: 'userData',
          foreignKey: 'userId',
          query: { $select: ['id', 'name', 'email'] },
        },
      }),
    );

    // Hook after get:populateMany para incluir miembros del grupo
    this.after(
      'get',
      populateMany({
        service: 'groupMember',
        name: 'members',
        parentField: 'id',
        childField: 'groupId',
        query: { $select: ['userId', 'role', 'groupId'] },
        populate: {
          service: 'user',
          field: 'userData',
          foreignKey: 'userId',
          query: { $select: ['id', 'name', 'email'] },
        },
      }),
    );

    // Hooks para create: validación + asignar creador como miembro
    this.before('create', validate(POST), assignCreator('userId'));
    this.after('create', addCreatorAsMember);

    // Hooks para patch: validación + verificar propiedad
    this.before('patch', validate(PATCH), checkOwnership('userId'));

    // Hooks para remove: verificar propiedad
    this.before('remove', checkOwnership('userId'));
  }
}

export default (app: unknown) => new GroupService(app);