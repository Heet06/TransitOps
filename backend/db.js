const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const initDb = async () => {
    try {
        await pool.query('SELECT 1');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS vehicle_documents (
                document_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
                vehicle_id uuid NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
                document_type varchar(50) NOT NULL,
                document_name varchar(150) NOT NULL,
                document_url text NOT NULL,
                expiry_date date,
                created_by uuid REFERENCES users(user_id),
                created_at timestamptz DEFAULT now() NOT NULL
            )
        `);
        await pool.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id)');
        console.log('Database connected successfully.');
    } catch (err) {
        console.error('Error connecting to database:', err);
    }
};

module.exports = { pool, initDb };
