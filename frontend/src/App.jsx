import { useState } from 'react'
import './App.css'

import heroImage from '../transitops/assets/img/hero.webp'
import avatarImage from '../transitops/assets/img/team/avatar2.jpg'
import adobeLogo from '../transitops/assets/img/brands/adobe.svg'
import githubLogo from '../transitops/assets/img/brands/github.svg'
import googleLogo from '../transitops/assets/img/brands/google.svg'
import instagramLogo from '../transitops/assets/img/brands/instagram.svg'
import microsoftLogo from '../transitops/assets/img/brands/microsoft.svg'
import spotifyLogo from '../transitops/assets/img/brands/spotify.svg'
import stripeLogo from '../transitops/assets/img/brands/stripe.svg'

const moduleNavigation = [
  { id: 'dashboard', label: 'Dashboard', group: 'Core' },
  { id: 'vehicles', label: 'Vehicles', group: 'Fleet' },
  { id: 'drivers', label: 'Drivers', group: 'People' },
  { id: 'trips', label: 'Trips', group: 'Dispatch' },
  { id: 'maintenance', label: 'Maintenance', group: 'Service' },
  { id: 'reports', label: 'Reports', group: 'Insights' },
  { id: 'pricing', label: 'Pricing', group: 'Commercial' },
  { id: 'contacts', label: 'Support', group: 'Admin' },
]

const roleAccess = {
  admin: {
    label: 'Global Admin',
    summary: 'Full system visibility plus CRUD across every business module.',
    pages: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'reports', 'pricing', 'contacts'],
  },
  dispatcher: {
    label: 'Dispatcher',
    summary: 'Dispatch, assignment, and trip operations with read-only access to finance views.',
    pages: ['dashboard', 'vehicles', 'drivers', 'trips', 'reports', 'contacts'],
  },
  manager: {
    label: 'Fleet Manager',
    summary: 'Promotes asset oversight, team operations, and delivery reporting.',
    pages: ['dashboard', 'vehicles', 'drivers', 'trips', 'reports'],
  },
  mechanic: {
    label: 'Maintenance Lead',
    summary: 'Controls serviceable fleet status, maintenance logs, uptime, and readiness.',
    pages: ['dashboard', 'vehicles', 'maintenance', 'reports'],
  },
  finance: {
    label: 'Finance Analyst',
    summary: 'Reads operational cost, revenue, and billing exposure for reporting teams.',
    pages: ['dashboard', 'reports', 'pricing', 'contacts'],
  },
  driver: {
    label: 'Driver',
    summary: 'Hands-on access to trip status, route visibility, and support channels.',
    pages: ['dashboard', 'trips', 'contacts'],
  },
}

const demoUsers = [
  { id: 'admin', name: 'Ava Patel', email: 'admin@transitops.io', password: 'admin123', role: 'admin' },
  { id: 'dispatcher', name: 'Noah Kim', email: 'dispatcher@transitops.io', password: 'dispatch123', role: 'dispatcher' },
  { id: 'manager', name: 'Lina Roberts', email: 'manager@transitops.io', password: 'manager123', role: 'manager' },
  { id: 'mechanic', name: 'Ravi Shah', email: 'mechanic@transitops.io', password: 'service123', role: 'mechanic' },
  { id: 'finance', name: 'Sofia Turner', email: 'finance@transitops.io', password: 'finance123', role: 'finance' },
  { id: 'driver', name: 'Marcus Lee', email: 'driver@transitops.io', password: 'driver123', role: 'driver' },
]

const heroFeatures = [
  'Driver & vehicle lifecycle visibility',
  'Maintenance and expense workflows',
  'Fleet utilization and operational analytics',
]

const kpiCards = [
  { label: 'Active Vehicles', value: '48', delta: '+4 today' },
  { label: 'Available Vehicles', value: '31', delta: '64% ready' },
  { label: 'Vehicles in Maintenance', value: '5', delta: '1 urgent' },
  { label: 'Active Trips', value: '12', delta: '4 dispatching' },
  { label: 'Pending Trips', value: '6', delta: '2 need driver' },
  { label: 'Drivers On Duty', value: '23', delta: '18 assigned' },
  { label: 'Fleet Utilization', value: '82%', delta: 'high demand' },
]

