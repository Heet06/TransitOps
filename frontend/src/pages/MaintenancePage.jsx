import { useState, useEffect } from 'react';
import { authFetch } from '../api.js';

const STATUS_COLORS = {
    OPEN: 'warning',
    IN_PROGRESS: 'info',
    CLOSED: 'success',
};

export default function MaintenancePage() {
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        description: '',
        cost: '',
        scheduled_date: new Date().toISOString().split('T')[0],
        status: 'OPEN'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchLogs = async () => {
        try {
            const res = await authFetch('/api/maintenance');
            if (res.ok) setLogs(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [logRes, vehRes] = await Promise.all([
                    authFetch('/api/maintenance'),
                    authFetch('/api/vehicles'),
                ]);
                if (logRes.ok) setLogs(await logRes.json());
                if (vehRes.ok) setVehicles(await vehRes.json());
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
            const res = await authFetch('/api/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to log maintenance record.');
            } else {
                setFormData({ vehicle_id: '', description: '', cost: '', scheduled_date: new Date().toISOString().split('T')[0], status: 'OPEN' });
                fetchLogs();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async (maintenanceId) => {
        try {
            const res = await authFetch(`/api/maintenance/${maintenanceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CLOSED' })
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to close');
            }
            fetchLogs();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Maintenance Logs</h4>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Log Maintenance</h5>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger small py-2">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Vehicle</label>
                                    <select className="form-select" name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required>
                                        <option value="">-- Select Vehicle --</option>
                                        {vehicles.filter(v => v.status !== 'RETIRED').map(v => (
                                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} – {v.model_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Description</label>
                                    <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} rows="3" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Cost (₹)</label>
                                    <input type="number" className="form-control" name="cost" value={formData.cost} onChange={handleChange} min="0" step="0.01" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Scheduled Date</label>
                                    <input type="date" className="form-control" name="scheduled_date" value={formData.scheduled_date} onChange={handleChange} required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Status</label>
                                    <select className="form-select" name="status" value={formData.status} onChange={handleChange}>
                                        <option value="OPEN">Open</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
                                    {loading ? 'Logging...' : 'Log Maintenance'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">All Maintenance Records</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Description</th>
                                            <th>Cost</th>
                                            <th>Scheduled</th>
                                            <th>Closed</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((log) => (
                                            <tr key={log.maintenance_id}>
                                                <td><span className="fw-medium">{log.registration_number || '—'}</span></td>
                                                <td>{log.description}</td>
                                                <td>₹{Number(log.cost).toLocaleString()}</td>
                                                <td>{new Date(log.scheduled_date).toLocaleDateString()}</td>
                                                <td>{log.closed_date ? new Date(log.closed_date).toLocaleDateString() : '—'}</td>
                                                <td>
                                                    <span className={`badge bg-${STATUS_COLORS[log.status] || 'secondary'} bg-opacity-10 text-${STATUS_COLORS[log.status] || 'secondary'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {log.status !== 'CLOSED' && (
                                                        <button className="btn btn-sm btn-outline-success" onClick={() => handleClose(log.maintenance_id)}>Close</button>
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
