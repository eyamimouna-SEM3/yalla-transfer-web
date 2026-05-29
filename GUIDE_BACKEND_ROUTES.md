# 📋 Guide: Créer les routes Bookings et Payments

## ⚠️ URGENT: Ton collègue doit créer ces routes!

Actuellement, il n'a que `/auth/**`
Il faut ajouter: `/bookings/**` et `/payments/**`

---

## 🎯 Étape 1: Créer le module Bookings

### Fichier: `src/bookings/bookings.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [PrismaModule],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
```

### Fichier: `src/bookings/bookings.controller.ts`

```typescript
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  async create(@Body() data: any, @Req() req: any) {
    return this.bookingsService.create({
      ...data,
      clientId: req.user.id, // Prendre l'ID du user connecté
    });
  }

  @Get()
  async getAll(@Req() req: any) {
    return this.bookingsService.getByClientId(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.bookingsService.getById(id);
  }
}
```

### Fichier: `src/bookings/bookings.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    clientId: string;
    pickupAddress: string;
    dropoffAddress: string;
    departureTime: string; // ISO DateTime
    passengers: number;
    luggageCount: number;
    luggageDetails?: any[];
    babySeat?: boolean;
    pmr?: boolean;
    notes?: string;
    totalPrice?: number;
  }) {
    return this.prisma.booking.create({
      data: {
        client_id: data.clientId,
        pickup_address: data.pickupAddress,
        dropoff_address: data.dropoffAddress,
        departure_time: new Date(data.departureTime),
        passengers: data.passengers,
        luggage_count: data.luggageCount,
        luggage_details: data.luggageDetails || [],
        notes: data.notes || '',
        total_price: data.totalPrice || 0,
        status: 'pending',
      },
    });
  }

  async getByClientId(clientId: string) {
    return this.prisma.booking.findMany({
      where: { client_id: clientId },
    });
  }

  async getById(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
    });
  }
}
```

---

## 🎯 Étape 2: Créer le module Payments

### Fichier: `src/payments/payments.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
```

### Fichier: `src/payments/payments.controller.ts`

```typescript
import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  async create(@Body() data: any) {
    return this.paymentsService.create(data);
  }

  @Get()
  async getAll(@Req() req: any) {
    return this.paymentsService.getAll();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.paymentsService.getById(id);
  }

  @Get('booking/:bookingId')
  async getByBookingId(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getByBookingId(bookingId);
  }
}
```

### Fichier: `src/payments/payments.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    bookingId: string;
    amount: number;
    currency: string;
    method: string; // 'cash' | 'card' | 'stripe' | 'paypal' | 'virement'
    paymentTiming: string; // 'immediate' | 'deferred'
  }) {
    return this.prisma.payment.create({
      data: {
        booking_id: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        payment_timing: data.paymentTiming,
        status: 'pending',
      },
    });
  }

  async getAll() {
    return this.prisma.payment.findMany();
  }

  async getById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async getByBookingId(bookingId: string) {
    return this.prisma.payment.findFirst({
      where: { booking_id: bookingId },
    });
  }
}
```

---

## 🎯 Étape 3: Importer les modules dans `app.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { BookingsModule } from './bookings/bookings.module'; // ← ADD
import { PaymentsModule } from './payments/payments.module'; // ← ADD
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    BookingsModule,  // ← ADD
    PaymentsModule,  // ← ADD
  ],
})
export class AppModule {}
```

---

## 🧪 Test des routes (Postman)

### Test 1: Créer une réservation

```
POST http://192.168.1.119:3000/api/bookings
Headers: 
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "pickupAddress": "Tunis Centre",
  "dropoffAddress": "Hammamet",
  "departureTime": "2026-04-01T10:00:00Z",
  "passengers": 2,
  "luggageCount": 1,
  "luggageDetails": [
    {"type": "valise", "longueur": 70, "largeur": 50, "hauteur": 30}
  ],
  "babySeat": false,
  "pmr": false,
  "totalPrice": 150
}
```

### Test 2: Créer un paiement

```
POST http://192.168.1.119:3000/api/payments
Headers:
  Authorization: Bearer <JWT_TOKEN>
  Content-Type: application/json

Body:
{
  "bookingId": "uuid-de-la-reservation",
  "amount": 150,
  "currency": "TND",
  "method": "cash",
  "paymentTiming": "immediate"
}
```

---

## ✅ Checklist pour ton collègue:

- [ ] Créer `src/bookings/` (module, controller, service)
- [ ] Créer `src/payments/` (module, controller, service)
- [ ] Ajouter `BookingsModule` et `PaymentsModule` à `app.module.ts`
- [ ] Vérifier que Prisma a les tables `bookings` et `payments`
- [ ] Tester avec Postman
- [ ] Vérifier l'authentification JWT marche

---

**Une fois que les routes sont créées, tu pourras:**
✅ Créer une réservation depuis CheckoutPage
✅ Créer un paiement
✅ Afficher les réservations dans le dashboard
