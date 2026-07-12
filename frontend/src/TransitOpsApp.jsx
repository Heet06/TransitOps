import { useState } from 'react'
import './App.css'

import { demoUsers, moduleNavigation, roleAccess } from './data/transitopsData.js'

import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import VehiclesPage from './pages/VehiclesPage.jsx'
import DriversPage from './pages/DriversPage.jsx'
import TripsPage from './pages/TripsPage.jsx'
import MaintenancePage from './pages/MaintenancePage.jsx'
import FuelExpensePage from './pages/FuelExpensePage.jsx'
import ReportsPage from './pages/ReportsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

const publicPages = new Set(['login', 'register'])

function findDemoUser(email, password, role) {
  return demoUsers.find(
    (user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password && user.role === role,
  )
}

export default function TransitOpsApp() {
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('login')
  const [loginEmail, setLoginEmail] = useState('admin@transitops.io')
  const [loginPassword, setLoginPassword] = useState('manager123')
  const [selectedRole, setSelectedRole] = useState('fleetManager')
  const [loginError, setLoginError] = useState('')

  const activeRole = currentUser ? roleAccess[currentUser.role] : roleAccess.fleetManager
  const visiblePages = moduleNavigation.filter((module) => activeRole.pages.includes(module.id))
  const allowedPage = currentUser
    ? visiblePages.some((module) => module.id === page)
      ? page
      : 'dashboard'
    : publicPages.has(page)
      ? page
      : 'login'

  const navigateTo = (nextPage) => {
    if (nextPage === 'home') {
      setPage('login')
      return
    }

    if (!currentUser && !publicPages.has(nextPage)) {
      setPage('login')
      return
    }

    if (currentUser && publicPages.has(nextPage)) {
      setPage('dashboard')
      return
    }

    setPage(nextPage)
  }

  const handleLogin = () => {
    const matchedUser = findDemoUser(loginEmail, loginPassword, selectedRole)

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
    setPage('login')
  }

  const commonPageProps = {
    activePage: allowedPage,
    currentUser,
    onNavigate: navigateTo,
  }

  if (allowedPage === 'login') {
    return (
      <LoginPage
        {...commonPageProps}
        loginEmail={loginEmail}
        loginPassword={loginPassword}
        selectedRole={selectedRole}
        loginError={loginError}
        setLoginEmail={setLoginEmail}
        setLoginPassword={setLoginPassword}
        setSelectedRole={setSelectedRole}
        onLogin={handleLogin}
      />
    )
  }

  if (allowedPage === 'register') {
    return <RegisterPage {...commonPageProps} />
  }

  if (allowedPage === 'vehicles') {
    return <VehiclesPage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'drivers') {
    return <DriversPage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'trips') {
    return <TripsPage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'maintenance') {
    return <MaintenancePage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'fuel') {
    return <FuelExpensePage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'reports') {
    return <ReportsPage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'settings') {
    return <SettingsPage {...commonPageProps} visiblePages={visiblePages} onLogout={handleLogout} />
  }

  if (allowedPage === 'dashboard') {
    return <DashboardPage currentUser={currentUser} activePage={allowedPage} visiblePages={visiblePages} onNavigate={navigateTo} onLogout={handleLogout} />
  }

  return <LoginPage {...commonPageProps} loginEmail={loginEmail} loginPassword={loginPassword} selectedRole={selectedRole} loginError={loginError} setLoginEmail={setLoginEmail} setLoginPassword={setLoginPassword} setSelectedRole={setSelectedRole} onLogin={handleLogin} />
}