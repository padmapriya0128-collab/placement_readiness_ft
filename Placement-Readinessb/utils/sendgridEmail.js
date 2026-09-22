const resendEmail = require('./resendEmail');

module.exports = {
  sendMailViaSendGrid: resendEmail.sendEmail,
  sendPlacementDriveEmail: resendEmail.sendPlacementDriveEmail,
  sendTestEmail: resendEmail.sendTestEmail
};

