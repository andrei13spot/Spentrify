/**
 * Error Handling Middleware
 * 
 * Centralized error handling for the Express application.
 * Provides consistent error responses and prevents information leakage.
 * 
 * Security Considerations:
 * - Hides internal error details in production
 * - Logs errors for debugging without exposing to clients
 * - Prevents stack trace exposure
 */

/**
 * Global error handler middleware
 * Must be used after all routes
 */
function errorHandler(err, req, res, next) {
  // Log error for debugging (server-side only)
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Security: Don't expose internal error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'An internal server error occurred'
    : err.message;

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

/**
 * 404 Not Found handler
 * Must be used after all routes but before error handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`
    }
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};

