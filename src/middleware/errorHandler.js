const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Duplicate value' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
};

module.exports = { errorHandler };