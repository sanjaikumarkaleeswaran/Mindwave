const { Resend } = require('resend');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Builds a branded HTML email wrapper around any inner HTML content.
 * @param {string} title     - The bold heading shown in the email
 * @param {string} bodyHtml  - HTML content for the email body
 * @param {string} btnText   - (optional) CTA button label
 * @param {string} btnUrl    - (optional) CTA button URL
 */
const buildHtmlEmail = (title, bodyHtml, btnText = null, btnUrl = null) => {
  const buttonHtml = btnText && btnUrl
    ? `<div style="text-align:center;margin:32px 0;">
               <a href="${btnUrl}"
                  style="display:inline-block;padding:14px 32px;background:#6366f1;color:#fff;
                         text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;
                         letter-spacing:0.3px;">
                  ${btnText}
               </a>
           </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;color:#c4b5fd;text-transform:uppercase;">MindWave</p>
              <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;">${title}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;color:#a1a1aa;font-size:15px;line-height:1.7;">
              ${bodyHtml}
              ${buttonHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                This email was sent from <strong style="color:#6366f1;">MindWave</strong> — Your AI-Powered Life OS.<br/>
                If you didn't request this, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * @param {Object} options
 * @param {string} options.email     - Recipient email
 * @param {string} options.subject   - Email subject
 * @param {string} options.message   - Plain-text fallback message
 * @param {string} [options.html]    - Full HTML (if not provided, a basic branded HTML is generated from message)
 */
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
