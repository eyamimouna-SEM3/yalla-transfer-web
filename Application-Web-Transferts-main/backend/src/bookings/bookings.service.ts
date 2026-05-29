import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  private async ensureBookingOwnership(id: string, clientId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException('Reservation introuvable');
    }

    if (booking.client_id !== clientId) {
      throw new ForbiddenException(
        "Vous n'avez pas acces a cette reservation",
      );
    }

    return booking;
  }

  private mapBookingUpdateData(data: Partial<CreateBookingDto>) {
    const updateData: Record<string, unknown> = {};

    if (data.pickupAddress !== undefined) {
      updateData.pickup_address = data.pickupAddress;
    }
    if (data.pickupLat !== undefined) {
      updateData.pickup_lat = data.pickupLat;
    }
    if (data.pickupLng !== undefined) {
      updateData.pickup_lng = data.pickupLng;
    }
    if (data.dropoffAddress !== undefined) {
      updateData.dropoff_address = data.dropoffAddress;
    }
    if (data.dropoffLat !== undefined) {
      updateData.dropoff_lat = data.dropoffLat;
    }
    if (data.dropoffLng !== undefined) {
      updateData.dropoff_lng = data.dropoffLng;
    }
    if (data.departureTime !== undefined) {
      updateData.departure_time = new Date(data.departureTime);
    }
    if (data.passengers !== undefined) {
      updateData.passengers = data.passengers;
    }
    if (data.luggageCount !== undefined) {
      updateData.luggage_count = data.luggageCount;
    }
    if (data.luggageDetails !== undefined) {
      updateData.luggage_details = data.luggageDetails;
    }
    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }
    if (data.totalPrice !== undefined) {
      updateData.total_price = data.totalPrice;
    }

    return updateData;
  }

  async create(clientId: string, data: CreateBookingDto) {
    return this.prisma.bookings.create({
      data: {
        client_id: clientId,
        pickup_address: data.pickupAddress,
        pickup_lat: data.pickupLat,
        pickup_lng: data.pickupLng,
        dropoff_address: data.dropoffAddress,
        dropoff_lat: data.dropoffLat,
        dropoff_lng: data.dropoffLng,
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
    const bookings = await this.prisma.bookings.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: bookings,
      total: bookings.length,
    };
  }

  async getById(id: string, clientId: string) {
    return this.ensureBookingOwnership(id, clientId);
  }

  async update(id: string, clientId: string, data: Partial<CreateBookingDto>) {
    await this.ensureBookingOwnership(id, clientId);

    return this.prisma.bookings.update({
      where: { id },
      data: {
        ...this.mapBookingUpdateData(data),
        updated_at: new Date(),
      },
    });
  }

  async cancel(id: string, clientId: string) {
    await this.ensureBookingOwnership(id, clientId);

    return this.prisma.bookings.update({
      where: { id },
      data: {
        status: 'cancelled',
        updated_at: new Date(),
      },
    });
  }
}
