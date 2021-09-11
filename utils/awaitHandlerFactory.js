const logger = require("../logger");

const awaitHandlerFactory = (middleware) => {
  return async (req, res, next) => {
    try {
      await middleware(req, res, next);
    } catch (err) {
      console.log("🚀 ~ file: awaitHandlerFactory.js ~ line 6 ~ return ~ err", err);
      logger.error(err);

      next(err);
    }
  };
};

module.exports = awaitHandlerFactory;
