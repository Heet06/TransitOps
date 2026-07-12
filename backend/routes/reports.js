const express = require('express');
const { pool } = require('../db');
const { rowsToCsv, buildSimplePdf, sendDbError } = require('../utils/http');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const [vehicleStats, tripStats, fuelStats, maintenanceStats, expenseStats] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS total_vehicles,
          COUNT(*) FILTER (WHERE status = 'AVAILABLE')::int AS available,
          COUNT(*) FILTER (WHERE status = 'ON_TRIP')::int AS on_trip,
          COUNT(*) FILTER (WHERE status = 'IN_SHOP')::int AS in_shop,
          COUNT(*) FILTER (WHERE status = 'RETIRED')::int AS retired,
          ROUND(COUNT(*) FILTER (WHERE status = 'ON_TRIP') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status != 'RETIRED'), 0), 1) AS utilization_pct
        FROM vehicles
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_trips,
          COUNT(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
          COUNT(*) FILTER (WHERE status = 'DISPATCHED')::int AS active,
          COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS draft,
          COUNT(*) FILTER (WHERE status = 'CANCELLED')::int AS cancelled
        FROM trips
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(liters), 0) AS total_fuel_liters,
          COALESCE(SUM(cost), 0) AS total_fuel_cost
        FROM fuel_logs
      `),
      pool.query(`
        SELECT
          COUNT(*)::int AS total_records,
          COUNT(*) FILTER (WHERE status IN ('OPEN', 'IN_PROGRESS'))::int AS open_count,
          COALESCE(SUM(cost), 0) AS total_cost
        FROM maintenance_logs
      `),
      pool.query(`
        SELECT
          COALESCE(SUM(amount), 0) AS total_expenses,
          COALESCE(SUM(amount) FILTER (WHERE expense_type = 'FUEL'), 0) AS fuel,
          COALESCE(SUM(amount) FILTER (WHERE expense_type = 'MAINTENANCE'), 0) AS maintenance,
          COALESCE(SUM(amount) FILTER (WHERE expense_type = 'TOLL'), 0) AS toll,
          COALESCE(SUM(amount) FILTER (WHERE expense_type = 'INSURANCE'), 0) AS insurance,
          COALESCE(SUM(amount) FILTER (WHERE expense_type = 'OTHER'), 0) AS other
        FROM expenses
      `),
    ]);

    const perVehicle = await pool.query(`
      SELECT
        v.vehicle_id,
        v.registration_number,
        v.model_name,
        v.acquisition_cost,
        COALESCE(fuel.total_cost, 0) AS fuel_cost,
        COALESCE(maint.total_cost, 0) AS maintenance_cost,
        COALESCE(exp.total_cost, 0) AS other_expense_cost,
        COALESCE(trip.revenue, 0) AS revenue,
        COALESCE(fuel.total_liters, 0) AS fuel_liters,
        COALESCE(trip.trip_fuel_liters, 0) AS trip_fuel_liters,
        COALESCE(trip.total_distance, 0) AS total_distance
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) AS total_cost, SUM(liters) AS total_liters
        FROM fuel_logs GROUP BY vehicle_id
      ) fuel ON v.vehicle_id = fuel.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(cost) AS total_cost
        FROM maintenance_logs GROUP BY vehicle_id
      ) maint ON v.vehicle_id = maint.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(amount) AS total_cost
        FROM expenses GROUP BY vehicle_id
      ) exp ON v.vehicle_id = exp.vehicle_id
      LEFT JOIN (
        SELECT vehicle_id, SUM(revenue) AS revenue, SUM(COALESCE(actual_distance_km, planned_distance_km)) AS total_distance, SUM(COALESCE(fuel_consumed_l, 0)) AS trip_fuel_liters
        FROM trips WHERE status = 'COMPLETED' GROUP BY vehicle_id
      ) trip ON v.vehicle_id = trip.vehicle_id
      WHERE v.status != 'RETIRED'
      ORDER BY v.registration_number
    `);

    const vehicleDetails = perVehicle.rows.map(v => {
      const totalCost = Number(v.fuel_cost) + Number(v.maintenance_cost) + Number(v.other_expense_cost);
      const revenue = Number(v.revenue);
      const acquisitionCost = Number(v.acquisition_cost) || 1;
      const roi = ((revenue - totalCost) / acquisitionCost * 100).toFixed(1);
      const litersForEfficiency = Number(v.trip_fuel_liters) > 0 ? Number(v.trip_fuel_liters) : Number(v.fuel_liters);
      const fuelEfficiency = litersForEfficiency > 0 ? (Number(v.total_distance) / litersForEfficiency).toFixed(1) : 'N/A';

      return {
        vehicle_id: v.vehicle_id,
        registration_number: v.registration_number,
        model_name: v.model_name,
        fuel_cost: Number(v.fuel_cost),
        maintenance_cost: Number(v.maintenance_cost),
        other_expense_cost: Number(v.other_expense_cost),
        total_cost: totalCost,
        revenue: revenue,
        roi: roi + '%',
        fuel_efficiency: fuelEfficiency === 'N/A' ? 'N/A' : fuelEfficiency + ' km/L',
        total_distance: Number(v.total_distance),
        fuel_liters: Number(v.fuel_liters),
        trip_fuel_liters: Number(v.trip_fuel_liters),
      };
    });

    res.json({
      overview: {
        vehicles: vehicleStats.rows[0],
        trips: tripStats.rows[0],
        fuel: fuelStats.rows[0],
        maintenance: maintenanceStats.rows[0],
        expenses: expenseStats.rows[0],
      },
      perVehicle: vehicleDetails,
    });
  } catch (err) {
    sendDbError(res, err);
  }
});

router.get('/export/csv', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.trip_id,
        t.source,
        t.destination,
        v.registration_number,
        d.full_name AS driver_name,
        t.cargo_weight_kg,
        t.planned_distance_km,
        t.actual_distance_km,
        t.fuel_consumed_l,
        t.revenue,
        t.status,
        t.dispatched_at,
        t.completed_at
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.vehicle_id
      LEFT JOIN drivers d ON t.driver_id = d.driver_id
      ORDER BY t.created_at DESC
    `);

    const csv = rowsToCsv([
      { key: 'trip_id', label: 'Trip ID' },
      { key: 'source', label: 'Source' },
      { key: 'destination', label: 'Destination' },
      { key: 'registration_number', label: 'Vehicle' },
      { key: 'driver_name', label: 'Driver' },
      { key: 'cargo_weight_kg', label: 'Cargo (kg)' },
      { key: 'planned_distance_km', label: 'Planned Dist (km)' },
      { key: 'actual_distance_km', label: 'Actual Dist (km)' },
      { key: 'fuel_consumed_l', label: 'Fuel (L)' },
      { key: 'revenue', label: 'Revenue' },
      { key: 'status', label: 'Status' },
      { key: 'dispatched_at', label: 'Dispatched At' },
      { key: 'completed_at', label: 'Completed At' },
    ], result.rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transitops_trips_export.csv');
    res.send(csv);
  } catch (err) {
    sendDbError(res, err);
  }
});

