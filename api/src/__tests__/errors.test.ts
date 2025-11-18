import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  formatErrorResponse,
} from '../utils/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with status code and message', () => {
      const error = new AppError(400, 'Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Bad request');
      expect(error.name).toBe('AppError');
    });

    it('should include details when provided', () => {
      const error = new AppError(400, 'Validation failed', { field: 'email' });
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with 400 status', () => {
      const error = new ValidationError('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('AuthenticationError', () => {
    it('should create auth error with 401 status', () => {
      const error = new AuthenticationError();
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Authentication required');
    });

    it('should accept custom message', () => {
      const error = new AuthenticationError('Invalid API key');
      expect(error.message).toBe('Invalid API key');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = new NotFoundError('Project');
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Project not found');
    });
  });
});

describe('formatErrorResponse', () => {
  it('should format AppError correctly', () => {
    const error = new ValidationError('Invalid input', [{ field: 'email' }]);
    const response = formatErrorResponse(error);

    expect(response).toEqual({
      error: {
        message: 'Invalid input',
        code: 'ValidationError',
        details: [{ field: 'email' }],
      },
    });
  });

  it('should format generic error', () => {
    const error = new Error('Something went wrong');
    const response = formatErrorResponse(error);

    expect(response).toEqual({
      error: {
        message: 'Internal server error',
        code: 'InternalError',
      },
    });
  });
});
