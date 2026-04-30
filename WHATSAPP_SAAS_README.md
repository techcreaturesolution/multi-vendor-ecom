# WhatsApp SaaS — Business Automation Platform

A multi-tenant SaaS platform for WhatsApp Business automation. Built with **Node.js**, **Express**, **MongoDB**, **React**, **Tailwind CSS**, **BullMQ**, and **Socket.IO**.

## Features

- **Multi-Tenant Architecture** — Each business gets isolated data with role-based access (Super Admin, Tenant Admin, Agent)
- **WhatsApp Account Management** — Connect multiple WhatsApp Business numbers via Meta Cloud API
- **Contact Management** — Manual entry, Excel/CSV bulk upload, tagging & segmentation
- **Campaign Management** — Create bulk messaging campaigns with template messages, media support, and scheduling
- **Queue-Based Processing** — BullMQ + Redis for async message dispatch with retry logic and rate limiting
- **Real-Time Chat Inbox** — View and reply to incoming WhatsApp messages via Socket.IO
- **Auto-Reply Engine** — Keyword-based, exact-match, and time-based automated responses
- **Analytics Dashboard** — Campaign reports, delivery stats, message trends with Recharts
- **Subscription & Billing** — Plan management with Razorpay payment integration
- **Super Admin Panel** — Platform-wide tenant management and analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Mongoose) |
| Queue | BullMQ + Redis |
| Auth | JWT + OTP |
| Real-time | Socket.IO |
| Payments | Razorpay |
| WhatsApp API | Meta Cloud API |
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Charts | Recharts |

## Project Structure

```
whatsapp-saas/
├── backend/
│   ├── src/
│   │   ├── config/          # env, db, logger, redis
│   │   ├── middleware/       # auth, tenant, rateLimit, error, upload
│   │   ├── models/           # Mongoose schemas (9 models)
│   │   ├── controllers/      # Route handlers
│   │   ├── services/         # Business logic
│   │   ├── routes/           # Express routers (10 route files)
│   │   ├── queues/           # BullMQ campaign queue & worker
│   │   ├── validators/       # Zod schemas
│   │   ├── utils/            # Socket.IO setup
│   │   ├── app.ts
│   │   └── index.ts
│   ├── scripts/seed.ts       # Super admin seeder
│   └── package.json
├── web-dashboard/
│   ├── src/
│   │   ├── components/       # Layout, Sidebar, ProtectedRoute
│   │   ├── pages/            # 10 page components
│   │   ├── services/         # Axios API client
│   │   ├── store/            # Auth context
│   │   ├── types/            # TypeScript interfaces
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB
- Redis (for campaign queue)

### Backend Setup

```bash
cd backend
cp .env.example .env    # Edit with your credentials
npm install
npm run seed            # Create super admin
npm run dev             # Starts on :5000
```

### Frontend Setup

```bash
cd web-dashboard
npm install
npm run dev             # Starts on :5173 (proxies /api to :5000)
```

### Environment Variables

See `backend/.env.example` for all required configuration.

## API Endpoints

| Module | Prefix | Auth |
|--------|--------|------|
| Auth | `/api/auth` | Public (register, login) |
| WhatsApp Accounts | `/api/whatsapp-accounts` | Tenant Admin |
| Contacts | `/api/contacts` | Authenticated |
| Campaigns | `/api/campaigns` | Authenticated |
| Chat | `/api/chat` | Authenticated |
| Auto-Reply | `/api/auto-reply` | Tenant Admin |
| Analytics | `/api/analytics` | Authenticated |
| Subscription | `/api/subscription` | Tenant Admin |
| Webhook | `/api/webhook` | Public (Meta verification) |
| Admin | `/api/admin` | Super Admin |

## Database Models

- **User** — Authentication, roles, OTP
- **Tenant** — Multi-tenant business entities
- **WhatsAppAccount** — Connected WhatsApp numbers
- **Contact** — Customer contacts with tags
- **Campaign** — Bulk messaging campaigns
- **Message** — Individual messages (inbound + outbound)
- **Conversation** — Chat threads
- **AutoReplyRule** — Automated response rules
- **Subscription** — Billing and plan management
