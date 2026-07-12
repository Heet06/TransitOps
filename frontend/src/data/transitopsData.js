import heroImage from '../../transitops/assets/img/hero.webp'
import authImage from '../../transitops/assets/img/photos/photo-2.jpg'
import avatarImage from '../../transitops/assets/img/team/avatar2.jpg'
import adobeLogo from '../../transitops/assets/img/brands/adobe.svg'
import githubLogo from '../../transitops/assets/img/brands/github.svg'
import googleLogo from '../../transitops/assets/img/brands/google.svg'
import instagramLogo from '../../transitops/assets/img/brands/instagram.svg'
import microsoftLogo from '../../transitops/assets/img/brands/microsoft.svg'
import spotifyLogo from '../../transitops/assets/img/brands/spotify.svg'
import stripeLogo from '../../transitops/assets/img/brands/stripe.svg'

export const publicNavItems = [
  { id: 'login', label: 'Login' },
  { id: 'register', label: 'Register' },
]

export const moduleNavigation = [
  { id: 'dashboard', label: 'Dashboard', group: 'Core' },
  { id: 'vehicles', label: 'Vehicle Registry', group: 'Fleet' },
  { id: 'drivers', label: 'Drivers & Safety', group: 'People' },
  { id: 'trips', label: 'Trip Scheduler', group: 'Dispatch' },
  { id: 'maintenance', label: 'Maintenance', group: 'Service' },
  { id: 'fuel', label: 'Fuel & Expense', group: 'Finance' },
  { id: 'reports', label: 'Reporting & Analytics', group: 'Insights' },
  { id: 'settings', label: 'Settings & Access', group: 'Admin' },
]

export const roleAccess = {
  fleetManager: {
    label: 'Fleet Manager',
    summary: 'Owns fleet operations, scheduling oversight, and administrative control.',
    pages: ['dashboard', 'vehicles', 'drivers', 'trips', 'maintenance', 'fuel', 'reports', 'settings'],
  },
  dispatcher: {
    label: 'Dispatcher',
    summary: 'Handles dispatch, assignment, and live trip coordination.',
    pages: ['dashboard', 'vehicles', 'trips', 'reports'],
  },
  safetyOfficer: {
    label: 'Safety Officer',
    summary: 'Monitors driver compliance, inspections, incidents, and maintenance readiness.',
    pages: ['dashboard', 'drivers', 'maintenance', 'reports'],
  },
  financialAnalyst: {
    label: 'Financial Analyst',
    summary: 'Tracks fuel, expense, cost control, and performance reporting.',
    pages: ['dashboard', 'fuel', 'reports'],
  },
}

export const demoUsers = [
  { id: 'fleet-manager', name: 'Ava Patel', email: 'manager@transitops.io', password: 'manager123', role: 'fleetManager' },
  { id: 'dispatcher', name: 'Noah Kim', email: 'dispatcher@transitops.io', password: 'dispatch123', role: 'dispatcher' },
  { id: 'safety-officer', name: 'Ravi Shah', email: 'safety@transitops.io', password: 'safety123', role: 'safetyOfficer' },
  { id: 'financial-analyst', name: 'Sofia Turner', email: 'finance@transitops.io', password: 'finance123', role: 'financialAnalyst' },
]

export const loginRoles = [
  { id: 'fleetManager', label: 'Fleet Manager' },
  { id: 'dispatcher', label: 'Dispatcher' },
  { id: 'safetyOfficer', label: 'Safety Officer' },
  { id: 'financialAnalyst', label: 'Financial Analyst' },
]

export const heroFeatures = [
  'Driver & vehicle lifecycle visibility',
  'Maintenance and expense workflows',
  'Fleet utilization and operational analytics',
]

export const trustedBrands = [
  { src: adobeLogo, alt: 'Adobe' },
  { src: githubLogo, alt: 'GitHub' },
  { src: googleLogo, alt: 'Google' },
  { src: instagramLogo, alt: 'Instagram' },
  { src: microsoftLogo, alt: 'Microsoft' },
  { src: spotifyLogo, alt: 'Spotify' },
  { src: stripeLogo, alt: 'Stripe' },
]

export const homeFeatureCards = [
  {
    title: 'Authentication and RBAC',
    description: 'Role-driven access for admins, dispatchers, fleet managers, mechanics, finance, and drivers.',
    badge: 'Access',
  },
  {
    title: 'Fleet Registry',
    description: 'Keep registration numbers, capacity, odometer, acquisition cost, and current status in sync.',
    badge: 'Fleet',
  },
  {
    title: 'Trip Lifecycle',
    description: 'Draft, dispatch, complete, and cancel with validations for vehicle and driver availability.',
    badge: 'Dispatch',
  },
  {
    title: 'Maintenance and Costing',
    description: 'Track service logs, fuel usage, and operational cost while keeping the vehicle pool clean.',
    badge: 'Ops',
  },
]

