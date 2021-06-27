const AppError = require("../utils/appError");
const dotenv = require("dotenv");
dotenv.config();

const authKey = () => {
  return async function (req, res, next) {
    
    try {
      const apiKey = req.headers['x-api-key'];

      if (!apiKey || apiKey != process.env.API_KEY) {
        throw new AppError(401, "401_invalidApiKey");
      }
  
      next();
      
    } catch (e) {
      e.status = 401;
      next(e);
    }
  };
};

module.exports = authKey;
