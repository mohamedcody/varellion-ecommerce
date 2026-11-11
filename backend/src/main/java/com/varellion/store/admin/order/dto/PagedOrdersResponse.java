package com.varellion.store.admin.order.dto;

import com.varellion.store.order.dto.OrderResponseDto;

import java.util.List;

/**
 * Standardized pagination envelope for administrative order listings.
 */
public record PagedOrdersResponse(
        List<OrderResponseDto> orders,
        long totalElements,
        int totalPages,
        int currentPage,
        int pageSize
) {
}
