const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();

const transporter = nodemailer.createTransport({
    pool: true,
    host: process.env.ADMIN_EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.SECURE == 'true',
    auth: {
        user: process.env.ADMIN_EMAIL_ADDRESS,
        pass: process.env.ADMIN_EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

exports.sendEmail = (options, successCallback = null, errorCallback = null) => {
    const mailOptions = {
        from: process.env.ADMIN_EMAIL_ADDRESS,
        to: options.to,
        subject: options.subject,
    };

    if (options.attachments) {
        mailOptions['attachments'] = options.attachments;
    }

    if (options.isHtml) {
        mailOptions['html'] = options.body;
    } else {
        mailOptions['text'] = options.body;
    }

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            errorCallback();
        } else {
            successCallback();
        }
    });
};


