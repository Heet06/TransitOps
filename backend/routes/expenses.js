const express = require('express');
const Joi = require('joi');
const { pool } = require('../db');
const { sendDbError } = require('../utils/http');

const router = express.Router();

const expenseSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required(),
  trip_id: Joi.string().uuid().allow(null),
  expense_type: Joi.string().valid('FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER').required(),
  amount: Joi.number().min(0).required(),
  expense_date: Joi.date().default(() => new Date()),
  notes: Joi.string().max(255).allow(null, ''),
});

router.get('/', async (req, res) => {
  try {
    let query = `
      SELECT e.*, v.registration_number
      FROM expenses e
      LEFT JOIN vehicles v ON e.vehicle_id = v.vehicle_id
    `;
    const params = [];
    const conditions = [];

    if (req.query.vehicle_id) {
      conditions.push(`e.vehicle_id = $${params.length + 1}`);
      params.push(req.query.vehicle_id);
    }
    if (req.query.expense_type) {
      conditions.push(`e.expense_type = $${params.length + 1}`);
      params.push(req.query.expense_type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY e.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.post('/', async (req, res) => {
  const { error, value } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [value.vehicle_id, value.trip_id, value.expense_type, value.amount, value.expense_date, value.notes, req.user?.user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.put('/:id', async (req, res) => {
  const { error, value } = expenseSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await pool.query(
      `UPDATE expenses SET vehicle_id=$1, trip_id=$2, expense_type=$3, amount=$4, expense_date=$5, notes=$6
       WHERE expense_id=$7 RETURNING *`,
      [value.vehicle_id, value.trip_id, value.expense_type, value.amount, value.expense_date, value.notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE expense_id = $1 RETURNING expense_id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    sendDbError(res, err);
  }
});

module.exports = router;
