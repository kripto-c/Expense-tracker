import { Request, Response, NextFunction } from 'express';
import { runWithContext } from '../context';

/**
 * Middleware de contexto
 * Inyecta el usuario autenticado en el AsyncLocalStorage
 * Permite usar getCurrentUser() desde cualquier punto del código
 */
function contextMiddleware(req: Request, res: Response, next: NextFunction): void {
  // req.user ya fue establecido por el middleware global de autenticación
  const store = { user: req.user };
  runWithContext(store, () => {
    next();
  });
}

export default contextMiddleware;