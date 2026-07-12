const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { pool } = require('../db');
const { authorize } = require('../middleware/auth');
const { sendDbError } = require('../utils/http');

const router = express.Router();

const createSchema = Joi.object({
  full_name: Joi.string().max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'ADMIN', 'DRIVER').required(),
  is_active: Joi.boolean().default(true),
});

const updateSchema = Joi.object({
  full_name: Joi.string().max(150).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'ADMIN', 'DRIVER').required(),
  is_active: Joi.boolean().required(),
});

router.get('/', authorize('ADMIN', 'FLEET_MANAGER'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.user_id, u.full_name, u.email, u.is_active, u.created_at, ur.role
       FROM users u
       JOIN user_roles ur ON ur.user_id = u.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.post('/', authorize('ADMIN'), async (req, res) => {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const passwordHash = await bcrypt.hash(value.password, 12);
    const user = await client.query(
      'INSERT INTO users (full_name, email, password_hash, is_active) VALUES ($1, $2, $3, $4) RETURNING user_id, full_name, email, is_active, created_at',
      [value.full_name, value.email, passwordHash, value.is_active]
    );
    await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [user.rows[0].user_id, value.role]);
    await client.query('COMMIT');
    res.status(201).json({ ...user.rows[0], role: value.role });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    sendDbError(res, err);
  } finally {
    client.release();
  }
});

router.put('/:id', authorize('ADMIN'), async (req, res) => {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await client.query(
      'UPDATE users SET full_name=$1, email=$2, is_active=$3 WHERE user_id=$4 RETURNING user_id, full_name, email, is_active, created_at',
      [value.full_name, value.email, value.is_active, req.params.id]
    );
    if (user.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User not found' });
    }
    await client.query('DELETE FROM user_roles WHERE user_id=$1', [req.params.id]);
    await client.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [req.params.id, value.role]);
    await client.query('COMMIT');
    res.json({ ...user.rows[0], role: value.role });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    sendDbError(res, err);
  } finally {
    client.release();
  }
});

module.exports = router;
