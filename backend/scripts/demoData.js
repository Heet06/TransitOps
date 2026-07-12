const { pool } = require('../db');

const today = new Date();
const isoDate = (offsetDays = 0) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

async function ensureVehicleDocumentsTable(client) {
  await client.query(`
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
  await client.query('CREATE INDEX IF NOT EXISTS idx_vehicle_documents_vehicle ON vehicle_documents(vehicle_id)');
}

async function lookupId(client, table, idColumn, nameColumn, value) {
  const result = await client.query(`SELECT ${idColumn} FROM ${table} WHERE ${nameColumn} = $1`, [value]);
  if (result.rows.length > 0) return result.rows[0][idColumn];
  const inserted = await client.query(`INSERT INTO ${table} (${nameColumn}) VALUES ($1) RETURNING ${idColumn}`, [value]);
  return inserted.rows[0][idColumn];
}

async function adminUserId(client) {
  const result = await client.query("SELECT user_id FROM users WHERE email = 'admin@transitops.io'");
  return result.rows[0]?.user_id || null;
}

async function clearDemoData(client) {
  const demoVehicles = await client.query("SELECT vehicle_id FROM vehicles WHERE registration_number LIKE 'DEMO-%'");
  const demoDrivers = await client.query("SELECT driver_id FROM drivers WHERE license_number LIKE 'DEMO-%'");
  const vehicleIds = demoVehicles.rows.map((row) => row.vehicle_id);
  const driverIds = demoDrivers.rows.map((row) => row.driver_id);

  if (vehicleIds.length > 0) {
    await client.query('DELETE FROM vehicle_documents WHERE vehicle_id = ANY($1::uuid[])', [vehicleIds]);
    await client.query('DELETE FROM fuel_logs WHERE vehicle_id = ANY($1::uuid[])', [vehicleIds]);
    await client.query('DELETE FROM expenses WHERE vehicle_id = ANY($1::uuid[])', [vehicleIds]);
    await client.query('DELETE FROM maintenance_logs WHERE vehicle_id = ANY($1::uuid[])', [vehicleIds]);
    await client.query('DELETE FROM trips WHERE vehicle_id = ANY($1::uuid[])', [vehicleIds]);
    await client.query('DELETE FROM vehicles WHERE vehicle_id = ANY($1::uuid[])', [vehicleIds]);
  }

  if (driverIds.length > 0) {
    await client.query('DELETE FROM trips WHERE driver_id = ANY($1::uuid[])', [driverIds]);
    await client.query('DELETE FROM drivers WHERE driver_id = ANY($1::uuid[])', [driverIds]);
  }
}

async function insertVehicle(client, vehicle) {
  const result = await client.query(
    `INSERT INTO vehicles (registration_number, model_name, vehicle_type_id, region_id, max_load_capacity_kg, odometer_km, acquisition_cost, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      vehicle.registration_number,
      vehicle.model_name,
      vehicle.vehicle_type_id,
      vehicle.region_id,
      vehicle.max_load_capacity_kg,
      vehicle.odometer_km,
      vehicle.acquisition_cost,
      vehicle.status || 'AVAILABLE',
    ]
  );
  return result.rows[0];
}

async function insertDriver(client, driver) {
  const result = await client.query(
    `INSERT INTO drivers (full_name, license_number, license_category_id, license_expiry_date, contact_number, safety_score, status, region_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      driver.full_name,
      driver.license_number,
      driver.license_category_id,
      driver.license_expiry_date,
      driver.contact_number,
      driver.safety_score,
      driver.status || 'AVAILABLE',
      driver.region_id,
    ]
  );
  return result.rows[0];
}

async function insertTrip(client, trip, createdBy) {
  const result = await client.query(
    `INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [trip.source, trip.destination, trip.vehicle_id, trip.driver_id, trip.cargo_weight_kg, trip.planned_distance_km, trip.revenue || 0, createdBy]
  );
  return result.rows[0];
}

async function dispatchTrip(client, tripId) {
  await client.query("UPDATE trips SET status = 'DISPATCHED' WHERE trip_id = $1", [tripId]);
}

async function completeTrip(client, tripId, actualDistance, fuelConsumed, endOdometer, revenue) {
  await client.query(
    `UPDATE trips
     SET status = 'COMPLETED', actual_distance_km = $2, fuel_consumed_l = $3, end_odometer_km = $4, revenue = $5
     WHERE trip_id = $1`,
    [tripId, actualDistance, fuelConsumed, endOdometer, revenue]
  );
}

