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
    from: '"Institutional Alumni CRM" <noreply@alumnicrm.edu>',
    to,
    subject: 'URGENT: Alumni Verification Quota Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; rounded: 8px;">
        <h2 style="color: #4f46e5;">Alumni Verification Reminder</h2>
        <p>Dear <strong>${studentName}</strong>,</p>
        <p>This is an automated operational alert from <strong>${officerName || 'Head Officer'}</strong> regarding your assigned alumni data verification quota.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px; color: #1f2937;">
            Pending Verification Records: <strong style="color: #dc2626;">${pendingCount} records</strong>
          </p>
        </div>
        <p>Please log into your Student Coordinator portal immediately to conduct outreach calls and submit verified records.</p>
        <br/>
        <p style="color: #6b7280; font-size: 12px;">Institutional Alumni Outreach & Data Verification System</p>
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

module.exports = { sendReminderEmail };
