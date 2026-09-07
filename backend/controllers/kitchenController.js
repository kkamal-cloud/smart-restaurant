const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const CustomerSession = require('../models/CustomerSession');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { updateOrderStatusSchema } = require('../validations/kitchenValidation');
const { getIo } = require('../sockets/socketSetup');

exports.getKitchenOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status: status.toLowerCase() } : (status === 'all' ? {} : { status: { $ne: 'served' } });

    const orders = await Order.find(filter)
      .populate({
        path: 'session',
        populate: [
          { path: 'table', select: 'tableNumber' },
          { path: 'customerIds', select: 'name phone' }
        ]
      })
      .sort('createdAt');
      
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

exports.updateOrderStatus = async (req, res, next) => {
  try {
    if (req.body && req.body.status) {
      req.body.status = req.body.status.toLowerCase();
    }
    const { error } = updateOrderStatusSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { status: newStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return sendError(res, 'NOT_FOUND', 'Order not found', 404);

    const validTransitions = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'served'
    };

    if (validTransitions[order.status] !== newStatus) {
      return sendError(res, 'BAD_REQUEST', 'Invalid status transition', 400);
    }

    order.status = newStatus;
    order.statusHistory.push({
      status: newStatus,
      changedBy: req.user._id
    });
    
    await order.save();

    const io = getIo();
    const updatePayload = { orderId: order._id, status: newStatus, order };
    io.to(`session:${order.session}`).emit('order:statusUpdate', updatePayload);
    io.to('kitchen').emit('order:statusUpdate', updatePayload);
    io.to('admin').emit('order:statusUpdate', updatePayload);

    if (newStatus === 'served') {
       io.to(`session:${order.session}`).emit('session:billable', { message: 'Items served, bill can be generated.' });
    }

    sendSuccess(res, order);
  } catch (err) {
    next(err);
  }
};
