import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@database/prisma/prisma.service';
import { Booking, BookingStatus } from '@prisma/client';
import {
  IPaymentGateway,
  PAYMENT_GATEWAY,
  PixSplitPaymentOutput,
} from '@domain/payment/interfaces/payment-gateway.interface';

export interface ProcessBookingInput {
  userId: string;
  productId: string;
  quantity?: number;
}

export interface ProcessBookingOutput {
  booking: Booking;
  payment: PixSplitPaymentOutput;
}

@Injectable()
export class ProcessBookingUseCase {
  private static readonly PLATFORM_FEE_PERCENTAGE = 10; // 10% Alagoas Tour

  constructor(
    private readonly prismaService: PrismaService,
    @Inject(PAYMENT_GATEWAY)
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(input: ProcessBookingInput): Promise<ProcessBookingOutput> {
    const quantity = input.quantity ?? 1;

    if (quantity <= 0) {
      throw new BadRequestException('A quantidade deve ser maior que zero.');
    }

    // 1. Validar comprador (User B2C ou B2B)
    const user = await this.prismaService.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário comprador não encontrado.');
    }

    // 2. Buscar passeio (Product) e dados do fornecedor (Supplier)
    const product = await this.prismaService.product.findUnique({
      where: { id: input.productId },
      include: { supplier: true },
    });

    if (!product) {
      throw new NotFoundException('Passeio (Product) não encontrado.');
    }

    const supplierAccountId = product.supplier.walletId || product.supplier.id;

    // 3. Calcular valores e Split (10% plataforma / 90% fornecedor)
    const unitPrice = Number(product.price);
    const totalAmount = Number((unitPrice * quantity).toFixed(2));
    const platformFee = Number(
      (
        (totalAmount * ProcessBookingUseCase.PLATFORM_FEE_PERCENTAGE) /
        100
      ).toFixed(2),
    );
    const supplierAmount = Number((totalAmount - platformFee).toFixed(2));

    // 4. Criar Booking com status PENDING no banco
    const pendingBooking = await this.prismaService.booking.create({
      data: {
        userId: user.id,
        productId: product.id,
        totalAmount,
        platformFee,
        supplierAmount,
        status: BookingStatus.PENDING,
      },
    });

    // 5. Chamar o Gateway de Pagamento desacoplado via interface
    const payment = await this.paymentGateway.processPixWithSplit(
      totalAmount,
      supplierAccountId,
      ProcessBookingUseCase.PLATFORM_FEE_PERCENTAGE,
    );

    // 6. Vincular o ID da transação do gateway à reserva criada
    const booking = await this.prismaService.booking.update({
      where: { id: pendingBooking.id },
      data: {
        paymentGatewayId: payment.transactionId,
      },
    });

    return {
      booking,
      payment,
    };
  }
}
