export class ErrorHandler extends Error {
  statusCode: number;

  constructor(statusCode = 500, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, ErrorHandler.prototype);
  }
}
