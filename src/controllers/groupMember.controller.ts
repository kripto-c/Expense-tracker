import { Request, Response, NextFunction } from 'express';
import { BadRequest } from '../errors';

/**
 * Controlador de miembros de grupo
 * Maneja la adición y consulta de miembros en grupos
 */

/**
 * Agregar un nuevo miembro a un grupo
 */
export const addMember = (req: Request, res: Response, next: NextFunction): void => {
  const { groupId } = req.params;
  const { userId, role = 'member' } = req.body;

  if (!userId) {
    return next(new BadRequest('userId es requerido'));
  }

  const groupMemberService = req.app.getService('groupMember');

  groupMemberService.find({ query: { groupId, userId } })
    .then((existing: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((existing as any)?.data?.length > 0) {
        throw new BadRequest('El usuario ya es miembro del grupo');
      }
      return groupMemberService.create({ groupId, userId, role });
    })
    .then((member) => res.status(201).json(member))
    .catch(next);
};

/**
 * Obtener todos los miembros de un grupo
 */
export const getMembers = (req: Request, res: Response, next: NextFunction): void => {
  const { groupId } = req.params;
  const groupMemberService = req.app.getService('groupMember');
  groupMemberService.find({ query: { groupId } })
    .then((members) => res.json(members))
    .catch(next);
};