const vehicleRows = [
  { reg: 'Van-05', model: 'Transit Mini', type: 'Van', capacity: '500 kg', odometer: '28,900', status: 'Available' },
  { reg: 'Bus-18', model: 'City Cruiser', type: 'Bus', capacity: '1400 kg', odometer: '66,400', status: 'On Trip' },
  { reg: 'Truck-09', model: 'Cargo Plus', type: 'Truck', capacity: '900 kg', odometer: '49,350', status: 'In Shop' },
]

const driverRows = [
  { name: 'Alex', license: 'DL-45A', category: 'LMV', expiry: '2026-09-13', safety: '94', status: 'Available' },
  { name: 'Priya', license: 'DL-12K', category: 'HGV', expiry: '2026-08-04', safety: '88', status: 'On Trip' },
  { name: 'Marcus', license: 'DL-67Z', category: 'LMV', expiry: '2026-06-21', safety: '79', status: 'Suspended' },
]

const tripRows = [
  { source: 'Depot A', destination: 'Central Market', vehicle: 'Van-05', driver: 'Alex', weight: '450 kg', status: 'Dispatched' },
  { source: 'Hub 2', destination: 'Airport', vehicle: 'Bus-18', driver: 'Priya', weight: '1120 kg', status: 'Completed' },
  { source: 'Warehouse', destination: 'North Ridge', vehicle: 'Truck-09', driver: 'Marcus', weight: '810 kg', status: 'Draft' },
]

const maintenanceRows = [
  { vehicle: 'Truck-09', task: 'Oil Change', date: '2026-07-11', cost: '$240', status: 'Open' },
  { vehicle: 'Bus-18', task: 'Brake Inspection', date: '2026-07-10', cost: '$180', status: 'Closed' },
  { vehicle: 'Van-05', task: 'Tire Rotation', date: '2026-07-12', cost: '$95', status: 'Open' },
]

const expenseRows = [
  { vehicle: 'Van-05', fuel: '42 L', maintenance: '$120', total: '$148', roi: '18%' },
  { vehicle: 'Bus-18', fuel: '56 L', maintenance: '$310', total: '$398', roi: '12%' },
  { vehicle: 'Truck-09', fuel: '38 L', maintenance: '$240', total: '$296', roi: '9%' },
]

