import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../api.js';

const emptyDriver = {
    full_name: '',
    license_number: '',
    license_category_id: '',
    license_expiry_date: '',
    contact_number: '',
    safety_score: 100,
    status: 'AVAILABLE',
    region_id: ''
};

export default function DriversPage() {
    const [drivers, setDrivers] = useState([]);
    const [licenseCategories, setLicenseCategories] = useState([]);
    const [regions, setRegions] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [formData, setFormData] = useState(emptyDriver);
    const [editingId, setEditingId] = useState(null);
    const [filters, setFilters] = useState({ search: '', status: '', expiry: '', sort: 'full_name' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchDrivers = async () => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.expiry) params.set('expiry', filters.expiry);
        const res = await authFetch(`/api/drivers${params.toString() ? `?${params}` : ''}`);
        if (res.ok) setDrivers(await res.json());
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [drvRes, catRes, regionRes, reminderRes] = await Promise.all([
                    authFetch('/api/drivers'),
                    authFetch('/api/license-categories'),
                    authFetch('/api/regions'),
                    authFetch('/api/reminders/license-expiry'),
                ]);
                if (drvRes.ok) setDrivers(await drvRes.json());
                if (catRes.ok) setLicenseCategories(await catRes.json());
                if (regionRes.ok) setRegions(await regionRes.json());
                if (reminderRes.ok) setReminders(await reminderRes.json());
            } catch (err) {
                setError(err.message);
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchDrivers().catch((err) => setError(err.message));
    }, [filters.status, filters.expiry]);

    const visibleDrivers = useMemo(() => {
        const needle = filters.search.trim().toLowerCase();
        return [...drivers]
            .filter((d) => !needle || [d.full_name, d.license_number, d.status].join(' ').toLowerCase().includes(needle))
            .sort((a, b) => String(a[filters.sort] ?? '').localeCompare(String(b[filters.sort] ?? ''), undefined, { numeric: true }));
    }, [drivers, filters.search, filters.sort]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const payload = {
            ...formData,
            license_category_id: Number(formData.license_category_id),
            safety_score: Number(formData.safety_score),
            region_id: formData.region_id || null,
        };
        try {
            const res = await authFetch(editingId ? `/api/drivers/${editingId}` : '/api/drivers', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) setError(data.error || 'Failed to save driver.');
            else {
                setFormData(emptyDriver);
                setEditingId(null);
                fetchDrivers();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (driver) => {
        setEditingId(driver.driver_id);
        setFormData({
            full_name: driver.full_name,
            license_number: driver.license_number,
            license_category_id: driver.license_category_id,
            license_expiry_date: driver.license_expiry_date?.slice(0, 10),
            contact_number: driver.contact_number,
            safety_score: driver.safety_score,
            status: driver.status,
            region_id: driver.region_id || '',
        });
    };

    const deleteDriver = async (driverId) => {
        if (!confirm('Delete this driver?')) return;
        const res = await authFetch(`/api/drivers/${driverId}`, { method: 'DELETE' });
        if (res.ok) fetchDrivers();
        else setError((await res.json()).error || 'Failed to delete driver.');
    };

    const sendReminders = async () => {
        const res = await authFetch('/api/reminders/license-expiry/send', { method: 'POST' });
        const data = await res.json();
        if (res.ok) alert(data.message || `${data.reminderCount || data.reminders.length} reminder email sent.`);
        else setError(data.error || 'Failed to send reminders.');
    };

    const isExpired = (date) => new Date(date) < new Date(new Date().toISOString().slice(0, 10));
    const STATUS_COLORS = { AVAILABLE: 'primary', ON_TRIP: 'info', OFF_DUTY: 'secondary', SUSPENDED: 'danger' };

    return (
        <div className="row g-4">
            <div className="col-12 col-xl-4">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0">
                        <h5 className="fw-bold mb-0">{editingId ? 'Edit Driver' : 'Add New Driver'}</h5>
                    </div>
                    <div className="card-body">
                        {error && <div className="alert alert-danger small py-2">{error}</div>}
                        <form onSubmit={handleSubmit}>
                            <input className="form-control mb-3" name="full_name" placeholder="Full Name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required />
                            <input className="form-control mb-3" name="license_number" placeholder="License Number" value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} required />
                            <select className="form-select mb-3" value={formData.license_category_id} onChange={(e) => setFormData({ ...formData, license_category_id: e.target.value })} required>
                                <option value="">License Category</option>
                                {licenseCategories.map(c => <option key={c.license_category_id} value={c.license_category_id}>{c.category_code}</option>)}
                            </select>
                            <input type="date" className="form-control mb-3" value={formData.license_expiry_date} onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })} required />
                            <input className="form-control mb-3" placeholder="Contact Number" value={formData.contact_number} onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })} required />
                            <input type="number" className="form-control mb-3" placeholder="Safety Score" value={formData.safety_score} onChange={(e) => setFormData({ ...formData, safety_score: e.target.value })} min="0" max="100" required />
                            <select className="form-select mb-3" value={formData.region_id} onChange={(e) => setFormData({ ...formData, region_id: e.target.value })}>
                                <option value="">Region</option>
                                {regions.map(r => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
                            </select>
                            <select className="form-select mb-4" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                <option value="AVAILABLE">Available</option>
                                <option value="ON_TRIP">On Trip</option>
                                <option value="OFF_DUTY">Off Duty</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary flex-grow-1" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Driver' : 'Register Driver'}</button>
                                {editingId && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditingId(null); setFormData(emptyDriver); }}>Cancel</button>}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="card border-0 shadow-sm mt-4">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">License Reminders</h5>
                        <button className="btn btn-sm btn-outline-primary" onClick={sendReminders}>Send Email</button>
                    </div>
                    <div className="card-body">
                        {reminders.length === 0 ? <p className="text-muted small mb-0">No licenses expiring in the next 30 days.</p> : reminders.map((r) => (
                            <div className="d-flex justify-content-between border-bottom py-2" key={r.driver_id}>
                                <span>{r.full_name}</span>
                                <span className={`badge ${r.status === 'EXPIRED' ? 'bg-danger' : 'bg-warning'} bg-opacity-10 text-${r.status === 'EXPIRED' ? 'danger' : 'warning'}`}>{r.days_to_expiry} days</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="col-12 col-xl-8">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4">
                        <div className="row g-2">
                            <div className="col-md-4"><input className="form-control" placeholder="Search drivers" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
                            <div className="col-md-3"><select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Status</option><option value="AVAILABLE">Available</option><option value="ON_TRIP">On Trip</option><option value="OFF_DUTY">Off Duty</option><option value="SUSPENDED">Suspended</option></select></div>
                            <div className="col-md-2"><select className="form-select" value={filters.expiry} onChange={(e) => setFilters({ ...filters, expiry: e.target.value })}><option value="">Expiry</option><option value="soon">Soon</option><option value="expired">Expired</option></select></div>
                            <div className="col-md-3"><select className="form-select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="full_name">Sort: Name</option><option value="license_expiry_date">Sort: Expiry</option><option value="safety_score">Sort: Safety</option></select></div>
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr><th>Name</th><th>License</th><th>Expiry</th><th>Safety</th><th>Status</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {visibleDrivers.map((d) => (
                                        <tr key={d.driver_id}>
                                            <td className="fw-medium">{d.full_name}</td>
                                            <td>{d.license_number}</td>
                                            <td className={isExpired(d.license_expiry_date) ? 'text-danger fw-bold' : ''}>{new Date(d.license_expiry_date).toLocaleDateString()}</td>
                                            <td>{Number(d.safety_score).toFixed(0)}%</td>
                                            <td><span className={`badge bg-${STATUS_COLORS[d.status] || 'secondary'} bg-opacity-10 text-${STATUS_COLORS[d.status] || 'secondary'}`}>{d.status}</span></td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button className="btn btn-outline-secondary" onClick={() => startEdit(d)}>Edit</button>
                                                    <button className="btn btn-outline-danger" onClick={() => deleteDriver(d.driver_id)}>Delete</button>
                                                </div>
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
    );
}
