import { Request, Response, NextFunction } from 'express';

/**
 * Controlador de gastos
 * Maneja las operaciones CRUD para gastos en grupos
 */

/**
 * Obtener todos los gastos
 * Soporta filtros y paginación mediante query params
 */
export const find = (req: Request, res: Response, next: NextFunction): void => {
  req.services.expense.find({ user: req.user, query: req.query })
    .then((expenses) => res.json(expenses))
    .catch(next);
};

/**
 * Obtener un gasto específico por ID
 */
export const get = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.expense.get(id, { user: req.user, query: req.query })
    .then((expense) => {
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    })
    .catch(next);
};

/**
 * Crear un nuevo gasto
 */
export const create = (req: Request, res: Response, next: NextFunction): void => {
  req.services.expense.create(req.body, { user: req.user })
    .then((expense) => res.status(201).json(expense))
    .catch(next);
};

/**
 * Actualizar parcialmente un gasto
 */
export const patch = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.expense.patch(id, req.body, { user: req.user })
    .then((expense) => res.json(expense))
    .catch(next);
};

/**
 * Eliminar un gasto
 */
export const remove = (req: Request, res: Response, next: NextFunction): void => {
  const id = req.params.id as string;
  req.services.expense.remove(id, { user: req.user })
    .then(() => res.status(204).send())
    .catch(next);
};