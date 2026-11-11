package com.varellion.store.catalog;

import com.varellion.store.catalog.controller.CategoryController;
import com.varellion.store.catalog.dto.CategoryDto;
import com.varellion.store.catalog.service.CategoryService;
import com.varellion.store.common.exception.GlobalExceptionHandler;
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

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    private MockMvc mockMvc;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController categoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(categoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("GET /api/categories - Should return list of active categories")
    void shouldReturnCategories() throws Exception {
        CategoryDto cat = new CategoryDto(
                UUID.randomUUID(),
                "الساعات الفاخرة",
                "Luxury Watches",
                "watches",
                "ساعات رجالية فخمة",
                "Men luxury watches",
                true,
                8L
        );

        when(categoryService.getActiveCategories()).thenReturn(List.of(cat));

        mockMvc.perform(get("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].slug").value("watches"))
                .andExpect(jsonPath("$.data[0].productCount").value(8));
    }

    @Test
    @DisplayName("GET /api/categories/{slug} - Should return category by slug")
    void shouldReturnCategoryBySlug() throws Exception {
        CategoryDto cat = new CategoryDto(
                UUID.randomUUID(),
                "المحافظ والجلديات",
                "Leather Goods",
                "leather-goods",
                "محافظ جلد",
                "Wallets",
                true,
                5L
        );

        when(categoryService.getCategoryBySlug("leather-goods")).thenReturn(cat);

        mockMvc.perform(get("/api/categories/leather-goods")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.slug").value("leather-goods"))
                .andExpect(jsonPath("$.data.nameAr").value("المحافظ والجلديات"));
    }
}
