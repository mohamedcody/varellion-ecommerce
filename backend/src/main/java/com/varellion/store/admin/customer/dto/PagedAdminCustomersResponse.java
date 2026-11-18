package com.varellion.store.admin.customer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedAdminCustomersResponse {
    private List<AdminCustomerSummaryDto> customers;
    private long totalElements;
    private int totalPages;
    private int currentPage;
    private int pageSize;
}
