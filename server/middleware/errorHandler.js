export function errorHandler(err, req, res, _next) {
  const status = Number(err.status) || 500;
  console.error(`[error] ${req.method} ${req.path}`, err.stack || err.message);
  // Never echo internal error text or stack traces to clients on 5xx.
  const message = status >= 500 ? 'Internal error' : err.message || 'Request error';
  res.status(status).json({ error: message, status });
}
