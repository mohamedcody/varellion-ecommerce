package com.varellion.store.catalog.dto;

import java.util.List;

/**
 * Standardized pagination envelope for catalog product listings.
 */
public record PagedProductsResponse(
        List<ProductDto> products,
        long totalElements,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