export const templateSpotlights = [
  {
    title: 'Sales Report',
    description: 'A reporting surface inspired by the sales-report template, repurposed for cost and ROI analysis.',
    tag: 'Analytics',
  },
  {
    title: 'Wallet / Expense Card',
    description: 'A compact finance-style card for fuel balance, maintenance spend, and transaction history.',
    tag: 'Finance',
  },
  {
    title: 'Product Card',
    description: 'A focused detail card that works well for vehicles, drivers, or a highlighted dispatch item.',
    tag: 'Detail',
  },
  {
    title: 'File Storage',
    description: 'A document-oriented layout for manifests, permits, and vehicle paperwork.',
    tag: 'Docs',
  },
  {
    title: 'Weather Forecast',
    description: 'A modular info widget style that adapts to status summaries and daily route conditions.',
    tag: 'Widget',
  },
  {
    title: 'Social Feed',
    description: 'A conversation stream pattern that fits dispatch notes, compliance updates, and alerts.',
    tag: 'Feed',
  },
]

export const kpiCards = [
  { label: 'Active Vehicles', value: '48', delta: '+4 today' },
  { label: 'Assigned Trips', value: '12', delta: '4 pending dispatch' },
  { label: 'Safety Flags', value: '3', delta: '1 escalated' },
  { label: 'Unreconciled Spend', value: '$2.8k', delta: 'fuel + maintenance' },
]

export const vehicleRows = [
  { reg: 'Van-05', model: 'Transit Mini', type: 'Van', capacity: '500 kg', odometer: '28,900', status: 'Available' },
  { reg: 'Bus-18', model: 'City Cruiser', type: 'Bus', capacity: '1400 kg', odometer: '66,400', status: 'On Trip' },
  { reg: 'Truck-09', model: 'Cargo Plus', type: 'Truck', capacity: '900 kg', odometer: '49,350', status: 'In Shop' },
]

export const driverRows = [
  { name: 'Alex', license: 'DL-45A', category: 'LMV', expiry: '2026-09-13', safety: '94', status: 'Available' },
  { name: 'Priya', license: 'DL-12K', category: 'HGV', expiry: '2026-08-04', safety: '88', status: 'On Trip' },
  { name: 'Marcus', license: 'DL-67Z', category: 'LMV', expiry: '2026-06-21', safety: '79', status: 'Suspended' },
]

export const tripRows = [
  { source: 'Depot A', destination: 'Central Market', vehicle: 'Van-05', driver: 'Alex', weight: '450 kg', status: 'Dispatched' },
  { source: 'Hub 2', destination: 'Airport', vehicle: 'Bus-18', driver: 'Priya', weight: '1120 kg', status: 'Completed' },
  { source: 'Warehouse', destination: 'North Ridge', vehicle: 'Truck-09', driver: 'Marcus', weight: '810 kg', status: 'Draft' },
]

export const maintenanceRows = [
  { vehicle: 'Truck-09', task: 'Oil Change', date: '2026-07-11', cost: '$240', status: 'Open' },
  { vehicle: 'Bus-18', task: 'Brake Inspection', date: '2026-07-10', cost: '$180', status: 'Closed' },
  { vehicle: 'Van-05', task: 'Tire Rotation', date: '2026-07-12', cost: '$95', status: 'Open' },
]

export const fuelRows = [
  { vehicle: 'Van-05', fuel: '42 L', rate: '$1.9', total: '$80', status: 'Submitted' },
  { vehicle: 'Bus-18', fuel: '56 L', rate: '$2.0', total: '$112', status: 'Approved' },
  { vehicle: 'Truck-09', fuel: '38 L', rate: '$2.1', total: '$80', status: 'Pending' },
]

export const accessRows = [
  { area: 'Fleet Registry', owner: 'Fleet Manager', scope: 'CRUD' },
  { area: 'Trip Scheduler', owner: 'Dispatcher', scope: 'Dispatch only' },
  { area: 'Safety Logs', owner: 'Safety Officer', scope: 'Review and escalate' },
  { area: 'Fuel & Expense', owner: 'Financial Analyst', scope: 'Approve and reconcile' },
]

export const expenseRows = [
  { vehicle: 'Van-05', fuel: '42 L', maintenance: '$120', total: '$148', roi: '18%' },
  { vehicle: 'Bus-18', fuel: '56 L', maintenance: '$310', total: '$398', roi: '12%' },
  { vehicle: 'Truck-09', fuel: '38 L', maintenance: '$240', total: '$296', roi: '9%' },
]

export const pricingPlans = [
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

export const supportContacts = [
  { label: 'Phone', value: '+1 800 555 0147' },
  { label: 'Email', value: 'hello@transitops.io' },
  { label: 'Location', value: '12 Example Street, Austin, TX' },
]

export const faqs = [
  {
    question: 'What does TransitOps cover?',
    answer: 'Fleet registration, driver management, dispatch, maintenance, expenses, and operational analytics.',
  },
  {
    question: 'Can I add more roles later?',
    answer: 'Yes. The RBAC model is data-driven so new roles can be layered in without reworking the UI.',
  },
  {
    question: 'Does the app support exports?',
    answer: 'The frontend already includes CSV and PDF export actions in the analytics surfaces.',
  },
]

export const heroImagePath = heroImage
export const authImagePath = authImage
export const avatarImagePath = avatarImage