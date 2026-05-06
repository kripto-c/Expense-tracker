const Joi = require('joi')

const POST = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
})

const PATCH = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
})

module.exports = {
  POST,
  PATCH,
}
