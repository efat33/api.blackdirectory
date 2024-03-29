const logger = require('../logger');

module.exports = (error, req, res, next) => {
  let { status = 500, message, data } = error;

  // If status code is 500 - change the message to Intrnal server error
  message = status === 500 || !message ? "Internal server error" : message;

  error = {
    type: "error",
    status,
    message,
    ...(data && data),
  };

  logger.error('Error response ' + JSON.stringify(error));

  res.status(status).send(error);
};
