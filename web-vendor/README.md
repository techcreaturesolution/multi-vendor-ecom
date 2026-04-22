# web-vendor — Vendor Dashboard

React + Vite + TypeScript + TailwindCSS. Dev port: **5174**.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Scope

- Vendor signup (sends KYC + bank details, creates `Vendor` record with `status = pending`)
- Login
- Dashboard (earnings summary)
- Products (list + create)
- Orders (list + book shipment)
- (Next PR) Customers list, earnings history/payouts, product edit, order details page
