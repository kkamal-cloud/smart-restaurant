const Joi = require('joi');

const createSessionSchema = Joi.object({
  tableId: Joi.string().required(),
<<<<<<< HEAD
  joinToken: Joi.string().optional(),
  customerName: Joi.string().required(),
  phone: Joi.string().optional(),
});
=======
  joinToken: Joi.string().optional().allow('', null),
  joinPin: Joi.string().optional().allow('', null),
  action: Joi.string().optional().allow('', null),
  customerName: Joi.string().required(),
  phone: Joi.string().optional().allow('', null),
}).unknown(true);
>>>>>>> 137886e9e2ab69827772f95310f4e215a0be8995

module.exports = {
  createSessionSchema,
};
