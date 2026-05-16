import Joi from 'joi';

/**
 * Schema para un item de permiso
 */
const permissionItem = Joi.object({
  actions: Joi.array()
    .items(Joi.string().valid('create', 'read', 'update', 'delete', 'manage'))
    .min(1)
    .label('actions')
    .required(),
  subject: Joi.array().items(Joi.string()).min(1).required().label('subject'),
});

/**
 * Schema de validación para crear un rol
 */
const POST = Joi.object({
  name: Joi.string().min(3).max(50).required().label('Nombre del rol'),
  description: Joi.string().max(200).optional().label('Descripción'),
  permissions: Joi.array().items(permissionItem).optional().default([]),
});

/**
 * Schema de validación para actualizar un rol
 */
const PATCH = Joi.object({
  name: Joi.string().min(3).max(50).optional().label('Nombre del rol'),
  description: Joi.string().max(200).optional().label('Descripción'),
  permissions: Joi.array().items(permissionItem).optional().label('Permisos'),
}).min(1);

export { POST, PATCH };