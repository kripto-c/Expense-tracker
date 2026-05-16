import Joi from 'joi';

/**
 * Schema de validación para crear un gasto
 */
const POST = Joi.object({
  description: Joi.string().trim().required().label('Descripción'),
  amount: Joi.number().positive().required().label('Monto'),
  date: Joi.date().required().label('Fecha'),
  groupId: Joi.string().uuid().required().label('ID del grupo'),
});

/**
 * Schema de validación para actualizar un gasto
 */
const PATCH = Joi.object({
  description: Joi.string().trim().label('Descripción'),
  amount: Joi.number().positive().label('Monto'),
  date: Joi.date().label('Fecha'),
}).min(1);

export { POST, PATCH };