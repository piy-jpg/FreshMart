module.exports = function errorMiddleware(err, req, res, next) {
  console.error('[FreshMart API Error]:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
};
