const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');

const router = express.Router();

const fuelLogSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  trip_id: Joi.string().uuid().allow(null),
  liters: Joi.number().positive().required(),
  cost: Joi.number().min(0).required(),
  log_date: Joi.date().default(() => new Date()),
});

router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT f.*, v.registration_number
      FROM fuel_logs f
      LEFT JOIN vehicles v ON f.vehicle_id = v.vehicle_id
    `;
    const params = [];
    const conditions = [];

    if (req.query.vehicle_id) {
      conditions.push(`f.vehicle_id = $${params.length + 1}`);
      params.push(req.query.vehicle_id);
    }
    if (req.query.trip_id) {
      conditions.push(`f.trip_id = $${params.length + 1}`);
      params.push(req.query.trip_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY f.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { error, value } = fuelLogSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [value.vehicle_id, value.trip_id, value.liters, value.cost, value.log_date, req.user?.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM fuel_logs WHERE fuel_log_id = $1 RETURNING fuel_log_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Fuel log not found' });
    res.json({ message: 'Fuel log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
