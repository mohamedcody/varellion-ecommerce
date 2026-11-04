package com.varellion.store.catalog.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO representing a catalog product with its inventory calculations and media assets.
 * Exposes customer-facing availableStock without leaking raw internal warehouse numbers.
 */
public record ProductDto(
        UUID productId,
        UUID categoryId,
        String categorySlug,
        String categoryNameAr,
        String categoryNameEn,
        String sku,
        String nameAr,
        String nameEn,
        String descriptionAr,
        String descriptionEn,
        BigDecimal price,
        Integer availableStock,
        Boolean isActive,
        List<ProductImageDto> images,
        OffsetDateTime createdAt
) {
}
