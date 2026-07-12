import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const navigate = useNavigate();

    const handleLogin = (e) => {
        e.preventDefault();
        navigate('/');
    };

    return (
        <section className="bg-body-tertiary">
            <div className="container d-flex min-vh-100 flex-column justify-content-center align-items-center py-5">
                <div className="card border-0 shadow-sm w-100 overflow-hidden auth-frame-card">
                    <div className="row g-0">
                        <div className="col-lg-6 auth-copy d-flex flex-column justify-content-between p-4 p-md-5" style={{ background: 'linear-gradient(180deg, rgba(9, 14, 22, 0.94), rgba(12, 18, 30, 0.98))', color: '#fff' }}>
                            <div>
                                <div className="d-flex align-items-center mb-4">
                                    <span className="fs-4 fw-bold">TransitOps</span>
                                </div>
                                <div className="badge bg-light text-dark rounded-pill p-2 mb-3 px-3">Operations first</div>
                                <h1 className="mb-3" style={{ fontSize: '3rem', fontWeight: 'bold' }}>Sign in to workspace</h1>
                                <p className="fs-5 mb-0 text-white-50">Manage your fleet and daily operations.</p>
                                <div className="d-flex flex-wrap gap-2 mt-4">
                                    <span className="badge bg-secondary bg-opacity-25 text-white rounded-pill px-3 py-2">RBAC ready</span>
                                    <span className="badge bg-secondary bg-opacity-25 text-white rounded-pill px-3 py-2">Fleet aware</span>
                                    <span className="badge bg-secondary bg-opacity-25 text-white rounded-pill px-3 py-2">Backend-ready forms</span>
                                </div>
                            </div>
                            <div className="small text-uppercase fw-bold text-white-50 mt-5">TransitOps control layer</div>
                        </div>
                        <div className="col-lg-6 bg-body p-4 p-md-5 d-flex align-items-center justify-content-center">
                            <div className="w-100" style={{ maxWidth: '360px' }}>
                                <form className="d-flex flex-column gap-3" onSubmit={handleLogin}>
                                    <div className="text-center mb-4">
                                        <h2 className="fs-4 fw-bold">Login to your account</h2>
                                        <p className="text-muted small">Enter your email below to login to your account</p>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-medium" htmlFor="email">Email</label>
                                        <input className="form-control" type="email" id="email" placeholder="email@example.com" required name="email" />
                                    </div>
                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <label className="form-label mb-0 small fw-medium" htmlFor="password">Password</label>
                                            <a className="ms-auto small text-decoration-none" href="#!">Forgot your password?</a>
                                        </div>
                                        <input className="form-control" type="password" id="password" required name="password" />
                                    </div>
                                    <button className="btn btn-primary w-100" type="submit">Login</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}