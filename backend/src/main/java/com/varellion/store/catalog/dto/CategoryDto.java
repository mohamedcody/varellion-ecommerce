package com.varellion.store.catalog.dto;

import java.util.UUID;

/**
 * DTO representing a catalog category.
 */
public record CategoryDto(
        UUID categoryId,
        String nameAr,
        String nameEn,
        String slug,
        String descriptionAr,
        String descriptionEn,
        Boolean isActive,
        Long productCount
) {
}
