package com.varellion.store.admin.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.admin.catalog.dto.*;
import com.varellion.store.admin.catalog.service.AdminProductService;
import com.varellion.store.catalog.dto.ProductImageDto;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AdminProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockBean
    private AdminProductService adminProductService;

    private AdminProductDto buildSampleProductDto() {
        return AdminProductDto.builder()
                .productId(UUID.randomUUID())
                .categoryId(UUID.randomUUID())
                .categorySlug("luxury-watches")
                .categoryNameAr("ساعات يد فاخرة")
                .categoryNameEn("Luxury Watches")
                .sku("VAR-WAT-EMR-01")
                .nameAr("ساعة كرونوغراف إميرالد")
                .nameEn("Varellion Emerald Chronograph")
                .price(new BigDecimal("4850.00"))
                .costPrice(new BigDecimal("2200.00"))
                .stockQuantity(15)
                .reservedQuantity(2)
                .availableStock(13)
                .isActive(true)
                .images(List.of(new ProductImageDto(UUID.randomUUID(), "https://varellion.com/images/watch-emerald-main.jpg", true, 0)))
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("GET /api/admin/products without token returns 401 Unauthorized")
    void listProducts_WithoutAuth_Returns401() throws Exception {
        mockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/products with Customer role returns 403 Forbidden")
    @WithMockUser(username = "customer@varellion.com", roles = {"USER"})
    void listProducts_CustomerRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/products with Admin role returns 200 OK and paged list")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void listProducts_AdminRole_Returns200() throws Exception {
        AdminProductDto sample = buildSampleProductDto();
        PagedAdminProductsResponse pagedResponse = PagedAdminProductsResponse.builder()
                .products(List.of(sample))
                .currentPage(0)
                .pageSize(20)
                .totalElements(1L)
                .totalPages(1)
                .build();

        when(adminProductService.getAdminProducts(any(), any(), any(), anyInt(), anyInt(), any(), any())).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/admin/products")
                        .param("page", "0")
                        .param("limit", "20")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentPage").value(0))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.products[0].sku").value("VAR-WAT-EMR-01"))
                .andExpect(jsonPath("$.data.products[0].price").value(4850.00));
    }

    @Test
    @DisplayName("GET /api/admin/products with sortBy and sortDirection passes params to service")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void listProducts_WithSorting_PassesParamsToService() throws Exception {
        AdminProductDto sample = buildSampleProductDto();
        PagedAdminProductsResponse pagedResponse = PagedAdminProductsResponse.builder()
                .products(List.of(sample))
                .currentPage(0)
                .pageSize(20)
                .totalElements(1L)
                .totalPages(1)
                .build();

        when(adminProductService.getAdminProducts(null, null, null, 0, 20, "price", "DESC")).thenReturn(pagedResponse);

        mockMvc.perform(get("/api/admin/products")
                        .param("sortBy", "price")
                        .param("sortDirection", "DESC")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.products[0].sku").value("VAR-WAT-EMR-01"));
    }

    @Test
    @DisplayName("POST /api/admin/products with valid payload returns 201 Created")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void createProduct_ValidPayload_Returns201() throws Exception {
        UUID categoryId = UUID.randomUUID();
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(categoryId)
                .nameAr("ساعة فاخرة")
                .nameEn("Luxury Watch")
                .descriptionAr("وصف بالعربية")
                .descriptionEn("Description in English")
                .price(new BigDecimal("3500.00"))
                .costPrice(new BigDecimal("1800.00"))
                .stockQuantity(20)
                .sku("VAR-WAT-002")
                .isActive(true)
                .images(new ArrayList<>())
                .build();

        AdminProductDto created = buildSampleProductDto();
        created.setCategoryId(categoryId);
        created.setSku("VAR-WAT-002");
        created.setNameAr("ساعة فاخرة");
        created.setNameEn("Luxury Watch");
        created.setPrice(new BigDecimal("3500.00"));
        created.setCostPrice(new BigDecimal("1800.00"));
        created.setStockQuantity(20);

        when(adminProductService.createProduct(any(CreateProductRequest.class))).thenReturn(created);

        mockMvc.perform(post("/api/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.sku").value("VAR-WAT-002"))
                .andExpect(jsonPath("$.data.stockQuantity").value(20));
    }

    @Test
    @DisplayName("POST /api/admin/products with duplicate SKU returns 409 Conflict")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void createProduct_DuplicateSku_Returns409() throws Exception {
        CreateProductRequest request = CreateProductRequest.builder()
                .categoryId(UUID.randomUUID())
                .nameAr("ساعة فاخرة")
                .nameEn("Luxury Watch")
                .price(new BigDecimal("3500.00"))
                .costPrice(new BigDecimal("1800.00"))
                .stockQuantity(20)
                .sku("VAR-WAT-DUPLICATE")
                .isActive(true)
                .images(new ArrayList<>())
                .build();

        when(adminProductService.createProduct(any(CreateProductRequest.class)))
                .thenThrow(new BusinessException("Product with SKU 'VAR-WAT-DUPLICATE' already exists", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Product with SKU 'VAR-WAT-DUPLICATE' already exists"));
    }

    @Test
    @DisplayName("GET /api/admin/products/{id} with existing ID returns 200 OK")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getProductById_Existing_Returns200() throws Exception {
        UUID productId = UUID.randomUUID();
        AdminProductDto sample = buildSampleProductDto();

        when(adminProductService.getAdminProductById(productId)).thenReturn(sample);

        mockMvc.perform(get("/api/admin/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sku").value(sample.getSku()));
    }

    @Test
    @DisplayName("GET /api/admin/products/{id} with unknown ID returns 404 Not Found")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getProductById_NotFound_Returns404() throws Exception {
        UUID unknownId = UUID.randomUUID();
        when(adminProductService.getAdminProductById(unknownId))
                .thenThrow(new ResourceNotFoundException("لم يتم العثور على المنتج المطلوب"));

        mockMvc.perform(get("/api/admin/products/{id}", unknownId))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PATCH /api/admin/products/{id}/status toggles active state")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void toggleProductStatus_Returns200() throws Exception {
        UUID productId = UUID.randomUUID();
        ToggleProductStatusRequest request = new ToggleProductStatusRequest(false);

        AdminProductDto updated = buildSampleProductDto();
        updated.setIsActive(false);

        when(adminProductService.toggleProductStatus(eq(productId), eq(false))).thenReturn(updated);

        mockMvc.perform(patch("/api/admin/products/{id}/status", productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("DELETE /api/admin/products/{id} deletes or archives product")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void deleteProduct_Returns200() throws Exception {
        UUID productId = UUID.randomUUID();

        when(adminProductService.deleteProduct(productId)).thenReturn("Product successfully deleted");

        mockMvc.perform(delete("/api/admin/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("PUT /api/admin/products/{id} updates product and returns 200 OK")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void updateProduct_ValidPayload_Returns200() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        UpdateProductRequest request = UpdateProductRequest.builder()
                .categoryId(catId)
                .nameAr("ساعة محدثة")
                .nameEn("Updated Watch")
                .sku("VAR-WAT-001")
                .price(new BigDecimal("5200.00"))
                .costPrice(new BigDecimal("2600.00"))
                .stockQuantity(12)
                .isActive(true)
                .build();

        AdminProductDto updated = buildSampleProductDto();
        updated.setProductId(productId);
        updated.setNameAr("ساعة محدثة");
        updated.setPrice(new BigDecimal("5200.00"));

        when(adminProductService.updateProduct(eq(productId), any(UpdateProductRequest.class))).thenReturn(updated);

        mockMvc.perform(put("/api/admin/products/{id}", productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.nameAr").value("ساعة محدثة"))
                .andExpect(jsonPath("$.data.price").value(5200.00));
    }

    @Test
    @DisplayName("PUT /api/admin/products/{id} returns 400 when stockQuantity is lower than reserved")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void updateProduct_StockLowerThanReserved_Returns400() throws Exception {
        UUID productId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        UpdateProductRequest request = UpdateProductRequest.builder()
                .categoryId(catId)
                .nameAr("ساعة محدثة")
                .nameEn("Updated Watch")
                .sku("VAR-WAT-001")
                .price(new BigDecimal("5200.00"))
                .costPrice(new BigDecimal("2600.00"))
                .stockQuantity(1)
                .isActive(true)
                .build();

        when(adminProductService.updateProduct(eq(productId), any(UpdateProductRequest.class)))
                .thenThrow(new BusinessException("لا يمكن تقليل كمية المخزون عن الكمية المحجوزة للطلبات الحالية", HttpStatus.BAD_REQUEST));

        mockMvc.perform(put("/api/admin/products/{id}", productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("لا يمكن تقليل كمية المخزون عن الكمية المحجوزة للطلبات الحالية"));
    }
}
