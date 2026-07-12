import { useState, useEffect } from 'react';

const EXPENSE_TYPES = ['FUEL', 'MAINTENANCE', 'TOLL', 'INSURANCE', 'OTHER'];
const TYPE_COLORS = {
    FUEL: 'primary',
    MAINTENANCE: 'warning',
    TOLL: 'info',
    INSURANCE: 'secondary',
    OTHER: 'dark',
};

export default function ExpensePage() {
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [trips, setTrips] = useState([]);
    const [formData, setFormData] = useState({
        vehicle_id: '',
        trip_id: '',
        expense_type: 'FUEL',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        notes: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchExpenses = async () => {
        try {
            const res = await fetch('/api/expenses');
            if (res.ok) setExpenses(await res.json());
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = async () => {
            try {
                const [expRes, vehRes, tripRes] = await Promise.all([
                    fetch('/api/expenses'),
                    fetch('/api/vehicles'),
                    fetch('/api/trips'),
                ]);
                if (expRes.ok) setExpenses(await expRes.json());
                if (vehRes.ok) setVehicles(await vehRes.json());
                if (tripRes.ok) setTrips(await tripRes.json());
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
            const payload = { ...formData, trip_id: formData.trip_id || null };
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to log expense.');
            } else {
                setFormData({ vehicle_id: '', trip_id: '', expense_type: 'FUEL', amount: '', expense_date: new Date().toISOString().split('T')[0], notes: '' });
                fetchExpenses();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const totalSpend = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const byType = EXPENSE_TYPES.map(type => ({
        type,
        total: expenses.filter(e => e.expense_type === type).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0)
    }));

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0">Fuel & Expense Management</h4>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-md-3">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body">
                            <h6 className="text-muted small fw-bold mb-2">Total Spend</h6>
                            <h3 className="mb-0 fw-bold">₹{totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                    </div>
                </div>
                {byType.map(({ type, total }) => (
                    <div className="col-12 col-sm-6 col-md-3" key={type}>
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted small fw-bold mb-2">{type}</h6>
                                <h4 className="mb-0 fw-bold">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h4>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-4">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Log Expense</h5>
                        </div>
                        <div className="card-body">
                            {error && <div className="alert alert-danger small py-2">{error}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Vehicle</label>
                                    <select className="form-select" name="vehicle_id" value={formData.vehicle_id} onChange={handleChange} required>
                                        <option value="">-- Select Vehicle --</option>
                                        {vehicles.map(v => (
                                            <option key={v.vehicle_id} value={v.vehicle_id}>{v.registration_number} – {v.model_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Trip (optional)</label>
                                    <select className="form-select" name="trip_id" value={formData.trip_id} onChange={handleChange}>
                                        <option value="">-- None --</option>
                                        {trips.map(t => (
                                            <option key={t.trip_id} value={t.trip_id}>{t.source} → {t.destination} ({t.status})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Expense Type</label>
                                    <select className="form-select" name="expense_type" value={formData.expense_type} onChange={handleChange} required>
                                        {EXPENSE_TYPES.map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Amount (₹)</label>
                                    <input type="number" className="form-control" name="amount" value={formData.amount} onChange={handleChange} min="0" step="0.01" required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label text-muted small fw-bold">Date</label>
                                    <input type="date" className="form-control" name="expense_date" value={formData.expense_date} onChange={handleChange} required />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label text-muted small fw-bold">Notes</label>
                                    <input type="text" className="form-control" name="notes" value={formData.notes} onChange={handleChange} />
                                </div>
                                <button type="submit" className="btn btn-primary w-100 fw-medium" disabled={loading}>
                                    {loading ? 'Saving...' : 'Log Expense'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="col-12 col-xl-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Expense Log</h5>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Vehicle</th>
                                            <th>Type</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expenses.map((e) => (
                                            <tr key={e.expense_id}>
                                                <td><span className="fw-medium">{e.registration_number || '—'}</span></td>
                                                <td>
                                                    <span className={`badge bg-${TYPE_COLORS[e.expense_type] || 'secondary'} bg-opacity-10 text-${TYPE_COLORS[e.expense_type] || 'secondary'}`}>
                                                        {e.expense_type}
                                                    </span>
                                                </td>
                                                <td>₹{Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                <td>{new Date(e.expense_date).toLocaleDateString()}</td>
                                                <td>{e.notes || '—'}</td>
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
