import { Request, Response, NextFunction } from 'express';

/**
 * Controlador de grupos
 * Maneja las operaciones CRUD para grupos de gastos compartidos
 */

/**
 * Obtener todos los grupos
 * Soporta filtros y paginación mediante query params
 */
export const find = (req: Request, res: Response, next: NextFunction): void => {
  req.services.group.find({ query: req.query })
    .then((groups) => res.json(groups))
    .catch(next);
};

/**
 * Obtener un grupo específico por ID
 */
export const get = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.group.get(id, { query: req.query })
    .then((group) => {
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      res.json(group);
    })
    .catch(next);
};

/**
 * Crear un nuevo grupo
 */
export const create = (req: Request, res: Response, next: NextFunction): void => {
  req.services.group.create(req.body)
    .then((group) => res.status(201).json(group))
    .catch(next);
};

/**
 * Actualizar parcialmente un grupo
 */
export const patch = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.group.patch(id, req.body)
    .then((group) => res.json(group))
    .catch(next);
};

/**
 * Eliminar un grupo
 */
export const remove = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.group.remove(id, { user: req.user })
    .then(() => res.status(204).send())
    .catch(next);
};