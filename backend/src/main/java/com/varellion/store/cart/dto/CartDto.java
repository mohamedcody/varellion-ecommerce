package com.varellion.store.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Data Transfer Object representing the customer's entire active shopping cart.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartDto {

    private UUID cartId;
    private UUID customerId;
    private List<CartItemDto> items;
    private Integer totalItems;
    private BigDecimal subtotal;
    private BigDecimal freeShippingThreshold;
    private BigDecimal amountForFreeShipping;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
