const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Stock = require('../models/Stock');
const Food = require('../models/Food');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createOrderSchema } = require('../validations/orderValidation');
const { getIo } = require('../sockets/socketSetup');

exports.createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { error } = createOrderSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { sessionId, items, specialInstructions } = req.body;

    const isStaff = req.user && ['admin', 'waiter', 'kitchen'].includes(req.user.role);
    if (!isStaff && (!req.session || req.session._id.toString() !== sessionId)) {
      return sendError(res, 'FORBIDDEN', 'Session mismatch', 403);
    }

    const newOrder = await Order.create([{ session: sessionId, specialInstructions }], { session });

    for (const item of items) {
      const food = await Food.findById(item.foodId).session(session);
      if (!food || !food.isAvailable) {
        throw new Error(`Food ${item.foodId} is not available`);
      }

      // Atomic stock decrement
      const stock = await Stock.findOneAndUpdate(
        { food: item.foodId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { new: true, session }
      );

      if (!stock) {
        throw new Error(`Insufficient stock for food ${food.name}`);
      }

      await OrderItem.create([{
        order: newOrder[0]._id,
        food: item.foodId,
        quantity: item.quantity,
        priceAtOrderTime: food.price,
        specialInstructions: item.specialInstructions
      }], { session });
    }

    await session.commitTransaction();
    session.endSession();

    // Populate and emit to kitchen
    const orderItems = await OrderItem.find({ order: newOrder[0]._id }).populate('food', 'name price');
    const populatedOrder = await Order.findById(newOrder[0]._id)
      .populate({
        path: 'session',
        populate: { path: 'table', select: 'tableNumber' }
      })
      .lean();
    
    const subtotal = orderItems.reduce((sum, item) => sum + item.priceAtOrderTime * item.quantity, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    populatedOrder.items = orderItems;
    populatedOrder.subtotal = subtotal;
    populatedOrder.tax = tax;
    populatedOrder.total = total;
    
    const io = getIo();
    io.to('kitchen').emit('order:new', populatedOrder);

    sendSuccess(res, populatedOrder, 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    if (err.message.includes('Insufficient stock') || err.message.includes('not available')) {
      return sendError(res, 'VALIDATION_ERROR', err.message, 400);
    }
    next(err);
  }
};

exports.getOrdersBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return sendError(res, 'VALIDATION_ERROR', 'sessionId query parameter is required');
    if (req.session && req.session._id.toString() !== sessionId && !req.user) {
        return sendError(res, 'FORBIDDEN', 'Not authorized to view these orders', 403);
    }
    
    const orders = await Order.find({ session: sessionId })
      .populate('statusHistory.changedBy', 'name')
      .populate({
        path: 'session',
        populate: { path: 'table', select: 'tableNumber' }
      });
    const orderItems = await OrderItem.find({ order: { $in: orders.map(o => o._id) } }).populate('food', 'name price');

    const result = orders.map(order => {
      const orderData = order.toObject();
      const items = orderItems.filter(item => item.order.toString() === order._id.toString());
      const subtotal = items.reduce((sum, item) => sum + item.priceAtOrderTime * item.quantity, 0);
      const tax = subtotal * 0.05;
      const total = subtotal + tax;

      orderData.items = items;
      orderData.subtotal = subtotal;
      orderData.tax = tax;
      orderData.total = total;
      return orderData;
    });

    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('statusHistory.changedBy', 'name')
      .populate({
        path: 'session',
        populate: [
          { path: 'table', select: 'tableNumber' },
          { path: 'customerIds', select: 'name phone' }
        ]
      });
      
    if (!order) return sendError(res, 'NOT_FOUND', 'Order not found', 404);

    const items = await OrderItem.find({ order: order._id }).populate('food', 'name price');
    const subtotal = items.reduce((sum, item) => sum + item.priceAtOrderTime * item.quantity, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const orderData = order.toObject();
    orderData.items = items;
    orderData.subtotal = subtotal;
    orderData.tax = tax;
    orderData.total = total;

    sendSuccess(res, orderData);
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);
    if (!order) return sendError(res, 'NOT_FOUND', 'Order not found', 404);

    if (order.status !== 'pending') {
      return sendError(res, 'BAD_REQUEST', 'Only pending orders can be cancelled', 400);
    }

    if (req.session && req.session._id.toString() !== order.session.toString()) {
       return sendError(res, 'FORBIDDEN', 'Not authorized to cancel this order', 403);
    }

    order.status = 'cancelled'; // Or delete it. Let's just remove it or mark cancelled.
    // Spec doesn't explicitly define 'cancelled' state, but asks to restore stock.
    // Let's delete it for simplicity or add a cancelled state if allowed, wait, spec says:
    // "order status is a strict state machine: pending -> preparing -> ready -> served. NO other transitions allowed."
    // Oh, but spec also says: "PATCH /api/orders/:id/cancel (pending only, restore stock)".
    // So we can transition to a special 'cancelled' status or just delete. I will delete the order and items for simplicity or add 'cancelled' state. Let's add it to schema or delete.
    
    const items = await OrderItem.find({ order: order._id }).session(session);
    for (const item of items) {
       await Stock.findOneAndUpdate(
         { food: item.food },
         { $inc: { quantity: item.quantity } },
         { session }
       );
    }

    await Order.findByIdAndDelete(order._id, { session });
    await OrderItem.deleteMany({ order: order._id }, { session });
    
    await session.commitTransaction();
    session.endSession();

    sendSuccess(res, { message: 'Order cancelled and stock restored' });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
