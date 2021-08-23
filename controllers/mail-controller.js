const AppError = require("../utils/appError");
const AppSuccess = require("../utils/appSuccess");
const mailHandler = require('../utils/mailHandler.js');

class MailController {
  sendMail = (req, res, next) => {
    if (!req.body.subject || !req.body.body) {
      throw new AppError(403, "403_missingValue");
    }

    const mailOptions = {
      to: req.body.to,
      subject: req.body.subject,
      body: req.body.body,
    }

    if (req.body.attachment) {
      mailOptions['attachments'] = [{
        filename: req.body.attachment,
        path: `uploads/job/${req.body.attachment}`
      }];
    }

    const successCallback = () => {
      new AppSuccess(res, 200, "200_mailSuccess", '');
    }

    const errorCallback = () => {
      throw new AppError(403, "403_unknownError");
    }

    mailHandler.sendEmail(mailOptions, successCallback, errorCallback);
  };
}

module.exports = new MailController();