router.get('/export/pdf', async (_req, res) => {
  try {
    const summary = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE v.status != 'RETIRED')::int AS active_vehicles,
        COUNT(*) FILTER (WHERE v.status = 'AVAILABLE')::int AS available_vehicles,
        COUNT(*) FILTER (WHERE v.status = 'ON_TRIP')::int AS vehicles_on_trip,
        COUNT(*) FILTER (WHERE v.status = 'IN_SHOP')::int AS vehicles_in_shop,
        COALESCE(SUM(f.cost), 0) AS total_fuel_cost,
        COALESCE(SUM(m.cost), 0) AS total_maintenance_cost,
        COALESCE(SUM(e.amount), 0) AS total_expenses,
        COALESCE(SUM(t.revenue), 0) AS total_revenue
      FROM vehicles v
      LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM fuel_logs GROUP BY vehicle_id) f ON f.vehicle_id = v.vehicle_id
      LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM maintenance_logs GROUP BY vehicle_id) m ON m.vehicle_id = v.vehicle_id
      LEFT JOIN (SELECT vehicle_id, SUM(amount) AS amount FROM expenses GROUP BY vehicle_id) e ON e.vehicle_id = v.vehicle_id
      LEFT JOIN (SELECT vehicle_id, SUM(revenue) AS revenue FROM trips WHERE status = 'COMPLETED' GROUP BY vehicle_id) t ON t.vehicle_id = v.vehicle_id
    `);
    const result = await pool.query(`
      SELECT v.registration_number, v.model_name, v.status,
             COALESCE(t.completed, 0) AS completed_trips,
             COALESCE(t.distance, 0) AS distance_km,
             COALESCE(f.cost, 0) AS fuel_cost,
             COALESCE(m.cost, 0) AS maintenance_cost
      FROM vehicles v
      LEFT JOIN (
        SELECT vehicle_id, COUNT(*) AS completed, SUM(COALESCE(actual_distance_km, planned_distance_km)) AS distance
        FROM trips WHERE status = 'COMPLETED' GROUP BY vehicle_id
      ) t ON t.vehicle_id = v.vehicle_id
      LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM fuel_logs GROUP BY vehicle_id) f ON f.vehicle_id = v.vehicle_id
      LEFT JOIN (SELECT vehicle_id, SUM(cost) AS cost FROM maintenance_logs GROUP BY vehicle_id) m ON m.vehicle_id = v.vehicle_id
      ORDER BY v.registration_number
      LIMIT 42
    `);

    const s = summary.rows[0];
    const lines = [
      `Generated: ${new Date().toISOString()}`,
      `Active vehicles: ${s.active_vehicles} | Available: ${s.available_vehicles} | On trip: ${s.vehicles_on_trip} | In shop: ${s.vehicles_in_shop}`,
      `Revenue: INR ${s.total_revenue} | Fuel: INR ${s.total_fuel_cost} | Maintenance: INR ${s.total_maintenance_cost} | Expenses: INR ${s.total_expenses}`,
      '',
      'Vehicle Performance',
      ...result.rows.map((row) =>
        `${row.registration_number} | ${row.model_name} | ${row.status} | completed trips ${row.completed_trips} | ${row.distance_km} km | fuel INR ${row.fuel_cost} | maintenance INR ${row.maintenance_cost}`
      ),
    ];

    const pdf = buildSimplePdf('TransitOps Operations Report', lines);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=transitops_operations_report.pdf');
    res.send(pdf);
  } catch (err) {
    sendDbError(res, err);
  }
});

module.exports = router;
