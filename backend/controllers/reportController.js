const Bill = require('../models/Bill');
const OrderItem = require('../models/OrderItem');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const RestaurantTable = require('../models/RestaurantTable');
const Expense = require('../models/Expense');
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

// --- New Reports & Profit Analytics Methods ---

const getDateRange = (query) => {
  const { startDate, endDate, period } = query;
  const now = new Date();
  let start, end;

  if (period === 'today' || (!startDate && !endDate && !period)) {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (startDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(now);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }
  return { start, end };
};

exports.getReportSummary = async (req, res, next) => {
  try {
    const { start, end } = getDateRange(req.query);

    // 1. Total Sales & Total Bills from Paid Bills
    const summaryAggr = await Bill.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: start, $lte: end } } },
      { $group: {
          _id: null,
          totalSales: { $sum: "$subtotal" },
          grandTotalRevenue: { $sum: "$grandTotal" },
          totalBills: { $sum: 1 }
      }}
    ]);

    const totalSales = summaryAggr[0]?.totalSales || 0;
    const grandTotalRevenue = summaryAggr[0]?.grandTotalRevenue || 0;
    const totalBills = summaryAggr[0]?.totalBills || 0;

    // 2. Food-wise Cost & Quantity Aggregation
    const foodAggr = await Bill.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.foodName",
          quantitySold: { $sum: "$items.quantity" },
          totalSales: { $sum: "$items.total" }
      }},
      { $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: 'name',
          as: 'foodDoc'
      }},
      { $unwind: { path: "$foodDoc", preserveNullAndEmptyArrays: true } },
      { $project: {
          foodName: "$_id",
          quantitySold: 1,
          totalSales: 1,
          costPrice: { $ifNull: ["$foodDoc.costPrice", 0] },
          totalCost: { $multiply: ["$quantitySold", { $ifNull: ["$foodDoc.costPrice", 0] }] },
          profit: { $subtract: ["$totalSales", { $multiply: ["$quantitySold", { $ifNull: ["$foodDoc.costPrice", 0] }] }] }
      }},
      { $sort: { profit: -1 } }
    ]);

    let totalFoodCost = 0;
    let mostProfitableFood = null;
    let bestSellingFood = null;

    if (foodAggr.length > 0) {
      totalFoodCost = foodAggr.reduce((sum, item) => sum + item.totalCost, 0);
      mostProfitableFood = foodAggr[0];
      
      const byQty = [...foodAggr].sort((a, b) => b.quantitySold - a.quantitySold);
      bestSellingFood = byQty[0];
    }

    const foodProfit = totalSales - totalFoodCost;

    // 3. Total Expenses
    const expenses = await Expense.aggregate([
      { $match: { date: { $gte: start, $lte: end } } },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
    ]);
    const totalExpenses = expenses[0]?.totalExpenses || 0;

    // 4. Net Profit
    const netProfit = totalSales - totalFoodCost - totalExpenses;

    sendSuccess(res, {
      dateRange: { start, end },
      totalSales,
      grandTotalRevenue,
      totalFoodCost,
      foodProfit,
      totalExpenses,
      netProfit,
      totalBills,
      bestSellingFood,
      mostProfitableFood
    });
  } catch (err) {
    next(err);
  }
};

exports.getFoodWiseReport = async (req, res, next) => {
  try {
    const { start, end } = getDateRange(req.query);

    const foodWise = await Bill.aggregate([
      { $match: { isPaid: true, createdAt: { $gte: start, $lte: end } } },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.foodName",
          quantitySold: { $sum: "$items.quantity" },
          totalSales: { $sum: "$items.total" },
          avgSellingPrice: { $avg: "$items.price" },
          lastSellingPrice: { $last: "$items.price" }
      }},
      { $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: 'name',
          as: 'foodDoc'
      }},
      { $unwind: { path: "$foodDoc", preserveNullAndEmptyArrays: true } },
      { $project: {
          foodName: "$_id",
          quantitySold: 1,
          sellingPrice: { $ifNull: ["$lastSellingPrice", "$avgSellingPrice"] },
          costPrice: { $ifNull: ["$foodDoc.costPrice", 0] },
          totalSales: 1,
          totalCost: { $multiply: ["$quantitySold", { $ifNull: ["$foodDoc.costPrice", 0] }] },
          profit: { $subtract: ["$totalSales", { $multiply: ["$quantitySold", { $ifNull: ["$foodDoc.costPrice", 0] }] }] }
      }},
      { $sort: { totalSales: -1 } }
    ]);

    sendSuccess(res, foodWise);
  } catch (err) {
    next(err);
  }
};

exports.getDailyReport = async (req, res, next) => {
  req.query.period = 'today';
  return exports.getReportSummary(req, res, next);
};

exports.getMonthlyReport = async (req, res, next) => {
  req.query.period = 'month';
  return exports.getReportSummary(req, res, next);
};

// --- Expense Management ---

exports.getExpenses = async (req, res, next) => {
  try {
    const { start, end } = getDateRange(req.query);
    const expenses = await Expense.find({ date: { $gte: start, $lte: end } }).sort({ date: -1, createdAt: -1 });
    sendSuccess(res, expenses);
  } catch (err) {
    next(err);
  }
};

exports.createExpense = async (req, res, next) => {
  try {
    const { title, amount, date, category } = req.body;
    if (!title || amount === undefined) {
      return sendError(res, 'VALIDATION_ERROR', 'Title and amount are required', 400);
    }
    const expense = await Expense.create({ title, amount, date, category });
    sendSuccess(res, expense, 201);
  } catch (err) {
    next(err);
  }
};

exports.updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after', runValidators: true });
    if (!expense) return sendError(res, 'NOT_FOUND', 'Expense not found', 404);
    sendSuccess(res, expense);
  } catch (err) {
    next(err);
  }
};


exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return sendError(res, 'NOT_FOUND', 'Expense not found', 404);
    sendSuccess(res, { message: 'Expense deleted successfully' });
  } catch (err) {
    next(err);
  }
};
