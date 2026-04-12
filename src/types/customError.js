const { HttpStatusText } = require("./HTTPStatusText");

class CustomError extends Error {
  statusCode;
  statusText;
  isJoi;
  constructor(
    message,
    statusCode = 500,
    statusText = HttpStatusText.ERROR,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.statusText = statusText;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = CustomError;