const { Resend } = require('resend');

/**
 * Safely masks email addresses for production diagnostic logs
 * Example: padmapriya0128@gmail.com -> p***8@gmail.com
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return 'unknown';
  const clean = email.trim().toLowerCase();
  const [user, domain] = clean.split('@');
  if (!domain) return 'invalid-email';
  if (user.length <= 2) return `${user[0]}*@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}

/**
 * Helper to get clean Resend sender configuration
 */
function getSenderAddress() {
  const envFrom = (process.env.EMAIL_FROM || '').trim();
  if (!envFrom) {
    return 'Adithya Placement Cell <onboarding@resend.dev>';
  }
  
  const match = envFrom.match(/<([^>]+)>/);
  const emailAddr = match ? match[1].trim() : envFrom;
  
  // Public webmail domains cannot be verified in Resend and will fail with 403
  const publicWebmailDomains = ['@gmail.com', '@yahoo.com', '@outlook.com', '@hotmail.com', '@icloud.com'];
  if (publicWebmailDomains.some(domain => emailAddr.toLowerCase().endsWith(domain))) {
    console.warn(`⚠️ [RESEND NOTICE] EMAIL_FROM is set to '${emailAddr}'. Public webmail domains cannot be verified on Resend and cause 403 API errors. Defaulting sender to 'Adithya Placement Cell <onboarding@resend.dev>'. To use custom sender, verify your domain in resend.com.`);
    return 'Adithya Placement Cell <onboarding@resend.dev>';
  }

  if (envFrom.includes('<') && envFrom.includes('>')) {
    return envFrom;
  }
  return `Adithya Placement Cell <${envFrom}>`;
}

