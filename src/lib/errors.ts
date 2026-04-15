export class AppError extends Error {
  statusCode: number;
  details?: any;

  constructor(message: string, statusCode: number = 400, name: string = 'AppError', details?: any) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
    this.details = details;
  }
}
