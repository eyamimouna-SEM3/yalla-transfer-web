# Yalla Transfer — Architecture unifiée

## Vue d'ensemble

Un seul backend NestJS sert **les 2 frontends** (web React + mobile Flutter) avec **synchronisation temps réel** via WebSocket.

```
            ┌────────────────────────────────────────────┐
            │  Backend NestJS (port 3000)                │
            │  yalla_transfer_backend/                   │
            │                                            │
            │  REST  →  /api/...                         │
            │  WS    →  /bookings, /chat, /tracking      │
            └─────────────┬──────────────┬───────────────┘
                          │              │
         ┌────────────────┘              └──────────────────┐
         │                                                  │
   ┌─────▼───────┐                                   ┌─────▼────────┐
   │  Web React  │                                   │  Mobile      │
   │  port 5173  │                                   │  Flutter     │
   └─────────────┘                                   └──────────────┘
                          │              │
                          └──────┬───────┘
                                 │
                          ┌──────▼───────┐
                          │  PostgreSQL  │
                          │  port 5432   │
                          └──────────────┘
```

**Localisations des projets :**
- Backend : `C:\projets\yalla_go_flutter\yalla_transfer_backend\`
- Web : `C:\Application-Web-Transferts-main\`
- Mobile : `C:\projets\yalla_go_flutter\`

## Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+ tournant sur `localhost:5432` avec utilisateur `postgres`/`postgres`
- Base `yalla_transfer` créée (vide — sera initialisée par Prisma)
- Flutter SDK (pour le mobile)

## Démarrage

### 1) Backend NestJS

```powershell
cd C:\projets\yalla_go_flutter\yalla_transfer_backend
npm install                     # première fois seulement
npx prisma generate             # première fois seulement
npx prisma migrate deploy       # applique les migrations existantes
npm run start:dev               # démarre en mode watch
```

Le backend écoute sur `http://localhost:3000`. Le seed automatique insère 7 véhicules dans le catalogue au démarrage.

### 2) Frontend Web React

```powershell
cd C:\Application-Web-Transferts-main
npm install                     # première fois seulement
npm run dev                     # serveur Vite sur localhost:5173
```

Le `.env` pointe vers `VITE_API_URL=http://localhost:3000/api`.

### 3) Mobile Flutter

```powershell
cd C:\projets\yalla_go_flutter
flutter pub get                 # première fois seulement
flutter run                     # cible sélectionnée (Android, iOS, Web)
```

- Émulateur Android : `http://10.0.2.2:3000/api` (configuré automatiquement dans `api_client.dart`)
- Web/iOS : `http://localhost:3000/api`
- Override : `flutter run --dart-define=API_BASE_URL=https://votre-serveur/api`

## Configuration backend (.env)

`C:\projets\yalla_go_flutter\yalla_transfer_backend\.env` :

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yalla_transfer?schema=public"
JWT_SECRET="yalla_transfer_secret_key_2024"
PORT=3000
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="Yalla Transfer <...>"
```

## Endpoints REST disponibles

| Domaine | Routes |
|---|---|
| Auth | `/api/auth/register`, `/login`, `/me`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/change-password` |
| Bookings | `/api/bookings`, `/active`, `/:id/tracking`, `/:id/voucher`, `/:id/client-rating` |
| Vehicles | `/api/vehicles` |
| Locations | `/api/locations` |
| Driver | `/api/driver/next-booking`, `/accept-booking`, `/pass-booking`, `/online`, `/location` |
| Supplier | `/api/supplier/dashboard`, `/bookings/unassigned`, `/bookings/recent`, `/clients`, `/fleet/drivers`, `/bookings/:id/assign-driver` |
| Payments | `/api/payments/methods`, `/send-code`, `/verify-code` |
| Notifications | `/api/notifications` |
| Chat | `/api/chat` (+ WebSocket `/chat`) |
| Return Trips | `/api/return-trips/search`, `/:id`, `/:id/book` |
| Routes (trajets prédéfinis) | `/api/routes`, `/search`, `/:id` |
| Ratings | `/api/ratings`, `/booking/:id`, `/driver/:id`, `/supplier/:id` |
| Claims | `/api/claims`, `/:id`, `/:id/status` |
| Partners | `/api/partners`, `/me`, `/:id` |
| Booking Offers | `/api/booking-offers`, `/my-offers`, `/booking/:id`, `/:id/accept`, `/:id/withdraw` |
| Admin | `/api/admin/stats`, `/users`, `/bookings`, `/payments` |

## Événements WebSocket

| Namespace | Événements |
|---|---|
| `/bookings` | `booking:created`, `booking:updated`, `booking:statusChanged`, `booking:driverAssigned`, `offer:created`, `offer:accepted` |
| `/chat` | `joinBooking`, `leaveBooking`, `sendMessage`, `chatMessage` |
| `/tracking` | `joinBookingTracking`, `leaveBookingTracking`, `joinSupplierFleet`, `trackingUpdate`, `fleetDriverMoved` |

L'authentification se fait via JWT passé en `auth.token` du handshake Socket.IO.

## Reset complet de la DB (dev uniquement)

```powershell
cd C:\projets\yalla_go_flutter\yalla_transfer_backend
npx prisma migrate reset --force
```

## Comptes de test

Aucun compte par défaut. Crée-toi un compte via `POST /api/auth/register` ou via la page `/inscription` du web.

Pour devenir admin :
```powershell
# Via Prisma Studio
cd C:\projets\yalla_go_flutter\yalla_transfer_backend
npx prisma studio
# → ouvrir la table `users`, modifier `role` = "admin" sur ton compte
```
