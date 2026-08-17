import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { isProduction } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'File is too large (max 25MB per file).',
  LIMIT_FILE_COUNT: 'Too many files in one upload (max 5).',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload.',
};

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    err = ApiError.badRequest(MULTER_MESSAGES[err.code] ?? 'File upload failed.');
  }

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
