/**
 * Tipos para errores personalizados de la aplicación
 */

export interface AppErrorData {
  [key: string]: unknown;
}

export interface AppError {
  message: string;
  name: string;
  code: number;
  className: string;
  data: AppErrorData;
}