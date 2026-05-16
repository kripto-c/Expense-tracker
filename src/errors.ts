import { AppErrorData } from './types';

/**
 * Clase base para errores personalizados de la aplicación
 */
class ErrorList extends Error {
  name: string;
  code: number;
  className: string;
  data: AppErrorData;

  constructor(message: string, name: string, code: number, className: string, data: AppErrorData = {}) {
    super(message);
    this.name = name;
    this.code = code;
    this.className = className;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotAuthenticated extends ErrorList {
  constructor(message = 'Not authenticated') {
    super(message, 'NotAuthenticated', 401, 'not-authenticated');
  }
}

class BadRequest extends ErrorList {
  constructor(message = 'Bad request', data: AppErrorData = {}) {
    super(message, 'BadRequest', 400, 'bad-request', data);
  }
}

class NotFound extends ErrorList {
  constructor(message = 'Not found') {
    super(message, 'NotFound', 404, 'not-found');
  }
}

class Forbidden extends ErrorList {
  constructor(message = 'Forbidden') {
    super(message, 'Forbidden', 403, 'forbidden');
  }
}

class Conflict extends ErrorList {
  constructor(message = 'Conflict', data: AppErrorData = {}) {
    super(message, 'Conflict', 409, 'conflict', data);
  }
}

class ValidationError extends ErrorList {
  constructor(message = 'Validation failed', errors: AppErrorData = {}) {
    super(message, 'ValidationError', 422, 'validation-error', { errors });
  }
}

export {
  ErrorList,
  NotAuthenticated,
  BadRequest,
  NotFound,
  Forbidden,
  Conflict,
  ValidationError,
};