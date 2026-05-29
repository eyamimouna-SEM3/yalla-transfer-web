import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Patch,
  Put,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  async create(@Req() req: any, @Body() data: CreatePaymentDto) {
    return this.paymentsService.create(req.user.sub, data);
  }

  @Get()
  async getAll(@Req() req: any) {
    return this.paymentsService.getAll(req.user.sub);
  }

  @Get('booking/:bookingId')
  async getByBookingId(@Req() req: any, @Param('bookingId') bookingId: string) {
    return this.paymentsService.getByBookingId(bookingId, req.user.sub);
  }

  @Get(':id/status')
  async getStatus(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.getStatus(id, req.user.sub);
  }

  @Get(':id')
  async getById(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.getById(id, req.user.sub);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() data: Partial<CreatePaymentDto>,
  ) {
    return this.paymentsService.update(id, req.user.sub, data);
  }

  @Post(':id/verify')
  async verify(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.verify(id, req.user.sub);
  }

  @Patch(':id/mark-as-paid')
  async markAsPaid(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.markAsPaid(id, req.user.sub);
  }
}
