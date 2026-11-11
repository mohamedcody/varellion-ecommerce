package com.varellion.store.admin.order.controller;

import com.varellion.store.admin.order.dto.PagedOrdersResponse;
import com.varellion.store.admin.order.dto.UpdateOrderStatusRequest;
import com.varellion.store.common.response.ApiResponse;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.entity.OrderStatus;
import com.varellion.store.order.service.OrderService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import com.varellion.store.security.entity.User;
import com.varellion.store.security.repository.UserRepository;
import com.varellion.store.security.service.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller providing administrative endpoints for order fulfillment and lifecycle transitions.
 * Protected strictly by role-based access control (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
@Slf4j
public class AdminOrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    /**
     * Retrieves paginated orders for administrative dashboard with optional status and search filtering.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedOrdersResponse>> getAdminOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) String search
    ) {
        PagedOrdersResponse response = orderService.getAdminOrders(page, limit, status, search);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves complete details of an order by its unique human-friendly orderNumber.
     */
    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponseDto>> getAdminOrderByNumber(
            @PathVariable
            @Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")
            String orderNumber
    ) {
        OrderResponseDto order = orderService.getAdminOrderByNumber(orderNumber);
        return ResponseEntity.ok(ApiResponse.success(order));
    }

    /**
     * Updates an order's lifecycle status and records the transition in audit history.
     *
     * @param orderNumber Human-friendly order identifier (e.g. VAR-20261028-0001)
     * @param request     Payload containing target status and optional reason
     * @param adminUser   Authenticated security principal
     * @return Updated order details wrapped in standardized ApiResponse
     */
    @PutMapping("/{orderNumber}/status")
    public ResponseEntity<ApiResponse<OrderResponseDto>> updateOrderStatus(
            @PathVariable
            @Pattern(regexp = "^VAR-\\d{8}-\\d{4}$", message = "صيغة رقم الطلب غير صحيحة")
            String orderNumber,
            @Valid @RequestBody UpdateOrderStatusRequest request,
            @AuthenticationPrincipal UserDetails adminUser
    ) {
        String actorUsername = (adminUser != null) ? adminUser.getUsername() : "SYSTEM";
        log.info("Admin [{}] changed status of order [{}] to [{}] - Reason: {}",
                actorUsername, orderNumber, request.getNewStatus(), request.getReason());

        Long actorId = resolveAdminActorId(adminUser);

        OrderResponseDto updated = orderService.updateOrderStatus(
                orderNumber,
                request.getNewStatus(),
                request.getReason(),
                actorId
        );
        return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة الطلب بنجاح", updated));
    }

    private Long resolveAdminActorId(UserDetails adminUser) {
        if (adminUser == null) {
            return null;
        }
        if (adminUser instanceof CustomUserDetails cud && cud.getId() != null) {
            return cud.getId();
        }
        return userRepository.findByUsername(adminUser.getUsername())
                .or(() -> userRepository.findByEmail(adminUser.getUsername()))
                .map(User::getId)
                .orElse(null);
    }
}
