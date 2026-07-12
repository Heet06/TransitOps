import { useState, useEffect, useMemo } from 'react';
import { authFetch } from '../api.js';

const emptyVehicle = {
    registration_number: '',
    model_name: '',
    vehicle_type_id: '',
    region_id: '',
    max_load_capacity_kg: '',
    odometer_km: 0,
    acquisition_cost: '',
    status: 'AVAILABLE'
};

const emptyDocument = {
    document_type: 'REGISTRATION',
    document_name: '',
    document_url: '',
    expiry_date: ''
};

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [regions, setRegions] = useState([]);
    const [formData, setFormData] = useState(emptyVehicle);
    const [editingId, setEditingId] = useState(null);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [documentForm, setDocumentForm] = useState(emptyDocument);
    const [filters, setFilters] = useState({ search: '', status: '', vehicle_type_id: '', region_id: '', sort: 'registration_number' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchVehicles = async () => {
        const params = new URLSearchParams();
        if (filters.status) params.set('status', filters.status);
        if (filters.vehicle_type_id) params.set('vehicle_type_id', filters.vehicle_type_id);
        if (filters.region_id) params.set('region_id', filters.region_id);
        const res = await authFetch(`/api/vehicles${params.toString() ? `?${params}` : ''}`);
        if (res.ok) setVehicles(await res.json());
    };

    const fetchDocuments = async (vehicleId) => {
        if (!vehicleId) return;
        const res = await authFetch(`/api/vehicles/${vehicleId}/documents`);
        if (res.ok) setDocuments(await res.json());
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [vehRes, typeRes, regionRes] = await Promise.all([
                    authFetch('/api/vehicles'),
                    authFetch('/api/vehicle-types'),
                    authFetch('/api/regions'),
                ]);
                if (vehRes.ok) setVehicles(await vehRes.json());
                if (typeRes.ok) setVehicleTypes(await typeRes.json());
                if (regionRes.ok) setRegions(await regionRes.json());
            } catch (err) {
                setError(err.message);
            }
        };
        init();
    }, []);

    useEffect(() => {
        fetchVehicles().catch((err) => setError(err.message));
    }, [filters.status, filters.vehicle_type_id, filters.region_id]);

    const visibleVehicles = useMemo(() => {
        const needle = filters.search.trim().toLowerCase();
        return [...vehicles]
            .filter((v) => !needle || [v.registration_number, v.model_name, v.status].join(' ').toLowerCase().includes(needle))
            .sort((a, b) => String(a[filters.sort] ?? '').localeCompare(String(b[filters.sort] ?? ''), undefined, { numeric: true }));
    }, [vehicles, filters.search, filters.sort]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData(emptyVehicle);
        setEditingId(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const payload = {
            ...formData,
            region_id: formData.region_id || null,
            odometer_km: Number(formData.odometer_km || 0),
            max_load_capacity_kg: Number(formData.max_load_capacity_kg),
            acquisition_cost: Number(formData.acquisition_cost),
            vehicle_type_id: Number(formData.vehicle_type_id),
        };
        try {
            const res = await authFetch(editingId ? `/api/vehicles/${editingId}` : '/api/vehicles', {
                method: editingId ? 'PUT' : 'POST',
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to save vehicle.');
            } else {
                resetForm();
                await fetchVehicles();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (vehicle) => {
        setEditingId(vehicle.vehicle_id);
        setFormData({
            registration_number: vehicle.registration_number,
            model_name: vehicle.model_name,
            vehicle_type_id: vehicle.vehicle_type_id,
            region_id: vehicle.region_id || '',
            max_load_capacity_kg: vehicle.max_load_capacity_kg,
            odometer_km: vehicle.odometer_km,
            acquisition_cost: vehicle.acquisition_cost,
            status: vehicle.status,
        });
    };

    const deleteVehicle = async (vehicleId) => {
        if (!confirm('Delete this vehicle?')) return;
        const res = await authFetch(`/api/vehicles/${vehicleId}`, { method: 'DELETE' });
        if (res.ok) fetchVehicles();
        else setError((await res.json()).error || 'Failed to delete vehicle.');
    };

    const openDocuments = async (vehicle) => {
        setSelectedVehicle(vehicle);
        setDocumentForm(emptyDocument);
        await fetchDocuments(vehicle.vehicle_id);
    };

    const saveDocument = async (e) => {
        e.preventDefault();
        if (!selectedVehicle) return;
        const payload = { ...documentForm, expiry_date: documentForm.expiry_date || null };
        const res = await authFetch(`/api/vehicles/${selectedVehicle.vehicle_id}/documents`, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setDocumentForm(emptyDocument);
            fetchDocuments(selectedVehicle.vehicle_id);
        } else {
            setError((await res.json()).error || 'Failed to save document.');
        }
    };

    const deleteDocument = async (documentId) => {
        const res = await authFetch(`/api/vehicles/${selectedVehicle.vehicle_id}/documents/${documentId}`, { method: 'DELETE' });
        if (res.ok) fetchDocuments(selectedVehicle.vehicle_id);
    };

    const STATUS_COLORS = { AVAILABLE: 'success', ON_TRIP: 'primary', IN_SHOP: 'warning', RETIRED: 'danger' };

    return (
        <div>
            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">{editingId ? 'Edit Vehicle' : 'Add New Vehicle'}</h5>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger small py-2">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <input className="form-control mb-3" name="registration_number" placeholder="Registration Number" value={formData.registration_number} onChange={handleChange} required />
                                <input className="form-control mb-3" name="model_name" placeholder="Vehicle Name / Model" value={formData.model_name} onChange={handleChange} required />
                                <select className="form-select mb-3" name="vehicle_type_id" value={formData.vehicle_type_id} onChange={handleChange} required>
                                    <option value="">Vehicle Type</option>
                                    {vehicleTypes.map(vt => <option key={vt.vehicle_type_id} value={vt.vehicle_type_id}>{vt.type_name}</option>)}
                                </select>
                                <select className="form-select mb-3" name="region_id" value={formData.region_id} onChange={handleChange}>
                                    <option value="">Region</option>
                                    {regions.map(r => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
                                </select>
                                <input type="number" className="form-control mb-3" name="max_load_capacity_kg" placeholder="Max Load Capacity (kg)" value={formData.max_load_capacity_kg} onChange={handleChange} min="0.01" step="0.01" required />
                                <input type="number" className="form-control mb-3" name="odometer_km" placeholder="Odometer (km)" value={formData.odometer_km} onChange={handleChange} min="0" step="0.01" required />
                                <input type="number" className="form-control mb-3" name="acquisition_cost" placeholder="Acquisition Cost" value={formData.acquisition_cost} onChange={handleChange} min="0" step="0.01" required />
                                <select className="form-select mb-4" name="status" value={formData.status} onChange={handleChange}>
                                    <option value="AVAILABLE">Available</option>
                                    <option value="ON_TRIP">On Trip</option>
                                    <option value="IN_SHOP">In Shop</option>
                                    <option value="RETIRED">Retired</option>
                                </select>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>{loading ? 'Saving...' : editingId ? 'Update Vehicle' : 'Register Vehicle'}</button>
                                    {editingId && <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>Cancel</button>}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4">
                            <div className="row g-2">
                                <div className="col-md-4"><input className="form-control" placeholder="Search vehicles" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} /></div>
                                <div className="col-md-2"><select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">Status</option><option value="AVAILABLE">Available</option><option value="ON_TRIP">On Trip</option><option value="IN_SHOP">In Shop</option><option value="RETIRED">Retired</option></select></div>
                                <div className="col-md-3"><select className="form-select" value={filters.vehicle_type_id} onChange={(e) => setFilters({ ...filters, vehicle_type_id: e.target.value })}><option value="">Type</option>{vehicleTypes.map(vt => <option key={vt.vehicle_type_id} value={vt.vehicle_type_id}>{vt.type_name}</option>)}</select></div>
                                <div className="col-md-3"><select className="form-select" value={filters.sort} onChange={(e) => setFilters({ ...filters, sort: e.target.value })}><option value="registration_number">Sort: Registration</option><option value="model_name">Sort: Model</option><option value="status">Sort: Status</option></select></div>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr><th>Registration</th><th>Model</th><th>Capacity</th><th>Odometer</th><th>Status</th><th>Actions</th></tr>
                                    </thead>
                                    <tbody>
                                        {visibleVehicles.map((v) => (
                                            <tr key={v.vehicle_id}>
                                                <td className="fw-medium">{v.registration_number}</td>
                                                <td>{v.model_name}</td>
                                                <td>{Number(v.max_load_capacity_kg).toLocaleString()} kg</td>
                                                <td>{Number(v.odometer_km).toLocaleString()} km</td>
                                                <td><span className={`badge bg-${STATUS_COLORS[v.status] || 'secondary'} bg-opacity-10 text-${STATUS_COLORS[v.status] || 'secondary'}`}>{v.status}</span></td>
                                                <td>
                                                    <div className="btn-group btn-group-sm">
                                                        <button className="btn btn-outline-secondary" onClick={() => startEdit(v)}>Edit</button>
                                                        <button className="btn btn-outline-primary" onClick={() => openDocuments(v)}>Docs</button>
                                                        <button className="btn btn-outline-danger" onClick={() => deleteVehicle(v.vehicle_id)}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {selectedVehicle && (
                        <div className="card border-0 shadow-sm mt-4">
                            <div className="card-header bg-transparent border-0 pt-4 pb-0 d-flex justify-content-between">
                                <h5 className="fw-bold mb-0">Documents: {selectedVehicle.registration_number}</h5>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedVehicle(null)}>Close</button>
                            </div>
                            <div className="card-body">
                                <form className="row g-2 mb-3" onSubmit={saveDocument}>
                                    <div className="col-md-2"><select className="form-select" value={documentForm.document_type} onChange={(e) => setDocumentForm({ ...documentForm, document_type: e.target.value })}><option>REGISTRATION</option><option>INSURANCE</option><option>PERMIT</option><option>FITNESS</option><option>POLLUTION</option><option>OTHER</option></select></div>
                                    <div className="col-md-3"><input className="form-control" placeholder="Document name" value={documentForm.document_name} onChange={(e) => setDocumentForm({ ...documentForm, document_name: e.target.value })} required /></div>
                                    <div className="col-md-4"><input className="form-control" placeholder="Document URL" value={documentForm.document_url} onChange={(e) => setDocumentForm({ ...documentForm, document_url: e.target.value })} required /></div>
                                    <div className="col-md-2"><input type="date" className="form-control" value={documentForm.expiry_date} onChange={(e) => setDocumentForm({ ...documentForm, expiry_date: e.target.value })} /></div>
                                    <div className="col-md-1"><button className="btn btn-primary w-100">Add</button></div>
                                </form>
                                <div className="table-responsive">
                                    <table className="table table-sm align-middle">
                                        <tbody>
                                            {documents.map((doc) => (
                                                <tr key={doc.document_id}>
                                                    <td><span className="badge bg-light text-dark">{doc.document_type}</span></td>
                                                    <td>{doc.document_name}</td>
                                                    <td><a href={doc.document_url} target="_blank" rel="noreferrer">Open</a></td>
                                                    <td>{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'No expiry'}</td>
                                                    <td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => deleteDocument(doc.document_id)}>Delete</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
