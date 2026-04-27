import { IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  bookingId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['TND', 'EUR', 'USD'])
  currency: string;

  @IsEnum(['cash', 'card', 'stripe', 'paypal', 'virement'])
  method: string;

  @IsEnum(['immediate', 'deferred'])
  paymentTiming: string;

  @IsOptional()
  @IsString()
  transactionRef?: string;
}
