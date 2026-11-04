package com.varellion.store.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Line item snapshot within an order response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemDto {
    private UUID orderItemId;
    private UUID productId;
    private String productNameAr;
    private String productNameEn;
    private String productSku;
    private BigDecimal unitPrice;
    private Integer quantity;
    private BigDecimal lineTotal;
    private String imageUrl;

    public BigDecimal getTotalPrice() {
        return lineTotal != null ? lineTotal : BigDecimal.ZERO;
    }
}
