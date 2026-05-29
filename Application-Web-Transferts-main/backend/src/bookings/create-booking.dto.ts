import { IsString, IsNumber, IsDateString, IsOptional, IsArray } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  clientId: string;

  @IsString()
  pickupAddress: string;

  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @IsString()
  dropoffAddress: string;

  @IsOptional()
  @IsNumber()
  dropoffLat?: number;

  @IsOptional()
  @IsNumber()
  dropoffLng?: number;

  @IsDateString()
  departureTime: string;

  @IsNumber()
  passengers: number;

  @IsNumber()
  luggageCount: number;

  @IsOptional()
  @IsArray()
  luggageDetails?: any[];

  @IsOptional()
  babySeat?: boolean;

  @IsOptional()
  pmr?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;
}
