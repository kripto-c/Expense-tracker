import { Request, Response, NextFunction } from 'express';

/**
 * Controlador de roles
 * Maneja las operaciones CRUD para roles del sistema
 */

/**
 * Obtener todos los roles
 */
export const find = (req: Request, res: Response, next: NextFunction): void => {
  req.services.role.find({ query: req.query })
    .then((roles) => res.json(roles))
    .catch(next);
};

/**
 * Obtener un rol específico por ID
 */
export const get = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.role.get(id)
    .then((role) => {
      if (!role) return res.status(404).json({ error: 'Role not found' });
      res.json(role);
    })
    .catch(next);
};

/**
 * Crear un nuevo rol
 */
export const create = (req: Request, res: Response, next: NextFunction): void => {
  req.services.role.create(req.body)
    .then((role) => res.status(201).json(role))
    .catch(next);
};

/**
 * Actualizar parcialmente un rol
 */
export const patch = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.role.patch(id, req.body)
    .then((role) => res.json(role))
    .catch(next);
};

/**
 * Eliminar un rol
 */
export const remove = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.role.remove(id)
    .then(() => res.status(204).send())
    .catch(next);
};