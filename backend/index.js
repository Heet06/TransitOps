const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')
const { pool, initDb } = require('./db')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
    }),
)

initDb();

app.get('/', (_request, response) => {
    response.json({
        name: 'TransitOps API',
        status: 'ok',
    })
})

app.get('/health', (_request, response) => {
    response.json({ status: 'healthy' })
})

// Lookup Tables
app.get('/api/vehicle-types', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vehicle_types ORDER BY vehicle_type_id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/license-categories', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM license_categories ORDER BY license_category_id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fuel Logs
app.get('/api/fuel-logs', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT f.*, v.registration_number 
            FROM fuel_logs f 
            LEFT JOIN vehicles v ON f.vehicle_id = v.vehicle_id
            ORDER BY f.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/fuel-logs', async (req, res) => {
    const { vehicle_id, trip_id, liters, cost, log_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [vehicle_id, trip_id || null, liters, cost, log_date || new Date()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Vehicles
app.get('/api/vehicles', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM vehicles ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/vehicles', async (req, res) => {
    const { registration_number, model_name, vehicle_type_id, max_load_capacity_kg, acquisition_cost, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO vehicles (registration_number, model_name, vehicle_type_id, max_load_capacity_kg, acquisition_cost, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [registration_number, model_name, vehicle_type_id, max_load_capacity_kg, acquisition_cost, status || 'AVAILABLE']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Drivers
app.get('/api/drivers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM drivers ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/drivers', async (req, res) => {
    const { full_name, license_number, license_category_id, license_expiry_date, contact_number, safety_score, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO drivers (full_name, license_number, license_category_id, license_expiry_date, contact_number, safety_score, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [full_name, license_number, license_category_id, license_expiry_date, contact_number, safety_score || 100, status || 'AVAILABLE']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Trips
app.get('/api/trips', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.*, v.registration_number, d.full_name as driver_name 
            FROM trips t 
            LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id 
            LEFT JOIN drivers d ON t.driver_id = d.driver_id 
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/trips', async (req, res) => {
    const { source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, status || 'DRAFT']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Maintenance
app.get('/api/maintenance', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, v.registration_number 
            FROM maintenance_logs m 
            LEFT JOIN vehicles v ON m.vehicle_id = v.vehicle_id 
            ORDER BY m.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/maintenance', async (req, res) => {
    const { vehicle_id, description, cost, scheduled_date, status } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO maintenance_logs (vehicle_id, description, cost, scheduled_date, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [vehicle_id, description, cost || 0, scheduled_date || new Date(), status || 'OPEN']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.*, v.registration_number 
            FROM expenses e 
            LEFT JOIN vehicles v ON e.vehicle_id = v.vehicle_id 
            ORDER BY e.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/expenses', async (req, res) => {
    const { vehicle_id, expense_type, amount, expense_date, notes } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO expenses (vehicle_id, expense_type, amount, expense_date, notes) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [vehicle_id, expense_type, amount, expense_date || new Date(), notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.use((request, response) => {
    response.status(404).json({
        error: 'Not found',
        path: request.originalUrl,
    })
})

app.listen(port, () => {
    console.log(`TransitOps backend listening on port ${port}`)
})