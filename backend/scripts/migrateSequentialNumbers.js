const Order = require('../models/Order');
const Bill = require('../models/Bill');
const Counter = require('../models/Counter');

const migrateSequentialNumbers = async () => {
  try {
    // 1. Backfill Orders
    const unnumberedOrders = await Order.find({
      $or: [
        { orderNumber: { $exists: false } },
        { orderNumber: null }
      ]
    }).sort({ createdAt: 1 });

    if (unnumberedOrders.length > 0) {
      console.log(`Found ${unnumberedOrders.length} orders needing sequential orderNumber...`);
      
      // Get highest existing orderNumber if any exist
      const highestOrder = await Order.findOne({ orderNumber: { $exists: true, $ne: null } }).sort({ orderNumber: -1 });
      let currentOrderSeq = highestOrder && highestOrder.orderNumber ? highestOrder.orderNumber : 0;

      for (const order of unnumberedOrders) {
        currentOrderSeq += 1;
        order.orderNumber = currentOrderSeq;
        await order.save();
      }
      
      // Update Counter sequence
      await Counter.findOneAndUpdate(
        { _id: 'order' },
        { $set: { seq: currentOrderSeq } },
        { upsert: true }
      );
      console.log(`Order migration completed. Current order sequence set to ${currentOrderSeq}.`);
    } else {
      // Ensure Counter document exists for order
      const existingOrderSeqDoc = await Counter.findById('order');
      if (!existingOrderSeqDoc) {
        const highestOrder = await Order.findOne({ orderNumber: { $exists: true, $ne: null } }).sort({ orderNumber: -1 });
        const maxSeq = highestOrder && highestOrder.orderNumber ? highestOrder.orderNumber : 0;
        await Counter.create({ _id: 'order', seq: maxSeq });
      }
    }

    // 2. Backfill Bills
    const unnumberedBills = await Bill.find({
      $or: [
        { billNumber: { $exists: false } },
        { billNumber: null }
      ]
    }).sort({ createdAt: 1 });

    if (unnumberedBills.length > 0) {
      console.log(`Found ${unnumberedBills.length} bills needing sequential billNumber...`);
      
      const highestBill = await Bill.findOne({ billNumber: { $exists: true, $ne: null } }).sort({ billNumber: -1 });
      let currentBillSeq = highestBill && highestBill.billNumber ? highestBill.billNumber : 0;

      for (const bill of unnumberedBills) {
        currentBillSeq += 1;
        bill.billNumber = currentBillSeq;
        await bill.save();
      }

      await Counter.findOneAndUpdate(
        { _id: 'bill' },
        { $set: { seq: currentBillSeq } },
        { upsert: true }
      );
      console.log(`Bill migration completed. Current bill sequence set to ${currentBillSeq}.`);
    } else {
      // Ensure Counter document exists for bill
      const existingBillSeqDoc = await Counter.findById('bill');
      if (!existingBillSeqDoc) {
        const highestBill = await Bill.findOne({ billNumber: { $exists: true, $ne: null } }).sort({ billNumber: -1 });
        const maxSeq = highestBill && highestBill.billNumber ? highestBill.billNumber : 0;
        await Counter.create({ _id: 'bill', seq: maxSeq });
      }
    }
  } catch (error) {
    console.error('Error during sequential numbers migration:', error.message);
  }
};

module.exports = migrateSequentialNumbers;
