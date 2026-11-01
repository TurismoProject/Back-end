import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  IPaymentGateway,
  PixSplitPaymentOutput,
} from '@domain/payment/interfaces/payment-gateway.interface';

@Injectable()
export class AsaasGatewayService implements IPaymentGateway {
  private readonly logger = new Logger(AsaasGatewayService.name);

  async processPixWithSplit(
    totalAmount: number,
    supplierAccountId: string,
    platformFeePercentage: number,
  ): Promise<PixSplitPaymentOutput> {
    try {
      const supplierPercentage = 100 - platformFeePercentage;

      // Payload que seria enviado para POST https://api.asaas.com/v3/payments
      const payload = {
        billingType: 'PIX',
        value: totalAmount,
        dueDate: new Date().toISOString().split('T')[0],
        split: [
          {
            walletId: supplierAccountId,
            percentualValue: supplierPercentage, // 90% direto para o Supplier
          },
        ],
      };

      this.logger.log(
        `Simulando criação de cobrança PIX com Split no Asaas: ${JSON.stringify(payload)}`,
      );

      // Simulação de resposta HTTP do Gateway
      const simulatedTransactionId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      return {
        transactionId: simulatedTransactionId,
        qrCode: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        pixCopyPaste: `00020126580014br.gov.bcb.pix0136${simulatedTransactionId}5204000053039865406${totalAmount.toFixed(2)}5802BR5912ALAGOAS_TOUR6006MACEIO62070503***6304ABCD`,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Falha ao processar pagamento PIX com Split no gateway: ${error.message}`,
      );
    }
  }
}
