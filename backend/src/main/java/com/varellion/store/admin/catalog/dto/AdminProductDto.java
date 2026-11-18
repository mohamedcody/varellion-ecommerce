package com.varellion.store.admin.catalog.dto;

import com.varellion.store.catalog.dto.ProductImageDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Administrative product details projection exposing complete inventory metrics and margins.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductDto {
    private UUID productId;
    private UUID categoryId;
    private String categorySlug;
    private String categoryNameAr;
    private String categoryNameEn;
    private String sku;
    private String nameAr;
    private String nameEn;
    private String descriptionAr;
    private String descriptionEn;
    private BigDecimal price;
    private BigDecimal costPrice;
    private Integer stockQuantity;
    private Integer reservedQuantity;
    private Integer availableStock;
    private Boolean isActive;
    private List<ProductImageDto> images;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
