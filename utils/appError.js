const dotenv = require("dotenv");
dotenv.config();

const lang = process.env.LOCALE || 'en';
const { RESPONSE_CODES, ENTITIES } = require(`./lang/${lang}.js`);

class AppError extends Error {
  
  constructor(status, errorCode, variables, data) {
    super();
    const message = this.generateErrorMessage(errorCode, variables);

    this.status = status;
    this.message = message;
    this.data = data;

  }

  generateErrorMessage(errorCode, variables) {
    let error = RESPONSE_CODES[errorCode] || "";

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`:${key}`, "g");
        const entityValue = ENTITIES[value] || "";

        error = error.replace(regex, entityValue);
      }
    }

    return error;
  }
}

module.exports = AppError;
