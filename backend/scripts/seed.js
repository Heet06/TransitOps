const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const users = [
  ['Admin User', 'admin@transitops.io', 'admin123', 'ADMIN'],
  ['Fleet Manager', 'fleet@transitops.io', 'manager123', 'FLEET_MANAGER'],
  ['Dispatcher', 'dispatcher@transitops.io', 'dispatch123', 'DISPATCHER'],
  ['Safety Officer', 'safety@transitops.io', 'safety123', 'SAFETY_OFFICER'],
  ['Financial Analyst', 'finance@transitops.io', 'finance123', 'FINANCIAL_ANALYST'],
];

async function upsertLookup(table, column, values) {
  for (const value of values) {
    await pool.query(`INSERT INTO ${table} (${column}) VALUES ($1) ON CONFLICT (${column}) DO NOTHING`, [value]);
  }
}

async function seedUsers() {
  for (const [fullName, email, password, role] of users) {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name
       RETURNING user_id`,
      [fullName, email, passwordHash]
    );
    await pool.query(
      `INSERT INTO user_roles (user_id, role)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role) DO NOTHING`,
      [user.rows[0].user_id, role]
    );
  }
}

async function main() {
  await upsertLookup('vehicle_types', 'type_name', ['Van', 'Truck', 'Bus', 'Mini Truck', 'Trailer']);
  await upsertLookup('license_categories', 'category_code', ['LMV', 'HMV', 'HGV', 'PSV']);
  await upsertLookup('regions', 'region_name', ['North', 'South', 'East', 'West', 'Central']);
  await seedUsers();
  console.log('Seed data loaded.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
