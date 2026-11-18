package com.varellion.store.admin.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Historical sales analytics and timeline trend data for executive visualization.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalesAnalyticsDto {

    private int periodDays;
    private BigDecimal totalPeriodRevenue;
    private long totalPeriodOrders;
    private List<DailySalesPointDto> timeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailySalesPointDto {
        private String date; // YYYY-MM-DD
        private BigDecimal revenue;
        private long ordersCount;
    }
}
