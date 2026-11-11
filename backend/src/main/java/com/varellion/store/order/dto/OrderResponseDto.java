package com.varellion.store.order.dto;

import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.entity.ShippingFeeStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Full master order details returned to client for order tracking and order history.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponseDto {

    private UUID orderId;
    private String orderNumber;

    // Customer & delivery snapshots
    private String customerName;
    private String customerPhone;
    private String shippingGovernorate;
    private String shippingCityArea;
    private String shippingDetailedAddress;

    // Financial calculations
    private String currency;
    private BigDecimal subtotal;
    private BigDecimal discountTotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    @Builder.Default
    private String paymentMethod = "CASH_ON_DELIVERY";

    // Lifecycle statuses
    private OrderStatus orderStatus;
    private String statusDisplayAr;
    private String statusDisplayEn;
    private ShippingFeeStatus shippingFeeStatus;

    // Delivery & timing
    private String estimatedDeliveryAr;
    private OffsetDateTime confirmationDeadline;

    // Notes
    private String customerNotes;

    // Audit timestamps
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Items & timeline history
    @Builder.Default
    private List<OrderItemDto> items = new ArrayList<>();

    @Builder.Default
    private List<OrderStatusHistoryDto> statusHistory = new ArrayList<>();
}
