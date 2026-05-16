import { AsyncLocalStorage } from 'async_hooks';
import { ContextStore, CurrentUser } from './types';

/**
 * Instancia global de AsyncLocalStorage para gestionar el contexto de la petición
 * Permite acceder al usuario desde cualquier punto del código sin pasar argumentos
 */
const asyncLocalStorage = new AsyncLocalStorage<ContextStore>();

/**
 * Ejecuta una función con un contexto específico
 */
export function runWithContext(store: ContextStore, callback: () => unknown): unknown {
  return asyncLocalStorage.run(store, callback);
}

/**
 * Obtiene el usuario actual del contexto asíncrono
 */
export function getCurrentUser(): CurrentUser | null {
  const store = asyncLocalStorage.getStore();
  return store?.user || null;
}

/**
 * Obtiene el contexto completo del store asíncrono
 */
export function getCurrentContext(): ContextStore | undefined {
  return asyncLocalStorage.getStore();
}