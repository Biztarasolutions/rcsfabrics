// src/utils/email.ts
import nodemailer from 'nodemailer';

// SMTP configuration should be set via environment variables
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';

if (!smtpHost || !smtpUser || !smtpPass) {
  console.warn('SMTP configuration is incomplete. Email sending will fail.');
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

export interface EmailOptions {
  to: string[]; // list of recipient emails
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions) => {
  const mailOptions = {
    from: smtpUser,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Error sending email:', err);
    throw err;
  }
};
