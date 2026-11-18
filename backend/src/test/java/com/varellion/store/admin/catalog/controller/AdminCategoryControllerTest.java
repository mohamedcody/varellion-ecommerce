package com.varellion.store.admin.catalog.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.varellion.store.admin.catalog.dto.AdminCategoryDto;
import com.varellion.store.admin.catalog.dto.CreateCategoryRequest;
import com.varellion.store.admin.catalog.dto.UpdateCategoryRequest;
import com.varellion.store.admin.catalog.service.AdminCategoryService;
import com.varellion.store.common.exception.BusinessException;
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

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(locations = "classpath:application-test.properties")
class AdminCategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockBean
    private AdminCategoryService categoryService;

    @Test
    @DisplayName("GET /api/admin/categories without token returns 401 Unauthorized")
    void getCategories_WithoutAuth_Returns401() throws Exception {
        mockMvc.perform(get("/api/admin/categories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/admin/categories with Customer role returns 403 Forbidden")
    @WithMockUser(username = "customer@varellion.com", roles = {"USER"})
    void getCategories_CustomerRole_Returns403() throws Exception {
        mockMvc.perform(get("/api/admin/categories"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/admin/categories with Admin role returns 200 OK and list")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void getCategories_AdminRole_Returns200() throws Exception {
        AdminCategoryDto dto = AdminCategoryDto.builder()
                .categoryId(UUID.randomUUID())
                .nameAr("ساعات")
                .nameEn("Watches")
                .slug("watches")
                .isActive(true)
                .productCount(12L)
                .createdAt(OffsetDateTime.now())
                .build();

        when(categoryService.getAllCategories()).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].slug").value("watches"))
                .andExpect(jsonPath("$.data[0].productCount").value(12));
    }

    @Test
    @DisplayName("POST /api/admin/categories with invalid slug returns 400 Bad Request")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void createCategory_InvalidSlug_Returns400() throws Exception {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .nameAr("قسم غير صالح")
                .nameEn("Invalid Cat")
                .slug("INVALID SLUG WITH SPACES")
                .build();

        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.validationErrors.slug").exists());
    }

    @Test
    @DisplayName("POST /api/admin/categories with duplicate slug returns 409 Conflict")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void createCategory_DuplicateSlug_Returns409() throws Exception {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .nameAr("ساعات")
                .nameEn("Watches")
                .slug("watches")
                .build();

        when(categoryService.createCategory(any(CreateCategoryRequest.class)))
                .thenThrow(new BusinessException("الرابط الدائم (slug) 'watches' مستخدم بالفعل لقسم آخر", HttpStatus.CONFLICT));

        mockMvc.perform(post("/api/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("الرابط الدائم (slug) 'watches' مستخدم بالفعل لقسم آخر"));
    }

    @Test
    @DisplayName("DELETE /api/admin/categories/{id} with products returns 409 Conflict")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void deleteCategory_ContainsProducts_Returns409() throws Exception {
        UUID categoryId = UUID.randomUUID();

        when(categoryService.deleteCategory(categoryId))
                .thenThrow(new BusinessException("لا يمكن حذف قسم يحتوي على منتجات مرتبطة به", HttpStatus.CONFLICT));

        mockMvc.perform(delete("/api/admin/categories/{id}", categoryId))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("DELETE /api/admin/categories/{id} without products returns 200 OK")
    @WithMockUser(username = "admin@varellion.com", roles = {"ADMIN"})
    void deleteCategory_Success_Returns200() throws Exception {
        UUID categoryId = UUID.randomUUID();

        when(categoryService.deleteCategory(categoryId)).thenReturn("تم حذف القسم بنجاح");

        mockMvc.perform(delete("/api/admin/categories/{id}", categoryId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("تم حذف القسم بنجاح"));
    }
}
