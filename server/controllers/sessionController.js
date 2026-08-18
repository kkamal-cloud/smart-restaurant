const crypto = require('crypto');
const CustomerSession = require('../models/CustomerSession');
const Customer = require('../models/Customer');
const RestaurantTable = require('../models/RestaurantTable');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { createSessionSchema } = require('../validations/sessionValidation');
const { getIo } = require('../sockets/socketSetup');

exports.createOrJoinSession = async (req, res, next) => {
  try {
    const { error } = createSessionSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const { tableId, joinToken, customerName, phone } = req.body;
    
    const table = await RestaurantTable.findById(tableId);
    if (!table) return sendError(res, 'NOT_FOUND', 'Table not found', 404);

    let session;
    let customer;

    // Check if table has an active session
    const activeSession = await CustomerSession.findOne({ table: tableId, status: 'active' });

    if (activeSession) {
      if (joinToken && activeSession.joinToken === joinToken) {
        // Friend joins existing session (shared bill)
        customer = await Customer.create({ name: customerName, phone, session: activeSession._id });
        activeSession.customerIds.push(customer._id);
        await activeSession.save();
        session = activeSession;
      } else {
        // Strangers at the same table (separate bill) -> create new session
        session = await CustomerSession.create({
          table: tableId,
          joinToken: crypto.randomBytes(8).toString('hex'),
        });
        customer = await Customer.create({ name: customerName, phone, session: session._id });
        session.customerIds.push(customer._id);
        await session.save();
      }
    } else {
      // Create new session
      session = await CustomerSession.create({
        table: tableId,
        joinToken: crypto.randomBytes(8).toString('hex'),
      });
      customer = await Customer.create({ name: customerName, phone, session: session._id });
      session.customerIds.push(customer._id);
      await session.save();
      
      table.isAvailable = false;
      await table.save();
    }

    const io = getIo();
    io.emit('session:created', { tableId: table._id, sessionId: session._id });

    sendSuccess(res, {
      sessionId: session._id,
      joinToken: session.joinToken,
      customer: { id: customer._id, name: customer.name }
    }, 201);

  } catch (err) {
    next(err);
  }
};

exports.getSessionDetails = async (req, res, next) => {
  try {
    const sessionId = req.params.id || (req.session && req.session._id);
    if (!sessionId) {
      return sendError(res, 'BAD_REQUEST', 'Session ID not found', 400);
    }
    const session = await CustomerSession.findById(sessionId).populate('customerIds').populate('table');
    if (!session) {
      return sendError(res, 'NOT_FOUND', 'Session not found', 404);
    }
    sendSuccess(res, session);
  } catch (err) {
    next(err);
  }
};

exports.joinSessionWithToken = async (req, res, next) => {
   try {
    const { customerName, phone } = req.body;
    if (!customerName) return sendError(res, 'VALIDATION_ERROR', 'Customer name is required');
    
    const session = req.session;
    if (!session) {
      return sendError(res, 'AUTH_FAILED', 'No active session found', 401);
    }

    const customer = await Customer.create({ name: customerName, phone, session: session._id });
    session.customerIds.push(customer._id);
    await session.save();
    
    sendSuccess(res, {
      sessionId: session._id,
      joinToken: session.joinToken,
      customer: { id: customer._id, name: customer.name }
    });
   } catch (err) {
    next(err);
   }
};

exports.closeSession = async (req, res, next) => {
  try {
    const session = await CustomerSession.findById(req.params.id);
    if (!session) return sendError(res, 'NOT_FOUND', 'Session not found', 404);

    session.status = 'closed';
    await session.save();
    sendSuccess(res, { message: 'Session closed successfully' });
  } catch (err) {
    next(err);
  }
};
