import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;

  if (!isApiError) {
    logger.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      path: req.originalUrl,
    });
  } else if (statusCode >= 500) {
    logger.error(err.message, { path: req.originalUrl });
  }

  const body = {
    error: {
      message: isApiError ? err.message : 'Something went wrong. Please try again.',
    },
  };

  if (isApiError && err.details) {
    body.error.details = err.details;
  }

  if (!isProduction && !isApiError) {
    body.error.debug = err.message;
  }

  res.status(statusCode).json(body);
}
