import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de proveedor
 * Asigna el tipo de proveedor de la request
 * Se usa para distinguir llamadas externas (REST) de internas
 */
function setProvider(req: Request, _res: Response, next: NextFunction): void {
  // Por ahora solo manejamos REST
  // Si luego agregas Socket.io, puedes detectarlo y asignar otro valor
  req.provider = 'rest';
  next();
}

export default setProvider;