function getResendClient() {
  const apiKey = (process.env.RESEND_API_KEY || process.env.RESEND_KEY || '').trim();
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

/**
 * Validates email environment variables safely at startup without printing secrets
 */
function validateEmailEnvironment() {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const emailFrom = (process.env.EMAIL_FROM || '').trim();
  const frontendUrl = (process.env.FRONTEND_URL || '').trim();

  console.log('==================================================');
  console.log('📧 EMAIL PROVIDER: RESEND');
  console.log(`🔑 RESEND_API_KEY: ${apiKey ? 'CONFIGURED ✅' : 'MISSING ❌ (Emails will not send in production)'}`);
  console.log(`📤 EMAIL_FROM: ${emailFrom ? `CONFIGURED (${maskEmail(emailFrom)}) ✅` : 'DEFAULT (onboarding@resend.dev) ⚠️'}`);
  console.log(`🌐 FRONTEND_URL: ${frontendUrl ? `CONFIGURED (${frontendUrl}) ✅` : 'NOT SET (CORS defaults to all origins) ℹ️'}`);
  console.log('==================================================');
}

/**
 * Safe email health check for diagnostic endpoints
 */
function checkEmailHealth() {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const emailFrom = (process.env.EMAIL_FROM || '').trim();
  const isConfigured = !!(apiKey && apiKey.startsWith('re_'));

  return {
    provider: 'resend',
    configured: isConfigured,
    senderConfigured: !!emailFrom,
    sender: emailFrom ? maskEmail(emailFrom) : 'onboarding@resend.dev (Testing Domain)',
    status: isConfigured ? 'ready' : 'missing_resend_api_key'
  };
}

/**
 * Core Resend Dispatcher with strict error capturing & safe production logging
 */
async function sendViaResend({ feature, to, subject, html, text, attachments }) {
  const cleanRecipient = Array.isArray(to) ? to[0] : to;
  const maskedRecipient = maskEmail(cleanRecipient);

  console.log(`[EMAIL ATTEMPT] feature: ${feature} | recipient: ${maskedRecipient} | provider: RESEND`);

  const resend = getResendClient();
  if (!resend) {
    const errorMsg = 'RESEND_API_KEY is not configured in backend environment variables.';
    console.error(`[EMAIL FAILED] feature: ${feature} | recipient: ${maskedRecipient} | provider: RESEND | error: ${errorMsg}`);
    return {
      success: false,
      error: errorMsg,
      provider: 'resend',
      recipient: cleanRecipient
    };
  }

  const sender = getSenderAddress();
  const recipientList = Array.isArray(to) ? to : [to];

  try {
    const payload = {
      from: sender,
      to: recipientList,
      subject: subject,
      html: html || `<p>${text || ''}</p>`
    };

    if (text) {
      payload.text = text;
    }

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      payload.attachments = attachments.map(att => ({
        filename: att.filename,
        content: Buffer.isBuffer(att.content) ? att.content : Buffer.from(att.content)
      }));
    }

    const { data, error } = await resend.emails.send(payload);

    if (error) {
      const errorDetail = error.message || JSON.stringify(error);
      const statusCode = error.statusCode || error.status || 'UNKNOWN';
      console.warn(`[EMAIL NOTICE] feature: ${feature} | recipient: ${maskedRecipient} | status: ${statusCode} | ${errorDetail}`);
      
      const isSandboxRestriction = (
        statusCode === 422 || 
        statusCode === 403 || 
        errorDetail.includes('only send testing emails') || 
        errorDetail.includes('Invalid `to` field') ||
        errorDetail.includes('testing email address')
      );

      const testReceiver = (process.env.TEST_RECEIVER_EMAIL || process.env.SMTP_USER || 'padmapriya0128@gmail.com').trim().toLowerCase();

      // If in sandbox mode and recipient is a student email, deliver to test inbox
      if (isSandboxRestriction && cleanRecipient.toLowerCase() !== testReceiver) {
        console.log(`ℹ️ [RESEND SANDBOX MODE] Student recipient ${maskedRecipient} requires a verified custom domain. Auto-routing dispatch to registered testing inbox (${testReceiver})...`);
        
        try {
          const sandboxHtml = `
            <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 12px 16px; margin-bottom: 18px; border-radius: 8px; font-family: Arial, sans-serif; color: #92400e; font-size: 13px; line-height: 1.5;">
              <strong>⚠️ Resend Sandbox Mode (Development / Testing):</strong><br/>
              This recruitment email was automatically routed to your test inbox because <code>${cleanRecipient}</code> requires a custom verified domain on Resend.<br/>
              <em>To deliver directly to student inboxes in production, verify your college domain on <a href="https://resend.com/domains" style="color: #b45309; text-decoration: underline;">resend.com/domains</a>.</em>
            </div>
            ${html || `<p>${text || ''}</p>`}
          `;

          const retryPayload = {
            from: sender,
            to: [testReceiver],
            subject: `[Student: ${cleanRecipient}] ${subject}`,
            html: sandboxHtml,
            attachments: payload.attachments
          };

          if (text) {
            retryPayload.text = `[Intended Recipient: ${cleanRecipient}]\n\n${text}`;
          }

          const { data: retryData, error: retryError } = await resend.emails.send(retryPayload);

          if (!retryError && retryData?.id) {
            console.log(`[EMAIL SUCCESS via Resend Sandbox] Dispatched to test inbox (${testReceiver}) for student: ${maskedRecipient} | ID: ${retryData.id}`);
            return {
              success: true,
              messageId: retryData.id,
              provider: 'resend-sandbox',
              recipient: cleanRecipient,
              deliveredTo: testReceiver,
              sandboxMode: true
            };
          } else {
            console.error(`[EMAIL FAILED] Sandbox fallback retry failed:`, retryError);
          }
        } catch (retryErr) {
          console.error(`[EMAIL FAILED] Sandbox fallback exception:`, retryErr.message);
        }
      }

      let hint = '';
      if (statusCode === 403 || errorDetail.includes('only send testing emails') || errorDetail.includes('Invalid `to` field')) {
        hint = 'Resend sandbox active: Free tier on onboarding@resend.dev only permits sending to the Resend account owner email. Verify your custom domain in Resend dashboard to send to all student/faculty inboxes.';
      } else if (statusCode === 401 || errorDetail.includes('API key')) {
        hint = 'Invalid RESEND_API_KEY. Verify the API key in your environment variables.';
      } else if (statusCode === 422 || errorDetail.includes('from')) {
        hint = 'Sender domain unverified in Resend. Set EMAIL_FROM to a verified domain email in Resend dashboard or use onboarding@resend.dev for testing.';
      }

      return {
        success: false,
        error: errorDetail,
        statusCode: statusCode,
        hint: hint,
        provider: 'resend',
        recipient: cleanRecipient
      };
    }

    const messageId = data?.id || 'delivered';
    console.log(`[EMAIL SUCCESS] feature: ${feature} | recipient: ${maskedRecipient} | provider: RESEND | messageId: ${messageId}`);

    return {
      success: true,
      messageId: messageId,
      provider: 'resend',
      recipient: cleanRecipient
    };

  } catch (err) {
    const errorDetail = err?.message || 'Unexpected error dispatching email via Resend';
    console.error(`[EMAIL FAILED] feature: ${feature} | recipient: ${maskedRecipient} | provider: RESEND | error: ${errorDetail}`);
    return {
      success: false,
      error: errorDetail,
      provider: 'resend',
      recipient: cleanRecipient
    };
  }
}

/**
 * 1. Login Verification OTP Email
 */
async function sendLoginVerificationEmail({ to, otp, userName }) {
  const cleanEmail = (to || '').trim().toLowerCase();
  const subject = 'Your 6-Digit Verification Code - Adithya Placement Portal';
  const name = userName || 'Faculty Member';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">ADITHYA INSTITUTE OF TECHNOLOGY</h2>
          <p style="color: #2563eb; font-weight: bold; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Training & Placement Cell</p>
        </div>
        <p style="font-size: 15px; color: #334155; margin-bottom: 12px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
          Use the following 6-digit one-time verification code to verify your account and complete your sign in:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af; background: #eff6ff; padding: 14px 28px; border-radius: 12px; border: 1px solid #bfdbfe; display: inline-block; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.5;">
          This code is valid for <strong>10 minutes</strong>. If you did not request this login code, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Adithya Institute of Technology &bull; Placement Readiness Analyzer
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendViaResend({
    feature: 'LOGIN_OTP',
    to: cleanEmail,
    subject,
    html
  });
}

