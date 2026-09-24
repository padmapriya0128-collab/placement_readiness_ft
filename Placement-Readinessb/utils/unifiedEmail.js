const emailService = require('../services/emailService');

module.exports = {
  sendEmail: emailService.sendLoginVerificationEmail,
  sendVerificationOTPEmail: emailService.sendLoginVerificationEmail,
  sendLoginVerificationEmail: emailService.sendLoginVerificationEmail,
  sendForgotPasswordEmail: emailService.sendForgotPasswordEmail,
  sendShortlistEmail: emailService.sendShortlistEmail,
  sendPlacementDriveEmail: emailService.sendShortlistEmail,
  sendTestEmail: emailService.sendTestEmail,
  checkEmailHealth: emailService.checkEmailHealth,
  validateEmailEnvironment: emailService.validateEmailEnvironment,
  maskEmail: emailService.maskEmail
};
