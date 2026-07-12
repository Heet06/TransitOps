const express = require('express');
const { pool } = require('../db');

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
          ROUND(COUNT(*) FILTER (WHERE status != 'RETIRED' AND status != 'IN_SHOP') * 100.0 / NULLIF(COUNT(*) FILTER (WHERE status != 'RETIRED'), 0), 1) AS utilization_pct
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
        SELECT vehicle_id, SUM(revenue) AS revenue, SUM(COALESCE(actual_distance_km, planned_distance_km)) AS total_distance
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
      const fuelEfficiency = Number(v.fuel_liters) > 0 ? (Number(v.total_distance) / Number(v.fuel_liters)).toFixed(1) : 'N/A';

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
    res.status(500).json({ error: err.message });
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

    const headers = ['Trip ID', 'Source', 'Destination', 'Vehicle', 'Driver', 'Cargo (kg)', 'Planned Dist (km)', 'Actual Dist (km)', 'Fuel (L)', 'Revenue', 'Status', 'Dispatched At', 'Completed At'];
    const csvRows = [headers.join(',')];

    for (const row of result.rows) {
      csvRows.push([
        row.trip_id,
        `"${row.source}"`,
        `"${row.destination}"`,
        row.registration_number,
        `"${row.driver_name}"`,
        row.cargo_weight_kg,
        row.planned_distance_km,
        row.actual_distance_km || '',
        row.fuel_consumed_l || '',
        row.revenue || 0,
        row.status,
        row.dispatched_at || '',
        row.completed_at || '',
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=transitops_trips_export.csv');
    res.send(csvRows.join('\n'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
