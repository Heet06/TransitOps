import { useState, useEffect } from 'react';
import { authFetch } from '../api.js';

export default function ReportsPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await authFetch('/api/reports/stats');
                if (res.ok) setStats(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleExport = () => {
        authFetch('/api/reports/export/csv')
        .then(res => res.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transitops_trips_export.csv';
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch(err => console.error(err));
    };

    const handlePdfExport = () => {
        authFetch('/api/reports/export/pdf')
        .then(res => res.blob())
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transitops_operations_report.pdf';
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch(err => console.error(err));
    };

    if (loading) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (!stats) return <div className="text-center py-5 text-muted">Failed to load reports data.</div>;

    const { overview, perVehicle } = stats;
    const v = overview.vehicles;
    const t = overview.trips;
    const f = overview.fuel;
    const e = overview.expenses;

    const avgEfficiency = perVehicle.length > 0
        ? (perVehicle
            .filter(x => (x.trip_fuel_liters || x.fuel_liters) > 0)
            .reduce((s, x) => s + x.total_distance / (x.trip_fuel_liters || x.fuel_liters), 0) / perVehicle.filter(x => (x.trip_fuel_liters || x.fuel_liters) > 0).length || 0).toFixed(1)
        : '0';

    const reportCards = [
        { title: 'Fleet Utilization', metric: (v.utilization_pct || 0) + '%', trend: v.available + ' of ' + v.total_vehicles + ' available' },
        { title: 'Avg Fuel Efficiency', metric: avgEfficiency + ' km/L', trend: Number(f.total_fuel_liters || 0).toLocaleString() + ' L consumed' },
        { title: 'Total Expenses', metric: '₹' + Number(e.total_expenses || 0).toLocaleString(), trend: 'across all categories' },
        { title: 'Trip Completion', metric: t.completed + '/' + t.total_trips, trend: t.active + ' active, ' + t.draft + ' drafts' },
    ];

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div></div>
                <div className="btn-group btn-group-sm">
                    <button className="btn btn-outline-primary" onClick={handleExport}>Export CSV</button>
                    <button className="btn btn-outline-primary" onClick={handlePdfExport}>Export PDF</button>
                </div>
            </div>

            <div className="row g-4 mb-4">
                {reportCards.map((report, idx) => (
                    <div className="col-12 col-md-6 col-xl-3" key={idx}>
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted small fw-bold mb-2">{report.title}</h6>
                                <h3 className="mb-2 fw-bold">{report.metric}</h3>
                                <span className="badge bg-primary bg-opacity-10 text-primary">{report.trend}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4 mb-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Vehicle Performance</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Model</th>
                                            <th>Fuel (L)</th>
                                            <th>Distance (km)</th>
                                            <th>Efficiency</th>
                                            <th>Fuel Cost</th>
                                            <th>Maint. Cost</th>
                                            <th>Revenue</th>
                                            <th>ROI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {perVehicle.map((v) => (
                                            <tr key={v.vehicle_id}>
                                                <td><span className="fw-medium">{v.registration_number}</span></td>
                                                <td>{v.model_name}</td>
                                                <td>{Number(v.fuel_liters).toLocaleString()}</td>
                                                <td>{Number(v.total_distance).toLocaleString()}</td>
                                                <td>{v.fuel_efficiency}</td>
                                                <td>₹{Number(v.fuel_cost).toLocaleString()}</td>
                                                <td>₹{Number(v.maintenance_cost).toLocaleString()}</td>
                                                <td>₹{Number(v.revenue).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge ${parseFloat(v.roi) >= 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 text-${parseFloat(v.roi) >= 0 ? 'success' : 'danger'}`}>
                                                        {v.roi}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {perVehicle.length === 0 && (
                                            <tr><td colSpan="9" className="text-center text-muted py-4">No vehicle data yet.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Expense Breakdown</h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Tolls</span><span className="fw-bold">₹{Number(e.toll || 0).toLocaleString()}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Insurance</span><span className="fw-bold">₹{Number(e.insurance || 0).toLocaleString()}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Other</span><span className="fw-bold">₹{Number(e.other || 0).toLocaleString()}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between bg-light">
                                    <span className="fw-bold">Total</span><span className="fw-bold">₹{Number(e.total_expenses || 0).toLocaleString()}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Trip Summary</h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Total Trips</span><span className="fw-bold">{t.total_trips}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Completed</span><span className="fw-bold text-success">{t.completed}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Active (Dispatched)</span><span className="fw-bold text-info">{t.active}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Drafts</span><span className="fw-bold text-secondary">{t.draft}</span>
                                </li>
                                <li className="list-group-item d-flex justify-content-between">
                                    <span>Cancelled</span><span className="fw-bold text-danger">{t.cancelled}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
