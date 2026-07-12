const test = require('node:test');
const assert = require('node:assert/strict');
const { getGmailConfig, requireGmailConfig } = require('../utils/mailer');

test('getGmailConfig reads Gmail environment variables', () => {
  const previousUser = process.env.GMAIL_USER;
  const previousPass = process.env.GMAIL_APP_PASSWORD;
  const previousName = process.env.MAIL_FROM_NAME;

  process.env.GMAIL_USER = 'sender@example.com';
  process.env.GMAIL_APP_PASSWORD = 'app-password';
  process.env.MAIL_FROM_NAME = 'TransitOps Test';

  assert.deepEqual(getGmailConfig(), {
    user: 'sender@example.com',
    appPassword: 'app-password',
    fromName: 'TransitOps Test',
  });

  if (previousUser === undefined) delete process.env.GMAIL_USER;
  else process.env.GMAIL_USER = previousUser;
  if (previousPass === undefined) delete process.env.GMAIL_APP_PASSWORD;
  else process.env.GMAIL_APP_PASSWORD = previousPass;
  if (previousName === undefined) delete process.env.MAIL_FROM_NAME;
  else process.env.MAIL_FROM_NAME = previousName;
});

test('requireGmailConfig throws when Gmail credentials are missing', () => {
  const previousUser = process.env.GMAIL_USER;
  const previousPass = process.env.GMAIL_APP_PASSWORD;
  delete process.env.GMAIL_USER;
  delete process.env.GMAIL_APP_PASSWORD;

  assert.throws(() => requireGmailConfig(), /Missing email configuration/);

  if (previousUser !== undefined) process.env.GMAIL_USER = previousUser;
  if (previousPass !== undefined) process.env.GMAIL_APP_PASSWORD = previousPass;
});
