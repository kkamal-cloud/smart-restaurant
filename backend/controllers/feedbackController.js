const Feedback = require('../models/Feedback');
const Customer = require('../models/Customer');
const { sendSuccess, sendError } = require('../utils/responseFormatter');
const { submitFeedbackSchema } = require('../validations/feedbackValidation');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { error } = submitFeedbackSchema.validate(req.body);
    if (error) return sendError(res, 'VALIDATION_ERROR', error.details[0].message);

    const session = req.session;
    if (!session) return sendError(res, 'AUTH_FAILED', 'Session required', 401);

    // Assume we need to know WHICH customer in the session is submitting.
    // For simplicity, we can just pick the last customer added or require customerId.
    // Spec: "session token, one per customer per session".
    // Let's require customerId in body or header if multiple, or just check if any customer in session has submitted.
    // I'll take the first customer in session for this example if not provided.
    const customerId = req.body.customerId || session.customerIds[session.customerIds.length - 1];

    const existingFeedback = await Feedback.findOne({ session: session._id, customer: customerId });
    if (existingFeedback) {
      return sendError(res, 'BAD_REQUEST', 'Feedback already submitted for this customer in this session', 400);
    }

    const feedback = await Feedback.create({
      session: session._id,
      customer: customerId,
      rating: req.body.rating,
      comment: req.body.comment
    });

    sendSuccess(res, feedback, 201);
  } catch (err) {
    next(err);
  }
};

exports.getFeedback = async (req, res, next) => {
  try {
    const { rating } = req.query;
    const filter = rating ? { rating: Number(rating) } : {};
    
    const feedback = await Feedback.find(filter).populate('session').populate('customer').sort('-createdAt');
    sendSuccess(res, feedback);
  } catch (err) {
    next(err);
  }
};
