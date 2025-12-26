class ValidationError extends Error {
  statusCode: number;
  field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
    Error.captureStackTrace(this, this.constructor);
  }
}

class UnauthorizedError extends Error {
  statusCode: number;

  constructor(message: string = 'Unauthorized access') {
    super(message);
    this.name = 'UnauthorizedError';
    this.statusCode = 401;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ForbiddenError extends Error {
  statusCode: number;

  constructor(message: string = 'Access forbidden') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = 403;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends Error {
  statusCode: number;
  resource: string;
  resourceId?: string | number;

  constructor(resource: string, id?: string | number) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`;
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.resource = resource;
    this.resourceId = id;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ConflictError extends Error {
  statusCode: number;
  conflictType: 'duplicate' | 'locked' | 'version';

  constructor(message: string, conflictType?: 'duplicate' | 'locked' | 'version') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.conflictType = conflictType || 'duplicate';
    Error.captureStackTrace(this, this.constructor);
  }
}

class DatabaseError extends Error {
  statusCode: number;
  originalError?: Error;

  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.statusCode = 500;
    this.originalError = originalError;
    if (originalError && originalError.stack) {
      this.stack += '\nOriginal error: ' + originalError.stack;
    }
    Error.captureStackTrace(this, this.constructor);
  }
}

class ExternalServiceError extends Error {
  statusCode: number;
  serviceName: string;

  constructor(serviceName: string, message: string, statusCode?: number) {
    const fullMessage = `${serviceName} error: ${message}`;
    super(fullMessage);
    this.name = 'ExternalServiceError';
    this.statusCode = statusCode || 502;
    this.serviceName = serviceName;
    Error.captureStackTrace(this, this.constructor);
  }
}

export { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, DatabaseError, ExternalServiceError };