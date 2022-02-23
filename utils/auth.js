const AppError = require("../utils/appError");
const UserModel = require("../models/user-model");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const auth = () => {
  return async function (req, res, next) {
    try {
      // get cookie sent from frontend, and process to get the authentication token
      const rawCookies = req.headers.cookie.split('; ');
      const parsedCookies = {};
      rawCookies.forEach(rawCookie => {
        const parsedCookie = rawCookie.split('=');
        parsedCookies[parsedCookie[0]] = parsedCookie[1];
      });
      
      if(!parsedCookies['BDY-authorization']){
        throw new AppError(401, "401_invalidCredentials");
      }
      
      const authHeader = parsedCookies['BDY-authorization'].replace('%20', ' ');
      const bearer = "Bearer ";

      if (!authHeader || !authHeader.startsWith(bearer)) {
        throw new AppError(401, "401_invalidCredentials");
      }

      const token = authHeader.replace(bearer, "");
      const secretKey = process.env.SECRET_JWT || "";

      // Verify Token
      const decoded = jwt.verify(token, secretKey);
      const user = await UserModel.findOne({ id: decoded.user_id });
      
      if (user.is_deactivated == 1) {
        throw new AppError(401, "401_accountDeactivated");
      }

      // if the user has permissions
      req.currentUser = {
        id: decoded.user_id,
        name: user.display_name,
        email: user.email,
        role: decoded.role,
        forum_role: user.forum_role
      };

      next();
    } catch (e) {
      e.status = 401;
      next(e);
    }
  };
};

module.exports = auth;
