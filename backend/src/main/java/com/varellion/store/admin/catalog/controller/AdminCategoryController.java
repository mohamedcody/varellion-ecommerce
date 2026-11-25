package com.varellion.store.admin.catalog.controller;

import com.varellion.store.admin.catalog.dto.AdminCategoryDto;
import com.varellion.store.admin.catalog.dto.CreateCategoryRequest;
import com.varellion.store.admin.catalog.dto.ToggleProductStatusRequest;
import com.varellion.store.admin.catalog.dto.UpdateCategoryRequest;
import com.varellion.store.admin.catalog.service.AdminCategoryService;
import com.varellion.store.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller providing complete administrative CRUD operations for product categories.
 * Strictly protected by role-based access control (ROLE_ADMIN).
 */
@RestController
@RequestMapping("/api/admin/categories")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Validated
@Slf4j
public class AdminCategoryController {

    private final AdminCategoryService categoryService;

    /**
     * Lists all categories with associated product counts.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminCategoryDto>>> getAllCategories() {
        List<AdminCategoryDto> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    /**
     * Retrieves single category by ID.
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<AdminCategoryDto>> getCategoryById(@PathVariable UUID categoryId) {
        AdminCategoryDto category = categoryService.getCategoryById(categoryId);
        return ResponseEntity.ok(ApiResponse.success(category));
    }

    /**
     * Creates a new product category.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AdminCategoryDto>> createCategory(@Valid @RequestBody CreateCategoryRequest request) {
        AdminCategoryDto created = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("تم إنشاء القسم بنجاح", created));
    }

    /**
     * Updates an existing product category.
     */
    @PutMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<AdminCategoryDto>> updateCategory(
            @PathVariable UUID categoryId,
            @Valid @RequestBody UpdateCategoryRequest request
    ) {
        AdminCategoryDto updated = categoryService.updateCategory(categoryId, request);
        return ResponseEntity.ok(ApiResponse.success("تم تحديث القسم بنجاح", updated));
    }

    /**
     * Toggles category visibility/active status.
     */
    @PatchMapping("/{categoryId}/status")
    public ResponseEntity<ApiResponse<AdminCategoryDto>> toggleCategoryStatus(
            @PathVariable UUID categoryId,
            @RequestBody ToggleProductStatusRequest request
    ) {
        AdminCategoryDto updated = categoryService.toggleCategoryStatus(categoryId, Boolean.TRUE.equals(request.getIsActive()));
        return ResponseEntity.ok(ApiResponse.success("تم تغيير حالة القسم بنجاح", updated));
    }

    /**
     * Deletes a category if it contains no associated products.
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable UUID categoryId) {
        String msg = categoryService.deleteCategory(categoryId);
        return ResponseEntity.ok(ApiResponse.success(msg, null));
    }

}
