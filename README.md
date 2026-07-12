# TransitOps

TransitOps is a smart transport operations platform for vehicle registry, driver compliance, dispatch, maintenance, fuel, expenses, vehicle documents, and operational analytics.

## Prerequisites

- Node.js and npm
- PostgreSQL
- `psql` command-line client

## Local Setup

Create the local database from the project root:

```bash
createdb transitops
```

Configure backend environment:

```bash
cd backend
cp .env.example .env
```

Update `backend/.env` with your local Postgres credentials:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/transitops
JWT_SECRET=replace-with-a-long-random-secret
NODE_ENV=development
PORT=5001
ALLOW_PUBLIC_REGISTER=false
SAFETY_REMINDER_EMAIL=safety@transitops.local
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
MAIL_FROM_NAME=TransitOps
```

Load the database schema and seed demo data:

```bash
cd ..
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/transitops" -f transitops.sql

cd backend
npm install
npm run db:seed
npm run db:demo
```

Start the backend:

```bash
npm start
```

In a second terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open the app:

```text
http://127.0.0.1:5173/
```

Backend health check:

```text
http://127.0.0.1:5001/health
```

The frontend proxies `/api` requests to `http://localhost:5001`.

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@transitops.io | admin123 |
| Fleet Manager | fleet@transitops.io | manager123 |
| Dispatcher | dispatcher@transitops.io | dispatch123 |
| Safety Officer | safety@transitops.io | safety123 |
| Financial Analyst | finance@transitops.io | finance123 |

## Roles And Access

| Role | Access |
| --- | --- |
| Admin | Full access, user management, settings, all operational modules |
| Fleet Manager | Dashboard, vehicle registry, drivers, trips, maintenance, fuel and expenses, reports, settings |
| Dispatcher | Dashboard, vehicle registry, trip dispatching, reports |
| Safety Officer | Dashboard, driver compliance, maintenance, license reminders, reports |
| Financial Analyst | Dashboard, fuel logs, expenses, operational cost, reports, read-only operational views |
| Driver | Dashboard and trip workflow access |

Public registration is disabled by default. Create and manage users from the Settings page using the seeded Admin account.

## Core Workflows

### Vehicle Registry

1. Open Vehicle Registry.
2. Add a vehicle with registration number, model, type, region, capacity, odometer, acquisition cost, and status.
3. Use filters for type, status, and region.
4. Use Docs to add vehicle documents such as registration, insurance, permit, fitness, pollution, or other records.
5. Retired and in-shop vehicles are excluded from dispatch availability.

### Driver Management

1. Open Drivers & Safety Profiles.
2. Add a driver with license number, category, expiry date, contact number, safety score, status, and region.
3. Filter by status or license expiry.
4. Drivers with expired licenses or suspended status cannot be dispatched.
5. Use License Reminders to send a Gmail reminder email for licenses expiring within 30 days.

### Trip Dispatch

1. Open Trip Dispatching.
2. Create a draft trip with source, destination, available vehicle, available driver, cargo weight, planned distance, and optional revenue.
3. Dispatch the trip.
4. The system validates vehicle status, driver status, license expiry, active assignments, and cargo capacity.
5. Dispatching changes the vehicle and driver to `ON_TRIP`.
6. Completing the trip records actual distance, fuel consumed, end odometer, and revenue, then restores vehicle and driver availability.
7. Cancelling a dispatched trip restores vehicle and driver availability.

### Maintenance

1. Open Maintenance.
2. Create a maintenance record for an available vehicle.
3. Active maintenance changes the vehicle status to `IN_SHOP`.
4. In-shop vehicles are hidden from dispatch selection.
5. Closing maintenance restores the vehicle to `AVAILABLE` unless it is retired.

### Fuel And Expenses

1. Open Fuel & Expense Management.
2. Log fuel entries with vehicle, liters, cost, and date.
3. Log other expenses such as tolls, insurance, maintenance, or other costs.
4. Reports use fuel logs, maintenance logs, expenses, trip distance, and revenue to calculate cost and ROI.

