export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export const BadRequestError = (message: string, code: string = 'BAD_REQUEST', details?: any) => 
  new ApiError(message, 400, code, details);

export const UnauthorizedError = (message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') => 
  new ApiError(message, 401, code);

export const ForbiddenError = (message: string = 'Forbidden', code: string = 'FORBIDDEN') => 
  new ApiError(message, 403, code);

export const NotFoundError = (message: string = 'Not Found', code: string = 'NOT_FOUND') => 
  new ApiError(message, 404, code);

export const InternalServerError = (message: string = 'Internal Server Error', code: string = 'INTERNAL_ERROR') => 
  new ApiError(message, 500, code);
