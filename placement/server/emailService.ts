import nodemailer from 'nodemailer';

interface SendPlacementEmailParams {
  toEmail: string;
  studentName: string;
  companyName: string;
  registrationFormUrl: string;
  pdfDataUrl?: string;
  jobRole?: string;
  salaryPackage?: string;
  applicationDeadline?: string;
  eligibilityCriteria?: string;
  requiredSkills?: string;
  selectionProcess?: string;
  importantInstructions?: string;
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;

  if (gmailUser && gmailPass) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass
      }
    });
    console.log(`📧 Nodemailer Gmail SMTP configured with user: ${gmailUser}`);
  } else {
    console.log('ℹ️ GMAIL_USER/GMAIL_PASS not provided in environment. Utilizing simulated email logger transporter.');
  }

  return transporter;
}

export async function sendPlacementOpportunityEmail(params: SendPlacementEmailParams): Promise<{ success: boolean; error?: string }> {
  const { 
    toEmail, 
    studentName, 
    companyName, 
    registrationFormUrl, 
    pdfDataUrl,
    jobRole = 'Software Engineer / Graduate Trainee',
    salaryPackage = 'As per offer',
    applicationDeadline = 'As per schedule',
    eligibilityCriteria = 'Min 7.0 CGPA, 0 Active Arrears',
    requiredSkills = 'Core Technical Skills',
    selectionProcess = 'Aptitude Test -> Technical Interview -> HR Round',
    importantInstructions = 'Carry updated resume and college ID card'
  } = params;

  const subject = `Campus Placement Opportunity - ${companyName} (${jobRole})`;
  const textBody = `Dear ${studentName},

Congratulations!

Based on your academic profile and placement eligibility, you are eligible to participate in the recruitment drive conducted by ${companyName}.

COMPANY RECRUITMENT DETAILS:
- Company Name: ${companyName}
- Job Role: ${jobRole}
- Salary Package: ${salaryPackage}
- Application Deadline: ${applicationDeadline}
- Eligibility Criteria: ${eligibilityCriteria}
- Required Skills: ${requiredSkills}

Apply Now / Open Registration Form:
${registrationFormUrl || 'https://forms.google.com/adithya-placement-registration'}

Best Regards,
Training & Placement Cell
Adithya Institute of Technology`;

  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
  <div style="background-color: #0f172a; padding: 24px; text-align: center; color: #ffffff;">
    <h1 style="margin: 0; font-size: 22px; letter-spacing: 0.5px;">ADITHYA INSTITUTE OF TECHNOLOGY</h1>
    <p style="margin: 4px 0 0 0; font-size: 13px; color: #f97316; font-weight: bold; text-transform: uppercase;">Central Placement & Training Cell</p>
  </div>
  
  <div style="padding: 24px; color: #1e293b; line-height: 1.6;">
    <p style="font-size: 15px; font-weight: bold; margin-top: 0;">Dear ${studentName},</p>

    <p style="font-size: 16px; color: #166534; font-weight: bold; margin-bottom: 12px;">🎉 Congratulations! You are Eligible to Apply.</p>

    <p style="margin-bottom: 16px;">Based on your academic performance and placement criteria, you have been verified and selected for the upcoming recruitment drive by <strong>${companyName}</strong>.</p>

    <!-- RECRUITMENT SUMMARY CARD -->
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 16px 0;">
      <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 6px;">📢 Recruitment Opportunity Overview</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold; width: 35%;">Company Name:</td>
          <td style="padding: 6px 0; color: #0f172a; font-weight: bold;">${companyName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Job Role:</td>
          <td style="padding: 6px 0; color: #1d4ed8; font-weight: bold;">${jobRole}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Salary Package:</td>
          <td style="padding: 6px 0; color: #15803d; font-weight: bold;">${salaryPackage}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Application Deadline:</td>
          <td style="padding: 6px 0; color: #b91c1c; font-weight: bold;">${applicationDeadline}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Eligibility Criteria:</td>
          <td style="padding: 6px 0; color: #334155;">${eligibilityCriteria}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Required Skills:</td>
          <td style="padding: 6px 0; color: #334155;">${requiredSkills}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748b; font-weight: bold;">Selection Process:</td>
          <td style="padding: 6px 0; color: #334155;">${selectionProcess}</td>
        </tr>
      </table>
    </div>

    <!-- APPLY NOW CTA BUTTON -->
    <div style="margin: 24px 0; text-align: center; padding: 20px; background-color: #f1f5f9; border-radius: 10px;">
      <p style="margin: 0 0 12px 0; font-weight: bold; color: #0f172a; font-size: 14px;">Click the button below to submit your official application:</p>
      <a href="${registrationFormUrl || '#'}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 15px; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Apply Now (Open Registration Form)</a>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b; word-break: break-all;">Form URL: ${registrationFormUrl}</p>
    </div>

    <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
      <strong style="color: #c2410c; font-size: 12px;">Important Instructions:</strong>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #9a3412;">${importantInstructions}</p>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

    <p style="margin: 0; font-weight: bold; color: #0f172a;">Best Regards,</p>
    <p style="margin: 2px 0 0 0; font-weight: bold; color: #475569;">Training & Placement Cell</p>
    <p style="margin: 0; font-size: 13px; color: #64748b;">Adithya Institute of Technology</p>
  </div>
</div>
`;

  // Attachments
  const attachments: any[] = [];
  if (pdfDataUrl && pdfDataUrl.includes('base64,')) {
    try {
      const base64Data = pdfDataUrl.split('base64,')[1];
      const pdfBuffer = Buffer.from(base64Data, 'base64');
      const safeCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
      attachments.push({
        filename: `Placement_Registration_Form_${safeCompanyName}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    } catch (e) {
      console.error('Failed to parse PDF data URL for attachment', e);
    }
  }

  const activeTransporter = getTransporter();

  if (activeTransporter) {
    try {
      const senderUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'placement@adithyatech.edu.in';
      const info = await activeTransporter.sendMail({
        from: `"Adithya Institute Placement Cell" <${senderUser}>`,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody,
        attachments
      });
      console.log(`✅ Email sent successfully to ${toEmail}. MessageID: ${info.messageId}`);
      return { success: true };
    } catch (err: any) {
      console.error(`❌ Failed to send email to ${toEmail} via Nodemailer:`, err?.message);
      return { success: false, error: err?.message || 'Email delivery failed' };
    }
  } else {
    // Simulated delivery for dev environment when SMTP is unconfigured
    console.log(`[SIMULATED EMAIL SENT] To: ${toEmail} | Subject: ${subject}`);
    return { success: true };
  }
}

