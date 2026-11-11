package com.varellion.store.cart.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Data Transfer Object representing an individual cart line item.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDto {

    private UUID cartItemId;
    private UUID productId;
    private String nameAr;
    private String nameEn;
    private String sku;
    private BigDecimal price;
    private String imageUrl;
    private Integer quantity;
    private Integer availableStock;
    private BigDecimal subtotal;
    private OffsetDateTime addedAt;
}
