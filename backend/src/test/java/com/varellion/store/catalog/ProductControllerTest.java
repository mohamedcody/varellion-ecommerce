package com.varellion.store.catalog;

import com.varellion.store.catalog.controller.ProductController;
import com.varellion.store.catalog.dto.PagedProductsResponse;
import com.varellion.store.catalog.dto.ProductDto;
import com.varellion.store.catalog.dto.ProductImageDto;
import com.varellion.store.catalog.service.ProductService;
import com.varellion.store.common.exception.GlobalExceptionHandler;
import com.varellion.store.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    private ProductDto sampleProduct;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();

        sampleProduct = new ProductDto(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "watches",
                "الساعات الفاخرة",
                "Luxury Watches",
                "VAR-W-01",
                "ساعة فارليون كرونوغراف",
                "VARELLION Chronograph Watch",
                "ساعة رجالية فخمة",
                "Men luxury watch",
                new BigDecimal("1850.00"),
                16,
                true,
                List.of(new ProductImageDto(UUID.randomUUID(), "https://images.example.com/w1.jpg", true, 1)),
                OffsetDateTime.now()
        );
    }

    @Test
    @DisplayName("GET /api/products - Should return paginated products")
    void shouldReturnProducts() throws Exception {
        PagedProductsResponse response = new PagedProductsResponse(
                List.of(sampleProduct),
                1L,
                1,
                0,
                20
        );

        when(productService.getProducts(eq("watches"), eq("ساعة"), eq("price-asc"), eq(0), eq(20)))
                .thenReturn(response);

        mockMvc.perform(get("/api/products")
                        .param("category", "watches")
                        .param("q", "ساعة")
                        .param("sort", "price-asc")
                        .param("page", "0")
                        .param("limit", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.products[0].sku").value("VAR-W-01"))
                .andExpect(jsonPath("$.data.products[0].availableStock").value(16))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/products/{identifier} - Should return product by SKU")
    void shouldReturnProductBySku() throws Exception {
        when(productService.getProductByIdentifier("VAR-W-01"))
                .thenReturn(sampleProduct);

        mockMvc.perform(get("/api/products/VAR-W-01")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sku").value("VAR-W-01"))
                .andExpect(jsonPath("$.data.price").value(1850.00));
    }

    @Test
    @DisplayName("GET /api/products/{identifier} - Should return 404 when not found")
    void shouldReturn404WhenNotFound() throws Exception {
        when(productService.getProductByIdentifier("NONEXISTENT"))
                .thenThrow(new ResourceNotFoundException("المنتج غير موجود"));

        mockMvc.perform(get("/api/products/NONEXISTENT")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("المنتج غير موجود"));
    }

    @Test
    @DisplayName("GET /api/products/best-sellers - Should return best sellers")
    void shouldReturnBestSellers() throws Exception {
        when(productService.getBestSellers(anyInt()))
                .thenReturn(List.of(sampleProduct));

        mockMvc.perform(get("/api/products/best-sellers")
                        .param("limit", "4")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].sku").value("VAR-W-01"));
    }
}
