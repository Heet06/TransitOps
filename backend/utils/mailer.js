const nodemailer = require('nodemailer');

function getGmailConfig() {
  return {
    user: process.env.GMAIL_USER,
    appPassword: process.env.GMAIL_APP_PASSWORD,
    fromName: process.env.MAIL_FROM_NAME || 'TransitOps',
  };
}

function requireGmailConfig() {
  const config = getGmailConfig();
  const missing = [];
  if (!config.user) missing.push('GMAIL_USER');
  if (!config.appPassword) missing.push('GMAIL_APP_PASSWORD');

  if (missing.length > 0) {
    const error = new Error(`Missing email configuration: ${missing.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  return config;
}

function createGmailTransport() {
  const config = requireGmailConfig();
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.user,
      pass: config.appPassword,
    },
  });
}

async function sendGmailMessage({ to, subject, text, html }) {
  const config = requireGmailConfig();
  const transporter = createGmailTransport();
  return transporter.sendMail({
    from: `"${config.fromName}" <${config.user}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { getGmailConfig, requireGmailConfig, createGmailTransport, sendGmailMessage };
