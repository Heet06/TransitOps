import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const ROLE_LABELS = {
  FLEET_MANAGER: 'Fleet Manager',
  DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
  ADMIN: 'Admin',
  DRIVER: 'Driver',
};

export default function Layout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('transitops_theme') || 'light';
    document.documentElement.setAttribute('data-bs-theme', savedTheme);
  }, []);

  const setTheme = (theme) => {
    localStorage.setItem('transitops_theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme);
  };

  const navItems = [
    { id: '/', label: 'Dashboard', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST', 'DRIVER'] },
    { id: '/vehicles', label: 'Vehicle Registry', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { id: '/drivers', label: 'Drivers & Safety Profiles', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
    { id: '/trips', label: 'Trip Dispatching', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'DRIVER', 'FINANCIAL_ANALYST'] },
    { id: '/maintenance', label: 'Maintenance', roles: ['ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { id: '/expenses', label: 'Fuel & Expense Management', roles: ['ADMIN', 'FLEET_MANAGER', 'FINANCIAL_ANALYST'] },
    { id: '/reports', label: 'Reports & Analytics', roles: ['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] },
    { id: '/settings', label: 'Settings & RBAC', roles: ['ADMIN', 'FLEET_MANAGER'] },
  ];
  const visibleNavItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="container-fluid">
        <div className="row min-vh-100">
            <div className="col bg-body p-0 px-md-2" style={{ maxWidth: '280px' }}>
                <div className="offcanvas-md offcanvas-end sticky-md-top" tabIndex="-1" id="sidebar">
                    <div className="offcanvas-body position-relative flex-column">
                        <button className="btn-close position-absolute top-0 end-0 d-md-none m-4" type="button" aria-label="Close" data-bs-dismiss="offcanvas" data-bs-target="#sidebar"></button>
                        <div className="w-100 pt-3">
                            <Link className="text-decoration-none link-body-emphasis d-inline-flex align-items-center ms-3 mb-4" to="/">
                                <span className="fs-5 fw-bold">TransitOps</span>
                            </Link>
                            
                            <ul className="nav flex-column">
                                {visibleNavItems.map((item) => (
                                    <li className="nav-item" key={item.id}>
                                        <Link className={`nav-link ${location.pathname === item.id ? 'active fw-bold bg-light text-primary' : 'text-dark'}`} to={item.id}>
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="col bg-body-tertiary px-0">
                <div className="d-md-none p-2 sticky-top">
                    <nav className="navbar bg-body rounded-4 shadow-sm px-2">
                        <div className="container-fluid">
                            <Link className="navbar-brand" to="/">TransitOps</Link>
                            <button className="navbar-toggler border-0" data-bs-toggle="offcanvas" data-bs-target="#sidebar" type="button">
                                <span className="navbar-toggler-icon"></span>
                            </button>
                        </div>
                    </nav>
                </div>
                
                <main className="px-3 px-md-4 py-4">
                    <div className="d-flex flex-column justify-content-between flex-xl-row-reverse align-items-xl-start mb-4 border-bottom pb-3">
                        <div className="d-flex align-items-center mb-3 mb-xl-0 gap-2">
                            <form className="position-relative flex-grow-1 me-1" onSubmit={(e) => e.preventDefault()}>
                                <input className="form-control pe-4" type="search" placeholder="Search" />
                            </form>
                            <div className="dropdown theme-switcher">
                                <button className="btn btn-link dropdown-toggle px-2" data-bs-toggle="dropdown" aria-expanded="false" type="button">Theme</button>
                                <div className="dropdown-menu dropdown-menu-end">
                                    <button className="dropdown-item" type="button" onClick={() => setTheme('light')}>Light</button>
                                    <button className="dropdown-item" type="button" onClick={() => setTheme('dark')}>Dark</button>
                                </div>
                            </div>
                            <div className="dropdown">
                                <button className="btn dropdown-toggle border-0 p-2" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                                    <span className="fw-bold">{user?.full_name || 'Admin'}</span>
                                </button>
                                <div className="dropdown-menu dropdown-menu-end shadow">
                                    <div className="dropdown-item-text small text-muted">
                                        <div className="fw-medium">{user?.full_name}</div>
                                        <div>{ROLE_LABELS[user?.role] || user?.role}</div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <Link className="dropdown-item" to="/settings">Settings</Link>
                                    <button className="dropdown-item text-danger" onClick={logout}>Logout</button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h1 className="h3 mb-0 fw-bold">{navItems.find(item => item.id === location.pathname)?.label || 'Dashboard'}</h1>
                        </div>
                    </div>
                    <Outlet />
                </main>
            </div>
        </div>
    </div>
  );
}
