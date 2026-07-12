# TransitOps

TransitOps is a smart transport operations platform for vehicle registry, driver compliance, dispatch, maintenance, fuel, expenses, and operational analytics.

## Local Setup

1. Create a Postgres database named `transitops`.
2. Load the baseline schema:

   ```bash
   psql "$DATABASE_URL" -f transitops.sql
   ```

3. Configure the backend:

   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run db:seed
   npm run dev
   ```

4. Start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

The frontend proxies `/api` to `http://localhost:5001`.

## Seed Accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@transitops.io | admin123 |
| Fleet Manager | fleet@transitops.io | manager123 |
| Dispatcher | dispatcher@transitops.io | dispatch123 |
| Safety Officer | safety@transitops.io | safety123 |
| Financial Analyst | finance@transitops.io | finance123 |

## Production Checklist

- Set a strong `JWT_SECRET`.
- Keep `ALLOW_PUBLIC_REGISTER=false` and create users from Settings as an admin.
- Run `npm run db:seed` after loading the SQL schema.
- Run backend tests and frontend lint/build before deployment.
- Configure real email delivery behind `/api/reminders/license-expiry/send` if reminders should leave the app instead of returning preview payloads.
