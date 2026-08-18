const Bill = require('../models/Bill');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const RestaurantTable = require('../models/RestaurantTable');
const { sendSuccess } = require('../utils/responseFormatter');
const mongoose = require('mongoose');

exports.getSales = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { isPaid: true };
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Bill.aggregate([
      { $match: match },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$grandTotal" },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    sendSuccess(res, sales);
  } catch (err) {
    next(err);
  }
};

exports.getTopItems = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const topItems = await OrderItem.aggregate([
      { $match: match },
      { $group: {
          _id: "$food",
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: { $multiply: ["$quantity", "$priceAtOrderTime"] } }
      }},
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'foods', localField: '_id', foreignField: '_id', as: 'food' } },
      { $unwind: "$food" },
      { $project: { _id: 0, foodName: "$food.name", totalQuantity: 1, totalRevenue: 1 } }
    ]);

    sendSuccess(res, topItems);
  } catch (err) {
    next(err);
  }
};

exports.getOrderStats = async (req, res, next) => {
  try {
     const { startDate, endDate } = req.query;
     const match = {};
     if (startDate && endDate) {
       match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
     }

     const stats = await Order.aggregate([
       { $match: match },
       { $group: {
           _id: null,
           totalOrders: { $sum: 1 },
       }}
     ]);

     const hourStats = await Order.aggregate([
       { $match: match },
       { $group: {
           _id: { $hour: "$createdAt" },
           count: { $sum: 1 }
       }},
       { $sort: { count: -1 } }
     ]);

     sendSuccess(res, {
       totalOrders: stats[0]?.totalOrders || 0,
       peakHours: hourStats
     });
  } catch (err) {
    next(err);
  }
};

exports.getPaymentStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Payment.aggregate([
      { $match: match },
      { $group: {
          _id: "$method",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 }
      }}
    ]);

    const statusStats = await Payment.aggregate([
       { $match: match },
       { $group: {
           _id: "$status",
           count: { $sum: 1 }
       }}
    ]);

    sendSuccess(res, { byMethod: stats, byStatus: statusStats });
  } catch (err) {
    next(err);
  }
};

exports.getFeedbackStats = async (req, res, next) => {
   try {
    const { startDate, endDate } = req.query;
    const match = {};
    if (startDate && endDate) {
      match.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const stats = await Feedback.aggregate([
      { $match: match },
      { $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalFeedback: { $sum: 1 }
      }}
    ]);

    const distribution = await Feedback.aggregate([
      { $match: match },
      { $group: {
          _id: "$rating",
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    sendSuccess(res, {
      avgRating: stats[0]?.avgRating || 0,
      totalFeedback: stats[0]?.totalFeedback || 0,
      distribution
    });
   } catch (err) {
     next(err);
   }
};

exports.getDashboardStats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Today's Orders Count
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    // Pending Orders Count
    const pendingOrdersCount = await Order.countDocuments({ status: 'pending' });

    // Today's Revenue (grandTotal of paid bills created today)
    const revenueResult = await Bill.aggregate([
      {
        $match: {
          isPaid: true,
          createdAt: { $gte: startOfToday, $lte: endOfToday }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' }
        }
      }
    ]);
    const todayRevenue = revenueResult[0]?.totalRevenue || 0;

    // Available Tables Count
    const availableTablesCount = await RestaurantTable.countDocuments({ isAvailable: true });

    sendSuccess(res, {
      todayOrders: todayOrdersCount,
      pendingOrders: pendingOrdersCount,
      todayRevenue,
      availableTables: availableTablesCount
    });
  } catch (err) {
    next(err);
  }
};
