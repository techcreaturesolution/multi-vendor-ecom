# Backend — Multi-Vendor E-Commerce API

Node.js + Express + TypeScript + MongoDB (Mongoose).

## Setup

```bash
cp .env.example .env
# edit .env: set MONGO_URI, JWT secrets, Razorpay keys, admin seed creds
npm install
npm run seed      # creates master admin + default categories
npm run dev       # starts on http://localhost:5000
```

## Routes

| Prefix | Role | Description |
|---|---|---|
| `/api/auth`      | public   | signup (customer, vendor), login, refresh, me |
| `/api/admin`     | admin    | categories, vendors, MOU, customers, payouts, dashboard |
| `/api/vendor`    | vendor   | profile, KYC, products, orders, earnings, customers |
| `/api/customer`  | customer | catalog (public), cart, addresses, checkout, orders, tracking, reviews, returns |
| `/api/webhooks`  | public   | `razorpay`, `shipway` (signature-verified) |

See `src/routes/**/index.ts` for the full surface.

## Payment & money flow

1. Customer hits `POST /api/customer/checkout/orders` → backend builds an `Order`, creates a Razorpay order, returns `razorpay.orderId + keyId`.
2. Client opens Razorpay checkout; on success calls `POST /api/customer/checkout/verify` which validates the HMAC signature and marks the order paid.
3. Razorpay also fires `/api/webhooks/razorpay` server-to-server; the webhook handler is idempotent and also marks the order paid (safety net).
4. The `Order.vendorSplits[]` array is pre-computed at order build time with `subtotal − shippingCost − adminCommission% = vendorNet`. The `getActiveCommissionPercent` service reads the vendor's currently-active `MOU`.
5. Once `Order.status = delivered` (via Shipway webhook or manual vendor update), the admin can run `POST /api/admin/payouts/generate` for a (vendor, period) to aggregate all eligible splits into a `Payout` (status = processing). After bank transfer, admin posts `POST /api/admin/payouts/:id/mark-paid` with the UTR.

## Courier (Shipway)

`services/courier/CourierProvider.ts` defines the interface. `ShipwayProvider.ts` is currently a deterministic stub — it returns sensible fake rate quotes, fake AWBs, and fake tracking events so the whole checkout → shipment → delivery loop works end-to-end in dev. Swap the method bodies for real Shipway REST calls when credentials are ready; no downstream code needs to change.

## Scripts

- `npm run dev` — hot-reloading dev server
- `npm run build` — tsc to `dist/`
- `npm run start` — run compiled output
- `npm run seed` — insert master admin + default categories
- `npm run lint` — ESLint (wired but no config yet; add as needed)