const pricingPlans = [
  {
    name: 'Starter',
    price: '$19',
    description: 'Perfect for small transport teams and pilots.',
    accent: 'light',
    cta: 'Get Started',
    features: ['5 users', '10 active routes', 'Basic analytics', 'Email support'],
  },
  {
    name: 'Pro',
    price: '$29',
    description: 'Best for regional dispatch and billing operations.',
    accent: 'primary',
    cta: 'Choose Pro',
    features: ['20 users', 'Unlimited projects', 'Advanced analytics', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: '$99',
    description: 'Purpose-built for multi-region fleet operations.',
    accent: 'light',
    cta: 'Talk to Sales',
    features: ['Unlimited users', 'Dedicated success manager', 'Custom integrations', 'SAML SSO'],
  },
]

const trustedBrands = [
  { src: adobeLogo, alt: 'Adobe' },
  { src: githubLogo, alt: 'GitHub' },
  { src: googleLogo, alt: 'Google' },
  { src: instagramLogo, alt: 'Instagram' },
  { src: microsoftLogo, alt: 'Microsoft' },
  { src: spotifyLogo, alt: 'Spotify' },
  { src: stripeLogo, alt: 'Stripe' },
]

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [loginEmail, setLoginEmail] = useState('admin@transitops.io')
  const [loginPassword, setLoginPassword] = useState('admin123')
  const [selectedRole, setSelectedRole] = useState('admin')
  const [loginError, setLoginError] = useState('')

  const activeRole = currentUser ? roleAccess[currentUser.role] : roleAccess.admin
  const visiblePages = moduleNavigation.filter((module) => activeRole.pages.includes(module.id))
  const allowedPage = visiblePages.some((module) => module.id === page) ? page : 'dashboard'

  const handleLogin = (event) => {
    event.preventDefault()

    const matchedUser = demoUsers.find(
      (user) =>
        user.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        user.password === loginPassword &&
        user.role === selectedRole,
    )

    if (!matchedUser) {
      setLoginError('Your email, password, or selected role does not match one of the demo accounts.')
      return
    }

    setCurrentUser(matchedUser)
    setPage('dashboard')
    setLoginError('')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setPage('dashboard')
  }

  if (!currentUser) {
    return (
      <div className="transitops-app auth-shell">
        <div className="container-wide auth-layout">
          <section className="auth-copy">
            <span className="badge-soft">TransitOps control center</span>
            <h1>Multi-user transport operations UI.</h1>
            <p>
              This screen is the first UI layer for a shared operations system. Users can sign in as different roles and see only the pages allowed by RBAC.
            </p>
            <div className="hero-feature-list">
              {heroFeatures.map((item) => (
                <div key={item} className="feature-chip">✔ {item}</div>
              ))}
            </div>
            <div className="brand-list auth-brand-list">
              {trustedBrands.map((brand) => (
                <img key={brand.alt} src={brand.src} alt={brand.alt} className="brand-logo" />
              ))}
            </div>
          </section>

          <section className="login-card">
            <div className="panel-heading">
              <span>Sign in</span>
              <span className="status-pill subtle">RBAC Demo</span>
            </div>

            <form className="stacked-form" onSubmit={handleLogin}>
              <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
                <option value="admin">Global Admin</option>
                <option value="dispatcher">Dispatcher</option>
                <option value="manager">Fleet Manager</option>
                <option value="mechanic">Maintenance Lead</option>
                <option value="finance">Finance Analyst</option>
                <option value="driver">Driver</option>
              </select>

              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
              />

              {loginError ? <div className="error-banner">{loginError}</div> : null}

              <button type="submit" className="btn btn-primary rounded-pill">
                Continue to dashboard
              </button>
            </form>

            <div className="demo-user-grid">
              {demoUsers.map((user) => (
                <button
                  key={user.email}
                  type="button"
                  className="demo-user-chip"
                  onClick={() => {
                    setSelectedRole(user.role)
                    setLoginEmail(user.email)
                    setLoginPassword(user.password)
                  }}
                >
                  {user.name}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="transitops-app">
      <header className="site-header">
        <div className="container-wide header-row">
          <button type="button" className="brand-mark brand-button" onClick={() => setPage('dashboard')}>
            <span className="brand-icon">◈</span>
            <span>TransitOps</span>
          </button>

          <nav className="nav-pills">
            {visiblePages.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-pill ${allowedPage === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <span className="role-chip">{activeRole.label}</span>
            <button type="button" className="btn btn-outline-primary rounded-pill px-3" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="app-shell">
        <aside className="sidebar-card">
          <div className="sidebar-user-row">
            <img src={avatarImage} alt="User profile" className="avatar" />
            <div>
              <div className="sidebar-user-name">{currentUser.name}</div>
              <div className="sidebar-user-email">{currentUser.email}</div>
            </div>
          </div>

          <div className="sidebar-group">
            <div className="group-title">RBAC Access</div>
            <div className="access-summary">{activeRole.summary}</div>
          </div>

          <div className="sidebar-group">
            <div className="group-title">Available Modules</div>
            {visiblePages.map((module) => (
              <button
                key={module.id}
                type="button"
                className={`sidebar-button ${allowedPage === module.id ? 'active' : ''}`}
                onClick={() => setPage(module.id)}
              >
                <span>{module.label}</span>
                <span>{module.group}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="workspace-panel">
          {allowedPage === 'dashboard' && <DashboardPage currentRole={currentUser.role} />}
          {allowedPage === 'vehicles' && <VehiclesPage />}
          {allowedPage === 'drivers' && <DriversPage />}
          {allowedPage === 'trips' && <TripsPage />}
          {allowedPage === 'maintenance' && <MaintenancePage />}
          {allowedPage === 'reports' && <ReportsPage />}
          {allowedPage === 'pricing' && <PricingPage />}
          {allowedPage === 'contacts' && <ContactsPage />}
        </section>
      </main>
    </div>
  )
}

function DashboardPage({ currentRole }) {
  const userRole = roleAccess[currentRole]

  return (
    <section className="dashboard-section">
      <div className="container-wide">
        <div className="page-title-row">
          <div>
            <span className="badge-soft">Dashboard</span>
            <h2>TransitOps command center</h2>
          </div>
          <div className="search-box">
            <span>⌕</span>
            <input type="text" placeholder="Search vehicles, trips, drivers" />
          </div>
        </div>

        <div className="kpi-grid">
          {kpiCards.map((item) => (
            <article key={item.label} className="stat-card">
              <div className="stat-label">{item.label}</div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-delta">{item.delta}</div>
            </article>
          ))}
        </div>

        <div className="dashboard-grid">
          <article className="panel-card wide">
            <div className="panel-heading">
              <span>Fleet registry snapshot</span>
              <span className="status-pill subtle">Filtered by status</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Registration</th>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleRows.map((row) => (
                    <tr key={row.reg}>
                      <td>{row.reg}</td>
                      <td>{row.model}</td>
                      <td>{row.type}</td>
                      <td>{row.capacity}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-heading">
              <span>RBAC context</span>
            </div>
            <div className="rbac-card">
              <strong>{userRole.label}</strong>
              <p>{userRole.summary}</p>
              <div className="tag-row">
                {userRole.pages.map((page) => (
                  <span key={page} className="mini-tag">{page}</span>
                ))}
              </div>
            </div>
          </article>

          <article className="panel-card">
            <div className="panel-heading">
              <span>Drivers on duty</span>
            </div>
            <div className="driver-alert-list">
              {driverRows.map((driver) => (
                <div key={driver.name} className="driver-alert-item">
                  <div>
                    <strong>{driver.name}</strong>
                    <small>{driver.license} • Safety {driver.safety}</small>
                  </div>
                  <span className={`badge-dot ${driver.status.toLowerCase().replace(/\s/g, '-')}`}>{driver.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel-card wide">
            <div className="panel-heading">
              <span>Trip lifecycle</span>
              <span className="status-pill subtle">Draft → Dispatched → Completed / Cancelled</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tripRows.map((row) => (
                    <tr key={`${row.source}-${row.destination}`}>
                      <td>{row.source}</td>
                      <td>{row.destination}</td>
                      <td>{row.vehicle}</td>
                      <td>{row.driver}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function VehiclesPage() {
  return (
    <section className="module-section">
      <div className="container-wide">
        <div className="page-title-row">
          <div>
            <span className="badge-soft">Vehicle Registry</span>
            <h2>Manage fleet assets</h2>
          </div>
          <button type="button" className="btn btn-primary rounded-pill">Add Vehicle</button>
        </div>

        <div className="module-grid">
          <article className="panel-card">
            <div className="panel-heading">
              <span>Vehicle details</span>
            </div>
            <form className="stacked-form">
              <input type="text" placeholder="Registration Number" />
              <input type="text" placeholder="Vehicle Name / Model" />
              <select defaultValue="">
                <option value="" disabled>Vehicle Type</option>
                <option>Van</option>
                <option>Bus</option>
                <option>Truck</option>
              </select>
              <input type="text" placeholder="Maximum Load Capacity" />
              <input type="text" placeholder="Odometer" />
              <input type="text" placeholder="Acquisition Cost" />
              <select defaultValue="">
                <option value="" disabled>Status</option>
                <option>Available</option>
                <option>On Trip</option>
                <option>In Shop</option>
                <option>Retired</option>
              </select>
              <button type="button" className="btn btn-primary rounded-pill">Save Vehicle</button>
            </form>
          </article>

          <article className="panel-card wide">
            <div className="panel-heading">
              <span>Vehicle master list</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Model</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Odometer</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicleRows.map((row) => (
                    <tr key={row.reg}>
                      <td>{row.reg}</td>
                      <td>{row.model}</td>
                      <td>{row.type}</td>
                      <td>{row.capacity}</td>
                      <td>{row.odometer}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function DriversPage() {
  return (
    <section className="module-section">
      <div className="container-wide">
        <div className="page-title-row">
          <div>
            <span className="badge-soft">Driver Management</span>
            <h2>Maintain compliance and assignment readiness</h2>
          </div>
          <button type="button" className="btn btn-primary rounded-pill">Add Driver</button>
        </div>

        <div className="module-grid">
          <article className="panel-card">
            <div className="panel-heading">
              <span>Driver profile</span>
            </div>
            <form className="stacked-form">
              <input type="text" placeholder="Name" />
              <input type="text" placeholder="License Number" />
              <input type="text" placeholder="License Category" />
              <input type="date" placeholder="License Expiry Date" />
              <input type="text" placeholder="Contact Number" />
              <input type="text" placeholder="Safety Score" />
              <select defaultValue="">
                <option value="" disabled>Status</option>
                <option>Available</option>
                <option>On Trip</option>
                <option>Off Duty</option>
                <option>Suspended</option>
              </select>
              <button type="button" className="btn btn-primary rounded-pill">Save Driver</button>
            </form>
          </article>

          <article className="panel-card wide">
            <div className="panel-heading">
              <span>Driver roster</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>License</th>
                    <th>Category</th>
                    <th>Expiry</th>
                    <th>Safety</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {driverRows.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.license}</td>
                      <td>{row.category}</td>
                      <td>{row.expiry}</td>
                      <td>{row.safety}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function TripsPage() {
  return (
    <section className="module-section">
      <div className="container-wide">
        <div className="page-title-row">
          <div>
            <span className="badge-soft">Trip Management</span>
            <h2>Create and monitor dispatch flow</h2>
          </div>
          <button type="button" className="btn btn-primary rounded-pill">Create Trip</button>
        </div>

        <div className="module-grid">
          <article className="panel-card">
            <div className="panel-heading">
              <span>Trip input</span>
            </div>
            <form className="stacked-form">
              <input type="text" placeholder="Source" />
              <input type="text" placeholder="Destination" />
              <select defaultValue="">
                <option value="" disabled>Available Vehicle</option>
                <option>Van-05</option>
                <option>Bus-18</option>
              </select>
              <select defaultValue="">
                <option value="" disabled>Available Driver</option>
                <option>Alex</option>
                <option>Priya</option>
              </select>
              <input type="text" placeholder="Cargo Weight" />
              <input type="text" placeholder="Planned Distance" />
              <button type="button" className="btn btn-primary rounded-pill">Dispatch Trip</button>
            </form>
          </article>

          <article className="panel-card wide">
            <div className="panel-heading">
              <span>Trip lifecycle board</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Cargo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tripRows.map((row) => (
                    <tr key={`${row.source}-${row.destination}-${row.status}`}>
                      <td>{row.source}</td>
                      <td>{row.destination}</td>
                      <td>{row.vehicle}</td>
                      <td>{row.driver}</td>
                      <td>{row.weight}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function MaintenancePage() {
  return (
    <section className="module-section">
      <div className="container-wide">
        <div className="page-title-row">
          <div>
            <span className="badge-soft">Maintenance</span>
            <h2>Track service, repairs, and downtime</h2>
          </div>
          <button type="button" className="btn btn-primary rounded-pill">New Maintenance Log</button>
        </div>

        <div className="module-grid">
          <article className="panel-card">
            <div className="panel-heading">
              <span>Maintenance log</span>
            </div>
            <form className="stacked-form">
              <select defaultValue="">
                <option value="" disabled>Vehicle</option>
                <option>Van-05</option>
                <option>Bus-18</option>
                <option>Truck-09</option>
              </select>
              <input type="text" placeholder="Task / Service Type" />
              <input type="date" placeholder="Date" />
              <input type="text" placeholder="Cost" />
              <button type="button" className="btn btn-primary rounded-pill">Save Log</button>
            </form>
          </article>

          <article className="panel-card wide">
            <div className="panel-heading">
              <span>Active maintenance records</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Task</th>
                    <th>Date</th>
                    <th>Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceRows.map((row) => (
                    <tr key={`${row.vehicle}-${row.task}`}>
                      <td>{row.vehicle}</td>
                      <td>{row.task}</td>
                      <td>{row.date}</td>
                      <td>{row.cost}</td>
                      <td>{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function ReportsPage() {
  return (
    <section className="module-section">
      <div className="container-wide">
        <div className="page-title-row">
          <div>
            <span className="badge-soft">Reports & Analytics</span>
            <h2>Operational cost and efficiency</h2>
          </div>
          <div className="page-actions">
            <button type="button" className="btn btn-outline-primary rounded-pill">Export CSV</button>
            <button type="button" className="btn btn-primary rounded-pill">Export PDF</button>
          </div>
        </div>

        <div className="analytics-grid">
          <article className="panel-card">
            <div className="panel-heading">
              <span>Fuel efficiency</span>
            </div>
            <div className="metric-big">12.4 km/L</div>
            <p className="muted">Distance / Fuel based on latest trip and logs.</p>
          </article>
          <article className="panel-card">
            <div className="panel-heading">
              <span>Fleet utilization</span>
            </div>
            <div className="metric-big">82%</div>
            <p className="muted">Operational capacity usage across active region coverage.</p>
          </article>
          <article className="panel-card">
            <div className="panel-heading">
              <span>Operational cost</span>
            </div>
            <div className="metric-big">$2,090</div>
            <p className="muted">Fuel + maintenance for the current week.</p>
          </article>
          <article className="panel-card">
            <div className="panel-heading">
              <span>Vehicle ROI</span>
            </div>
            <div className="metric-big">18%</div>
            <p className="muted">Revenue minus maintenance and fuel divided by acquisition cost.</p>
          </article>
        </div>

        <article className="panel-card wide">
          <div className="panel-heading">
            <span>Expense summary</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Fuel</th>
                  <th>Maintenance</th>
                  <th>Total</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {expenseRows.map((row) => (
                  <tr key={row.vehicle}>
                    <td>{row.vehicle}</td>
                    <td>{row.fuel}</td>
                    <td>{row.maintenance}</td>
                    <td>{row.total}</td>
                    <td>{row.roi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  )
}

function PricingPage() {
  return (
    <section className="pricing-section">
      <div className="container-wide">
        <div className="section-heading text-center">
          <span className="badge-soft">Pricing</span>
          <h2>Simple, transparent pricing</h2>
          <p>Choose the package that matches your fleet and operating complexity.</p>
        </div>

        <div className="pricing-grid">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className={`pricing-card ${plan.accent === 'primary' ? 'featured' : ''}`}>
              <h3>{plan.name}</h3>
              <p>{plan.description}</p>
              <div className="price-row"><span className="price">{plan.price}</span><span className="price-unit">/month</span></div>
              <ul>
                {plan.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              <button type="button" className={`btn ${plan.accent === 'primary' ? 'btn-light text-primary' : 'btn-outline-primary'} rounded-pill mt-3`}>{plan.cta}</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function ContactsPage() {
  return (
    <section className="contacts-section">
      <div className="container-wide contact-grid">
        <div className="contact-copy">
          <span className="badge-soft">Support</span>
          <h2>Coordinate with the TransitOps team</h2>
          <p>Use this ticketing panel to raise support questions, dispatch issues, compliance alerts, or billing escalations.</p>
          <div className="contact-cards">
            <div className="contact-item"><strong>Phone</strong><span>+1 800 555 0147</span></div>
            <div className="contact-item"><strong>Email</strong><span>hello@transitops.io</span></div>
            <div className="contact-item"><strong>Location</strong><span>12 Example Street, Austin, TX</span></div>
          </div>
        </div>

        <form className="contact-form">
          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <textarea rows="6" placeholder="Message" />
          <button type="button" className="btn btn-primary w-100 rounded-pill">Send</button>
        </form>
      </div>
    </section>
  )
}

export default App
