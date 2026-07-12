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

function allowMethods(readRoles, writeRoles) {
  return (req, res, next) => {
    const roles = req.method === 'GET' ? readRoles : writeRoles;
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action' });
    }
    next();
  };
}

// Public routes
app.get('/', (_req, res) => {
  res.json({ name: 'TransitOps API', status: 'ok' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Auth routes (public)
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api', authenticate, require('./routes/lookups'));
app.use('/api/vehicles', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
  ['ADMIN', 'FLEET_MANAGER']
), require('./routes/vehicles'));
app.use('/api/drivers', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'],
  ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER']
), require('./routes/drivers'));
app.use('/api/trips', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER', 'FINANCIAL_ANALYST'],
  ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER']
), require('./routes/trips'));
app.use('/api/maintenance', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
  ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER']
), require('./routes/maintenance'));
app.use('/api/expenses', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'],
  ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']
), require('./routes/expenses'));
app.use('/api/fuel-logs', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'],
  ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']
), require('./routes/fuelLogs'));
app.use('/api/reports', authenticate, allowMethods(
  ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
  ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST']
), require('./routes/reports'));
app.use('/api/users', authenticate, require('./routes/users'));
app.use('/api/reminders', authenticate, require('./routes/reminders'));

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found', path: _req.originalUrl });
});

app.listen(port, () => {
  console.log(`TransitOps backend listening on port ${port}`);
});
