const nodemailer = require('nodemailer');

/**
 * Dynamically evaluate email environment settings on each invocation
 */
function getEmailConfig() {
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  return {
    useEthereal: process.env.USE_ETHEREAL === 'true',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: smtpPort,
    smtpSecure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
    smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER || 'placement@adithya.edu.in',
    smtpPass: process.env.SMTP_PASS || process.env.GMAIL_PASS || '',
    emailFrom: process.env.EMAIL_FROM || process.env.SMTP_FROM || 'placement@adithya.edu.in',

    // Google OAuth2 Credentials
    oauthClientId: process.env.OAUTH_CLIENT_ID,
    oauthClientSecret: process.env.OAUTH_CLIENT_SECRET,
    oauthRefreshToken: process.env.OAUTH_REFRESH_TOKEN,
    oauthAccessToken: process.env.OAUTH_ACCESS_TOKEN
  };
}

function hasValidOAuth(config) {
  return !!(
    config.oauthClientId &&
    config.oauthClientSecret &&
    config.oauthRefreshToken &&
    !config.oauthClientId.includes('your_oauth') &&
    !config.oauthClientSecret.includes('your_oauth') &&
    !config.oauthRefreshToken.includes('your_oauth')
  );
}

function hasValidSmtpPass(config) {
  return !!(
    config.smtpUser &&
    config.smtpPass &&
    !config.smtpPass.includes('your_app_password')
  );
}

async function createTransporter(type, config) {
  if (type === 'oauth2') {
    const authObj = {
      type: 'OAuth2',
      user: config.smtpUser,
      clientId: config.oauthClientId,
      clientSecret: config.oauthClientSecret,
      refreshToken: config.oauthRefreshToken
    };
    if (config.oauthAccessToken) {
      authObj.accessToken = config.oauthAccessToken;
    }
    return nodemailer.createTransport({
      service: 'gmail',
      auth: authObj,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  if (type === 'smtp') {
    const isGmail = config.smtpHost.includes('gmail') || config.smtpUser.includes('@gmail.com');
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
    } else {
      return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });
    }
  }

  if (type === 'ethereal') {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
  }

  return null;
}

/**
 * Send an email via Nodemailer for REAL email delivery
 */
