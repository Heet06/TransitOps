import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../api.js';

const STATUS_COLORS = {
    DRAFT: 'secondary',
    DISPATCHED: 'info',
    COMPLETED: 'success',
    CANCELLED: 'danger',
};

export default function TripsPage() {
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [filters, setFilters] = useState({ search: '', status: '', sort: 'created_at' });
    const [completingTrip, setCompletingTrip] = useState(null);
    const [completionForm, setCompletionForm] = useState({ actual_distance_km: '', fuel_consumed_l: '', end_odometer_km: '', revenue: '' });
    const [formData, setFormData] = useState({
        source: '',
        destination: '',
        vehicle_id: '',
        driver_id: '',
        cargo_weight_kg: '',
        planned_distance_km: '',
        revenue: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchTrips = async () => {
        try {
            const [tripRes, vehRes, drvRes] = await Promise.all([
                authFetch('/api/trips'),
                authFetch('/api/vehicles'),
                authFetch('/api/drivers'),
            ]);
            if (tripRes.ok) setTrips(await tripRes.json());
            if (vehRes.ok) setVehicles(await vehRes.json());
            if (drvRes.ok) setDrivers(await drvRes.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [tripRes, vehRes, drvRes] = await Promise.all([
                    authFetch('/api/trips'),
                    authFetch('/api/vehicles'),
                    authFetch('/api/drivers'),
                ]);
                if (tripRes.ok) setTrips(await tripRes.json());
                if (vehRes.ok) setVehicles(await vehRes.json());
                if (drvRes.ok) setDrivers(await drvRes.json());
            } catch (err) {
                console.error(err);
            }
        };
        init();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authFetch('/api/trips', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: formData.source,
                    destination: formData.destination,
                    vehicle_id: formData.vehicle_id,
                    driver_id: formData.driver_id,
                    cargo_weight_kg: Number(formData.cargo_weight_kg),
                    planned_distance_km: Number(formData.planned_distance_km),
                    revenue: Number(formData.revenue || 0),
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to dispatch trip.');
            } else {
                setFormData({ source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight_kg: '', planned_distance_km: '', revenue: '' });
                fetchTrips();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDispatch = async (tripId) => {
        try {
            const res = await authFetch(`/api/trips/${tripId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DISPATCHED' })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to dispatch');
            }
            fetchTrips();
        } catch (err) {
            console.error(err);
        }
    };

    const startComplete = (trip) => {
        setCompletingTrip(trip);
        setCompletionForm({
            actual_distance_km: trip.actual_distance_km || trip.planned_distance_km || '',
            fuel_consumed_l: trip.fuel_consumed_l || '',
            end_odometer_km: '',
            revenue: trip.revenue || '',
        });
    };

    const submitComplete = async (e) => {
        e.preventDefault();
        if (!completingTrip) return;
        try {
            const res = await authFetch(`/api/trips/${completingTrip.trip_id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'COMPLETED',
                    actual_distance_km: Number(completionForm.actual_distance_km),
                    fuel_consumed_l: Number(completionForm.fuel_consumed_l),
                    end_odometer_km: Number(completionForm.end_odometer_km),
                    revenue: Number(completionForm.revenue || 0)
                })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to complete');
            } else {
                setCompletingTrip(null);
                setCompletionForm({ actual_distance_km: '', fuel_consumed_l: '', end_odometer_km: '', revenue: '' });
            }
            fetchTrips();
        } catch (err) {
            console.error(err);
        }
    };

    const visibleTrips = useMemo(() => {
        const needle = filters.search.trim().toLowerCase();
        return [...trips]
            .filter((trip) => !filters.status || trip.status === filters.status)
            .filter((trip) => !needle || [trip.source, trip.destination, trip.registration_number, trip.driver_name, trip.status].join(' ').toLowerCase().includes(needle))
            .sort((a, b) => {
                if (filters.sort === 'planned_distance_km') return Number(b.planned_distance_km || 0) - Number(a.planned_distance_km || 0);
                if (filters.sort === 'status') return String(a.status).localeCompare(String(b.status));
                return String(b.created_at || '').localeCompare(String(a.created_at || ''));
            });
    }, [trips, filters]);

    const handleCancel = async (tripId) => {
        if (!confirm('Cancel this trip?')) return;
        try {
            const res = await authFetch(`/api/trips/${tripId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to cancel');
            }
            fetchTrips();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Trip Dispatching</h4>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Dispatch New Trip</h5>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger small py-2">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Source</label>
                                    <input type="text" className="form-control" name="source" value={formData.source} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Destination</label>
                                    <input type="text" className="form-control" name="destination" value={formData.destination} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Vehicle</label>
                                    <select className="form-select" name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required>
                                        <option value="">-- Select Vehicle --</option>
                                        {vehicles.filter(v => v.status === 'AVAILABLE').map(v => (
                                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} – {v.model_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Driver</label>
                                    <select className="form-select" name="driver_id" value={formData.driver_id} onChange={handleChange} required>
                                        <option value="">-- Select Driver --</option>
                                        {drivers.filter(d => d.status === 'AVAILABLE' && new Date(d.license_expiry_date) >= new Date(new Date().toISOString().slice(0, 10))).map(d => (
                                            <option key={d.driver_id} value={d.driver_id}>{d.full_name} – {d.license_number}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Cargo Weight (kg)</label>
                                    <input type="number" className="form-control" name="cargo_weight_kg" value={formData.cargo_weight_kg} onChange={handleChange} min="0.01" step="0.01" required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Planned Distance (km)</label>
                                    <input type="number" className="form-control" name="planned_distance_km" value={formData.planned_distance_km} onChange={handleChange} min="0.01" step="0.01" required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Revenue (₹)</label>
                                    <input type="number" className="form-control" name="revenue" value={formData.revenue} onChange={handleChange} min="0" step="0.01" />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
                                    {loading ? 'Creating...' : 'Create Trip'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    {completingTrip && (
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-transparent border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Complete Trip: {completingTrip.source} to {completingTrip.destination}</h5>
                                <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => setCompletingTrip(null)}>Cancel</button>
                            </div>
                            <div className="card-body">
                                <form className="row g-3" onSubmit={submitComplete}>
                                    <div className="col-md-3">
                                        <label className="form-label text-muted small fw-bold">Actual Distance (km)</label>
                                        <input type="number" className="form-control" value={completionForm.actual_distance_km} onChange={(e) => setCompletionForm({ ...completionForm, actual_distance_km: e.target.value })} min="0" step="0.01" required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label text-muted small fw-bold">Fuel Consumed (L)</label>
                                        <input type="number" className="form-control" value={completionForm.fuel_consumed_l} onChange={(e) => setCompletionForm({ ...completionForm, fuel_consumed_l: e.target.value })} min="0" step="0.01" required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label text-muted small fw-bold">End Odometer</label>
                                        <input type="number" className="form-control" value={completionForm.end_odometer_km} onChange={(e) => setCompletionForm({ ...completionForm, end_odometer_km: e.target.value })} min="0" step="0.01" required />
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label text-muted small fw-bold">Revenue (₹)</label>
                                        <input type="number" className="form-control" value={completionForm.revenue} onChange={(e) => setCompletionForm({ ...completionForm, revenue: e.target.value })} min="0" step="0.01" />
                                    </div>
                                    <div className="col-12">
                                        <button className="btn btn-success" type="submit">Complete Trip</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4">
                            <div className="row g-2 align-items-center">
                                <div className="col-md-4"><h5 className="fw-bold mb-0">All Trips</h5></div>
                                <div className="col-md-3"><input className="form-control" placeholder="Search trips" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
                                <div className="col-md-2"><select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Status</option><option value="DRAFT">Draft</option><option value="DISPATCHED">Dispatched</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
                                <div className="col-md-3"><select className="form-select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="created_at">Newest first</option><option value="status">Status</option><option value="planned_distance_km">Distance</option></select></div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Source</th>
                                            <th>Destination</th>
                                            <th>Vehicle</th>
                                            <th>Driver</th>
                                            <th>Distance (km)</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleTrips.map((t) => (
                                            <tr key={t.trip_id}>
                                                <td>{t.source}</td>
                                                <td>{t.destination}</td>
                                                <td><span className="fw-medium">{t.registration_number || '—'}</span></td>
                                                <td>{t.driver_name || '—'}</td>
                                                <td>{t.planned_distance_km}</td>
                                                <td>
                                                    <span className={`badge bg-${STATUS_COLORS[t.status] || 'secondary'} bg-opacity-10 text-${STATUS_COLORS[t.status] || 'secondary'}`}>
                                                        {t.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {t.status === 'DRAFT' && (
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleDispatch(t.trip_id)}>Dispatch</button>
                                                    )}
                                                    {t.status === 'DISPATCHED' && (
                                                        <>
                                                            <button className="btn btn-sm btn-outline-success me-1" onClick={() => startComplete(t)}>Complete</button>
                                                            <button className="btn btn-sm btn-outline-danger" onClick={() => handleCancel(t.trip_id)}>Cancel</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
