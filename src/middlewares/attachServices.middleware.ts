import { Request, Response, NextFunction } from 'express';
import app from '../app';

/**
 * Interfaz para los parámetros base que se injectan a cada llamada de servicio
 */
interface BaseParams {
  provider: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
}

/**
 * Middleware que inyecta servicios en el objeto request
 * Crea un proxy que automáticamente añade provider y user a cada llamada de servicio
 */
function attachServices(req: Request, _res: Response, next: NextFunction): void {
  const baseParams: BaseParams = { provider: req.provider, user: req.user };
  req.services = {};

  // Iterar sobre todos los servicios registrados
  for (const [name, service] of app.services.entries()) {
    // Crear un proxy que intercepta las llamadas a los métodos del servicio
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    req.services[name] = new Proxy(service as any, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get(target: any, prop: string) {
        const originalMethod = target[prop];
        // Si no es función, retornar la propiedad directamente
        if (typeof originalMethod !== 'function') return originalMethod;

        // Retornar una función que modifica los parámetros automáticamente
        return function (...args: unknown[]) {
          // Para create: firma (data, params)
          if (prop === 'create') {
            let params = baseParams;
            if (args.length > 1 && typeof args[1] === 'object') {
              params = { ...(args[1] as Record<string, unknown>), ...baseParams };
            }
            return originalMethod.call(target, args[0], params);
          }

          // Para patch: firma (id, data, params) - el data está en args[1], params en args[2]
          if (prop === 'patch') {
            let params = baseParams;
            if (args.length > 2 && typeof args[2] === 'object') {
              params = { ...(args[2] as Record<string, unknown>), ...baseParams };
            }
            return originalMethod.call(target, args[0], args[1], params);
          }

          // Para find: firma (params) → un solo argumento
          if (prop === 'find') {
            const mergedParams = { ...((args[0] as Record<string, unknown>) || {}), ...baseParams };
            return originalMethod.call(target, mergedParams);
          }

          // Para get y remove: firma (id, params)
          if (prop === 'get' || prop === 'remove') {
            let params = baseParams;
            if (args.length > 1 && typeof args[1] === 'object') {
              params = { ...(args[1] as Record<string, unknown>), ...baseParams };
            }
            return originalMethod.call(target, args[0], params);
          }

          // Para otros métodos (si los hay) por defecto
          return originalMethod.call(target, ...args);
        };
      },
    });
  }
  next();
}

export default attachServices;