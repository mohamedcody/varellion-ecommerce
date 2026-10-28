import { PaymobPaymentInitiation, Order } from '@/types';
import { requestApi } from './api';

export interface InitiatePaymentParams {
  order: Order;
  customerEmail?: string;
}

export const paymentService = {
  /**
   * Requests Paymob Hosted Checkout initiation.
   * Calls backend /api/payments/paymob/initiate
   * Falls back to local interactive simulation route (/checkout/mock-paymob) if backend is unreachable.
   */
  async initiatePaymobPayment(params: InitiatePaymentParams): Promise<PaymobPaymentInitiation> {
    const { order, customerEmail } = params;

    try {
      const response = await requestApi<PaymobPaymentInitiation>('/payments/paymob/initiate', {
        method: 'POST',
        body: JSON.stringify({
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          amountCents: Math.round(order.totalAmount * 100),
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: customerEmail || 'customer@varellion.luxury',
          shippingGovernorate: order.shippingGovernorate,
          shippingCityArea: order.shippingCityArea,
          shippingDetailedAddress: order.shippingDetailedAddress,
        }),
      });

      return response;
    } catch (backendError) {
      console.warn(
        '[paymentService] Live Paymob backend gateway unavailable, routing to development simulator:',
        backendError
      );

      // Simulation Route for offline/dev testing
      const simulatedUrl = `/checkout/mock-paymob?orderNumber=${encodeURIComponent(
        order.orderNumber
      )}&amount=${encodeURIComponent(order.totalAmount.toString())}&customerName=${encodeURIComponent(
        order.customerName
      )}`;

      return {
        paymentUrl: simulatedUrl,
        transactionId: `txn_sim_${Date.now()}`,
        orderId: order.orderId,
        orderNumber: order.orderNumber,
      };
    }
  },
};
