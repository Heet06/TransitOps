export default function ReportsPage() {
    const reports = [
        { title: 'Fuel Efficiency', metric: '8.5 L/100km', trend: '-2% this month' },
        { title: 'Fleet Utilization', metric: '94%', trend: '+5% this month' },
        { title: 'Operational Cost', metric: '₹12,450', trend: '-8% this month' },
        { title: 'Vehicle ROI', metric: '18%', trend: '+1.5% this month' }
    ];

    return (
        <div>
            <div className="row g-4 mb-4">
                {reports.map((report, idx) => (
                    <div className="col-12 col-md-6 col-xl-3" key={idx}>
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body">
                                <h6 className="text-muted small fw-bold mb-2">{report.title}</h6>
                                <h3 className="mb-2 fw-bold">{report.metric}</h3>
                                <span className={`badge ${report.trend.startsWith('+') ? 'bg-success' : 'bg-primary'} bg-opacity-10 text-${report.trend.startsWith('+') ? 'success' : 'primary'}`}>
                                    {report.trend}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100 min-vh-50" style={{ minHeight: '300px' }}>
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Cost vs Revenue</h5>
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center bg-light m-3 rounded">
                            <span className="text-muted">Chart Placeholder</span>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100 min-vh-50" style={{ minHeight: '300px' }}>
                        <div className="card-header bg-transparent border-0 pt-4 pb-0">
                            <h5 className="fw-bold mb-0">Fleet Utilization Overview</h5>
                        </div>
                        <div className="card-body d-flex align-items-center justify-content-center bg-light m-3 rounded">
                            <span className="text-muted">Chart Placeholder</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}