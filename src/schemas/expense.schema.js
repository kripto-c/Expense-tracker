const Joi = require('joi')

const POST = Joi.object({
  description: Joi.string().trim().required().label('Descripción'),
  amount: Joi.number().positive().required().label('Monto'),
  date: Joi.date().required().label('Fecha'),
  groupId: Joi.string().uuid().required().label('ID del grupo'),
})

const PATCH = Joi.object({
  description: Joi.string().trim().label('Descripción'),
  amount: Joi.number().positive().label('Monto'),
  date: Joi.date().label('Fecha'),
}).min(1)

module.exports = {
  POST,
  PATCH,
}
