package com.varellion.store.admin.catalog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Standard pagination envelope for administrative product listings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedAdminProductsResponse {
    private List<AdminProductDto> products;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
