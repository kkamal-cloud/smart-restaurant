const Bill = require('../models/Bill');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const CustomerSession = require('../models/CustomerSession');
const calculateBill = require('../utils/billCalculator');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createBillSchema } = require('../validations/billValidation');
const { getIo } = require('../sockets/socketSetup');

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

    const bill = await Bill.create({
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
        populate: { path: 'table', select: 'tableNumber' }
      })
      .sort('-createdAt');
    sendSuccess(res, bills);
  } catch (err) {
    next(err);
  }
};
