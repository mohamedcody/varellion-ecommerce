package com.varellion.store.catalog.dto;

import java.util.UUID;

/**
 * DTO representing an image asset of a product.
 */
public record ProductImageDto(
        UUID imageId,
        String imageUrl,
        Boolean isMain,
        Integer displayOrder
) {
}
