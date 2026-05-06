const Joi = require('joi')

const permissionItem = Joi.object({
  actions: Joi.array()
    .items(Joi.string().valid('create', 'read', 'update', 'delete', 'manage'))
    .min(1)
    .label('actions')
    .required(),
  subject: Joi.array().items(Joi.string()).min(1).required().label('subject'),
})

const POST = Joi.object({
  name: Joi.string().min(3).max(50).required().label('Nombre del rol'),
  description: Joi.string().max(200).optional().label('Descripción'),
  permissions: Joi.array().items(permissionItem).optional().default([]),
})

const PATCH = Joi.object({
  name: Joi.string().min(3).max(50).optional().label('Nombre del rol'),
  description: Joi.string().max(200).optional().label('Descripción'),
  permissions: Joi.array().items(permissionItem).optional().label('Permisos'),
}).min(1)

module.exports = { POST, PATCH }
