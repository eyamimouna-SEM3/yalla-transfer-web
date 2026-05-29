# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yalla Transfer is a Tunisian transport/transfer booking platform. Clients book vehicle transfers (airport, hotel, inter-city), manage bookings and payments. Includes admin and supplier dashboards.

**Stack:** React 18 + TypeScript + Vite (frontend) | NestJS 11 + TypeScript + Prisma (backend) | PostgreSQL (database) | Supabase (parallel auth)

## Development Commands

### Frontend (root directory)
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (port 8080)
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint check
npm run test         # Run Vitest once
npm run test:watch   # Vitest in watch mode
```

### Backend (backend/ directory)
```bash
cd backend
npm install             # Install dependencies
npx prisma db pull      # Introspect existing DB schema
npx prisma generate     # Generate Prisma client
npm run start:dev       # Start NestJS with watch mode (port 3000)
npm run build           # Compile TypeScript
npm run test            # Run Jest
npm run test:watch      # Jest in watch mode
npm run test:e2e        # End-to-end tests
npm run lint            # ESLint
npm run format          # Prettier
```

### Database setup
1. PostgreSQL 14+ must be running with database `yalla_transfer` created
2. Run `npx prisma db pull` then `npx prisma generate` in `backend/`

## Architecture

### Dual Auth System (important)
The app runs **two separate auth systems in parallel**:
- **Supabase Auth** (`src/hooks/useAuth.tsx` + `src/integrations/supabase/`): Used for login/signup UI and admin role checks via `user_roles` table. Wraps the entire app via `AuthProvider`.
- **NestJS JWT Auth** (`src/hooks/useAuthService.ts` + `src/services/authService.ts` + `src/utils/tokenStorage.ts`): Used for API calls to the NestJS backend. JWT stored in localStorage, auto-injected by `src/services/api.ts`.

### Frontend structure
- **Entry:** `src/main.tsx` → `src/App.tsx` (router + providers)
- **Routing:** React Router v6 defined in `App.tsx`. Admin routes wrapped with `AdminRouteGuard`.
- **API layer:** `src/services/api.ts` — fetch wrapper that auto-injects Bearer token, handles 401 redirect to `/auth`
- **Service modules:** `src/services/authService.ts`, `bookingService.ts`, `paymentService.ts`
- **Component library:** shadcn/ui (50+ components in `src/components/ui/`)
- **Styling:** Tailwind CSS with custom "yala" color palette (blue, blue-dark, blue-light, black, gray, gray-light, accent)
- **Path alias:** `@/` maps to `src/`
- **Forms:** react-hook-form + zod resolvers
- **Animations:** Framer Motion (auth step transitions)

### Backend structure
- **Entry:** `backend/src/main.ts` — NestJS bootstrap on port 3000, global `/api` prefix, CORS, validation pipes
- **Modules:** Auth (`backend/src/auth/`), Bookings (`backend/src/bookings/`), Payments (`backend/src/payments/`), Prisma (`backend/src/prisma/`)
- **Pattern:** NestJS module/controller/service per domain. DTOs with `class-validator` decorators. Ownership checks in services (`ensureBookingOwnership`, `ensurePaymentOwnership`).
- **ORM:** Prisma Client, schema at `backend/prisma/schema.prisma` (12 models, snake_case DB columns)

### Data flow
```
React Frontend (:8080)
  → api.ts (fetch wrapper + JWT injection)
  → NestJS Backend (:3000/api)
    → Auth Module (JWT, bcryptjs, 7-day expiry)
    → Bookings Module (Prisma → PostgreSQL)
    → Payments Module (Prisma → PostgreSQL)

React Frontend also connects to:
  → Supabase (auth context, user_roles for admin checks)
```

### Key database models
`users` (roles: client_b2c, client_b2b, driver_independent, driver_employee, supplier, admin), `bookings` (status: pending/confirmed/completed/cancelled), `payments` (1:1 with bookings, currencies: TND/EUR/USD, methods: cash/card/stripe/paypal/virement), `drivers`, `vehicles`, `suppliers`, `partners`, `routes`, `booking_offers`, `messages`, `notifications`, `ratings`, `claims`, `refresh_tokens`

### Environment variables
- **Root `.env`:** `VITE_API_URL` (defaults to `http://localhost:3000/api`), Supabase project ID, anon key, URL
- **`backend/.env`:** `DATABASE_URL` (PostgreSQL), `PORT` (3000), `JWT_SECRET`, `CORS_ORIGIN`, Google OAuth placeholders

## API Routes (all under /api)

| Method | Route | Auth |
|--------|-------|------|
| POST | `/auth/register` | No |
| POST | `/auth/login` | No |
| GET | `/auth/me` | JWT |
| POST/GET | `/bookings` | JWT |
| GET/PUT/DELETE | `/bookings/:id` | JWT |
| POST/GET | `/payments` | JWT |
| GET/PUT | `/payments/:id` | JWT |
| GET | `/payments/booking/:bookingId` | JWT |
| POST | `/payments/:id/verify` | JWT |
| PATCH | `/payments/:id/mark-as-paid` | JWT |

## Conventions

- Documentation is in French (INSTALLATION.md, GUIDE_BACKEND_ROUTES.md, backend/README.md)
- UI copy and location data are in French (Tunisian governorates, airports, ports, hotels in `src/data/locations.ts`)
- Vehicle types defined in `src/data/vehicleTypes.ts` (10 categories: eco, sedan, premium, luxe, pmr, van, 4x4, minibus, autocar, bus)
- Prisma schema uses snake_case column names; NestJS services map between camelCase JS and snake_case DB
- Supabase migrations in `supabase/migrations/` manage `profiles` and `user_roles` tables with RLS policies
