const mongoose = require('mongoose');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Stock = require('../models/Stock');
const Food = require('../models/Food');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createOrderSchema } = require('../validations/orderValidation');
const { getIo } = require('../sockets/socketSetup');

exports.createOrder = async (req, res, next) => {
  const useTransaction = mongoose.connection.isReplicaSet;
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { error } = createOrderSchema.validate(req.body);
    if (error) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'VALIDATION_ERROR', error.details[0].message);
    }

    const { sessionId, items, specialInstructions } = req.body;

    const isStaff = req.user && ['admin', 'waiter', 'kitchen'].includes(req.user.role);
    if (!isStaff && (!req.session || req.session._id.toString() !== sessionId)) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'FORBIDDEN', 'Session mismatch', 403);
    }

    const newOrder = await Order.create([{ session: sessionId, specialInstructions }], { session: session || undefined });

    for (const item of items) {
      let foodQuery = Food.findById(item.foodId);
      if (session) foodQuery = foodQuery.session(session);
      const food = await foodQuery;
      
      if (!food || !food.isAvailable) {
        throw new Error(`Food ${item.foodId} is not available`);
      }

      // Atomic stock decrement
      const stock = await Stock.findOneAndUpdate(
        { food: item.foodId, quantity: { $gte: item.quantity } },
        { $inc: { quantity: -item.quantity } },
        { returnDocument: 'after', session: session || undefined }
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
      }], { session: session || undefined });
    }

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

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
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
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
  const useTransaction = mongoose.connection.isReplicaSet;
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    let orderQuery = Order.findById(req.params.id);
    if (session) orderQuery = orderQuery.session(session);
    const order = await orderQuery;
    
    if (!order) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'NOT_FOUND', 'Order not found', 404);
    }

    if (order.status !== 'pending') {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return sendError(res, 'BAD_REQUEST', 'Only pending orders can be cancelled', 400);
    }

    if (req.session && req.session._id.toString() !== order.session.toString()) {
       if (session) {
         await session.abortTransaction();
         session.endSession();
       }
       return sendError(res, 'FORBIDDEN', 'Not authorized to cancel this order', 403);
    }

    order.status = 'cancelled';
    
    let itemsQuery = OrderItem.find({ order: order._id });
    if (session) itemsQuery = itemsQuery.session(session);
    const items = await itemsQuery;
    
    for (const item of items) {
       await Stock.findOneAndUpdate(
         { food: item.food },
         { $inc: { quantity: item.quantity } },
         { session: session || undefined }
       );
    }

    await Order.findByIdAndDelete(order._id, { session: session || undefined });
    await OrderItem.deleteMany({ order: order._id }, { session: session || undefined });
    
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    sendSuccess(res, { message: 'Order cancelled and stock restored' });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    next(err);
  }
};
