import { useState, useEffect } from 'react';

export default function DriversPage() {
    const [drivers, setDrivers] = useState([]);
    const [licenseCategories, setLicenseCategories] = useState([]);
    const [formData, setFormData] = useState({
        full_name: '',
        license_number: '',
        license_category_id: '',
        license_expiry_date: '',
        contact_number: '',
        safety_score: 100,
        status: 'AVAILABLE'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchDrivers = async () => {
        try {
            const res = await fetch('/api/drivers');
            if (res.ok) setDrivers(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [drvRes, catRes] = await Promise.all([
                    fetch('/api/drivers'),
                    fetch('/api/license-categories'),
                ]);
                if (drvRes.ok) setDrivers(await drvRes.json());
                if (catRes.ok) setLicenseCategories(await catRes.json());
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
            const res = await fetch('/api/drivers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to register driver.');
            } else {
                setFormData({ full_name: '', license_number: '', license_category_id: '', license_expiry_date: '', contact_number: '', safety_score: 100, status: 'AVAILABLE' });
                fetchDrivers();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const STATUS_COLORS = { AVAILABLE: 'primary', ON_TRIP: 'info', OFF_DUTY: 'secondary', SUSPENDED: 'danger' };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Drivers & Safety Profiles</h4>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Add New Driver</h5>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger small py-2">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Full Name</label>
                                    <input type="text" className="form-control" name="full_name" value={formData.full_name} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">License Number</label>
                                    <input type="text" className="form-control" name="license_number" value={formData.license_number} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">License Category</label>
                                    <select className="form-select" name="license_category_id" value={formData.license_category_id} onChange={handleChange} required>
                                        <option value="">-- Select Category --</option>
                                        {licenseCategories.map(c => (
                                            <option key={c.license_category_id} value={c.license_category_id}>{c.category_code}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">License Expiry Date</label>
                                    <input type="date" className="form-control" name="license_expiry_date" value={formData.license_expiry_date} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Contact Number</label>
                                    <input type="text" className="form-control" name="contact_number" value={formData.contact_number} onChange={handleChange} required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Safety Score (0–100)</label>
                                    <input type="number" className="form-control" name="safety_score" value={formData.safety_score} onChange={handleChange} min="0" max="100" required />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
                                    {loading ? 'Registering...' : 'Register Driver'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Driver Profiles</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>License No</th>
                                            <th>Contact</th>
                                            <th>Expiry</th>
                                            <th>Safety Score</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map((d) => (
                                            <tr key={d.driver_id}>
                                                <td><span className="fw-medium">{d.full_name}</span></td>
                                                <td>{d.license_number}</td>
                                                <td>{d.contact_number}</td>
                                                <td>{new Date(d.license_expiry_date).toLocaleDateString()}</td>
                                                <td>
                                                    <div className="d-flex align-items-center gap-2">
                                                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                                                            <div
                                                                className={`progress-bar ${d.safety_score >= 90 ? 'bg-success' : d.safety_score >= 75 ? 'bg-warning' : 'bg-danger'}`}
                                                                role="progressbar"
                                                                style={{ width: `${d.safety_score}%` }}
                                                                aria-valuenow={d.safety_score}
                                                                aria-valuemin="0"
                                                                aria-valuemax="100"
                                                            />
                                                        </div>
                                                        <span className="small text-muted">{d.safety_score}%</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`badge bg-${STATUS_COLORS[d.status] || 'secondary'} bg-opacity-10 text-${STATUS_COLORS[d.status] || 'secondary'}`}>
                                                        {d.status}
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