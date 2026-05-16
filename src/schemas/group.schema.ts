import Joi from 'joi';

/**
 * Schema de validación para crear un grupo
 */
const POST = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
});

/**
 * Schema de validación para actualizar un grupo
 */
const PATCH = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
});

export { POST, PATCH };