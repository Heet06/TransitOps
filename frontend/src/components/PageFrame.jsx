import BrandMark from './BrandMark.jsx'
import { avatarImagePath, roleAccess } from '../data/transitopsData.js'

export function SectionHeader({ badge, title, description, actions, centered = false }) {
  return (
    <div className={`section-heading ${centered ? 'text-center' : ''}`}>
      {badge ? <span className="badge-soft">{badge}</span> : null}
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actions ? <div className="hero-actions justify-content-center">{actions}</div> : null}
    </div>
  )
}

export function PanelCard({ children, className = '' }) {
  return <article className={`panel-card ${className}`.trim()}>{children}</article>
}

export function MetricCard({ label, value, delta }) {
  return (
    <article className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-delta">{delta}</div>
    </article>
  )
}

export function StatusPill({ children, tone = 'subtle' }) {
  return <span className={`status-pill ${tone}`}>{children}</span>
}

export function MiniTag({ children }) {
  return <span className="mini-tag">{children}</span>
}

export function PublicFrame({ onNavigate, onLogout, currentUser, children }) {
  return (
    <div className="transitops-app">
      <header className="navbar navbar-expand-md sticky-top bg-body py-3 site-header">
        <div className="container">
          <BrandMark onClick={() => onNavigate(currentUser ? 'dashboard' : 'login')} />
          <button className="navbar-toggler border-0" data-bs-toggle="collapse" data-bs-target="#public-nav" type="button">
            <span className="visually-hidden">Toggle navigation</span>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="public-nav">
            <div className="ms-auto d-flex gap-2 align-items-center">
              {currentUser ? (
                <>
                  <StatusPill>{roleAccess[currentUser.role]?.label ?? currentUser.role}</StatusPill>
                  <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => onNavigate('dashboard')}>
                    Dashboard
                  </button>
                  <button type="button" className="btn btn-primary rounded-pill" onClick={onLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button type="button" className="btn btn-outline-primary rounded-pill" onClick={() => onNavigate('login')}>
                    Login
                  </button>
                  <button type="button" className="btn btn-primary rounded-pill" onClick={() => onNavigate('register')}>
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-body-tertiary py-3 border-top">
        <div className="container d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
          <p className="text-muted mb-0"><small>Frontend shell prepared for auth and backend integration.</small></p>
          <p className="text-muted mb-0"><small>No marketing content, no public product pages.</small></p>
        </div>
      </footer>
    </div>
  )
}

export function AuthFrame({ title, subtitle, illustration, children, onNavigate }) {
  return (
    <section className="bg-body-tertiary">
      <div className="container d-flex min-vh-100 flex-column justify-content-center align-items-center py-5">
        <BrandMark onClick={() => onNavigate('login')} className="mb-4" />
        <div className="card border-0 shadow-sm w-100 overflow-hidden auth-frame-card">
          <div className="row g-0">
            <div className="col-lg-6 auth-frame-copy d-flex flex-column justify-content-between p-4 p-md-5">
              <div>
                <div className="badge bg-light rounded-pill p-2 mb-3 px-3">Operations first</div>
                <h1 className="mb-3">{title}</h1>
                <p className="fs-5 mb-0">{subtitle}</p>
                <div className="d-flex flex-wrap gap-2 mt-4">
                  <span className="badge bg-light rounded-pill px-3 py-2">RBAC ready</span>
                  <span className="badge bg-light rounded-pill px-3 py-2">Fleet aware</span>
                  <span className="badge bg-light rounded-pill px-3 py-2">Backend-ready forms</span>
                </div>
              </div>
              <div className="small text-uppercase fw-bold">TransitOps control layer</div>
            </div>
            <div className="col-lg-6 bg-body p-4 p-md-5">
              <div className="card border-0 shadow-sm overflow-hidden h-100">
                <div className="card-body p-4 auth-panel-card" style={{ backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.55), rgba(248,250,252,0.95)), url(${illustration})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <form className="d-flex flex-column gap-3" onSubmit={(event) => event.preventDefault()}>
                    {children}
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function DashboardFrame({ currentUser, activePage, visiblePages, onNavigate, onLogout, children }) {
  const activeRole = roleAccess[currentUser.role]

  return (
    <div className="transitops-app">
      <div className="container-fluid">
        <div className="row min-vh-100">
          <div className="col bg-body p-0 px-md-2">
            <div className="offcanvas-md offcanvas-end sticky-md-top dashboard-sidebar-shell" tabIndex="-1" id="sidebar">
              <div className="offcanvas-body position-relative flex-column">
                <button className="btn-close position-absolute top-0 end-0 d-md-none m-4" type="button" aria-label="Close" data-bs-dismiss="offcanvas" data-bs-target="#sidebar"></button>
                <div className="w-100 pt-3">
                  <BrandMark onClick={() => onNavigate('dashboard')} className="ms-3" />
                  <button className="btn btn-primary d-flex justify-content-center align-items-center m-3 w-100 rounded-pill" type="button" onClick={() => onNavigate('dashboard')}>
                    <span className="me-2">+</span>Quick Create
                  </button>
                  <ul className="nav flex-column dashboard-nav-list">
                    {visiblePages.map((module) => (
                      <li key={module.id} className="nav-item">
                        <button className={`nav-link dashboard-nav-link ${activePage === module.id ? 'active' : ''}`} type="button" onClick={() => onNavigate(module.id)}>
                          <span className="me-2">•</span>{module.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    <h6 className="text-muted ps-3 small">Role</h6>
                    <div className="px-3 pb-3">
                      <StatusPill tone="subtle">{activeRole.label}</StatusPill>
                      <p className="small text-muted mt-2 mb-0">{activeRole.summary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-9 col-xl-10 bg-body-tertiary px-0">
            <div className="d-md-none p-2 sticky-top">
              <nav className="navbar bg-body rounded-4 shadow-sm px-2">
                <div className="container-fluid">
                  <BrandMark onClick={() => onNavigate('dashboard')} />
                  <button className="navbar-toggler border-0" data-bs-toggle="offcanvas" data-bs-target="#sidebar" type="button">
                    <span className="visually-hidden">Toggle navigation</span>
                    <span className="navbar-toggler-icon"></span>
                  </button>
                </div>
              </nav>
            </div>
            <main className="px-3 px-md-4">
              <div className="d-flex flex-column justify-content-between flex-xl-row-reverse align-items-xl-start pt-3 mb-3 border-bottom dashboard-topbar">
                <div className="d-flex align-items-center mb-3 mb-xl-0 gap-2">
                  <form className="position-relative flex-grow-1 me-1 dashboard-search-form" onSubmit={(event) => event.preventDefault()}>
                    <input className="form-control pe-4" type="search" placeholder="Search" name="search" />
                    <button className="btn border-0 position-absolute top-50 end-0 translate-middle-y" type="submit">
                      <span aria-hidden="true">⌕</span>
                    </button>
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
                      <img className="object-fit-cover border rounded-circle" src={avatarImagePath} width="32" height="32" alt="Profile" />
                    </button>
                    <div className="dropdown-menu dropdown-menu-end shadow">
                      <button className="dropdown-item" type="button">Profile</button>
                      <button className="dropdown-item" type="button">Settings</button>
                      <button className="dropdown-item link-danger" type="button" onClick={onLogout}>Logout</button>
                    </div>
                  </div>
                </div>
                <div>
                  <ol className="breadcrumb mb-2">
                    <li className="breadcrumb-item"><button className="btn btn-link p-0 text-decoration-none" type="button" onClick={() => onNavigate('dashboard')}>Home</button></li>
                    <li className="breadcrumb-item active"><span>{activePage}</span></li>
                  </ol>
                  <h1 className="h2 mb-0">{visiblePages.find((module) => module.id === activePage)?.label ?? 'Dashboard'}</h1>
                </div>
              </div>
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  )
}