import { Outlet, Link, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { id: '/', label: 'Dashboard' },
    { id: '/vehicles', label: 'Vehicle Registry' },
    { id: '/drivers', label: 'Drivers & Safety Profiles' },
    { id: '/trips', label: 'Trip Dispatching' },
    { id: '/maintenance', label: 'Maintenance' },
    { id: '/expenses', label: 'Fuel & Expense Management' },
    { id: '/reports', label: 'Reports & Analytics' },
    { id: '/settings', label: 'Settings & RBAC' },
  ];

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
                                {navItems.map((item) => (
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
                                    <button className="dropdown-item" type="button" onClick={() => document.documentElement.setAttribute('data-bs-theme', 'light')}>Light</button>
                                    <button className="dropdown-item" type="button" onClick={() => document.documentElement.setAttribute('data-bs-theme', 'dark')}>Dark</button>
                                </div>
                            </div>
                            <div className="dropdown">
                                <button className="btn dropdown-toggle border-0 p-2" data-bs-toggle="dropdown" aria-expanded="false" type="button">
                                    <span className="fw-bold">Admin</span>
                                </button>
                                <div className="dropdown-menu dropdown-menu-end shadow">
                                    <Link className="dropdown-item" to="/settings">Settings</Link>
                                    <Link className="dropdown-item text-danger" to="/login">Logout</Link>
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
