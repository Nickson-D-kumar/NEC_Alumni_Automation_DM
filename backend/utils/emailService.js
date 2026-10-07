const nodemailer = require('nodemailer');

// Create test transporter or use SMTP credentials if available
let transporter;

const initTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate Ethereal test SMTP account automatically
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Ethereal Email Transporter initialized for ${testAccount.user}`);
    } catch (err) {
      console.log('Using console fallback email transport...');
      transporter = {
        sendMail: async (opts) => {
          console.log(`[SIMULATED EMAIL SENT] To: ${opts.to} | Subject: ${opts.subject}\nBody: ${opts.text || opts.html}`);
          return { messageId: 'simulated-id-' + Date.now() };
        }
      };
    }
  }
};

initTransporter();

const sendReminderEmail = async ({ to, studentName, pendingCount, officerName }) => {
  const mailOptions = {
    from: '"NEC Alumni Outreach Cell" <alumni-support@institution.edu>',
    to,
    subject: 'URGENT: Alumni Verification Quota Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5;">Alumni Verification Reminder</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>This is an operational notification regarding your assigned alumni data verification quota.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; color: #1f2937;">
            Pending Verification Records: <strong style="color: #dc2626;">${pendingCount} records</strong>
          </p>
        </div>
        <p>Please log into your Student Coordinator portal to conduct outreach calls and submit verified records.</p>
        <br/>
        <p style="color: #6b7280; font-size: 12px;">NEC Alumni Association • Outreach Cell</p>
      </div>
    `
  };

  if (!transporter) {
    await initTransporter();
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email dispatched to ${to}. MessageId: ${info.messageId}`);
  return info;
};

const sendInitiativeEmail = async ({
  to,
  studentName,
  assignedCount,
  assignedBatches = [],
  staffCoordinatorName,
  staffCoordinatorEmail,
  department = 'Computer Science & Engineering',
  loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login'
}) => {
  const mailOptions = {
    from: '"NEC Alumni Outreach Cell" <alumni-support@institution.edu>',
    replyTo: staffCoordinatorEmail || 'alumni-support@institution.edu',
    to,
    subject: `New Alumni Outreach Allocation - ${department} | NEC Alumni Association`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #7c3aed; margin: 0; font-size: 20px;">National Engineering College</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Office of Alumni Affairs & Outreach Cell • ${department}</p>
        </div>

        <p style="font-size: 15px; margin-bottom: 12px;">Dear <strong>${studentName}</strong>,</p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          You have been allocated a new cohort of alumni records for outreach, contact verification, and master directory updates.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Allocation Summary</h4>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 45%;">Allocated Quota:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${assignedCount} Alumni Records</td>
            </tr>
            ${assignedBatches && assignedBatches.length > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Target Batches:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #7c3aed;">${assignedBatches.join(', ')}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Supervising Authority:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">Prof. ${staffCoordinatorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Department:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${department}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Coordinator Contact:</td>
              <td style="padding: 6px 0; color: #2563eb;">${staffCoordinatorEmail}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            💰 <strong>Student Incentive Policy:</strong> ₹10 incentive credited for each verified alumni record approved by Admin.
          </p>
        </div>

        <p style="font-size: 13px; color: #475569; font-style: italic;">
          Initiated & Allocated by: Prof. ${staffCoordinatorName}, Department Staff Coordinator (${department}).
        </p>

        <div style="margin: 28px 0 16px 0; text-align: center;">
          <a href="${loginUrl}" style="background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Access Student Coordinator Portal
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          NEC Alumni Association • Outreach & Data Verification Management System<br/>
          If you have questions, please reply directly to this email to reach Prof. ${staffCoordinatorName}.
        </p>
      </div>
    `
  };

  if (!transporter) {
    await initTransporter();
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`Initiative email dispatched to ${to}. MessageId: ${info.messageId}`);
  return info;
};

const sendStaffInitiativeReminderEmail = async ({
  to,
  studentName,
  pendingCount = 0,
  totalAssigned = 0,
  staffCoordinatorName = 'Staff Coordinator',
  staffCoordinatorEmail = 'staff@crm.com',
  department = 'Computer Science & Engineering',
  loginUrl = process.env.FRONTEND_URL || 'http://localhost:3000/login'
}) => {
  const mailOptions = {
    from: '"NEC Alumni Outreach Cell" <alumni-support@institution.edu>',
    replyTo: staffCoordinatorEmail || 'alumni-support@institution.edu',
    to,
    subject: 'Outreach Pending Reminder - Action Required | NEC Alumni Portal',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #1e293b;">
        <div style="border-bottom: 2px solid #7c3aed; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #7c3aed; margin: 0; font-size: 20px;">National Engineering College</h2>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 13px;">Office of Alumni Affairs & Outreach Cell • ${department}</p>
        </div>

        <p style="font-size: 15px; margin-bottom: 12px;">Dear <strong>${studentName}</strong>,</p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          This is an operational reminder from your supervising Department Staff Coordinator regarding your pending alumni verification quota.
          Our activity monitor indicates that no outreach submissions have been logged for your assigned quota in the last <strong>3+ days</strong>.
        </p>

        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <h4 style="margin: 0 0 10px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; color: #991b1b;">Outreach Quota Status</h4>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 45%;">Pending Verifications:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #dc2626; font-size: 16px;">${pendingCount} Records</td>
            </tr>
            ${totalAssigned > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Total Allocated Quota:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${totalAssigned} Records</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Supervising Staff Coordinator:</td>
              <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">Prof. ${staffCoordinatorName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Staff Email Contact:</td>
              <td style="padding: 6px 0; color: #2563eb;">${staffCoordinatorEmail}</td>
            </tr>
          </table>
        </div>

        <div style="background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #92400e;">
            💰 <strong>Student Incentive Reminder:</strong> ₹10 incentive credited directly to your Student Coordinator Wallet for each verified alumni record approved by Admin.
          </p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #334155;">
          Please log into your coordinator portal immediately, contact your assigned alumni cohort, update any missing profile parameters, and submit the records for back officer review.
        </p>

        <div style="margin: 28px 0 16px 0; text-align: center;">
          <a href="${loginUrl}" style="background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
            Open Student Portal & Resume Outreach
          </a>
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          NEC Alumni Association • Outreach & Data Verification Management System<br/>
          If you are facing difficulties reaching these alumni or require reassignment, reply directly to this email to contact Prof. ${staffCoordinatorName}.
        </p>
      </div>
    `
  };

  if (!transporter) {
    await initTransporter();
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`Staff initiative reminder email dispatched to ${to}. MessageId: ${info.messageId}`);
  return info;
};

module.exports = { 
  sendReminderEmail,
  sendInitiativeEmail,
  sendStaffInitiativeReminderEmail
};
