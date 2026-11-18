package com.varellion.store.admin.dashboard;

import com.varellion.store.admin.dashboard.controller.AdminDashboardController;
import com.varellion.store.admin.dashboard.dto.DashboardSummaryDto;
import com.varellion.store.admin.dashboard.dto.SalesAnalyticsDto;
import com.varellion.store.admin.dashboard.service.AdminDashboardService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AdminDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminDashboardService adminDashboardService;

    @Test
    @DisplayName("GET /api/admin/dashboard/summary without auth returns 401 Unauthorized")
    void getSummary_WithoutAuth_Returns401() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/summary"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/dashboard/summary with User role returns 403 Forbidden")
    @WithMockUser(username = "customer@varellion.com", roles = {"USER"})
    void getSummary_UserRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard/summary"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/dashboard/summary with Admin role returns 200 OK and KPI summary")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getSummary_AdminRole_Returns200() throws Exception {
        DashboardSummaryDto summary = DashboardSummaryDto.builder()
                .totalRevenue(new BigDecimal("98000.00"))
                .totalOrders(35L)
                .pendingOrders(8L)
                .deliveredOrders(25L)
                .lowStockProductsCount(2L)
                .totalCustomers(20L)
                .build();

        when(adminDashboardService.getSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/admin/dashboard/summary")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalRevenue").value(98000.00))
                .andExpect(jsonPath("$.data.totalOrders").value(35))
                .andExpect(jsonPath("$.data.pendingOrders").value(8))
                .andExpect(jsonPath("$.data.deliveredOrders").value(25))
                .andExpect(jsonPath("$.data.lowStockProductsCount").value(2))
                .andExpect(jsonPath("$.data.totalCustomers").value(20));
    }

    @Test
    @DisplayName("GET /api/admin/dashboard/order-status-stats with Admin role returns 200 OK")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getOrderStatusStats_AdminRole_Returns200() throws Exception {
        Map<String, Long> stats = Map.of(
                "CONFIRMED", 12L,
                "DELIVERED", 30L
        );

        when(adminDashboardService.getOrderStatusStats()).thenReturn(stats);

        mockMvc.perform(get("/api/admin/dashboard/order-status-stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.CONFIRMED").value(12))
                .andExpect(jsonPath("$.data.DELIVERED").value(30));
    }

    @Test
    @DisplayName("GET /api/admin/dashboard/sales-analytics with Admin role returns 200 OK")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getSalesAnalytics_AdminRole_Returns200() throws Exception {
        SalesAnalyticsDto analytics = SalesAnalyticsDto.builder()
                .periodDays(30)
                .totalPeriodRevenue(new BigDecimal("50000.00"))
                .totalPeriodOrders(15L)
                .timeline(List.of(
                        new SalesAnalyticsDto.DailySalesPointDto("2026-11-01", new BigDecimal("5000.00"), 2L)
                ))
                .build();

        when(adminDashboardService.getSalesAnalytics(anyInt())).thenReturn(analytics);

        mockMvc.perform(get("/api/admin/dashboard/sales-analytics?days=30")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.periodDays").value(30))
                .andExpect(jsonPath("$.data.totalPeriodRevenue").value(50000.00))
                .andExpect(jsonPath("$.data.timeline[0].date").value("2026-11-01"));
    }
}
