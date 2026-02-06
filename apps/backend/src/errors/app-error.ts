export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }

  static conflict(message: string): AppError {
    return new AppError(409, "CONFLICT", message);
  }

  static notFound(message: string): AppError {
    return new AppError(404, "NOT_FOUND", message);
  }

  static unauthorized(message: string): AppError {
    return new AppError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message: string): AppError {
    return new AppError(403, "FORBIDDEN", message);
  }

  static badRequest(message: string): AppError {
    return new AppError(400, "BAD_REQUEST", message);
  }
}