export async function sendVerificationOTPEmail(toEmail: string, otp: string): Promise<{ success: boolean; error?: string }> {
  console.log(`\n==================================================`);
  console.log(`🔑 [VERIFICATION CODE DISPATCH]`);
  console.log(`📧 RECIPIENT: ${toEmail}`);
  console.log(`🔢 6-DIGIT OTP CODE: ${otp}`);
  console.log(`🕒 TIMESTAMP: ${new Date().toISOString()}`);
  console.log(`==================================================\n`);

  const subject = `Your Security Verification Code - Adithya Placement Readiness Portal`;
  const textBody = `Your 6-digit verification code is: ${otp}. Enter this code to complete authentication.`;
  const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h2 style="color: #1e3a8a; margin: 0;">ADITHYA INSTITUTE OF TECHNOLOGY</h2>
    <p style="color: #2563eb; font-weight: bold; margin: 4px 0 0 0; font-size: 13px; text-transform: uppercase;">Placement Readiness Portal</p>
  </div>
  <p style="color: #334155; font-size: 14px; margin-bottom: 16px;">Hello,</p>
  <p style="color: #334155; font-size: 14px;">Use the following 6-digit verification code to log in and open your dashboard:</p>
  <div style="text-align: center; margin: 24px 0;">
    <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1; display: inline-block;">${otp}</span>
  </div>
  <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">This security code is strictly required to authorize access to your account.</p>
</div>
`;

  const activeTransporter = getTransporter();
  if (activeTransporter) {
    try {
      const senderUser = process.env.GMAIL_USER || process.env.SMTP_USER || 'placement@adithyatech.edu.in';
      await activeTransporter.sendMail({
        from: `"Adithya Placement Cell" <${senderUser}>`,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody
      });
      console.log(`✅ Verification OTP sent to ${toEmail}`);
      return { success: true };
    } catch (err: any) {
      console.error(`❌ Failed to send OTP email to ${toEmail}:`, err?.message);
      return { success: false, error: err?.message };
    }
  } else {
    console.log(`🔑 [SIMULATED VERIFICATION OTP SENT] To: ${toEmail} | OTP Code: ${otp}`);
    return { success: true };
  }
}
