package com.varellion.store.order.controller;

import com.varellion.store.common.response.ApiResponse;
import com.varellion.store.order.dto.CreateOrderRequest;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for authenticated customer order operations (Order Creation, History, Details).
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final com.varellion.store.order.service.IdempotencyService idempotencyService;

    /**
     * Authoritative order creation endpoint for authenticated customers with replay protection.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponseDto>> createOrder(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateOrderRequest request
    ) {
        OrderResponseDto created = idempotencyService.execute(idempotencyKey,
                () -> orderService.createOrder(userDetails.getUsername(), request));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("تم تأكيد وتسجيل طلبك بنجاح", created));
    }

    /**
     * Retrieves the authenticated customer's order history with pagination.
     */
    @GetMapping("/my-orders")
    public ResponseEntity<ApiResponse<List<OrderResponseDto>>> getMyOrders(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int limit
    ) {
        List<OrderResponseDto> orders = orderService.getCustomerOrders(userDetails.getUsername(), page, limit);
        return ResponseEntity.ok(ApiResponse.success(orders));
    }

    /**
     * Retrieves details of a specific order owned by the authenticated customer.
     */
    @GetMapping("/{orderNumber}")
    public ResponseEntity<ApiResponse<OrderResponseDto>> getOrderByNumber(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String orderNumber
    ) {
        OrderResponseDto order = orderService.getCustomerOrderByNumber(userDetails.getUsername(), orderNumber);
        return ResponseEntity.ok(ApiResponse.success(order));
    }
}
