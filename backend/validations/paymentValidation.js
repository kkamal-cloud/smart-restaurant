const Joi = require('joi');

const processPaymentSchema = Joi.object({
  billId: Joi.string().required(),
  amount: Joi.number().min(0).required(),
  method: Joi.string().valid('cash', 'card', 'upi').required(),
  reference: Joi.string().allow('', null),
});

const createRazorpayOrderSchema = Joi.object({
  billId: Joi.string().required(),
});

const verifyRazorpaySchema = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
  billId: Joi.string().required(),
});

module.exports = {
  processPaymentSchema,
  createRazorpayOrderSchema,
  verifyRazorpaySchema,
};