/**
 * 2. Forgot Password Reset OTP Email
 */
async function sendForgotPasswordEmail({ to, otp, userName }) {
  const cleanEmail = (to || '').trim().toLowerCase();
  const subject = 'Password Reset Code - Adithya Placement Portal';
  const name = userName || 'User';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 20px;">ADITHYA INSTITUTE OF TECHNOLOGY</h2>
          <p style="color: #dc2626; font-weight: bold; margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Password Reset Request</p>
        </div>
        <p style="font-size: 15px; color: #334155; margin-bottom: 12px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 20px;">
          We received a request to reset your account password. Enter the 6-digit verification code below to set a new password:
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #b91c1c; background: #fef2f2; padding: 14px 28px; border-radius: 12px; border: 1px solid #fecaca; display: inline-block; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px; line-height: 1.5;">
          This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;">
        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Adithya Institute of Technology &bull; Placement Readiness Analyzer
        </p>
      </div>
    </body>
    </html>
  `;

  return await sendViaResend({
    feature: 'FORGOT_PASSWORD',
    to: cleanEmail,
    subject,
    html
  });
}

/**
 * 3. Company Recruitment / Eligible Student Shortlist Email
 */
async function sendShortlistEmail({ 
  to, 
  studentName, 
  registerNumber, 
  companyName, 
  jobRole, 
  salaryPackage, 
  deadline, 
  venue, 
  registrationFormUrl, 
  pdfDataUrl 
}) {
  const cleanEmail = (to || '').trim().toLowerCase();
  const cName = companyName || 'Company Recruitment Drive';
  const role = jobRole || 'Graduate Trainee / Software Engineer';
  const pkg = salaryPackage || 'Competitive Package';
  const lastDate = deadline || 'As per schedule';
  const loc = venue || 'Campus / Virtual';
  const sName = studentName || 'Student';
  const regNo = registerNumber || '';

  const subject = `[Placement Drive] Recruitment Opportunity: ${cName} (${role})`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 30px; text-align: center; color: #ffffff;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #60a5fa; margin-bottom: 8px;">Adithya Institute of Technology</div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800;">Official Placement Drive Announcement</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; color: #cbd5e1;">Shortlist / Eligibility Notification</p>
        </div>

        <!-- Content Body -->
        <div style="padding: 28px;">
          <p style="font-size: 15px; margin-top: 0;">Dear <strong>${sName}</strong> ${regNo ? `(${regNo})` : ''},</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            You have been verified as eligible for the upcoming campus recruitment drive conducted by <strong>${cName}</strong>.
          </p>

          <!-- Specifications Box -->
          <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin: 0 0 12px 0; font-size: 15px; color: #0f172a;">${cName} - Drive Details</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
              <tr><td style="padding: 6px 0; font-weight: bold; width: 140px;">Designation:</td><td style="padding: 6px 0; color: #1d4ed8; font-weight: bold;">${role}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Package (CTC):</td><td style="padding: 6px 0; color: #059669; font-weight: bold;">${pkg}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Drive Venue:</td><td style="padding: 6px 0;">${loc}</td></tr>
              <tr><td style="padding: 6px 0; font-weight: bold;">Deadline:</td><td style="padding: 6px 0; color: #dc2626; font-weight: bold;">${lastDate}</td></tr>
            </table>
          </div>

          <!-- Application Button -->
          <div style="text-align: center; margin: 28px 0;">
            <a href="${registrationFormUrl || '#'}" target="_blank" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 10px; display: inline-block; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);">
              Complete Registration & Apply &rarr;
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">
            Direct Registration Link: <a href="${registrationFormUrl || '#'}" style="color: #2563eb; word-break: break-all;">${registrationFormUrl || '#'}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 16px 0;">
          <div style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
            Department of Training & Placement &bull; Adithya Institute of Technology
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
        const safeCompanyName = (cName || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
        attachments.push({
          filename: `${safeCompanyName}_Drive_Details.pdf`,
          content: Buffer.from(base64Data, 'base64')
        });
      }
    } catch (e) {
      console.error('Failed to parse PDF attachment buffer:', e.message);
    }
  }

  return await sendViaResend({
    feature: 'SHORTLIST',
    to: cleanEmail,
    subject,
    html,
    attachments
  });
}

/**
 * 4. Email Integration Diagnostic Test Email
 */
async function sendTestEmail({ to }) {
  const cleanEmail = (to || '').trim().toLowerCase();
  const subject = 'Resend Production Email Integration Test';

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; color: #1e3a8a;">
      <h2 style="margin-top: 0;">Resend Production Email Test ✅</h2>
      <p>This test email confirms that your Resend configuration on Render is working and connected.</p>
      <p>Timestamp: <strong>${new Date().toISOString()}</strong></p>
    </div>
  `;

  return await sendViaResend({
    feature: 'DIAGNOSTIC_TEST',
    to: cleanEmail,
    subject,
    html
  });
}

module.exports = {
  sendLoginVerificationEmail,
  sendForgotPasswordEmail,
  sendShortlistEmail,
  sendTestEmail,
  checkEmailHealth,
  validateEmailEnvironment,
  maskEmail
};
