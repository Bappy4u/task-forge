// utils/AppError.ts

export class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    // e.g., 400 = 'fail', 500 = 'error'
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true; // Helps differentiate trusted operational errors from bugs

    Error.captureStackTrace(this, this.constructor);
  }
}
