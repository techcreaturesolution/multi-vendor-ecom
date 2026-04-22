# web-customer — Customer Storefront

React + Vite + TypeScript + TailwindCSS. Dev port: **5175**.

Razorpay Checkout is loaded via CDN in `index.html`.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Scope

- Public catalog (all vendors, all categories)
- Product detail
- Cart, address book, checkout with Razorpay
- Order history + tracking
- Signup / login
- (Next PR) Returns flow UI, reviews UI, wishlist
