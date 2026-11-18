package com.varellion.store.admin.catalog.controller;

import com.varellion.store.admin.catalog.dto.*;
import com.varellion.store.admin.catalog.service.AdminProductService;
import com.varellion.store.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller providing administrative endpoints for catalog products lifecycle management.
 * Strictly protected by role-based access control (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
@Slf4j
public class AdminProductController {

    private final AdminProductService adminProductService;

    /**
     * Retrieves paginated products for administrative dashboard with category, search, and active status filtering.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedAdminProductsResponse>> getAdminProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection
    ) {
        PagedAdminProductsResponse response = adminProductService.getAdminProducts(category, search, isActive, page, limit, sortBy, sortDirection);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves full administrative details of a single product by UUID.
     */
    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<AdminProductDto>> getAdminProductById(@PathVariable UUID productId) {
        AdminProductDto product = adminProductService.getAdminProductById(productId);
        return ResponseEntity.ok(ApiResponse.success(product));
    }

    /**
     * Creates a new catalog product with inventory balances and media gallery.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminProductDto>> createProduct(@Valid @RequestBody CreateProductRequest request) {
        AdminProductDto created = adminProductService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("تم إنشاء المنتج بنجاح", created));
    }

    /**
     * Updates an existing product's metadata, prices, inventory, and images.
     */
    @PutMapping("/{productId}")
    public ResponseEntity<ApiResponse<AdminProductDto>> updateProduct(
            @PathVariable UUID productId,
            @Valid @RequestBody UpdateProductRequest request
    ) {
        AdminProductDto updated = adminProductService.updateProduct(productId, request);
        return ResponseEntity.ok(ApiResponse.success("تم تحديث بيانات المنتج بنجاح", updated));
    }

    /**
     * Toggles a product's active visibility in the storefront.
     */
    @PatchMapping("/{productId}/status")
    public ResponseEntity<ApiResponse<AdminProductDto>> toggleProductStatus(
            @PathVariable UUID productId,
            @Valid @RequestBody ToggleProductStatusRequest request
    ) {
        AdminProductDto updated = adminProductService.toggleProductStatus(productId, request.getIsActive());
        return ResponseEntity.ok(ApiResponse.success("تم تحديث حالة المنتج بنجاح", updated));
    }

    /**
     * Deletes or archives a product. If the product has past orders, it is automatically soft-deleted.
     */
    @DeleteMapping("/{productId}")
    public ResponseEntity<ApiResponse<String>> deleteProduct(@PathVariable UUID productId) {
        String resultMessage = adminProductService.deleteProduct(productId);
        return ResponseEntity.ok(ApiResponse.success(resultMessage, resultMessage));
    }
}
