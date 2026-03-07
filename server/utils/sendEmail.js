const { Resend } = require('resend');

// Remove the Nodemailer logic and replace with Resend initialization
const sendEmail = async (options) => {
  if (!process.env.RESEND_API_KEY) {
    console.error('⚠️ CRITICAL: RESEND_API_KEY is not set in the environment variables!');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log(`Attempting to send email to ${options.email} via Resend...`);

  // Note: Resend requires a verified domain to send FROM in production.
  // We use their testing domain or the users configured FROM email.
  const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  const fromName = process.env.FROM_NAME || 'MindWave';

  try {
    const data = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: options.email,
      subject: options.subject,
      html: options.html || options.message,
      text: options.message,
    });

    console.log(`Email successfully sent via Resend. ID:`, data.id);
    return data;
  } catch (error) {
    console.error('Resend Error:', error);
    throw error;
  }
};

module.exports = { sendEmail, buildHtmlEmail };
