const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { sendDbError } = require('../utils/http');

const router = express.Router();

const createSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  description: Joi.string().max(255).required(),
  cost: Joi.number().min(0).default(0),
  scheduled_date: Joi.date().default(() => new Date()),
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'CLOSED').default('OPEN'),
});

const updateSchema = Joi.object({
  vehicle_id: Joi.string().uuid(),
  description: Joi.string().max(255),
  cost: Joi.number().min(0),
  scheduled_date: Joi.date(),
  status: Joi.string().valid('OPEN', 'IN_PROGRESS', 'CLOSED'),
  closed_date: Joi.date(),
});

router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT m.*, v.registration_number
      FROM maintenance_logs m
      LEFT JOIN vehicles v ON m.vehicle_id = v.vehicle_id
    `;
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push(`m.status = $${params.length + 1}`);
      params.push(req.query.status);
    }
    if (req.query.vehicle_id) {
      conditions.push(`m.vehicle_id = $${params.length + 1}`);
      params.push(req.query.vehicle_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY m.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, v.registration_number
       FROM maintenance_logs m
       LEFT JOIN vehicles v ON m.vehicle_id = v.vehicle_id
       WHERE m.maintenance_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vehicle = await client.query('SELECT status FROM vehicles WHERE vehicle_id = $1 FOR UPDATE', [value.vehicle_id]);
    if (vehicle.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (vehicle.rows[0].status === 'ON_TRIP') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Vehicle is on a trip and cannot enter maintenance' });
    }
    if (vehicle.rows[0].status === 'RETIRED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Retired vehicles cannot enter active maintenance' });
    }

    const result = await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, scheduled_date, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [value.vehicle_id, value.description, value.cost, value.scheduled_date, value.status, req.user?.user_id]
    );

    if (value.status !== 'CLOSED') {
      await client.query("UPDATE vehicles SET status = 'IN_SHOP' WHERE vehicle_id = $1", [value.vehicle_id]);
    }

    const full = await client.query(
      `SELECT m.*, v.registration_number
       FROM maintenance_logs m
       LEFT JOIN vehicles v ON m.vehicle_id = v.vehicle_id
       WHERE m.maintenance_id = $1`,
      [result.rows[0].maintenance_id]
    );

    await client.query('COMMIT');
    res.status(201).json(full.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendDbError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM maintenance_logs WHERE maintenance_id = $1 FOR UPDATE', [req.params.id]);
    if (current.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (value.status === 'CLOSED') {
      value.closed_date = value.closed_date || new Date();
    }

    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        fields.push(`${key} = $${idx}`);
        params.push(val);
        idx++;
      }
    }

    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    await client.query(
      `UPDATE maintenance_logs SET ${fields.join(', ')} WHERE maintenance_id = $${idx}`,
      params
    );

    const finalVehicleId = value.vehicle_id || current.rows[0].vehicle_id;
    if (value.status && value.status !== 'CLOSED') {
      await client.query("UPDATE vehicles SET status = 'IN_SHOP' WHERE vehicle_id = $1 AND status <> 'RETIRED'", [finalVehicleId]);
    }
    if (value.status === 'CLOSED') {
      await client.query("UPDATE vehicles SET status = 'AVAILABLE' WHERE vehicle_id = $1 AND status <> 'RETIRED'", [finalVehicleId]);
    }

    const full = await client.query(
      `SELECT m.*, v.registration_number
       FROM maintenance_logs m
       LEFT JOIN vehicles v ON m.vehicle_id = v.vehicle_id
       WHERE m.maintenance_id = $1`,
      [req.params.id]
    );

    if (full.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Maintenance record not found' });
    }
    await client.query('COMMIT');
    res.json(full.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendDbError(res, err);
  } finally {
    client.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM maintenance_logs WHERE maintenance_id = $1 RETURNING maintenance_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Maintenance record not found' });
    res.json({ message: 'Maintenance record deleted' });
  } catch (err) {
    sendDbError(res, err);
  }
});

module.exports = router;
