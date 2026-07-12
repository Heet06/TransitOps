const express = require('express');
const { pool } = require('../db');
const { authorize } = require('../middleware/auth');
const { sendDbError } = require('../utils/http');

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

    const reminders = result.rows.map((driver) => ({
      to: process.env.SAFETY_REMINDER_EMAIL || 'safety@transitops.local',
      subject: `License reminder: ${driver.full_name}`,
      message: `${driver.full_name} (${driver.license_number}) license expires on ${driver.license_expiry_date}. Days to expiry: ${driver.days_to_expiry}.`,
    }));

    res.json({
      sent: false,
      transport: 'preview',
      reminders,
      message: 'SMTP transport is not configured; reminder payloads are ready for delivery.',
    });
  } catch (err) {
    sendDbError(res, err);
  }
});

module.exports = router;
