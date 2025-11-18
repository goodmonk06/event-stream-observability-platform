export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(401, message);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
    this.name = 'ConflictError';
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    details?: any;
  };
}

export function formatErrorResponse(error: Error): ErrorResponse {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        code: error.name,
        details: error.details,
      },
    };
  }

  // Default error response
  return {
    error: {
      message: 'Internal server error',
      code: 'InternalError',
    },
  };
}
