export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    error.message = 'Resource not found';
    return res.status(404).json({ success: false, message: error.message });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    return res.status(400).json({ success: false, message: error.message });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = messages.join(', ');
    return res.status(400).json({ success: false, message: error.message });
  }

  if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongooseError' ||
    error.message?.includes('buffering timed out')
  ) {
    return res.status(503).json({
      success: false,
      message: 'Database is not connected. Start MongoDB and try again.'
    });
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error'
  });
};
