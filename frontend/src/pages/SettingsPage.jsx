import { useState, useEffect } from 'react';

const ROLE_LABELS = {
    FLEET_MANAGER: 'Fleet Manager',
    DISPATCHER: 'Dispatcher',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
    ADMIN: 'Admin',
    DRIVER: 'Driver',
};

const ROLE_PAGES = {
    FLEET_MANAGER: 'Dashboard, Vehicles, Drivers, Trips, Reports, Settings',
    DISPATCHER: 'Dashboard, Vehicles, Trips, Reports',
    SAFETY_OFFICER: 'Dashboard, Drivers, Maintenance, Reports',
    FINANCIAL_ANALYST: 'Dashboard, Fuel & Expense, Reports',
    ADMIN: 'All Pages',
    DRIVER: 'Dashboard, Trips',
};

export default function SettingsPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('transitops_token');
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) setUsers([data]);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const roleRows = Object.entries(ROLE_LABELS).map(([key, label]) => ({
        role: key,
        name: label,
        pages: ROLE_PAGES[key] || 'Dashboard',
    }));

    return (
        <div className="row g-4">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0">
                        <h5 className="fw-bold mb-0">Role-Based Access Control (RBAC)</h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light">
                                    <tr>
                                        <th>Role</th>
                                        <th>Name</th>
                                        <th>Accessible Pages</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleRows.map((r) => (
                                        <tr key={r.role}>
                                            <td><span className="badge bg-primary bg-opacity-10 text-primary fw-medium">{r.name}</span></td>
                                            <td><span className="fw-medium">{r.name}</span></td>
                                            <td>{r.pages}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {!loading && users.length > 0 && (
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Current Session</h5>
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush">
                                {users.map(u => (
                                    <li className="list-group-item d-flex justify-content-between" key={u.user_id}>
                                        <span className="fw-medium">{u.full_name}</span>
                                        <span className="badge bg-info bg-opacity-10 text-info">{ROLE_LABELS[u.role] || u.role}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
