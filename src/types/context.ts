/**
 * Tipos para el contexto de autenticación
 */

export interface CurrentUser {
  userId: string;
  email: string;
  roles?: Array<{ name: string; permissions: unknown }>;
}

export interface ContextStore {
  user: CurrentUser | null;
}