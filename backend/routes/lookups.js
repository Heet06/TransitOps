const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/vehicle-types', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicle_types ORDER BY vehicle_type_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/license-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM license_categories ORDER BY license_category_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/regions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM regions ORDER BY region_id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
