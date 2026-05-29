# 🚀 Yalla Transfer Backend

Backend NestJS pour l'application Yalla Transfer.

## 📋 Prérequis

- Node.js >= 18
- PostgreSQL 14+
- npm ou yarn

## 🛠️ Installation

### Étape 1: Installer les dépendances

```bash
npm install
```

### Étape 2: Configurer la base de données

**A. Créer la base de données PostgreSQL:**

```sql
CREATE DATABASE yalla_transfer;
```

**B. Copier le schéma depuis le fichier SQL:**

Exécuter le contenu du fichier SQL du schéma dans pgAdmin ou postico.

**C. Configurer le `.env`:**

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/yalla_transfer"
```

Remplace `password` par ton mot de passe PostgreSQL.

### Étape 3: Synchroniser Prisma avec la base de données

```bash
npx prisma db pull  # Générer le schema Prisma depuis la BD
npx prisma generate # Générer le client Prisma
```

## 🚀 Lancer le serveur

### Mode développement (avec reload automatique)

```bash
npm run start:dev
```

La console affichera:
```
╔════════════════════════════════════════╗
║  🚀 Yalla Transfer Backend Running!   ║
║  ✅ Server: http://localhost:3000      ║
║  ✅ API: http://localhost:3000/api     ║
╚════════════════════════════════════════╝
```

### Mode production

```bash
npm run build
npm run start:prod
```

## 📡 Routes disponibles

### Authentication
- `POST /auth/register` - Inscription
- `POST /auth/login` - Connexion
- `GET /auth/me` - Récupérer l'utilisateur connecté

### Bookings (Réservation)
- `POST /bookings` - Créer une réservation
- `GET /bookings` - Récupérer les réservations de l'utilisateur
- `GET /bookings/:id` - Récupérer une réservation
- `PUT /bookings/:id` - Mettre à jour une réservation
- `DELETE /bookings/:id` - Annuler une réservation

### Payments (Paiement)
- `POST /payments` - Créer un paiement
- `GET /payments` - Récupérer tous les paiements
- `GET /payments/:id` - Récupérer un paiement
- `GET /payments/booking/:bookingId` - Récupérer le paiement d'une réservation
- `PATCH /payments/:id/mark-as-paid` - Marquer comme payé

## 🧪 Test avec Postman

### 1. Register
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "50123456789",
  "password": "Password123!",
  "role": "client_b2c"
}
```

### 2. Login
```
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

Copie le token reçu dans la réponse.

### 3. Créer une réservation
```
POST http://localhost:3000/api/bookings
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "clientId": "uuid-du-user",
  "pickupAddress": "Tunis Centre",
  "dropoffAddress": "Hammamet",
  "departureTime": "2026-04-01T10:00:00Z",
  "passengers": 2,
  "luggageCount": 1,
  "totalPrice": 150
}
```

## 📁 Structure du projet

```
backend/
├── src/
│   ├── auth/              # Module authentification
│   ├── bookings/          # Module réservations
│   ├── payments/          # Module paiements
│   ├── prisma/            # Service Prisma
│   ├── app.module.ts      # Module principal
│   └── main.ts            # Point d'entrée
├── prisma/
│   └── schema.prisma      # Schéma de base de données
├── package.json
├── tsconfig.json
├── .env                   # Variables d'environnement
└── README.md             # Ce fichier
```

## 🔧 Variables d'environnement

| Variable | Description | Exemple |
|----------|-----------|---------|
| DATABASE_URL | Connexion PostgreSQL | postgresql://user:pass@localhost/db |
| PORT | Port du serveur | 3000 |
| JWT_SECRET | Clé secrète JWT | my_secret_key |
| JWT_EXPIRY | Expiration JWT | 7d |
| CORS_ORIGIN | Origines CORS autorisées | http://localhost:5173 |
| NODE_ENV | Environnement | development |

## 🐛 Troubleshooting

### Erreur: "Cannot find database"
```bash
# Créer la base de données manquante
createdb yalla_transfer
```

### Erreur: "Prisma connection error"
```bash
# Vérifier que PostgreSQL est lancé
# Vérifier le DATABASE_URL dans .env
npx prisma db push  # Créer les tables
```

### Erreur: "Port 3000 already in use"
```bash
# Changer le port dans .env
PORT=3001
```

## 📚 Documentation utile

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [JWT Authentication](https://github.com/nestjs/jwt)

## 👨‍💻 Développement

### Scripts disponibles

```bash
npm run build          # Builder le projet
npm run start          # Démarrer en production
npm run start:dev      # Démarrer en développement
npm run start:debug    # Démarrer avec debugger
npm run test           # Lancer les tests
npm run test:watch     # Tests en mode watch
npm run test:cov       # Coverage des tests
npm run lint           # Lancer eslint
```

## 📝 Licence

UNLICENSED
