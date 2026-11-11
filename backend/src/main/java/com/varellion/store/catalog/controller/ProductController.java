package com.varellion.store.catalog.controller;

import com.varellion.store.catalog.dto.PagedProductsResponse;
import com.varellion.store.catalog.dto.ProductDto;
import com.varellion.store.catalog.service.ProductService;
import com.varellion.store.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller exposing public endpoints for catalog browsing, search, and details.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    /**
     * Retrieves paginated and filtered catalog products.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedProductsResponse>> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false, name = "q") String search,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int limit
    ) {
        PagedProductsResponse response = productService.getProducts(category, search, sort, page, limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves top best-selling products for landing and promotional showcases.
     */
    @GetMapping("/best-sellers")
    public ResponseEntity<ApiResponse<List<ProductDto>>> getBestSellers(
            @RequestParam(required = false, defaultValue = "4") int limit
    ) {
        List<ProductDto> bestSellers = productService.getBestSellers(limit);
        return ResponseEntity.ok(ApiResponse.success(bestSellers));
    }

    /**
     * Retrieves details of a single product by UUID or SKU.
     */
    @GetMapping("/{identifier}")
    public ResponseEntity<ApiResponse<ProductDto>> getProductByIdentifier(@PathVariable String identifier) {
        ProductDto product = productService.getProductByIdentifier(identifier);
        return ResponseEntity.ok(ApiResponse.success(product));
    }
}
