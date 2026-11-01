export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');

export interface PixSplitPaymentOutput {
  qrCode: string;
  pixCopyPaste: string;
  transactionId: string;
}

export interface IPaymentGateway {
  processPixWithSplit(
    totalAmount: number,
    supplierAccountId: string,
    platformFeePercentage: number,
  ): Promise<PixSplitPaymentOutput>;
}

