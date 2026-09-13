const Counter = require('../models/Counter');

exports.getNextSequence = async (sequenceName, options = {}) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { returnDocument: 'after', upsert: true, ...options }
  );
  return counter.seq;
};

