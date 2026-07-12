import { useState, useEffect } from 'react';
import { authFetch } from '../api.js';

export default function DashboardPage() {
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [trips, setTrips] = useState([]);
    const [vehicleTypes, setVehicleTypes] = useState([]);
    const [regions, setRegions] = useState([]);
    const [filters, setFilters] = useState({ vehicle_type_id: '', status: '', region_id: '' });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const params = new URLSearchParams();
                if (filters.vehicle_type_id) params.set('vehicle_type_id', filters.vehicle_type_id);
                if (filters.status) params.set('status', filters.status);
                if (filters.region_id) params.set('region_id', filters.region_id);
                const [vehRes, drvRes, tripRes] = await Promise.all([
                    authFetch(`/api/vehicles${params.toString() ? `?${params}` : ''}`),
                    authFetch('/api/drivers'),
                    authFetch('/api/trips')
                ]);
                
                if (vehRes.ok) setVehicles(await vehRes.json());
                if (drvRes.ok) setDrivers(await drvRes.json());
                if (tripRes.ok) setTrips(await tripRes.json());
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            }
        };
        fetchData();
    }, [filters]);

    useEffect(() => {
        Promise.all([authFetch('/api/vehicle-types'), authFetch('/api/regions')])
            .then(async ([typeRes, regionRes]) => {
                if (typeRes.ok) setVehicleTypes(await typeRes.json());
                if (regionRes.ok) setRegions(await regionRes.json());
            })
            .catch(() => {});
    }, []);

    const activeVehicles = vehicles.filter(v => v.status !== 'RETIRED').length;
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const maintenanceVehicles = vehicles.filter(v => v.status === 'IN_SHOP').length;
    
    const activeTrips = trips.filter(t => t.status === 'DISPATCHED').length;
    const pendingTrips = trips.filter(t => t.status === 'DRAFT').length;
    
    const driversOnDuty = drivers.filter(d => d.status === 'ON_TRIP').length;
    const utilization = activeVehicles > 0 ? Math.round((vehicles.filter(v => v.status === 'ON_TRIP').length / activeVehicles) * 100) : 0;

    const kpis = [
        { label: 'Active Vehicles', value: activeVehicles.toString() },
        { label: 'Available Vehicles', value: availableVehicles.toString() },
        { label: 'Vehicles in Maintenance', value: maintenanceVehicles.toString() },
        { label: 'Active Trips', value: activeTrips.toString() },
        { label: 'Pending Trips', value: pendingTrips.toString() },
        { label: 'Drivers on Duty', value: driversOnDuty.toString() },
        { label: 'Fleet Utilization', value: utilization + '%' }
    ];

    return (
        <div>
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <div className="row g-2">
                        <div className="col-md-4">
                            <select className="form-select" value={filters.vehicle_type_id} onChange={(e) => setFilters({ ...filters, vehicle_type_id: e.target.value })}>
                                <option value="">All vehicle types</option>
                                {vehicleTypes.map(vt => <option key={vt.vehicle_type_id} value={vt.vehicle_type_id}>{vt.type_name}</option>)}
                            </select>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                                <option value="">All statuses</option>
                                <option value="AVAILABLE">Available</option>
                                <option value="ON_TRIP">On Trip</option>
                                <option value="IN_SHOP">In Shop</option>
                                <option value="RETIRED">Retired</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select" value={filters.region_id} onChange={(e) => setFilters({ ...filters, region_id: e.target.value })}>
                                <option value="">All regions</option>
                                {regions.map(r => <option key={r.region_id} value={r.region_id}>{r.region_name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row mb-4 g-3">
                {kpis.map((kpi, idx) => (
                    <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={idx}>
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted small fw-bold mb-2">{kpi.label}</h6>
                                <h3 className="mb-0 fw-bold">{kpi.value}</h3>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4 mb-4">
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Fleet Status Mix</h5></div>
                        <div className="card-body">
                            {['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'].map((status) => {
                                const count = vehicles.filter(v => v.status === status).length;
                                const width = vehicles.length ? Math.round(count / vehicles.length * 100) : 0;
                                return <div className="mb-3" key={status}><div className="d-flex justify-content-between small mb-1"><span>{status}</span><span>{count}</span></div><div className="progress" style={{ height: '10px' }}><div className="progress-bar" style={{ width: `${width}%` }} /></div></div>;
                            })}
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Trip Pipeline</h5></div>
                        <div className="card-body">
                            {['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'].map((status) => {
                                const count = trips.filter(t => t.status === status).length;
                                const width = trips.length ? Math.round(count / trips.length * 100) : 0;
                                return <div className="mb-3" key={status}><div className="d-flex justify-content-between small mb-1"><span>{status}</span><span>{count}</span></div><div className="progress" style={{ height: '10px' }}><div className="progress-bar bg-info" style={{ width: `${width}%` }} /></div></div>;
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-4">
                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Vehicle Registry Snapshot</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Registration</th>
                                            <th>Model</th>
                                            <th>Capacity (kg)</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vehicles.slice(0, 5).map((v) => (
                                            <tr key={v.vehicle_id}>
                                                <td><span className="fw-medium">{v.registration_number}</span></td>
                                                <td>{v.model_name}</td>
                                                <td>{Number(v.max_load_capacity_kg).toLocaleString()}</td>
                                                <td><span className={`badge ${v.status === 'AVAILABLE' ? 'bg-success' : v.status === 'ON_TRIP' ? 'bg-primary' : v.status === 'IN_SHOP' ? 'bg-warning' : 'bg-danger'} bg-opacity-10`}>{v.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Drivers On Duty</h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                {drivers.filter(d => d.status === 'AVAILABLE' || d.status === 'ON_TRIP').slice(0, 5).map((d) => (
                                    <li className="list-group-item d-flex justify-content-between align-items-center px-0" key={d.driver_id}>
                                        <span className="fw-medium">{d.full_name}</span>
                                        <span className={`badge ${d.status === 'AVAILABLE' ? 'bg-primary' : 'bg-secondary'} bg-opacity-10 text-${d.status === 'AVAILABLE' ? 'primary' : 'secondary'}`}>{d.status}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Trip Lifecycle</h5>
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
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {trips.slice(0, 5).map((t) => (
                                            <tr key={t.trip_id}>
                                                <td>{t.source}</td>
                                                <td>{t.destination}</td>
                                                <td><span className="fw-medium">{t.registration_number || '—'}</span></td>
                                                <td>{t.driver_name || '—'}</td>
                                                <td><span className={`badge ${t.status === 'COMPLETED' ? 'bg-success' : t.status === 'DISPATCHED' ? 'bg-info' : t.status === 'DRAFT' ? 'bg-secondary' : 'bg-danger'} bg-opacity-10 text-${t.status === 'COMPLETED' ? 'success' : t.status === 'DISPATCHED' ? 'info' : t.status === 'DRAFT' ? 'secondary' : 'danger'}`}>{t.status}</span></td>
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
