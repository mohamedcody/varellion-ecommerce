package com.varellion.store.admin.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminCategoryDto {
    private UUID categoryId;
    private String nameAr;
    private String nameEn;
    private String slug;
    private String descriptionAr;
    private String descriptionEn;
    private Boolean isActive;
    private long productCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
