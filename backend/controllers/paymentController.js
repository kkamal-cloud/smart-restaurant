const crypto = require('crypto');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const CustomerSession = require('../models/CustomerSession');
const RestaurantTable = require('../models/RestaurantTable');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { processPaymentSchema, createRazorpayOrderSchema, verifyRazorpaySchema } = require('../validations/paymentValidation');
const { getIo } = require('../sockets/socketSetup');
const mongoose = require('mongoose');
const razorpay = require('../utils/razorpay');
const { syncTableAvailability } = require('../utils/tableHelper');


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

    // Check if an existing pending payment exists for this bill
    let payment;
    const existingPayment = await Payment.findOne({ bill: billId, status: 'pending' }).session(session || undefined);
    if (existingPayment) {
      existingPayment.method = method;
      existingPayment.status = 'success';
      existingPayment.reference = reference || existingPayment.reference;
      existingPayment.amount = amount;
      await existingPayment.save({ session: session || undefined });
      payment = existingPayment;
    } else {
      const created = await Payment.create([{
        bill: billId,
        amount,
        method,
        status: 'success',
        reference
      }], { session: session || undefined });
      payment = created[0];
    }

    bill.isPaid = true;
    await bill.save({ session: session || undefined });

    let sessionQuery = CustomerSession.findById(bill.session);
    if (session) sessionQuery = sessionQuery.session(session);
    const customerSession = await sessionQuery;
    
    customerSession.status = 'closed';
    await customerSession.save({ session: session || undefined });

    await syncTableAvailability(customerSession.table, session);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const io = getIo();
    io.to(`session:${customerSession._id}`).emit('session:closed', { message: 'Payment successful, session closed.' });
    io.emit('payment:updated', { billId, status: 'success' });

    sendSuccess(res, payment, 201);
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

exports.selectCounterPayment = async (req, res, next) => {
  try {
    const { billId, method } = req.body;
    if (!billId || !['cash', 'card'].includes(method)) {
      return sendError(res, 'VALIDATION_ERROR', 'Valid billId and method (cash/card) are required', 400);
    }

    const bill = await Bill.findById(billId);
    if (!bill) return sendError(res, 'NOT_FOUND', 'Bill not found', 404);
    if (bill.isPaid) return sendError(res, 'BAD_REQUEST', 'Bill is already paid', 400);

    let payment = await Payment.findOne({ bill: billId });
    if (payment) {
      payment.method = method;
      payment.status = 'pending';
      await payment.save();
    } else {
      payment = await Payment.create({
        bill: billId,
        amount: bill.grandTotal,
        method,
        status: 'pending'
      });
    }

    const io = getIo();
    io.emit('payment:pending', { billId, method, amount: bill.grandTotal });

    sendSuccess(res, {
      payment,
      message: 'Please complete your payment at the counter.'
    });
  } catch (err) {
    next(err);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { method, status } = req.query;
    const filter = {};
    if (method) filter.method = method;
    if (status) filter.status = status;

    const payments = await Payment.find(filter)
      .populate({
        path: 'bill',
        populate: {
          path: 'session',
          populate: { path: 'table', select: 'tableNumber' }
        }
      })
      .sort('-createdAt');
    sendSuccess(res, payments);
  } catch (err) {
    next(err);
  }
};

// ─── Razorpay: Create Order ───────────────────────────────────────────────────
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { error } = createRazorpayOrderSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { billId } = req.body;
    const bill = await Bill.findById(billId);
    if (!bill) return sendError(res, 'NOT_FOUND', 'Bill not found', 404);
    if (bill.isPaid) return sendError(res, 'BAD_REQUEST', 'Bill is already paid', 400);

    // Razorpay amount is in paise (multiply by 100)
    const options = {
      amount: Math.round(bill.grandTotal * 100),
      currency: 'INR',
      receipt: `bill_${bill.billNumber || bill._id.toString().slice(-6)}`,
      notes: {
        billId: bill._id.toString(),
      },
    };

    const order = await razorpay.orders.create(options);
    sendSuccess(res, {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

// ─── Razorpay: Verify Payment & Mark Bill Paid ───────────────────────────────
exports.verifyRazorpayPayment = async (req, res, next) => {
  const useTransaction = mongoose.connection.isReplicaSet;
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { error } = verifyRazorpaySchema.validate(req.body);
    if (error) {
      if (session) { await session.abortTransaction(); session.endSession(); }
      return sendError(res, 'VALIDATION_ERROR', error.details[0].message);
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, billId } = req.body;

    // Cryptographic signature verification
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      if (session) { await session.abortTransaction(); session.endSession(); }
      return sendError(res, 'FORBIDDEN', 'Payment verification failed: invalid signature', 403);
    }

    let billQuery = Bill.findById(billId);
    if (session) billQuery = billQuery.session(session);
    const bill = await billQuery;
    if (!bill) throw new Error('Bill not found');
    if (bill.isPaid) throw new Error('Bill is already paid');

    // Record the payment (update existing or create new)
    let payment;
    const existingPayment = await Payment.findOne({ bill: billId }).session(session || undefined);
    if (existingPayment) {
      existingPayment.method = 'upi';
      existingPayment.status = 'success';
      existingPayment.reference = razorpay_payment_id;
      existingPayment.amount = bill.grandTotal;
      await existingPayment.save({ session: session || undefined });
      payment = existingPayment;
    } else {
      const created = await Payment.create([{
        bill: billId,
        amount: bill.grandTotal,
        method: 'upi',
        status: 'success',
        reference: razorpay_payment_id,
      }], { session: session || undefined });
      payment = created[0];
    }

    bill.isPaid = true;
    await bill.save({ session: session || undefined });

    let sessionQuery = CustomerSession.findById(bill.session);
    if (session) sessionQuery = sessionQuery.session(session);
    const customerSession = await sessionQuery;

    customerSession.status = 'closed';
    await customerSession.save({ session: session || undefined });

    await syncTableAvailability(customerSession.table, session);

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    const io = getIo();
    io.to(`session:${customerSession._id}`).emit('session:closed', { message: 'Payment successful, session closed.' });
    io.emit('payment:updated', { billId, status: 'success' });

    sendSuccess(res, payment, 201);
  } catch (err) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    if (err.message === 'Bill not found' || err.message === 'Bill is already paid') {
      return sendError(res, 'BAD_REQUEST', err.message, 400);
    }
    next(err);
  }
};


