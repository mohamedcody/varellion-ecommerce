package com.varellion.store.order.controller;

import com.varellion.store.common.response.ApiResponse;
import com.varellion.store.order.dto.OrderLookupRequest;
import com.varellion.store.order.dto.OrderResponseDto;
import com.varellion.store.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public REST Controller enabling guest customers to track their orders securely
 * by providing Order Number and registered Egyptian Phone Number.
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class GuestOrderLookupController {

    private final OrderService orderService;

    /**
     * POST endpoint for tracking lookup using a JSON payload.
     */
    @PostMapping("/lookup")
    public ResponseEntity<ApiResponse<OrderResponseDto>> lookupOrder(@Valid @RequestBody OrderLookupRequest request) {
        OrderResponseDto order = orderService.trackOrder(request.getOrderNumber(), request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("تم العثور على بيانات الطلب بنجاح", order));
    }

    /**
     * GET endpoint for tracking lookup using query parameters (for direct URLs from SMS/WhatsApp/Email).
     */
    @GetMapping("/track")
    public ResponseEntity<ApiResponse<OrderResponseDto>> trackOrder(
            @RequestParam String orderNumber,
            @RequestParam String phone
    ) {
        OrderResponseDto order = orderService.trackOrder(orderNumber, phone);
        return ResponseEntity.ok(ApiResponse.success("تم العثور على بيانات الطلب بنجاح", order));
    }
}
