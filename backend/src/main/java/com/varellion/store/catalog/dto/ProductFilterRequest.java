package com.varellion.store.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter and pagination request parameters for catalog listings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {
    private String category;
    private String search;
    private String sort;
    @Builder.Default
    private Integer page = 0;
    @Builder.Default
    private Integer size = 20;
}