async function cancelTrip(client, tripId) {
  await client.query("UPDATE trips SET status = 'CANCELLED' WHERE trip_id = $1", [tripId]);
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureVehicleDocumentsTable(client);
    await clearDemoData(client);

    const createdBy = await adminUserId(client);
    const vanType = await lookupId(client, 'vehicle_types', 'vehicle_type_id', 'type_name', 'Van');
    const truckType = await lookupId(client, 'vehicle_types', 'vehicle_type_id', 'type_name', 'Truck');
    const busType = await lookupId(client, 'vehicle_types', 'vehicle_type_id', 'type_name', 'Bus');
    const north = await lookupId(client, 'regions', 'region_id', 'region_name', 'North');
    const south = await lookupId(client, 'regions', 'region_id', 'region_name', 'South');
    const west = await lookupId(client, 'regions', 'region_id', 'region_name', 'West');
    const central = await lookupId(client, 'regions', 'region_id', 'region_name', 'Central');
    const lmv = await lookupId(client, 'license_categories', 'license_category_id', 'category_code', 'LMV');
    const hgv = await lookupId(client, 'license_categories', 'license_category_id', 'category_code', 'HGV');
    const psv = await lookupId(client, 'license_categories', 'license_category_id', 'category_code', 'PSV');

    const van05 = await insertVehicle(client, {
      registration_number: 'DEMO-VAN-05',
      model_name: 'Transit Mini Van',
      vehicle_type_id: vanType,
      region_id: north,
      max_load_capacity_kg: 500,
      odometer_km: 28900,
      acquisition_cost: 900000,
    });
    const truck09 = await insertVehicle(client, {
      registration_number: 'DEMO-TRUCK-09',
      model_name: 'Cargo Plus 9T',
      vehicle_type_id: truckType,
      region_id: west,
      max_load_capacity_kg: 900,
      odometer_km: 49350,
      acquisition_cost: 1450000,
    });
    const bus18 = await insertVehicle(client, {
      registration_number: 'DEMO-BUS-18',
      model_name: 'City Cruiser',
      vehicle_type_id: busType,
      region_id: south,
      max_load_capacity_kg: 1400,
      odometer_km: 66400,
      acquisition_cost: 2200000,
    });
    const retired = await insertVehicle(client, {
      registration_number: 'DEMO-RET-01',
      model_name: 'Legacy Cargo',
      vehicle_type_id: truckType,
      region_id: central,
      max_load_capacity_kg: 750,
      odometer_km: 155800,
      acquisition_cost: 600000,
      status: 'RETIRED',
    });

    const alex = await insertDriver(client, {
      full_name: 'Alex Morgan',
      license_number: 'DEMO-DL-45A',
      license_category_id: lmv,
      license_expiry_date: isoDate(210),
      contact_number: '+91 90000 10001',
      safety_score: 94,
      region_id: north,
    });
    const priya = await insertDriver(client, {
      full_name: 'Priya Shah',
      license_number: 'DEMO-DL-12K',
      license_category_id: hgv,
      license_expiry_date: isoDate(18),
      contact_number: '+91 90000 10002',
      safety_score: 88,
      region_id: west,
    });
    const ravi = await insertDriver(client, {
      full_name: 'Ravi Kumar',
      license_number: 'DEMO-DL-77P',
      license_category_id: psv,
      license_expiry_date: isoDate(120),
      contact_number: '+91 90000 10003',
      safety_score: 91,
      region_id: south,
    });
    await insertDriver(client, {
      full_name: 'Marcus Lee',
      license_number: 'DEMO-DL-67Z',
      license_category_id: lmv,
      license_expiry_date: isoDate(-12),
      contact_number: '+91 90000 10004',
      safety_score: 71,
      status: 'SUSPENDED',
      region_id: central,
    });
    await insertDriver(client, {
      full_name: 'Neha Verma',
      license_number: 'DEMO-DL-30N',
      license_category_id: hgv,
      license_expiry_date: isoDate(8),
      contact_number: '+91 90000 10005',
      safety_score: 83,
      status: 'OFF_DUTY',
      region_id: north,
    });

    const completedVanTrip = await insertTrip(client, {
      source: 'Depot A',
      destination: 'Central Market',
      vehicle_id: van05.vehicle_id,
      driver_id: alex.driver_id,
      cargo_weight_kg: 450,
      planned_distance_km: 74,
      revenue: 14800,
    }, createdBy);
    await dispatchTrip(client, completedVanTrip.trip_id);
    await completeTrip(client, completedVanTrip.trip_id, 78, 9.5, 28978, 15200);

    const activeBusTrip = await insertTrip(client, {
      source: 'South Hub',
      destination: 'Airport Terminal',
      vehicle_id: bus18.vehicle_id,
      driver_id: ravi.driver_id,
      cargo_weight_kg: 900,
      planned_distance_km: 112,
      revenue: 23500,
    }, createdBy);
    await dispatchTrip(client, activeBusTrip.trip_id);

    const cancelledTrip = await insertTrip(client, {
      source: 'Warehouse 4',
      destination: 'North Ridge',
      vehicle_id: van05.vehicle_id,
      driver_id: alex.driver_id,
      cargo_weight_kg: 210,
      planned_distance_km: 46,
      revenue: 6500,
    }, createdBy);
    await cancelTrip(client, cancelledTrip.trip_id);

    await insertTrip(client, {
      source: 'Central Depot',
      destination: 'Retail Cluster B',
      vehicle_id: van05.vehicle_id,
      driver_id: alex.driver_id,
      cargo_weight_kg: 320,
      planned_distance_km: 58,
      revenue: 8800,
    }, createdBy);

    await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, scheduled_date, status, created_by)
       VALUES ($1, 'Oil change and tire rotation', 8200, $2, 'OPEN', $3)`,
      [truck09.vehicle_id, isoDate(0), createdBy]
    );
    await client.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, cost, scheduled_date, status, closed_date, created_by)
       VALUES ($1, 'Brake inspection', 5400, $2, 'CLOSED', $3, $4)`,
      [van05.vehicle_id, isoDate(-16), isoDate(-14), createdBy]
    );

    await client.query(
      `INSERT INTO fuel_logs (vehicle_id, trip_id, liters, cost, log_date, created_by)
       VALUES ($1, $2, 42.5, 4250, $3, $4), ($5, $6, 56.2, 5900, $7, $4), ($8, NULL, 38.0, 3800, $9, $4)`,
      [van05.vehicle_id, completedVanTrip.trip_id, isoDate(-2), createdBy, bus18.vehicle_id, activeBusTrip.trip_id, isoDate(-1), truck09.vehicle_id, isoDate(0)]
    );
    await client.query(
      `INSERT INTO expenses (vehicle_id, trip_id, expense_type, amount, expense_date, notes, created_by)
       VALUES
       ($1, $2, 'TOLL', 950, $3, 'Expressway toll', $4),
       ($1, NULL, 'INSURANCE', 12500, $5, 'Quarterly insurance premium', $4),
       ($6, NULL, 'MAINTENANCE', 8200, $7, 'Oil and tires', $4),
       ($8, $9, 'OTHER', 1600, $10, 'Airport loading fee', $4)`,
      [van05.vehicle_id, completedVanTrip.trip_id, isoDate(-2), createdBy, isoDate(-28), truck09.vehicle_id, isoDate(0), bus18.vehicle_id, activeBusTrip.trip_id, isoDate(-1)]
    );

    await client.query(
      `INSERT INTO vehicle_documents (vehicle_id, document_type, document_name, document_url, expiry_date, created_by)
       VALUES
       ($1, 'REGISTRATION', 'Registration certificate', 'https://example.com/demo/van-05-registration.pdf', $2, $6),
       ($1, 'INSURANCE', 'Insurance policy', 'https://example.com/demo/van-05-insurance.pdf', $3, $6),
       ($4, 'PERMIT', 'State road permit', 'https://example.com/demo/truck-09-permit.pdf', $5, $6),
       ($7, 'FITNESS', 'Fitness certificate', 'https://example.com/demo/bus-18-fitness.pdf', $8, $6),
       ($9, 'OTHER', 'Retirement inspection note', 'https://example.com/demo/ret-01-note.pdf', NULL, $6)`,
      [van05.vehicle_id, isoDate(330), isoDate(22), truck09.vehicle_id, isoDate(16), createdBy, bus18.vehicle_id, isoDate(95), retired.vehicle_id]
    );

    await client.query('COMMIT');
    console.log('Demo data loaded.');
    console.log('Use DEMO-VAN-05 and Alex Morgan to demonstrate the capacity-valid dispatch workflow.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { isoDate };
