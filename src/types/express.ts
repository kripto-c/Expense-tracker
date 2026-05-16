/**
 * Extensiones de tipos de Express para la aplicación
 */

import { CurrentUser } from './context';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AppServiceAny extends Record<string, any> {
  find: (params: unknown) => Promise<unknown>;
  get: (id: string, params?: unknown) => Promise<unknown>;
  create: (data: unknown, params?: unknown) => Promise<unknown>;
  patch: (id: string, data: unknown, params?: unknown) => Promise<unknown>;
  remove: (id: string, params?: unknown) => Promise<unknown>;
}

export interface AppServices {
  [key: string]: AppServiceAny;
}

declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser | null;
      provider?: string;
      services?: AppServices;
    }

    interface Application {
      services: Map<string, AppServiceAny>;
      registerService: (name: string, service: AppServiceAny) => AppServiceAny;
      getService: (name: string) => AppServiceAny;
    }
  }
}

export {};