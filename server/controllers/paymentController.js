const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const CustomerSession = require('../models/CustomerSession');
const RestaurantTable = require('../models/RestaurantTable');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { processPaymentSchema } = require('../validations/paymentValidation');
const { getIo } = require('../sockets/socketSetup');
const mongoose = require('mongoose');

exports.processPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error } = processPaymentSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { billId, amount, method, reference } = req.body;

    const bill = await Bill.findById(billId).session(session);
    if (!bill) throw new Error('Bill not found');
    if (bill.isPaid) throw new Error('Bill is already paid');

    if (amount !== bill.grandTotal) {
      throw new Error(`Amount must equal grandTotal (${bill.grandTotal})`);
    }

    const payment = await Payment.create([{
      bill: billId,
      amount,
      method,
      status: 'success',
      reference
    }], { session });

    bill.isPaid = true;
    await bill.save({ session });

    const customerSession = await CustomerSession.findById(bill.session).session(session);
    customerSession.status = 'closed';
    await customerSession.save({ session });

    const table = await RestaurantTable.findById(customerSession.table).session(session);
    table.isAvailable = true;
    await table.save({ session });

    await session.commitTransaction();
    session.endSession();

    const io = getIo();
    io.to(`session:${customerSession._id}`).emit('session:closed', { message: 'Payment successful, session closed.' });

    sendSuccess(res, payment[0], 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    if (err.message.includes('Amount must equal') || err.message === 'Bill not found' || err.message === 'Bill is already paid') {
       return sendError(res, 'BAD_REQUEST', err.message, 400);
    }
    next(err);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { method, status } = req.query;
    const filter = {};
    if (method) filter.method = method;
    if (status) filter.status = status;

    const payments = await Payment.find(filter).populate('bill').sort('-createdAt');
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
};
