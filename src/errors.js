class ErrorList extends Error {
  constructor(message, name, code, className, data = {}) {
    super(message)
    this.name = name
    this.code = code
    this.className = className
    this.data = data
    Error.captureStackTrace(this, this.constructor)
  }
}

class NotAuthenticated extends ErrorList {
  constructor(message = 'Not authenticated') {
    super(message, 'NotAuthenticated', 401, 'not-authenticated')
  }
}

class BadRequest extends ErrorList {
  constructor(message = 'Bad request', data = {}) {
    super(message, 'BadRequest', 400, 'bad-request', data)
  }
}

class NotFound extends ErrorList {
  constructor(message = 'Not found') {
    super(message, 'NotFound', 404, 'not-found')
  }
}

class Forbidden extends ErrorList {
  constructor(message = 'Forbidden') {
    super(message, 'Forbidden', 403, 'forbidden')
  }
}

class Conflict extends ErrorList {
  constructor(message = 'Conflict', data = {}) {
    super(message, 'Conflict', 409, 'conflict', data)
  }
}

class ValidationError extends ErrorList {
  constructor(message = 'Validation failed', errors = {}) {
    super(message, 'ValidationError', 422, 'validation-error', { errors })
  }
}

module.exports = {
  ErrorList,
  NotAuthenticated,
  BadRequest,
  NotFound,
  Forbidden,
  Conflict,
  ValidationError,
}
