const Bill = require('../models/Bill');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const CustomerSession = require('../models/CustomerSession');
const calculateBill = require('../utils/billCalculator');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createBillSchema } = require('../validations/billValidation');
const { getIo } = require('../sockets/socketSetup');
const { getNextSequence } = require('../utils/sequenceGenerator');

exports.generateBill = async (req, res, next) => {
  try {
    const { error } = createBillSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { sessionId, taxRate, discount } = req.body;

    const session = await CustomerSession.findById(sessionId);
    if (!session) return sendError(res, 'NOT_FOUND', 'Session not found', 404);
    if (session.status !== 'active') return sendError(res, 'BAD_REQUEST', 'Session is already closed', 400);

    // Get all active, non-cancelled orders for this session
    const servedOrders = await Order.find({ session: sessionId, status: { $ne: 'cancelled' } });
    if (servedOrders.length === 0) {
      return sendError(res, 'BAD_REQUEST', 'No served orders to bill', 400);
    }

    const orderIds = servedOrders.map(o => o._id);

    // Check if these orders are already in an existing bill
    const existingBill = await Bill.findOne({ session: sessionId, orderIds: { $in: orderIds } });
    if (existingBill) {
      return sendError(res, 'BAD_REQUEST', 'One or more orders are already billed', 400);
    }

    const orderItems = await OrderItem.find({ order: { $in: orderIds } }).populate('food', 'name');

    // Aggregate identical foods
    const groupedItems = {};
    orderItems.forEach(item => {
      const foodName = item.food.name;
      if (!groupedItems[foodName]) {
        groupedItems[foodName] = { foodName, quantity: 0, price: item.priceAtOrderTime, total: 0 };
      }
      groupedItems[foodName].quantity += item.quantity;
      groupedItems[foodName].total += (item.quantity * item.priceAtOrderTime);
    });

    const itemsForBill = Object.values(groupedItems);

    // Server-compute totals
    const totals = calculateBill(orderItems, taxRate, discount);

    const billNumber = await getNextSequence('bill');
    const bill = await Bill.create({
      billNumber,
      session: sessionId,
      orderIds,
      items: itemsForBill,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      discount: totals.discount,
      grandTotal: totals.grandTotal,
    });


    // Update session total
    session.totalAmount += totals.grandTotal;
    await session.save();

    const io = getIo();
    io.to(`session:${sessionId}`).emit('bill:generated', bill);

    sendSuccess(res, bill, 201);
  } catch (err) {
    next(err);
  }
};

exports.getBillBySession = async (req, res, next) => {
  try {
    const bills = await Bill.find({ session: req.params.sessionId });
    sendSuccess(res, bills);
  } catch (err) {
    next(err);
  }
};

exports.getBills = async (req, res, next) => {
  try {
    const bills = await Bill.find()
      .populate({
        path: 'session',
        populate: [{ path: 'table', select: 'tableNumber' }, { path: 'customerIds', select: 'name' }]
      })
      .sort('-createdAt');
    sendSuccess(res, bills);
  } catch (err) {
    next(err);
  }
};

exports.finishDining = async (req, res, next) => {
  try {
    const sessionId = req.body.sessionId || (req.session && req.session._id.toString());
    if (!sessionId) {
      return sendError(res, 'VALIDATION_ERROR', 'Session ID is required', 400);
    }

    const session = await CustomerSession.findById(sessionId).populate('table');
    if (!session) return sendError(res, 'NOT_FOUND', 'Session not found', 404);

    // Check if a bill already exists for this session
    const existingBill = await Bill.findOne({ session: sessionId }).populate({
      path: 'session',
      populate: [{ path: 'table', select: 'tableNumber' }, { path: 'customerIds', select: 'name' }]
    });
    if (existingBill) {
      return sendSuccess(res, existingBill);
    }

    if (session.status !== 'active') {
      return sendError(res, 'BAD_REQUEST', 'Session is already closed', 400);
    }

    // Check all orders for this session
    const allOrders = await Order.find({ session: sessionId });
    if (allOrders.length === 0) {
      return sendError(res, 'BAD_REQUEST', 'No orders placed in this session yet.', 400);
    }

    const nonCancelledOrders = allOrders.filter(o => o.status !== 'cancelled');
    if (nonCancelledOrders.length === 0) {
      return sendError(res, 'BAD_REQUEST', 'No active orders found to bill.', 400);
    }

    // Check if any non-cancelled order is still pending, preparing, or ready
    const incompleteOrders = nonCancelledOrders.filter(o => o.status !== 'served');
    if (incompleteOrders.length > 0) {
      return sendError(res, 'BAD_REQUEST', 'You have orders that are still being prepared or served. Please wait until all your orders are served before finishing dining.', 400);
    }

    const orderIds = nonCancelledOrders.map(o => o._id);
    const orderItems = await OrderItem.find({ order: { $in: orderIds } }).populate('food', 'name');

    // Group identical food items
    const groupedItems = {};
    orderItems.forEach(item => {
      const foodName = item.food ? item.food.name : 'Food Item';
      if (!groupedItems[foodName]) {
        groupedItems[foodName] = { foodName, quantity: 0, price: item.priceAtOrderTime, total: 0 };
      }
      groupedItems[foodName].quantity += item.quantity;
      groupedItems[foodName].total += (item.quantity * item.priceAtOrderTime);
    });

    const itemsForBill = Object.values(groupedItems);
    const totals = calculateBill(orderItems, 5, 0);

    const billNumber = await getNextSequence('bill');
    const bill = await Bill.create({
      billNumber,
      session: sessionId,
      orderIds,
      items: itemsForBill,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      discount: totals.discount,
      grandTotal: totals.grandTotal,
      isPaid: false
    });

    session.totalAmount = totals.grandTotal;
    await session.save();

    const populatedBill = await Bill.findById(bill._id).populate({
      path: 'session',
      populate: [{ path: 'table', select: 'tableNumber' }, { path: 'customerIds', select: 'name' }]
    });

    const io = getIo();
    io.to(`session:${sessionId}`).emit('bill:generated', populatedBill);

    sendSuccess(res, populatedBill, 201);
  } catch (err) {
    next(err);
  }
};

