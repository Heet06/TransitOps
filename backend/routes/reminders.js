const express = require('express');
const { pool } = require('../db');
const { authorize } = require('../middleware/auth');
const { sendDbError } = require('../utils/http');
const { sendGmailMessage } = require('../utils/mailer');

const router = express.Router();

router.get('/license-expiry', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT driver_id, full_name, license_number, license_expiry_date,
             (license_expiry_date - CURRENT_DATE) AS days_to_expiry,
             CASE
               WHEN license_expiry_date < CURRENT_DATE THEN 'EXPIRED'
               WHEN license_expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'EXPIRING_SOON'
               ELSE 'OK'
             END AS status
      FROM drivers
      WHERE license_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY license_expiry_date ASC
    `);
    res.json(result.rows);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.post('/license-expiry/send', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT full_name, license_number, license_expiry_date,
             (license_expiry_date - CURRENT_DATE) AS days_to_expiry
      FROM drivers
      WHERE license_expiry_date <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY license_expiry_date ASC
    `);

    const recipient = process.env.SAFETY_REMINDER_EMAIL;
    if (!recipient) {
      return res.status(400).json({ error: 'Missing email configuration: SAFETY_REMINDER_EMAIL' });
    }

    const reminders = result.rows.map((driver) => ({
      full_name: driver.full_name,
      license_number: driver.license_number,
      license_expiry_date: driver.license_expiry_date,
      days_to_expiry: Number(driver.days_to_expiry),
      status: Number(driver.days_to_expiry) < 0 ? 'EXPIRED' : 'EXPIRING_SOON',
    }));

    const subject = `TransitOps license reminders (${reminders.length})`;
    const text = [
      'TransitOps License Reminder',
      '',
      reminders.length === 0
        ? 'No driver licenses are expired or expiring within 30 days.'
        : 'The following driver licenses need review:',
      '',
      ...reminders.map((driver) =>
        `${driver.full_name} | ${driver.license_number} | ${driver.status} | expiry: ${driver.license_expiry_date} | days: ${driver.days_to_expiry}`
      ),
    ].join('\n');
    const rows = reminders.map((driver) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${driver.full_name}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${driver.license_number}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${driver.license_expiry_date}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${driver.days_to_expiry}</td>
        <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${driver.status}</td>
      </tr>
    `).join('');
    const html = `
      <div style="font-family:Arial,sans-serif;color:#111827;">
        <h2 style="margin-bottom:4px;">TransitOps License Reminder</h2>
        <p style="color:#4b5563;">${reminders.length === 0 ? 'No driver licenses are expired or expiring within 30 days.' : 'The following driver licenses need review.'}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th align="left" style="padding:8px;">Driver</th>
              <th align="left" style="padding:8px;">License</th>
              <th align="left" style="padding:8px;">Expiry</th>
              <th align="left" style="padding:8px;">Days</th>
              <th align="left" style="padding:8px;">Status</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td style="padding:8px;" colspan="5">No reminders.</td></tr>'}</tbody>
        </table>
      </div>
    `;

    const info = await sendGmailMessage({ to: recipient, subject, text, html });

    res.json({
      sent: true,
      transport: 'gmail',
      to: recipient,
      messageId: info.messageId,
      reminderCount: reminders.length,
      reminders,
      message: `License reminder email sent to ${recipient}.`,
    });
  } catch (err) {
    if (err.statusCode) return res.status(err.statusCode).json({ error: err.message });
    sendDbError(res, err);
  }
});

module.exports = router;