### Reports And Analytics

1. Open Reports & Analytics.
2. Review fleet utilization, average fuel efficiency, expenses, trip completion, vehicle performance, and ROI.
3. Export trip data as CSV.
4. Export the operations report as PDF.

### Settings And Users

1. Login as Admin.
2. Open Settings & RBAC.
3. Review role permissions.
4. Create or update user accounts and assign roles.
5. Keep public registration disabled for controlled access.

## Development Commands

Backend:

```bash
cd backend
npm start
npm run db:seed
npm run db:demo
npm test
```

## Demo Data

Use deterministic demo data before a product walkthrough:

```bash
cd backend
npm run db:seed
npm run db:demo
```

The demo script safely replaces records with `DEMO-` vehicle registrations and driver licenses. It creates:

- vehicles across available, on-trip, in-shop, and retired states
- drivers with valid, expiring, expired, suspended, and off-duty profiles
- trips across draft, dispatched, completed, and cancelled states
- active and closed maintenance records
- fuel logs, tolls, insurance, maintenance, and other expenses
- vehicle documents with realistic expiry dates
- report-ready revenue, cost, utilization, fuel-efficiency, and ROI data

## Suggested Demo Walkthrough

1. Login as Admin or Fleet Manager.
2. Open Dashboard and show KPIs, filters, and status charts.
3. Open Vehicle Registry and inspect `DEMO-VAN-05`, `DEMO-TRUCK-09`, documents, statuses, and filters.
4. Open Drivers & Safety Profiles and show expiring or blocked licenses.
5. Open Trip Dispatching, create a draft trip with an available vehicle and valid driver, then dispatch it.
6. Complete a dispatched trip using the inline completion panel.
7. Open Maintenance and show that active maintenance moves `DEMO-TRUCK-09` into `IN_SHOP`.
8. Open Fuel & Expense Management and show fuel and expense logs filtered by vehicle.
9. Open Reports & Analytics and export CSV/PDF.
10. Send a license reminder email from Drivers & Safety Profiles.
11. Open Settings & RBAC to explain role access.

Frontend:

```bash
cd frontend
npm run dev
npm run lint
npm run build
npm run preview
```

## Troubleshooting

### Database Password Error

If the backend logs this error:

```text
client password must be a string
```

Your `DATABASE_URL` probably has an empty password, such as:

```env
DATABASE_URL=postgresql://postgres:@localhost:5432/transitops
```

Replace it with a valid password:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/transitops
```

### Missing Lookup Data

If vehicle types, license categories, regions, or demo users are missing, run:

```bash
cd backend
npm run db:seed
```

### Missing Tables

If API calls fail because tables do not exist, load the schema from the project root:

```bash
psql "postgresql://postgres:YOUR_PASSWORD@localhost:5432/transitops" -f transitops.sql
```

### Port Conflicts

Backend default port:

```text
5001
```

Frontend default port:

```text
5173
```

If either port is busy, stop the existing process or configure another port.

### Frontend Dependency Issue

If Vite reports a missing Rolldown native binding, refresh frontend dependencies:

```bash
cd frontend
npm install
```

### Gmail Reminder Email Setup

License reminder email delivery uses Gmail with an App Password.

1. Enable 2-Step Verification on the Gmail account.
2. Create an App Password in Google Account security settings.
3. Add these values to `backend/.env`:

```env
SAFETY_REMINDER_EMAIL=recipient@example.com
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
MAIL_FROM_NAME=TransitOps
```

Use the App Password, not your normal Gmail password.

## Verification

Run these before sharing or deploying the project:

```bash
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```

## Deployment Notes

- Use a strong `JWT_SECRET`.
- Keep `ALLOW_PUBLIC_REGISTER=false`.
- Configure a production PostgreSQL database.
- Run schema setup and seed required lookup data before first login.
- Configure Gmail App Password credentials for `/api/reminders/license-expiry/send`.
