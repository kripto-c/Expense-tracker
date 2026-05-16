/**
 * Tipos para el sistema de servicios
 */

/**
 * Tipo de método del servicio
 */
export type ServiceMethod = 'find' | 'get' | 'create' | 'patch' | 'update' | 'remove';

/**
 * Tipo de acción para permisos
 */
export type ActionType = 'create' | 'read' | 'update' | 'delete';

/**
 * Interfaz para parámetros de consulta
 */
export interface QueryParams {
  query?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Interfaz para la respuesta paginada del método find
 */
export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  limit?: number;
  skip?: number;
}

/**
 * Interfaz genérica para el modelo de Prisma
 */
export interface PrismaModel {
  findMany: (options?: Record<string, unknown>) => Promise<unknown[]>;
  findUnique: (options: Record<string, unknown>) => Promise<unknown>;
  create: (options: Record<string, unknown>) => Promise<unknown>;
  update: (options: Record<string, unknown>) => Promise<unknown>;
  patch: (options: Record<string, unknown>) => Promise<unknown>;
  delete: (options: Record<string, unknown>) => Promise<unknown>;
  count: (options?: Record<string, unknown>) => Promise<number>;
}

/**
 * Interfaz para el contexto de los hooks
 */
export interface HookContext {
  method: string;
  params: QueryParams;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  service: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _permissions?: Record<string, unknown>;
  error?: Error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  originalContext?: any;
}

/**
 * Tipo para función de hook
 */
export type HookFunction = (context: HookContext) => Promise<HookContext>;