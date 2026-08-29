const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const CustomerSession = require('../models/CustomerSession');
const RestaurantTable = require('../models/RestaurantTable');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { processPaymentSchema } = require('../validations/paymentValidation');
const { getIo } = require('../sockets/socketSetup');
const mongoose = require('mongoose');

exports.processPayment = async (req, res, next) => {
  const useTransaction = mongoose.connection.isReplicaSet;
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { error } = processPaymentSchema.validate(req.body);
    if (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'VALIDATION_ERROR', error.details[0].message);
    }

    const { billId, amount, method, reference } = req.body;

    let billQuery = Bill.findById(billId);
    if (session) billQuery = billQuery.session(session);
    const bill = await billQuery;
    
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
    }], { session: session || undefined });

    bill.isPaid = true;
    await bill.save({ session: session || undefined });

    let sessionQuery = CustomerSession.findById(bill.session);
    if (session) sessionQuery = sessionQuery.session(session);
    const customerSession = await sessionQuery;
    
    customerSession.status = 'closed';
    await customerSession.save({ session: session || undefined });

    let tableQuery = RestaurantTable.findById(customerSession.table);
    if (session) tableQuery = tableQuery.session(session);
    const table = await tableQuery;
    
    table.isAvailable = true;
    await table.save({ session: session || undefined });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const io = getIo();
    io.to(`session:${customerSession._id}`).emit('session:closed', { message: 'Payment successful, session closed.' });

    sendSuccess(res, payment[0], 201);
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
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
