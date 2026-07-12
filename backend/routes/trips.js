const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');

const router = express.Router();

const createTripSchema = Joi.object({
  source: Joi.string().max(150).required(),
  destination: Joi.string().max(150).required(),
  vehicle_id: Joi.string().uuid().required(),
  driver_id: Joi.string().uuid().required(),
  cargo_weight_kg: Joi.number().positive().required(),
  planned_distance_km: Joi.number().positive().required(),
  revenue: Joi.number().min(0).default(0),
});

const updateTripSchema = Joi.object({
  source: Joi.string().max(150),
  destination: Joi.string().max(150),
  vehicle_id: Joi.string().uuid(),
  driver_id: Joi.string().uuid(),
  cargo_weight_kg: Joi.number().positive(),
  planned_distance_km: Joi.number().positive(),
  revenue: Joi.number().min(0),
  status: Joi.string().valid('DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'),
  actual_distance_km: Joi.number().min(0),
  start_odometer_km: Joi.number().min(0),
  end_odometer_km: Joi.number().min(0),
  fuel_consumed_l: Joi.number().min(0),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string().valid('DISPATCHED', 'COMPLETED', 'CANCELLED').required(),
  actual_distance_km: Joi.number().min(0).when('status', { is: 'COMPLETED', then: Joi.required() }),
  start_odometer_km: Joi.number().min(0),
  end_odometer_km: Joi.number().min(0),
  fuel_consumed_l: Joi.number().min(0).when('status', { is: 'COMPLETED', then: Joi.required() }),
  revenue: Joi.number().min(0),
});

router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT t.*, v.registration_number, d.full_name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN drivers d ON t.driver_id = d.driver_id
    `;
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push(`t.status = $${params.length + 1}`);
      params.push(req.query.status);
    }
    if (req.query.vehicle_id) {
      conditions.push(`t.vehicle_id = $${params.length + 1}`);
      params.push(req.query.vehicle_id);
    }
    if (req.query.driver_id) {
      conditions.push(`t.driver_id = $${params.length + 1}`);
      params.push(req.query.driver_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, v.registration_number, d.full_name as driver_name
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       WHERE t.trip_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { error, value } = createTripSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [value.source, value.destination, value.vehicle_id, value.driver_id,
       value.cargo_weight_kg, value.planned_distance_km, value.revenue || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { error, value } = updateTripSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const fields = [];
    const params = [];
    let idx = 1;

    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE trips SET ${fields.join(', ')} WHERE trip_id = $${idx} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/status', async (req, res) => {
  const { error, value } = statusUpdateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const current = await client.query('SELECT * FROM trips WHERE trip_id = $1 FOR UPDATE', [req.params.id]);
    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = current.rows[0];

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot change status of a ${trip.status.toLowerCase()} trip` });
    }

    const updateFields = { status: value.status };

    if (value.status === 'COMPLETED') {
      updateFields.actual_distance_km = value.actual_distance_km;
      updateFields.end_odometer_km = value.end_odometer_km;
      updateFields.fuel_consumed_l = value.fuel_consumed_l;
      if (value.revenue !== undefined) updateFields.revenue = value.revenue;
    }

    const setClauses = [];
    const params = [];
    let idx = 1;
    for (const [k, v] of Object.entries(updateFields)) {
      setClauses.push(`${k} = $${idx}`);
      params.push(v);
      idx++;
    }
    params.push(req.params.id);

    const result = await client.query(
      `UPDATE trips SET ${setClauses.join(', ')} WHERE trip_id = $${idx} RETURNING *`,
      params
    );

    await client.query('COMMIT');

    const full = await pool.query(
      `SELECT t.*, v.registration_number, d.full_name as driver_name
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
       LEFT JOIN drivers d ON t.driver_id = d.driver_id
       WHERE t.trip_id = $1`,
      [req.params.id]
    );

    res.json(full.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const trip = await pool.query('SELECT status FROM trips WHERE trip_id = $1', [req.params.id]);
    if (trip.rows.length === 0) return res.status(404).json({ error: 'Trip not found' });
    if (trip.rows[0].status !== 'DRAFT') {
      return res.status(400).json({ error: 'Only draft trips can be deleted' });
    }
    await pool.query('DELETE FROM trips WHERE trip_id = $1', [req.params.id]);
    res.json({ message: 'Trip deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
