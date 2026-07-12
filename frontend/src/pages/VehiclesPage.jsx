import { useState, useEffect } from 'react';
import { authFetch } from '../api.js';

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [formData, setFormData] = useState({
        registration_number: '',
        model_name: '',
        vehicle_type_id: '',
        max_load_capacity_kg: '',
        acquisition_cost: '',
        status: 'AVAILABLE'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchVehicles = async () => {
        try {
            const res = await authFetch('/api/vehicles');
            if (res.ok) setVehicles(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [vehRes, typeRes] = await Promise.all([
                    authFetch('/api/vehicles'),
                    authFetch('/api/vehicle-types'),
                ]);
                if (vehRes.ok) setVehicles(await vehRes.json());
                if (typeRes.ok) setVehicleTypes(await typeRes.json());
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
            const res = await authFetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to register vehicle.');
            } else {
                setFormData({ registration_number: '', model_name: '', vehicle_type_id: '', max_load_capacity_kg: '', acquisition_cost: '', status: 'AVAILABLE' });
                fetchVehicles();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const STATUS_COLORS = { AVAILABLE: 'success', ON_TRIP: 'primary', IN_SHOP: 'warning', RETIRED: 'danger' };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Vehicle Registry</h4>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Add New Vehicle</h5>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger small py-2">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Registration Number</label>
                                    <input type="text" className="form-control" name="registration_number" value={formData.registration_number} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Model Name</label>
                                    <input type="text" className="form-control" name="model_name" value={formData.model_name} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Vehicle Type</label>
                                    <select className="form-select" name="vehicle_type_id" value={formData.vehicle_type_id} onChange={handleChange} required>
                                        <option value="">-- Select Type --</option>
                                        {vehicleTypes.map(vt => (
                                            <option key={vt.vehicle_type_id} value={vt.vehicle_type_id}>{vt.type_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Max Load Capacity (kg)</label>
                                    <input type="number" className="form-control" name="max_load_capacity_kg" value={formData.max_load_capacity_kg} onChange={handleChange} min="0.01" step="0.01" required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Acquisition Cost (₹)</label>
                                    <input type="number" className="form-control" name="acquisition_cost" value={formData.acquisition_cost} onChange={handleChange} min="0" step="0.01" required />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
                                    {loading ? 'Registering...' : 'Register Vehicle'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Fleet List</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Registration</th>
                                            <th>Model Name</th>
                                            <th>Capacity (kg)</th>
                                            <th>Cost (₹)</th>
                                            <th>Odometer (km)</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicles.map((v) => (
                                            <tr key={v.vehicle_id}>
                                                <td><span className="fw-medium">{v.registration_number}</span></td>
                                                <td>{v.model_name}</td>
                                                <td>{Number(v.max_load_capacity_kg).toLocaleString()}</td>
                                                <td>₹{Number(v.acquisition_cost).toLocaleString()}</td>
                                                <td>{Number(v.odometer_km).toLocaleString()}</td>
                                                <td>
                                                    <span className={`badge bg-${STATUS_COLORS[v.status] || 'secondary'} bg-opacity-10 text-${STATUS_COLORS[v.status] || 'secondary'}`}>
                                                        {v.status}
                                                    </span>
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
