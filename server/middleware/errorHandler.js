const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Uploaded file exceeds the 8MB limit.' });
    }
    return res.status(400).json({ message: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(' ') });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: `Invalid identifier for ${err.path}.` });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `Duplicate value for ${field}.` });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    message: err.message || 'Internal server error',
  });
};

module.exports = errorHandler;
