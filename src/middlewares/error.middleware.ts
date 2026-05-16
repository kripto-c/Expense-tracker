import { Request, Response, NextFunction } from 'express';
import { ErrorList } from '../errors';

/**
 * Interfaz para errores de Prisma
 */
interface PrismaError {
  code?: string;
  meta?: {
    driverAdapterError?: {
      cause?: {
        constraint?: {
          fields?: string[];
        };
      };
    };
    target?: string[];
  };
}

/**
 * Interfaz para errores de Joi
 */
interface JoiError {
  isJoi: boolean;
  details: Array<{ message: string }>;
}

/**
 * Middleware de manejo de errores
 * Convierte diferentes tipos de errores en respuestas JSON consistentes
 */
function errorHandler(
  err: Error | ErrorList | PrismaError | JoiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let status: number;
  let name: string;
  let message: string;
  let className: string;
  let data: Record<string, unknown> = {};

  // 1. Mapear errores de Prisma (violación de restricción única)
  if ((err as PrismaError).code === 'P2002') {
    status = 409;
    name = 'Conflict';
    let fields: string[] = [];

    // Para Prisma 7+ (estructura anidada)
    if ((err as PrismaError).meta?.driverAdapterError?.cause?.constraint?.fields) {
      fields = (err as PrismaError).meta.driverAdapterError.cause.constraint.fields;
    }
    // Fallback para versiones anteriores
    else if ((err as PrismaError).meta?.target) {
      fields = (err as PrismaError).meta.target as string[];
    }

    const fieldName = fields.join(', ') || 'campo desconocido';
    message = `El campo ${fieldName} esta duplicado`;
    className = 'conflict';
    data = { fields };
  }
  // 2. Mapear errores de validación de Joi
  else if ((err as JoiError).isJoi) {
    status = 422;
    name = 'ValidationError';
    message = 'Validation failed';
    className = 'validation-error';
    data = { errors: (err as JoiError).details.map((d) => d.message) };
  }
  // 3. Si ya es un ErrorList personalizado, tomar sus propiedades
  else if (err instanceof ErrorList) {
    status = err.code;
    name = err.name;
    message = err.message;
    className = err.className;
    data = err.data || {};
  }
  // 4. Error genérico (por defecto)
  else {
    status = (err as Error & { status?: number }).status || 500;
    name = (err as Error).name || 'Error';
    message = (err as Error).message || 'Internal Server Error';
    className = (err as Error & { className?: string }).className || 'unknown';
    data = (err as Error & { data?: Record<string, unknown> }).data || {};
  }

  // Crear el error ErrorList si no lo era
  if (!(err instanceof ErrorList)) {
    err = new ErrorList(message, name, status, className, data);
  }

  // Log del error
  console.error(`[${(err as ErrorList).name}] ${(err as ErrorList).message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error((err as Error).stack);
  }

  // Responder con formato JSON consistente
  res.status(status).json({
    name: (err as ErrorList).name,
    message: (err as ErrorList).message,
    code: (err as ErrorList).code,
    className: (err as ErrorList).className,
    errors: (err as ErrorList).data.errors || {},
    ...(process.env.NODE_ENV !== 'production' && { stack: (err as Error).stack }),
  });
}

export { errorHandler };