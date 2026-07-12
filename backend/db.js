const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
    try {
        await pool.query('SELECT 1');
        console.log('Database connected successfully.');
    } catch (err) {
        console.error('Error connecting to database:', err);
    }
};

module.exports = { pool, initDb };
