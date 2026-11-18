package com.varellion.store.admin.dashboard.controller;

import com.varellion.store.admin.dashboard.dto.DashboardSummaryDto;
import com.varellion.store.admin.dashboard.dto.SalesAnalyticsDto;
import com.varellion.store.admin.dashboard.service.AdminDashboardService;
import com.varellion.store.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * REST Controller exposing executive management analytics, KPIs, and operational volume metrics.
 * Strictly protected by role-based access control (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    /**
     * Retrieves primary executive KPIs for dashboard overview cards.
     */
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<DashboardSummaryDto>> getSummary() {
        DashboardSummaryDto summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    /**
     * Retrieves order counts partitioned across all lifecycle status states.
     */
    @GetMapping("/order-status-stats")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOrderStatusStats() {
        Map<String, Long> stats = dashboardService.getOrderStatusStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * Retrieves historical revenue and order trends across a sliding window of days.
     */
    @GetMapping("/sales-analytics")
    public ResponseEntity<ApiResponse<SalesAnalyticsDto>> getSalesAnalytics(
            @RequestParam(defaultValue = "30") int days
    ) {
        SalesAnalyticsDto analytics = dashboardService.getSalesAnalytics(days);
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }
}
