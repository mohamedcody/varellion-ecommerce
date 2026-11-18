package com.varellion.store.admin.customer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.admin.catalog.dto.ToggleProductStatusRequest;
import com.varellion.store.admin.customer.controller.AdminCustomerController;
import com.varellion.store.admin.customer.dto.AdminCustomerDetailDto;
import com.varellion.store.admin.customer.dto.AdminCustomerSummaryDto;
import com.varellion.store.admin.customer.dto.PagedAdminCustomersResponse;
import com.varellion.store.admin.customer.service.AdminCustomerService;
import com.varellion.store.order.dto.OrderResponseDto;
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
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AdminCustomerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockBean
    private AdminCustomerService customerService;

    @Test
    @DisplayName("GET /api/admin/customers without auth returns 401 Unauthorized")
    void getCustomers_WithoutAuth_Returns401() throws Exception {
        mockMvc.perform(get("/api/admin/customers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/customers with User role returns 403 Forbidden")
    @WithMockUser(username = "customer@varellion.com", roles = {"USER"})
    void getCustomers_UserRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/admin/customers"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/customers with Admin role returns 200 OK and paged list")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getCustomers_AdminRole_Returns200() throws Exception {
        AdminCustomerSummaryDto summary = AdminCustomerSummaryDto.builder()
                .customerId(UUID.randomUUID())
                .fullName("علي حسن")
                .email("ali@example.com")
                .phoneNumber("01012345678")
                .governorate("القاهرة")
                .totalOrders(3L)
                .totalSpent(new BigDecimal("4500.00"))
                .isActive(true)
                .build();

        PagedAdminCustomersResponse pagedResponse = PagedAdminCustomersResponse.builder()
                .customers(List.of(summary))
                .currentPage(0)
                .pageSize(20)
                .totalElements(1L)
                .totalPages(1)
                .build();

        when(customerService.getAdminCustomers(anyInt(), anyInt(), any())).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/admin/customers")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.customers[0].fullName").value("علي حسن"))
                .andExpect(jsonPath("$.data.customers[0].totalSpent").value(4500.00));
    }

    @Test
    @DisplayName("GET /api/admin/customers/{id} with Admin role returns 200 OK and detail")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getCustomerById_AdminRole_Returns200() throws Exception {
        UUID customerId = UUID.randomUUID();
        AdminCustomerDetailDto detail = AdminCustomerDetailDto.builder()
                .customerId(customerId)
                .fullName("علي حسن")
                .email("ali@example.com")
                .phoneNumber("01012345678")
                .governorate("القاهرة")
                .cityArea("المعادي")
                .detailedAddress("شارع 9")
                .totalOrders(5L)
                .totalSpent(new BigDecimal("7500.00"))
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .build();

        when(customerService.getAdminCustomerById(customerId)).thenReturn(detail);

        mockMvc.perform(get("/api/admin/customers/{id}", customerId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.customerId").value(customerId.toString()))
                .andExpect(jsonPath("$.data.cityArea").value("المعادي"));
    }

    @Test
    @DisplayName("GET /api/admin/customers/{id}/orders with Admin role returns 200 OK and order list")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getCustomerOrders_AdminRole_Returns200() throws Exception {
        UUID customerId = UUID.randomUUID();
        OrderResponseDto order = OrderResponseDto.builder()
                .orderNumber("VAR-20261117-0001")
                .totalAmount(new BigDecimal("1500.00"))
                .build();

        when(customerService.getCustomerOrders(eq(customerId), anyInt(), anyInt())).thenReturn(List.of(order));

        mockMvc.perform(get("/api/admin/customers/{id}/orders", customerId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].orderNumber").value("VAR-20261117-0001"));
    }

    @Test
    @DisplayName("PATCH /api/admin/customers/{id}/status toggles active status and returns 200 OK")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void toggleCustomerStatus_AdminRole_Returns200() throws Exception {
        UUID customerId = UUID.randomUUID();
        ToggleProductStatusRequest request = new ToggleProductStatusRequest(false);

        AdminCustomerDetailDto detail = AdminCustomerDetailDto.builder()
                .customerId(customerId)
                .fullName("علي حسن")
                .isActive(false)
                .build();

        when(customerService.toggleCustomerStatus(eq(customerId), eq(false))).thenReturn(detail);

        mockMvc.perform(patch("/api/admin/customers/{id}/status", customerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isActive").value(false));
    }
}
