import { useState, useEffect } from 'react';
import { authFetch } from '../api.js';

const EXPENSE_TYPES = ['MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER'];

export default function ExpensePage() {
    const [expenses, setExpenses] = useState([]);
    const [fuelLogs, setFuelLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [fuelForm, setFuelForm] = useState({ vehicle_id: '', trip_id: '', liters: '', cost: '', log_date: new Date().toISOString().split('T')[0] });
    const [expenseForm, setExpenseForm] = useState({ vehicle_id: '', trip_id: '', expense_type: 'TOLL', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        const [expRes, fuelRes, vehRes] = await Promise.all([
            authFetch('/api/expenses'),
            authFetch('/api/fuel-logs'),
            authFetch('/api/vehicles'),
        ]);
        if (expRes.ok) setExpenses(await expRes.json());
        if (fuelRes.ok) setFuelLogs(await fuelRes.json());
        if (vehRes.ok) setVehicles(await vehRes.json());
    };

    useEffect(() => {
        fetchData().catch((err) => setError(err.message));
    }, []);

    const saveFuel = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await authFetch('/api/fuel-logs', {
            method: 'POST',
            body: JSON.stringify({
                ...fuelForm,
                trip_id: fuelForm.trip_id || null,
                liters: Number(fuelForm.liters),
                cost: Number(fuelForm.cost),
            })
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setError(data.error || 'Failed to log fuel.');
        setFuelForm({ vehicle_id: '', trip_id: '', liters: '', cost: '', log_date: new Date().toISOString().split('T')[0] });
        fetchData();
    };

    const saveExpense = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const res = await authFetch('/api/expenses', {
            method: 'POST',
            body: JSON.stringify({
                ...expenseForm,
                trip_id: expenseForm.trip_id || null,
                amount: Number(expenseForm.amount),
            })
        });
        const data = await res.json();
        setLoading(false);
        if (!res.ok) return setError(data.error || 'Failed to log expense.');
        setExpenseForm({ vehicle_id: '', trip_id: '', expense_type: 'TOLL', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
        fetchData();
    };

    const remove = async (url) => {
        if (!confirm('Delete this log?')) return;
        const res = await authFetch(url, { method: 'DELETE' });
        if (res.ok) fetchData();
    };

    const fuelSpend = fuelLogs.reduce((sum, e) => sum + parseFloat(e.cost || 0), 0);
    const expenseSpend = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const fuelLiters = fuelLogs.reduce((sum, e) => sum + parseFloat(e.liters || 0), 0);

    return (
        <div>
            {error && <div className="alert alert-danger small py-2">{error}</div>}
            <div className="row g-3 mb-4">
                <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><h6 className="text-muted small fw-bold">Fuel Spend</h6><h3>₹{fuelSpend.toLocaleString()}</h3></div></div></div>
                <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><h6 className="text-muted small fw-bold">Fuel Volume</h6><h3>{fuelLiters.toLocaleString()} L</h3></div></div></div>
                <div className="col-md-4"><div className="card border-0 shadow-sm"><div className="card-body"><h6 className="text-muted small fw-bold">Other Expenses</h6><h3>₹{expenseSpend.toLocaleString()}</h3></div></div></div>
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Fuel Log</h5></div>
                        <div className="card-body">
                            <form onSubmit={saveFuel}>
                                <select className="form-select mb-3" value={fuelForm.vehicle_id} onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })} required>
                                    <option value="">Vehicle</option>
                                    {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model_name}</option>)}
                                </select>
                                <input type="number" className="form-control mb-3" placeholder="Liters" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} min="0.01" step="0.01" required />
                                <input type="number" className="form-control mb-3" placeholder="Cost" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} min="0" step="0.01" required />
                                <input type="date" className="form-control mb-4" value={fuelForm.log_date} onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })} required />
                                <button className="btn btn-primary w-100" disabled={loading}>Save Fuel</button>
                            </form>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Other Expense</h5></div>
                        <div className="card-body">
                            <form onSubmit={saveExpense}>
                                <select className="form-select mb-3" value={expenseForm.vehicle_id} onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })} required>
                                    <option value="">Vehicle</option>
                                    {vehicles.map(v => <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} - {v.model_name}</option>)}
                                </select>
                                <select className="form-select mb-3" value={expenseForm.expense_type} onChange={(e) => setExpenseForm({ ...expenseForm, expense_type: e.target.value })}>
                                    {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <input type="number" className="form-control mb-3" placeholder="Amount" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} min="0" step="0.01" required />
                                <input type="date" className="form-control mb-3" value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} required />
                                <input className="form-control mb-4" placeholder="Notes" value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} />
                                <button className="btn btn-primary w-100" disabled={loading}>Save Expense</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Fuel Logs</h5></div>
                        <div className="card-body table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light"><tr><th>Vehicle</th><th>Liters</th><th>Cost</th><th>Date</th><th></th></tr></thead>
                                <tbody>{fuelLogs.map(f => <tr key={f.fuel_log_id}><td>{f.registration_number || '-'}</td><td>{Number(f.liters).toLocaleString()} L</td><td>₹{Number(f.cost).toLocaleString()}</td><td>{new Date(f.log_date).toLocaleDateString()}</td><td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => remove(`/api/fuel-logs/${f.fuel_log_id}`)}>Delete</button></td></tr>)}</tbody>
                            </table>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0"><h5 className="fw-bold mb-0">Expense Log</h5></div>
                        <div className="card-body table-responsive">
                            <table className="table table-hover align-middle">
                                <thead className="table-light"><tr><th>Vehicle</th><th>Type</th><th>Amount</th><th>Date</th><th>Notes</th><th></th></tr></thead>
                                <tbody>{expenses.map(e => <tr key={e.expense_id}><td>{e.registration_number || '-'}</td><td>{e.expense_type}</td><td>₹{Number(e.amount).toLocaleString()}</td><td>{new Date(e.expense_date).toLocaleDateString()}</td><td>{e.notes || '-'}</td><td className="text-end"><button className="btn btn-sm btn-outline-danger" onClick={() => remove(`/api/expenses/${e.expense_id}`)}>Delete</button></td></tr>)}</tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
