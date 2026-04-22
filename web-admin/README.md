# web-admin — Master Admin Portal

React + Vite + TypeScript + TailwindCSS.

## Setup

```bash
cp .env.example .env        # set VITE_API_URL=http://localhost:5000
npm install
npm run dev                 # http://localhost:5173
```

## Scope

- Auth (login as master_admin only)
- Dashboard metrics
- Categories CRUD
- Vendors list + approve/reject
- (Next PR) MOU creation/edit, Customers, Payouts generation, Reports

Login with the seeded admin credentials from backend `.env`:

```
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
```
