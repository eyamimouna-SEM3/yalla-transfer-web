ru# 📱 Yalla Transfer - Guide de démarrage complet

## 📂 Structure du projet

```
Application-Web-Transferts-main/
├── src/                      ← React Web Frontend (port 5173)
├── backend/                  ← NestJS Backend (port 3000) NEW!
├── mobile/                   ← Flutter Mobile App
├── .env.local               ← Config React
└── ...
```

---

## 🎯 Prérequis

### Installés et fonctionnels:
- ✅ Node.js 18+
- ✅ npm/yarn
- ✅ PostgreSQL 14+ (avec la BD `yalla_transfer`)
- ✅ Le schéma PostgreSQL importé

### À vérifier:
```bash
node --version      # Doit être v18+
npm --version       # Doit être v8+
psql --version      # PostgreSQL 14+
```

---

## 🚀 Démarrage rapide (3 étapes)

### Étape 1️⃣: Configurer le Backend local

```bash
# 1. Va dans le dossier backend
cd backend

# 2. Installe les dépendances
npm install

# 3. Configure la BD (voir section "Base de données")
# Assure-toi que PostgreSQL est lancé et que la BD existe

# 4. Synchronise Prisma avec la BD
npx prisma db pull
npx prisma generate

# 5. Démarre le backend
npm run start:dev

# Résultat attendu:
# ╔════════════════════════════════════════╗
# ║  🚀 Yalla Transfer Backend Running!   ║
# ║  ✅ Server: http://localhost:3000      ║
# ║  ✅ API: http://localhost:3000/api     ║
# ╚════════════════════════════════════════╝
```

### Étape 2️⃣: Configurer le Frontend React

```bash
# 1. Va à la racine du projet (où se trouvent src/ et backend/)
cd ..

# 2. Vérifie que .env.local existe et contient:
# REACT_APP_API_URL=http://localhost:3000/api

cat .env.local  # Doit afficher: REACT_APP_API_URL=http://localhost:3000/api

# 3. Installe les dépendances (une seule fois)
npm install

# 4. Démarre le serveur React
npm run dev

# Résultat attendu:
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### Étape 3️⃣: Tester le tout!

```
1. Ouvre: http://localhost:5173 dans ton navigateur
2. Clique sur "Login" ou "Register"
3. Essaie de créer un compte
4. Du backend, tu devrais voir:
   ✅ POST /auth/register 201
```

---

## 🗄️ Base de données

### Vérifier que PostgreSQL fonctionne

```powershell
# Ouvre PostgreSQL
psql -U postgres

# Dans PostgreSQL, tape:
\l                          # Liste les BD
CREATE DATABASE yalla_transfer;  # Crée la BD
\c yalla_transfer           # Se connecte à la BD
\q                          # Quitter
```

### Importer le schéma

**Méthode 1: Avec pgAdmin**
1. Ouvre pgAdmin → Servers → PostgreSQL → Databases
2. Crée une nouvelle BD: `yalla_transfer`
3. Clique sur la BD → Query Tool
4. Copie tout le SQL du fichier schéma
5. Exécute (F5)

**Méthode 2: Avec la commande psql**
```bash
psql -U postgres -d yalla_transfer -f schema.sql
```

### Vérifier les tables

```powershell
psql -U postgres -d yalla_transfer

# Dans PostgreSQL:
\dt                  # Liste les tables
SELECT * FROM users; # Voir les utilisateurs
```

---

## 📡 Routes API à tester

### 1️⃣ Créer un compte (Register)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@test.com",
    "phone": "50123456789",
    "password": "Test@123",
    "role": "client_b2c"
  }'

# Résponse attendue:
# {
#   "access_token": "eyJhbGc...",
#   "user": { "id": "...", "fullName": "John Doe", ... }
# }
```

### 2️⃣ Se connecter (Login)

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "Test@123"
  }'

# Copie le token (access_token)
```

### 3️⃣ Créer une réservation (Booking)

```bash
# Remplace TOKEN par le token du login
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "clientId": "user-id-from-login",
    "pickupAddress": "Tunis Centre",
    "dropoffAddress": "Hammamet",
    "departureTime": "2026-04-01T10:00:00Z",
    "passengers": 2,
    "luggageCount": 1,
    "totalPrice": 150
  }'
```

### 4️⃣ Créer un paiement (Payment)

```bash
# Remplace TOKEN et BOOKING_ID
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "bookingId": "BOOKING_ID_FROM_CREATE_BOOKING",
    "amount": 150,
    "currency": "TND",
    "method": "cash",
    "paymentTiming": "immediate"
  }'
```

---

## 🧪 Tester avec Postman

1. **Télécharge Postman**: https://www.postman.com/downloads/
2. **Crée une collection "Yalla Transfer"**
3. **Ajoute les requêtes ci-dessus**
4. **Teste chaque endpoint**

---

## 🐛 Troubleshooting

### "Cannot GET /"
```
→ Le backend n'est pas lancé!
  Lance: cd backend && npm run start:dev
```

### "401 Unauthorized"
```
→ Le JWT token est manquant ou expiré
  Vérifie le header: Authorization: Bearer TOKEN
```

### "Connection refused at 127.0.0.1:5432"
```
→ PostgreSQL n'est pas lancé
  Lance PostgreSQL en tant que service ou application
```

### "database "yalla_transfer" does not exist"
```
→ La BD n'existe pas encore
  Crée-la: createdb yalla_transfer
```

### Port 3000 déjà utilisé
```
→ Un autres processus utilise le port
  change dans backend/.env: PORT=3001
```

---

## 📁 Fichiers importants

| Fichier | Description |
|---------|-----------|
| `backend/.env` | Config base de données + JWT |
| `backend/src/app.module.ts` | Module principal NestJS |
| `backend/prisma/schema.prisma` | Schéma de base de données |
| `.env.local` | Config URL API du React |
| `src/services/api.ts` | Client HTTP du React |

---

## 🔄 Architecture global

```
React Web (5173)
    ↓
    ├→ /auth/login
    ├→ /auth/register
    ├→ /bookings (POST/GET/PUT/DELETE)
    ├→ /payments (POST/GET)
    ↓
NestJS Backend (3000)
    ↓
    ├→ Auth Module (JWT)
    ├→ Bookings Module (Prisma)
    ├→ Payments Module (Prisma)
    ↓
PostgreSQL (5432)
    ↓
    └→ Database: yalla_transfer
```

---

## ✅ Checklist de démarrage

- [ ] PostgreSQL lancé et fonctionnel
- [ ] BD `yalla_transfer` créée
- [ ] Schéma importé dans la BD
- [ ] `backend/npm install` complété
- [ ] `backend/.env` configuré
- [ ] `npx prisma db pull` complété
- [ ] `npm run start:dev` lancé dans backend/
- [ ] Frontend `npm install` complété
- [ ] `npm run dev` lancé dans le répertoire racine
- [ ] Peut se connecter à http://localhost:5173
- [ ] Peut créer un compte
- [ ] Peut voir les données dans la BD

---

## 🚀 Prochaines étapes

1. ✅ Intégrer les services Flutter au même backend
2. ✅ Implémenter les webhooks paiement
3. ✅ Ajouter les notifications push
4. ✅ Déployer sur production

---

**Besoin d'aide?** Consulte README.md dans le dossier `backend/`
