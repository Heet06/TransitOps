const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { sendDbError } = require('../utils/http');

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

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const vehicle = await client.query(
      'SELECT vehicle_id, status, max_load_capacity_kg FROM vehicles WHERE vehicle_id = $1 FOR UPDATE',
      [value.vehicle_id]
    );
    if (vehicle.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    if (vehicle.rows[0].status !== 'AVAILABLE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only available vehicles can be assigned to a trip' });
    }
    if (Number(value.cargo_weight_kg) > Number(vehicle.rows[0].max_load_capacity_kg)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cargo weight exceeds vehicle maximum load capacity' });
    }

    const driver = await client.query(
      'SELECT driver_id, status, license_expiry_date FROM drivers WHERE driver_id = $1 FOR UPDATE',
      [value.driver_id]
    );
    if (driver.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Driver not found' });
    }
    if (driver.rows[0].status !== 'AVAILABLE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only available drivers can be assigned to a trip' });
    }
    if (new Date(driver.rows[0].license_expiry_date) < new Date(new Date().toISOString().slice(0, 10))) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Driver license is expired' });
    }

    const result = await client.query(
      `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [value.source, value.destination, value.vehicle_id, value.driver_id,
       value.cargo_weight_kg, value.planned_distance_km, value.revenue || 0, req.user?.user_id]
    );
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    sendDbError(res, err);
  } finally {
    client.release();
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
    sendDbError(res, err);
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

    if (value.status === 'DISPATCHED' && trip.status !== 'DRAFT') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only draft trips can be dispatched' });
    }
    if (value.status === 'COMPLETED' && trip.status !== 'DISPATCHED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Only dispatched trips can be completed' });
    }

    const updateFields = { status: value.status };

    if (value.status === 'DISPATCHED') {
      const vehicle = await client.query(
        'SELECT status, max_load_capacity_kg FROM vehicles WHERE vehicle_id = $1 FOR UPDATE',
        [trip.vehicle_id]
      );
      const driver = await client.query(
        'SELECT status, license_expiry_date FROM drivers WHERE driver_id = $1 FOR UPDATE',
        [trip.driver_id]
      );
      if (vehicle.rows.length === 0 || driver.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Assigned vehicle or driver no longer exists' });
      }
      if (vehicle.rows[0].status !== 'AVAILABLE') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Vehicle is not available for dispatch' });
      }
      if (driver.rows[0].status !== 'AVAILABLE') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Driver is not available for dispatch' });
      }
      if (new Date(driver.rows[0].license_expiry_date) < new Date(new Date().toISOString().slice(0, 10))) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Driver license is expired' });
      }
      if (Number(trip.cargo_weight_kg) > Number(vehicle.rows[0].max_load_capacity_kg)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Cargo weight exceeds vehicle maximum load capacity' });
      }
      updateFields.dispatched_at = new Date();
    }

    if (value.status === 'COMPLETED') {
      updateFields.actual_distance_km = value.actual_distance_km;
      if (value.start_odometer_km !== undefined) updateFields.start_odometer_km = value.start_odometer_km;
      updateFields.end_odometer_km = value.end_odometer_km;
      updateFields.fuel_consumed_l = value.fuel_consumed_l;
      if (value.revenue !== undefined) updateFields.revenue = value.revenue;
      updateFields.completed_at = new Date();
    }

    if (value.status === 'CANCELLED') {
      updateFields.cancelled_at = new Date();
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

    if (value.status === 'DISPATCHED') {
      await client.query("UPDATE vehicles SET status = 'ON_TRIP' WHERE vehicle_id = $1", [trip.vehicle_id]);
      await client.query("UPDATE drivers SET status = 'ON_TRIP' WHERE driver_id = $1", [trip.driver_id]);
    }
    if (value.status === 'COMPLETED') {
      await client.query(
        "UPDATE vehicles SET status = 'AVAILABLE', odometer_km = GREATEST(odometer_km, COALESCE($2, odometer_km)) WHERE vehicle_id = $1",
        [trip.vehicle_id, value.end_odometer_km]
      );
      await client.query("UPDATE drivers SET status = 'AVAILABLE' WHERE driver_id = $1", [trip.driver_id]);
    }
    if (value.status === 'CANCELLED' && trip.status === 'DISPATCHED') {
      await client.query("UPDATE vehicles SET status = 'AVAILABLE' WHERE vehicle_id = $1", [trip.vehicle_id]);
      await client.query("UPDATE drivers SET status = 'AVAILABLE' WHERE driver_id = $1", [trip.driver_id]);
    }

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
    sendDbError(res, err);
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
    sendDbError(res, err);
  }
});

module.exports = router;
