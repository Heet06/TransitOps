const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { sendDbError } = require('../utils/http');

const router = express.Router();

const vehicleSchema = Joi.object({
  registration_number: Joi.string().max(30).required(),
  model_name: Joi.string().max(100).required(),
  vehicle_type_id: Joi.number().integer().required(),
  region_id: Joi.number().integer().allow(null),
  max_load_capacity_kg: Joi.number().positive().required(),
  odometer_km: Joi.number().min(0).default(0),
  acquisition_cost: Joi.number().min(0).required(),
  status: Joi.string().valid('AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED').default('AVAILABLE'),
});

const documentSchema = Joi.object({
  document_type: Joi.string().valid('REGISTRATION', 'INSURANCE', 'PERMIT', 'FITNESS', 'POLLUTION', 'OTHER').required(),
  document_name: Joi.string().max(150).required(),
  document_url: Joi.string().uri().required(),
  expiry_date: Joi.date().allow(null),
});

router.get('/', async (req, res) => {
  try {
    let query = 'SELECT * FROM vehicles';
    const params = [];
    const conditions = [];

    if (req.query.status) {
      conditions.push(`status = $${params.length + 1}`);
      params.push(req.query.status);
    }
    if (req.query.vehicle_type_id) {
      conditions.push(`vehicle_type_id = $${params.length + 1}`);
      params.push(req.query.vehicle_type_id);
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
    sendDbError(res, err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles WHERE vehicle_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { error, value } = vehicleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (registration_number, model_name, vehicle_type_id, region_id, max_load_capacity_kg, odometer_km, acquisition_cost, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [value.registration_number, value.model_name, value.vehicle_type_id, value.region_id, value.max_load_capacity_kg, value.odometer_km, value.acquisition_cost, value.status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Registration number already exists' });
    sendDbError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const { error, value } = vehicleSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `UPDATE vehicles SET registration_number=$1, model_name=$2, vehicle_type_id=$3, region_id=$4,
       max_load_capacity_kg=$5, odometer_km=$6, acquisition_cost=$7, status=$8
       WHERE vehicle_id=$9 RETURNING *`,
      [value.registration_number, value.model_name, value.vehicle_type_id, value.region_id,
       value.max_load_capacity_kg, value.odometer_km, value.acquisition_cost, value.status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Registration number already exists' });
    sendDbError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE vehicle_id = $1 RETURNING vehicle_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    if (err.code === '23503') return res.status(409).json({ error: 'Cannot delete vehicle with associated records' });
    sendDbError(res, err);
  }
});

router.get('/:id/documents', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vehicle_documents WHERE vehicle_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.post('/:id/documents', async (req, res) => {
  const { error, value } = documentSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const vehicle = await pool.query('SELECT vehicle_id FROM vehicles WHERE vehicle_id = $1', [req.params.id]);
    if (vehicle.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });

    const result = await pool.query(
      `INSERT INTO vehicle_documents (vehicle_id, document_type, document_name, document_url, expiry_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, value.document_type, value.document_name, value.document_url, value.expiry_date, req.user?.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.delete('/:id/documents/:documentId', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM vehicle_documents WHERE vehicle_id = $1 AND document_id = $2 RETURNING document_id',
      [req.params.id, req.params.documentId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
    res.json({ message: 'Document deleted' });
  } catch (err) {
    sendDbError(res, err);
  }
});

module.exports = router;
