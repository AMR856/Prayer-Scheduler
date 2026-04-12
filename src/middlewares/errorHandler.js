const { HttpStatusText } = require("../types/HTTPStatusText");

const errorHandler = (
  err,
  req,
  res,
  next,
) => {
  let statusCode = err.statusCode ?? 500;
  let message = err.message ?? "Internal Server Error";
  let statusText = err.statusText ?? HttpStatusText.ERROR;
  if (err.name === "ZodError") {
    statusCode = 400;
    message = err.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    statusText = HttpStatusText.FAIL;
  }

  res.status(statusCode).json({
    status: statusText,
    message,
  });
};

module.exports = errorHandler;