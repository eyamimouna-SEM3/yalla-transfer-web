import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  private async ensureBookingOwnership(bookingId: string, clientId: string) {
    const booking = await this.prisma.bookings.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Reservation introuvable');
    }

    if (booking.client_id !== clientId) {
      throw new ForbiddenException("Vous n'avez pas acces a ce paiement");
    }

    return booking;
  }

  private async ensurePaymentOwnership(id: string, clientId: string) {
    const payment = await this.prisma.payments.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Paiement introuvable');
    }

    await this.ensureBookingOwnership(payment.booking_id, clientId);
    return payment;
  }

  private mapPaymentUpdateData(data: Partial<CreatePaymentDto>) {
    const updateData: Record<string, unknown> = {};

    if (data.amount !== undefined) {
      updateData.amount = data.amount;
    }
    if (data.currency !== undefined) {
      updateData.currency = data.currency;
    }
    if (data.method !== undefined) {
      updateData.method = data.method;
    }
    if (data.paymentTiming !== undefined) {
      updateData.payment_timing = data.paymentTiming;
    }
    if (data.transactionRef !== undefined) {
      updateData.transaction_ref = data.transactionRef;
    }

    return updateData;
  }

  async create(clientId: string, data: CreatePaymentDto) {
    await this.ensureBookingOwnership(data.bookingId, clientId);

    return this.prisma.payments.create({
      data: {
        booking_id: data.bookingId,
        amount: data.amount,
        currency: data.currency,
        method: data.method,
        payment_timing: data.paymentTiming,
        transaction_ref: data.transactionRef,
        status: 'pending',
      },
    });
  }

  async getAll(clientId: string) {
    const payments = await this.prisma.payments.findMany({
      where: {
        bookings: {
          is: {
            client_id: clientId,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return {
      data: payments,
      total: payments.length,
    };
  }

  async getById(id: string, clientId: string) {
    await this.ensurePaymentOwnership(id, clientId);

    return this.prisma.payments.findUnique({
      where: { id },
    });
  }

  async getByBookingId(bookingId: string, clientId: string) {
    await this.ensureBookingOwnership(bookingId, clientId);

    return this.prisma.payments.findFirst({
      where: { booking_id: bookingId },
    });
  }

  async update(id: string, clientId: string, data: Partial<CreatePaymentDto>) {
    await this.ensurePaymentOwnership(id, clientId);

    return this.prisma.payments.update({
      where: { id },
      data: this.mapPaymentUpdateData(data),
    });
  }

  async markAsPaid(id: string, clientId: string) {
    await this.ensurePaymentOwnership(id, clientId);

    return this.prisma.payments.update({
      where: { id },
      data: {
        status: 'paid',
        paid_at: new Date(),
      },
    });
  }

  async getStatus(id: string, clientId: string) {
    const payment = await this.ensurePaymentOwnership(id, clientId);

    return {
      status: payment.status,
    };
  }

  async verify(id: string, clientId: string) {
    return this.markAsPaid(id, clientId);
  }
}
