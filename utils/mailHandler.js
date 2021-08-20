const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();

const mailTemplate = `
<div style="width:100%; margin:0;">
  <table border="0" cellpadding="0" cellspacing="0" height="100%" width="100%">
    <tbody>
      <tr>
        <td align="center" valign="top">
          <table border="0" cellpadding="0" cellspacing="0"
            style="border-radius:0px!important;background-color:#fafafa;border-radius:6px!important;width:100%;max-width:100%">
            <tbody>
              <tr>
                <td align="center" valign="top">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%"
                    style="background-color:#005484;color:#f1f1f1;border-top-left-radius:0px!important;border-top-right-radius:0px!important;border-bottom:0;font-family:Arial;font-weight:bold;line-height:100%;vertical-align:middle">
                    <tbody>
                      <tr>
                        <td>
                          <h1
                            style="color:#f1f1f1;margin:0;padding:28px 24px;display:block;font-family:Arial;font-size:30px;font-weight:bold;text-align:center;line-height:150%">
                            <a style="color:#f1f1f1;text-decoration:none" href="https://www.blackdirectory.co.uk"
                              title="Black Directory" target="_blank"
                              data-saferedirecturl="https://www.google.com/url?q=https://www.blackdirectory.co.uk&amp;source=gmail&amp;ust=1629564381513000&amp;usg=AFQjCNF-Yv05TqCfiShAJgjRLrXXIgGK-g"><img
                                style="max-width:100%"
                                src="https://ci4.googleusercontent.com/proxy/g8ydsk6btECnwbYoYkM5qgnMKUMjPO7Z2zVVp1UMidTA17Ix8Wm1Mk1VQLvCK1nfZdtX5eT4OEMGxg3V1221L28JRCDI9wZJ739bDzdm_YNCTGYb_8IAXwbA2ciS=s0-d-e1-ft#https://blackdirectory.co.uk/wp-content/uploads/2020/09/logo-162x100-1.png"
                                alt="UK's Leading Black Directory"> </a>
                          </h1>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                </td>
              </tr>
              <tr>
                <td align="center" valign="top">

                  <table border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tbody>
                      <tr>
                        <td valign="top" style="background-color:#fafafa">

                          <table border="0" cellpadding="20" cellspacing="0" width="100%">
                            <tbody>
                              <tr>
                                <td valign="top">
                                  <div style="color:#888;font-family:Arial;font-size:14px;line-height:150%;text-align:left">
                                    {{mailBody}}
                                  </div>
                                </td>
                              </tr>
                            </tbody>
                          </table>

                        </td>
                      </tr>
                    </tbody>
                  </table>

                </td>
              </tr>
              <tr>
                <td align="center" valign="top">

                  <table border="0" cellpadding="10" cellspacing="0" width="100%"
                    style="border-top:1px solid #e2e2e2;background:#eee;border-radius:0px 0px 0px 0px">
                    <tbody>
                      <tr>
                        <td valign="top">
                          <table border="0" cellpadding="10" cellspacing="0" width="100%">
                            <tbody>
                              <tr>
                                <td colspan="2" valign="middle"
                                  style="border:0;color:#777;font-family:Arial;font-size:12px;line-height:125%;text-align:center">

                                  ©2021 Black Directory </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>

                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</div>
`;

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

  const body = mailTemplate.replace('{{mailBody}}', options.body);

  mailOptions['html'] = body;

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      errorCallback();
    } else {
      successCallback();
    }
  });
};


