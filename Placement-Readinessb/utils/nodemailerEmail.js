const emailService = require('../services/emailService');

module.exports = {
  sendMailViaNodemailer: emailService.sendLoginVerificationEmail,
  sendEmail: emailService.sendLoginVerificationEmail,
  sendLoginVerificationEmail: emailService.sendLoginVerificationEmail,
  sendForgotPasswordEmail: emailService.sendForgotPasswordEmail,
  sendShortlistEmail: emailService.sendShortlistEmail,
  sendPlacementDriveEmail: emailService.sendShortlistEmail,
  sendTestEmail: emailService.sendTestEmail,
  checkEmailHealth: emailService.checkEmailHealth,
  validateEmailEnvironment: emailService.validateEmailEnvironment,
  maskEmail: emailService.maskEmail
};
