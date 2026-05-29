import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './create-booking.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(private bookingsService: BookingsService) {}

  @Post()
  async create(@Req() req: any, @Body() data: CreateBookingDto) {
    return this.bookingsService.create(req.user.sub, data);
  }

  @Get()
  async getAll(@Req() req: any) {
    return this.bookingsService.getByClientId(req.user.sub);
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.getById(id, req.user.sub);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: Partial<CreateBookingDto>,
  ) {
    return this.bookingsService.update(id, req.user.sub, data);
  }

  @Delete(':id')
  async cancel(@Req() req: any, @Param('id') id: string) {
    return this.bookingsService.cancel(id, req.user.sub);
  }
}
