const CustomerSession = require('../models/CustomerSession');
const RestaurantTable = require('../models/RestaurantTable');

/**
 * Updates table availability based on active customer sessions.
 * If at least ONE active customer session exists for a table -> isAvailable = false (OCCUPIED).
 * Only when NO active customer sessions remain -> isAvailable = true (AVAILABLE).
 * 
 * @param {string|ObjectId} tableId - ID of the table to check & update
 * @param {ClientSession|null} sessionDb - Optional Mongoose transaction session
 * @returns {Promise<Document|null>} - Updated RestaurantTable document
 */
const syncTableAvailability = async (tableId, sessionDb = null) => {
  let activeSessionQuery = CustomerSession.findOne({ table: tableId, status: 'active' });
  if (sessionDb) activeSessionQuery = activeSessionQuery.session(sessionDb);
  const activeSession = await activeSessionQuery;

  let tableQuery = RestaurantTable.findById(tableId);
  if (sessionDb) tableQuery = tableQuery.session(sessionDb);
  const table = await tableQuery;

  if (table) {
    table.isAvailable = !activeSession;
    await table.save({ session: sessionDb || undefined });
  }
  return table;
};

module.exports = {
  syncTableAvailability
};
