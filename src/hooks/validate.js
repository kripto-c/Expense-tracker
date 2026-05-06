const validate = (schema) => {
  return async (context) => {
    // Aplicamos validación al `context.data` (para create/update) o a `context.params.query` (para find)
    const dataToValidate = context.method === 'find' ? context.params?.query : context.data

    const { error, value } = schema.validate(dataToValidate, { abortEarly: false })
    if (error) {
      throw new Error(`Validation error: ${error.details.map((d) => d.message).join(', ')}`)
    }

    // Reemplazamos los datos con los validados (por si Joi transformó algo)
    if (context.method === 'find') {
      context.params.query = value
    } else {
      context.data = value
    }

    return context
  }
}

module.exports = validate
