const { ErrorList } = require('../errors')

function errorHandler(err, req, res, next) {
  let status, name, message, className, data

  // 1. Mapear errores de Prisma
  if (err.code === 'P2002') {
    status = 409
    name = 'Conflict'
    message = `El campo ${err.meta?.target?.join(', ')} ya existe`
    className = 'conflict'
    data = { fields: err.meta?.target }
  } else if (err.code === 'P2025') {
    status = 404
    name = 'NotFound'
    message = 'Registro no encontrado'
    className = 'not-found'
    data = {}
  }
  // 2. Mapear errores de Joi
  else if (err.isJoi) {
    status = 422
    name = 'ValidationError'
    message = 'Validation failed'
    className = 'validation-error'
    data = { errors: err.details.map((d) => d.message) }
  }
  // 3. Si ya es un ErrorList, tomar sus propiedades
  else if (err instanceof ErrorList) {
    status = err.code
    name = err.name
    message = err.message
    className = err.className
    data = err.data || {}
  }
  // 4. Error genérico (por defecto)
  else {
    status = err.status || 500
    name = err.name || 'Error'
    message = err.message || 'Internal Server Error'
    className = err.className || 'unknown'
    data = err.data || {}
  }

  // Crear el error ErrorList si no lo era
  if (!(err instanceof ErrorList)) {
    err = new ErrorList(message, name, status, className, data)
  }

  console.error(`[${err.name}] ${err.message}`)
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack)
  }

  res.status(status).json({
    name: err.name,
    message: err.message,
    code: err.code,
    className: err.className,
    errors: err.data.errors || {},
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

module.exports = { errorHandler }
