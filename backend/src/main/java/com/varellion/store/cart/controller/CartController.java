package com.varellion.store.cart.controller;

import com.varellion.store.cart.dto.*;
import com.varellion.store.cart.service.CartService;
import com.varellion.store.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller exposing RESTful endpoints for customer shopping cart operations.
 * Requires authenticated user session via JWT / Spring Security.
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    /**
     * Retrieves the active shopping cart for the authenticated customer.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<CartDto>> getCart(
            @AuthenticationPrincipal UserDetails userDetails) {
        CartDto cart = cartService.getCart(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(cart));
    }

    /**
     * Adds an item to the cart or increments its quantity.
     */
    @PostMapping("/items")
    public ResponseEntity<ApiResponse<CartDto>> addItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddToCartRequest request) {
        CartDto cart = cartService.addItem(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("تمت إضافة المنتج إلى السلة بنجاح", cart));
    }

    /**
     * Modifies the quantity of an existing cart item.
     */
    @PutMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDto>> updateQuantity(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID cartItemId,
            @Valid @RequestBody UpdateCartItemRequest request) {
        CartDto cart = cartService.updateItemQuantity(userDetails.getUsername(), cartItemId, request.getQuantity());
        return ResponseEntity.ok(ApiResponse.success("تم تحديث كمية المنتج بنجاح", cart));
    }

    /**
     * Removes an individual line item from the cart.
     */
    @DeleteMapping("/items/{cartItemId}")
    public ResponseEntity<ApiResponse<CartDto>> removeItem(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID cartItemId) {
        CartDto cart = cartService.removeItem(userDetails.getUsername(), cartItemId);
        return ResponseEntity.ok(ApiResponse.success("تم حذف المنتج من السلة بنجاح", cart));
    }

    /**
     * Empties the customer's cart entirely.
     */
    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> clearCart(
            @AuthenticationPrincipal UserDetails userDetails) {
        cartService.clearCart(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("تم تفريغ السلة بنجاح", null));
    }

    /**
     * Batch-merges guest cart items with the customer's database cart upon sign-in.
     */
    @PostMapping("/merge")
    public ResponseEntity<ApiResponse<CartDto>> mergeCart(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MergeCartRequest request) {
        CartDto cart = cartService.mergeCart(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("تم دمج سلة المشتريات بنجاح", cart));
    }
}
