import { Module } from '@nestjs/common';
import { DatabaseModule } from '@modules/database.module';
import { PAYMENT_GATEWAY } from '@domain/payment/interfaces/payment-gateway.interface';
import { AsaasGatewayService } from '@infrastructure/payment/gateways/asaas-gateway.service';
import { ProcessBookingUseCase } from '@application/use-cases/booking/process-booking.use-case';

@Module({
  imports: [DatabaseModule],
  providers: [
    ProcessBookingUseCase,
    {
      provide: PAYMENT_GATEWAY,
      useClass: AsaasGatewayService,
    },
  ],
  exports: [ProcessBookingUseCase, PAYMENT_GATEWAY],
})
export class PaymentModule {}
