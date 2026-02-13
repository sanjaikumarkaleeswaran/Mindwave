const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // ensure env vars

const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail', // Consider using specific SMTP details for production instead of 'service'
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message
    };

    await transporter.sendMail(message);
};

module.exports = sendEmail;
