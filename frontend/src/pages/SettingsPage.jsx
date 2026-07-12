import { useState, useEffect } from 'react';
import { authFetch } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABELS = {
    FLEET_MANAGER: 'Fleet Manager',
    DISPATCHER: 'Dispatcher',
    SAFETY_OFFICER: 'Safety Officer',
    FINANCIAL_ANALYST: 'Financial Analyst',
    ADMIN: 'Admin',
    DRIVER: 'Driver',
};

const ROLE_PAGES = {
    ADMIN: 'All pages and user management',
    FLEET_MANAGER: 'Dashboard, vehicles, drivers, trips, maintenance, finance, reports, settings',
    DISPATCHER: 'Dashboard, vehicles, trips, reports',
    SAFETY_OFFICER: 'Dashboard, drivers, maintenance, reports, reminders',
    FINANCIAL_ANALYST: 'Dashboard, vehicles, finance, maintenance read, reports',
    DRIVER: 'Dashboard and trips',
};

const emptyUser = { full_name: '', email: '', password: '', role: 'DISPATCHER', is_active: true };

export default function SettingsPage() {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState(emptyUser);
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        const res = await authFetch('/api/users');
        if (res.ok) setUsers(await res.json());
    };

    useEffect(() => {
        fetchUsers().catch((err) => setError(err.message));
    }, []);

    const saveUser = async (e) => {
        e.preventDefault();
        setError('');
        const payload = editingId
            ? { full_name: formData.full_name, email: formData.email, role: formData.role, is_active: formData.is_active }
            : formData;
        const res = await authFetch(editingId ? `/api/users/${editingId}` : '/api/users', {
            method: editingId ? 'PUT' : 'POST',
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) return setError(data.error || 'Failed to save user.');
        setFormData(emptyUser);
        setEditingId(null);
        fetchUsers();
    };

    const startEdit = (account) => {
        setEditingId(account.user_id);
        setFormData({ full_name: account.full_name, email: account.email, password: '', role: account.role, is_active: account.is_active });
    };

    return (
        <div className="row g-4">
            <div className="col-12">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0">
                        <h5 className="fw-bold mb-0">Role-Based Access Control</h5>
                    </div>
                    <div className="card-body table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light"><tr><th>Role</th><th>Access</th></tr></thead>
                            <tbody>{Object.entries(ROLE_LABELS).map(([key, label]) => <tr key={key}><td><span className="badge bg-primary bg-opacity-10 text-primary">{label}</span></td><td>{ROLE_PAGES[key]}</td></tr>)}</tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="col-12 col-xl-4">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">{editingId ? 'Edit User' : 'Create User'}</h5></div>
                    <div className="card-body">
                        {error && <div className="alert alert-danger small py-2">{error}</div>}
                        {user?.role !== 'ADMIN' && <div className="alert alert-info small py-2">Only admins can create or update users.</div>}
                        <form onSubmit={saveUser}>
                            <input className="form-control mb-3" placeholder="Full name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required disabled={user?.role !== 'ADMIN'} />
                            <input type="email" className="form-control mb-3" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required disabled={user?.role !== 'ADMIN'} />
                            {!editingId && <input type="password" className="form-control mb-3" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required disabled={user?.role !== 'ADMIN'} />}
                            <select className="form-select mb-3" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} disabled={user?.role !== 'ADMIN'}>
                                {Object.entries(ROLE_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                            </select>
                            <div className="form-check form-switch mb-4">
                                <input className="form-check-input" type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} disabled={user?.role !== 'ADMIN'} />
                                <label className="form-check-label">Active account</label>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary flex-grow-1" disabled={user?.role !== 'ADMIN'}>{editingId ? 'Update User' : 'Create User'}</button>
                                {editingId && <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditingId(null); setFormData(emptyUser); }}>Cancel</button>}
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="col-12 col-xl-8">
                <div className="card border-0 shadow-sm">
                    <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Users</h5></div>
                    <div className="card-body table-responsive">
                        <table className="table table-hover align-middle">
                            <thead className="table-light"><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
                            <tbody>{users.map((account) => <tr key={account.user_id}><td>{account.full_name}</td><td>{account.email}</td><td>{ROLE_LABELS[account.role] || account.role}</td><td>{account.is_active ? 'Active' : 'Inactive'}</td><td className="text-end"><button className="btn btn-sm btn-outline-secondary" onClick={() => startEdit(account)} disabled={user?.role !== 'ADMIN'}>Edit</button></td></tr>)}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
