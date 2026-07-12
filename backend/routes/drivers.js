const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');

const router = express.Router();

const driverSchema = Joi.object({
  full_name: Joi.string().max(150).required(),
  license_number: Joi.string().max(50).required(),
  license_category_id: Joi.number().integer().required(),
  license_expiry_date: Joi.date().required(),
  contact_number: Joi.string().max(20).required(),
  safety_score: Joi.number().min(0).max(100).default(100),
  status: Joi.string().valid('AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED').default('AVAILABLE'),
  region_id: Joi.number().integer().allow(null),
});

router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM drivers';
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(req.query.status);
    }
    if (req.query.license_category_id) {
      conditions.push(`license_category_id = $${params.length + 1}`);
      params.push(req.query.license_category_id);
    }
    if (req.query.region_id) {
      conditions.push(`region_id = $${params.length + 1}`);
      params.push(req.query.region_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM drivers WHERE driver_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { error, value } = driverSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `INSERT INTO drivers (full_name, license_number, license_category_id, license_expiry_date, contact_number, safety_score, status, region_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [value.full_name, value.license_number, value.license_category_id, value.license_expiry_date,
       value.contact_number, value.safety_score, value.status, value.region_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'License number already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { error, value } = driverSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `UPDATE drivers SET full_name=$1, license_number=$2, license_category_id=$3, license_expiry_date=$4,
       contact_number=$5, safety_score=$6, status=$7, region_id=$8
       WHERE driver_id=$9 RETURNING *`,
      [value.full_name, value.license_number, value.license_category_id, value.license_expiry_date,
       value.contact_number, value.safety_score, value.status, value.region_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'License number already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM drivers WHERE driver_id = $1 RETURNING driver_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    if (err.code === '23503') return res.status(409).json({ error: 'Cannot delete driver with associated records' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
