package com.varellion.store.admin.customer.controller;

import com.varellion.store.admin.catalog.dto.ToggleProductStatusRequest;
import com.varellion.store.admin.customer.dto.AdminCustomerDetailDto;
import com.varellion.store.admin.customer.dto.PagedAdminCustomersResponse;
import com.varellion.store.admin.customer.service.AdminCustomerService;
import com.varellion.store.common.response.ApiResponse;
import com.varellion.store.order.dto.OrderResponseDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller providing administrative oversight of customer accounts, profiles, and order histories.
 * Protected strictly by role-based access control (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
@Slf4j
public class AdminCustomerController {

    private final AdminCustomerService customerService;

    /**
     * Lists paginated customers with search by name or phone, spend totals, and order counts.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedAdminCustomersResponse>> getAdminCustomers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search
    ) {
        PagedAdminCustomersResponse response = customerService.getAdminCustomers(page, limit, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves full customer profile, saved delivery address, and lifetime purchase statistics.
     */
    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<AdminCustomerDetailDto>> getAdminCustomerById(@PathVariable UUID customerId) {
        AdminCustomerDetailDto customer = customerService.getAdminCustomerById(customerId);
        return ResponseEntity.ok(ApiResponse.success(customer));
    }

    /**
     * Retrieves order history for a specific customer.
     */
    @GetMapping("/{customerId}/orders")
    public ResponseEntity<ApiResponse<List<OrderResponseDto>>> getCustomerOrders(
            @PathVariable UUID customerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<OrderResponseDto> orders = customerService.getCustomerOrders(customerId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * Toggles customer active status (e.g. banning or unbanning an account).
     */
    @PatchMapping("/{customerId}/status")
    public ResponseEntity<ApiResponse<AdminCustomerDetailDto>> toggleCustomerStatus(
            @PathVariable UUID customerId,
            @RequestBody ToggleProductStatusRequest request
    ) {
        AdminCustomerDetailDto updated = customerService.toggleCustomerStatus(
                customerId,
                Boolean.TRUE.equals(request.getIsActive())
        );
        return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة العميل بنجاح", updated));
    }
}
