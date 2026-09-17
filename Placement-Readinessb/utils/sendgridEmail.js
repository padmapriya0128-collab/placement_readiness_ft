const nodemailerEmail = require('./nodemailerEmail');

module.exports = {
  sendMailViaSendGrid: nodemailerEmail.sendMailViaNodemailer,
  sendPlacementDriveEmail: nodemailerEmail.sendPlacementDriveEmail,
  sendTestEmail: nodemailerEmail.sendTestEmail
};

