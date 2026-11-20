import { PaymobPaymentInitiation, Order } from '@/types';

export interface InitiatePaymentParams {
  order: Order;
  customerEmail?: string;
}

export const paymentService = {
  /**
   * AUD-009 (COD-Only Release): Online Paymob payment integration is intentionally deferred.
   * Never route customers to a simulated /checkout/mock-paymob flow in production.
   */
  async initiatePaymobPayment(_params: InitiatePaymentParams): Promise<PaymobPaymentInitiation> {
    throw new Error(
      'الدفع الإلكتروني (Paymob) غير متاح حالياً. يرجى إتمام طلبك باستخدام الدفع عند الاستلام (Cash on Delivery).'
    );
  },
};
