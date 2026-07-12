export default function SettingsPage() {
    const roleRows = [
        { role: 'Admin', name: 'Super Administrator', pages: 'All Pages' },
        { role: 'Manager', name: 'Fleet Manager', pages: 'Dashboard, Vehicles, Drivers, Trips, Reports' },
        { role: 'Dispatcher', name: 'Trip Dispatcher', pages: 'Dashboard, Trips, Drivers' },
        { role: 'Mechanic', name: 'Maintenance Staff', pages: 'Dashboard, Vehicles, Maintenance' }
    ];

    return (
        <div className="row g-4">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
                        <h5 className="fw-bold mb-0">Role-Based Access Control (RBAC)</h5>
                        <button className="btn btn-primary btn-sm">Create Role</button>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Role</th>
                                        <th>Name</th>
                                        <th>Pages</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleRows.map((r, i) => (
                                        <tr key={i}>
                                            <td><span className="badge bg-primary bg-opacity-10 text-primary fw-medium">{r.role}</span></td>
                                            <td><span className="fw-medium">{r.name}</span></td>
                                            <td>{r.pages}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-secondary me-2">Edit</button>
                                                <button className="btn btn-sm btn-outline-danger">Delete</button>
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