const dotenv = require("dotenv");
dotenv.config();

const lang = process.env.LOCALE || 'en';
const { RESPONSE_CODES, ENTITIES } = require(`./lang/${lang}.js`);

class AppSuccess {

  constructor(res, status, resCode, variables, data) {
    const message = this.generateResponseMessage(resCode, variables);

    this.status = status;
    this.message = message;
    this.data = data;
    
    const response = {
      status,
      message,
      data
    };
    
    res.status(status).send(response);

  }

  generateResponseMessage(message, variables) {
    let res_msg = RESPONSE_CODES[message] || message;

    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`:${key}`, "g");
        const entityValue = ENTITIES[value] || "";

        res_msg = res_msg.replace(regex, entityValue);
      }
    }

    return res_msg;
  }

};

module.exports = AppSuccess;
