package com.varellion.store.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Top-level executive key performance indicators for admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryDto {
    private BigDecimal totalRevenue;
    private long totalOrders;
    private long pendingOrders;
    private long deliveredOrders;
    private long lowStockProductsCount;
    private long totalCustomers;
}