async function sendMailViaNodemailer(mailPayload) {
  const config = getEmailConfig();
  const recipient = mailPayload.to;
  const subject = mailPayload.subject || 'Placement Notification';
  const fromAddress = mailPayload.from || `"Adithya Placement Cell" <${config.emailFrom}>`;

  const candidateTransports = [];

  // 1. If App Password is configured, try SMTP first
  if (hasValidSmtpPass(config)) {
    candidateTransports.push('smtp');
  }

  // 2. If OAuth2 credentials configured, try OAuth2
  if (hasValidOAuth(config)) {
    candidateTransports.push('oauth2');
  }

  // 3. If explicitly configured for Ethereal testing
  if (config.useEthereal) {
    candidateTransports.push('ethereal');
  }

  // If no credentials configured at all and Ethereal not forced, default to ethereal for dev
  if (candidateTransports.length === 0) {
    candidateTransports.push('ethereal');
  }

  let lastError = null;
  const attempted = [];

  for (const transportType of candidateTransports) {
    attempted.push(transportType);
    try {
      console.log(`📧 Dispatching REAL email to ${recipient} via [${transportType.toUpperCase()}]...`);
      const transporter = await createTransporter(transportType, config);
      if (!transporter) continue;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject: subject,
        text: mailPayload.text,
        html: mailPayload.html,
        attachments: mailPayload.attachments || []
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      if (previewUrl) {
        console.log(`✉️ [Ethereal Delivered] To: ${recipient} | MessageID: ${info.messageId}`);
        console.log(`🔗 Preview Email Online: ${previewUrl}`);
      } else {
        console.log(`✅ [REAL EMAIL SENT via ${transportType.toUpperCase()}] Delivered to ${recipient}. MessageID: ${info.messageId}`);
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
        isEthereal: !!previewUrl || transportType === 'ethereal',
        transport: transportType
      };
    } catch (err) {
      lastError = err;
      console.error(`❌ [${transportType.toUpperCase()} Real Delivery Failed] ${err.code || err.name}: ${err.message}`);
    }
  }

  // If real email credentials (OAuth or App Password) were provided, DO NOT fallback to simulated/ethereal!
  // Return explicit failure so the user knows real email sending failed and why.
  const isRealConfigured = hasValidSmtpPass(config) || hasValidOAuth(config);

  if (isRealConfigured && !config.useEthereal) {
    const errorMsg = lastError ? lastError.message : 'Authentication or network failure with email provider';
    let hint = 'Please check your Google OAuth Refresh Token or set a 16-character Gmail App Password (SMTP_PASS) in .env.';
    if (errorMsg.includes('unauthorized_client') || errorMsg.includes('EAUTH')) {
      hint = 'Google OAuth token expired or unauthorized. Either refresh OAUTH_REFRESH_TOKEN via OAuth Playground OR set SMTP_PASS=<your_gmail_app_password> in .env.';
    }

    return {
      success: false,
      error: `Real email delivery failed via ${attempted.join('/')}: ${errorMsg}`,
      code: lastError?.code || 'EAUTH',
      hint: hint,
      transport: attempted.join('/')
    };
  }

  // Only fallback to Ethereal if no real credentials were set at all
  try {
    console.log('🔄 Attempting fallback to Ethereal Test Account...');
    const etherealTransporter = await createTransporter('ethereal', config);
    if (etherealTransporter) {
      const info = await etherealTransporter.sendMail({
        from: fromAddress,
        to: recipient,
        subject: subject,
        text: mailPayload.text,
        html: mailPayload.html,
        attachments: mailPayload.attachments || []
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: previewUrl || null,
        isEthereal: true,
        transport: 'ethereal-fallback'
      };
    }
  } catch (e) {
    console.error('⚠️ Ethereal fallback failed:', e.message);
  }

  return {
    success: false,
    error: lastError ? lastError.message : 'Failed to send email via available transports',
    code: lastError?.code || 'EEMAILFAILED'
  };
}

/**
 * Dispatch placement drive recruitment invitation email to a single student
 */
async function sendPlacementDriveEmail({ student, company, registrationFormUrl, pdfDataUrl, fromEmail }) {
  if (!student) {
    return { success: false, error: 'Student details missing' };
  }

  const config = getEmailConfig();

  let recipientEmail = (
    student.email ||
    student.studentEmail ||
    student.contactEmail ||
    student.emailId ||
    (student.registerNumber ? `${student.registerNumber.toString().trim().toLowerCase()}@adithya.edu.in` : null) ||
    (student.id ? `student_${student.id}@adithya.edu.in` : null) ||
    'student@adithya.edu.in'
  );

  if (!recipientEmail || !recipientEmail.includes('@')) {
    recipientEmail = 'student@adithya.edu.in';
  }

  const companyName = company?.name || 'Recruitment Drive';
  const jobRole = company?.jobRole || 'Graduate Engineer Trainee';
  const salaryPackage = company?.salaryPackage || 'Competitive CTC';
  const deadline = company?.applicationDeadline || 'As scheduled';
  const venue = company?.driveVenue || company?.location || 'Campus';
  const sender = fromEmail || config.emailFrom;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Recruitment Invitation - ${companyName}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; tracking: 1px; color: #60a5fa; margin-bottom: 8px;">Adithya Institute of Technology - Training & Placement Cell</div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Official Recruitment Drive Announcement</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;">Invitation for Shortlisted / Eligible Candidates</p>
        </div>

        <!-- Content Body -->
        <div style="padding: 30px;">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>${student.name || 'Student'}</strong> (${student.registerNumber || ''}),</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            We are pleased to inform you that based on your academic profile and readiness score, you have been shortlisted for the upcoming placement recruitment drive with <strong>${companyName}</strong>.
          </p>

          <!-- Drive Details Box -->
          <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #0f172a;">${companyName} - Drive Specifications</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 140px;">Designation:</td>
                <td style="padding: 6px 0;">${jobRole}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Package (CTC):</td>
                <td style="padding: 6px 0; color: #059669; font-weight: bold;">${salaryPackage}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Drive Venue:</td>
                <td style="padding: 6px 0;">${venue}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">Application Deadline:</td>
                <td style="padding: 6px 0; color: #dc2626; font-weight: bold;">${deadline}</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Please complete your application and registration by clicking the button below. Your response will automatically sync with the Placement Cell office.
          </p>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationFormUrl || '#'}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);">
              Complete Registration & Apply Now &rarr;
            </a>
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${registrationFormUrl || '#'}" style="color: #2563eb; word-break: break-all;">${registrationFormUrl || '#'}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px 0;">

          <!-- Footer -->
          <div style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
            This is an automated notification from the <strong>Training & Placement Cell</strong>.<br>
            Adithya Institute of Technology &bull; Placement Readiness Analyzer Portal
          </div>
        </div>

      </div>
    </body>
    </html>
  `;

  const attachments = [];
  if (pdfDataUrl && typeof pdfDataUrl === 'string' && pdfDataUrl.includes('base64,')) {
    try {
      const base64Data = pdfDataUrl.split('base64,')[1];
      if (base64Data) {
        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const safeCompanyName = (companyName || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
        attachments.push({
          filename: `${safeCompanyName}_Drive_Circular.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
      }
    } catch (e) {
      console.error('Failed to parse PDF data URL for attachment:', e);
    }
  }

  const mailPayload = {
    from: `"Adithya Placement Cell" <${sender}>`,
    to: recipientEmail.trim(),
    subject: `[Placement Drive] Recruitment Invitation for ${companyName} - ${jobRole}`,
    html: htmlContent,
    attachments
  };

  return await sendMailViaNodemailer(mailPayload);
}

/**
 * Send a test email to verify Nodemailer setup
 */
async function sendTestEmail(targetEmail) {
  const config = getEmailConfig();
  const mailPayload = {
    from: `"Adithya Placement Cell" <${config.emailFrom}>`,
    to: targetEmail,
    subject: 'Nodemailer Email Integration Test - Placement Readiness Portal',
    html: `<div style="font-family: Arial, sans-serif; padding: 20px; background: #e0f2fe; border-radius: 12px; color: #0369a1;">
      <h2>Nodemailer Email Integration Test</h2>
      <p>This test email confirms that your Nodemailer configuration is functional.</p>
      <p>Timestamp: <strong>${new Date().toLocaleString()}</strong></p>
    </div>`
  };

  return await sendMailViaNodemailer(mailPayload);
}

module.exports = {
  sendMailViaNodemailer,
  sendPlacementDriveEmail,
  sendTestEmail
};
