const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const dotenv = require('dotenv');
const { pool, initDb } = require('./db');
const { authenticate } = require('./middleware/auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

initDb();

// Public routes
app.get('/', (_req, res) => {
  res.json({ name: 'TransitOps API', status: 'ok' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Lookup routes (public)
app.use('/api', require('./routes/lookups'));

// Protected routes
app.use('/api/vehicles', authenticate, require('./routes/vehicles'));
app.use('/api/drivers', authenticate, require('./routes/drivers'));
app.use('/api/trips', authenticate, require('./routes/trips'));
app.use('/api/maintenance', authenticate, require('./routes/maintenance'));
app.use('/api/expenses', authenticate, require('./routes/expenses'));
app.use('/api/fuel-logs', authenticate, require('./routes/fuelLogs'));
app.use('/api/reports', authenticate, require('./routes/reports'));

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', path: _req.originalUrl });
});

app.listen(port, () => {
  console.log(`TransitOps backend listening on port ${port}`);
});
