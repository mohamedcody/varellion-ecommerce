package com.varellion.store.admin.catalog.service;

import com.varellion.store.admin.catalog.dto.AdminCategoryDto;
import com.varellion.store.admin.catalog.dto.CreateCategoryRequest;
import com.varellion.store.admin.catalog.dto.UpdateCategoryRequest;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.common.exception.BusinessException;
import com.varellion.store.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminCategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private AdminCategoryService adminCategoryService;

    private UUID categoryId;
    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        categoryId = UUID.randomUUID();
        sampleCategory = Category.builder()
                .categoryId(categoryId)
                .nameAr("ساعات يد فاخرة")
                .nameEn("Luxury Watches")
                .slug("luxury-watches")
                .descriptionAr("قسم الساعات الفاخرة")
                .descriptionEn("Luxury watches department")
                .isActive(true)
                .createdAt(OffsetDateTime.now())
                .updatedAt(OffsetDateTime.now())
                .build();
    }

    @Test
    @DisplayName("getAllCategories: Returns categories with mapped product counts")
    void getAllCategories_Success() {
        when(categoryRepository.findAll()).thenReturn(List.of(sampleCategory));
        List<Object[]> rows = List.<Object[]>of(new Object[]{categoryId, 15L});
        when(categoryRepository.countAllProductsGroupedByCategory()).thenReturn(rows);

        List<AdminCategoryDto> result = adminCategoryService.getAllCategories();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSlug()).isEqualTo("luxury-watches");
        assertThat(result.get(0).getProductCount()).isEqualTo(15L);
    }

    @Test
    @DisplayName("getCategoryById: Returns category with count when exists")
    void getCategoryById_Success() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.countAllProductsByCategoryId(categoryId)).thenReturn(10L);

        AdminCategoryDto dto = adminCategoryService.getCategoryById(categoryId);

        assertThat(dto).isNotNull();
        assertThat(dto.getCategoryId()).isEqualTo(categoryId);
        assertThat(dto.getProductCount()).isEqualTo(10L);
    }

    @Test
    @DisplayName("getCategoryById: Throws ResourceNotFoundException when category not found")
    void getCategoryById_NotFound() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminCategoryService.getCategoryById(categoryId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("القسم المطلوب غير موجود");
    }

    @Test
    @DisplayName("createCategory: Successfully creates category")
    void createCategory_Success() {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .nameAr("مجوهرات ملكية")
                .nameEn("Royal Jewelry")
                .slug("royal-jewelry")
                .isActive(true)
                .build();

        when(categoryRepository.existsBySlugIgnoreCase("royal-jewelry")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> {
            Category c = inv.getArgument(0);
            c.setCategoryId(UUID.randomUUID());
            return c;
        });

        AdminCategoryDto created = adminCategoryService.createCategory(request);

        assertThat(created).isNotNull();
        assertThat(created.getSlug()).isEqualTo("royal-jewelry");
        assertThat(created.getProductCount()).isEqualTo(0L);
    }

    @Test
    @DisplayName("createCategory: Throws BusinessException 409 Conflict when slug already exists")
    void createCategory_DuplicateSlug() {
        CreateCategoryRequest request = CreateCategoryRequest.builder()
                .nameAr("ساعات")
                .nameEn("Watches")
                .slug("luxury-watches")
                .build();

        when(categoryRepository.existsBySlugIgnoreCase("luxury-watches")).thenReturn(true);

        assertThatThrownBy(() -> adminCategoryService.createCategory(request))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("مستخدم بالفعل لقسم آخر");
    }

    @Test
    @DisplayName("updateCategory: Successfully updates category fields")
    void updateCategory_Success() {
        UpdateCategoryRequest request = UpdateCategoryRequest.builder()
                .nameAr("ساعات ملكية محدثة")
                .nameEn("Updated Watches")
                .slug("luxury-watches")
                .isActive(true)
                .build();

        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.save(any(Category.class))).thenAnswer(inv -> inv.getArgument(0));
        when(categoryRepository.countAllProductsByCategoryId(categoryId)).thenReturn(5L);

        AdminCategoryDto updated = adminCategoryService.updateCategory(categoryId, request);

        assertThat(updated).isNotNull();
        assertThat(updated.getNameAr()).isEqualTo("ساعات ملكية محدثة");
        assertThat(updated.getProductCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("deleteCategory: Rejects with 409 Conflict when category contains products")
    void deleteCategory_Conflict_WhenContainsProducts() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.countAllProductsByCategoryId(categoryId)).thenReturn(3L);

        assertThatThrownBy(() -> adminCategoryService.deleteCategory(categoryId))
                .isInstanceOf(BusinessException.class)
                .hasFieldOrPropertyWithValue("status", HttpStatus.CONFLICT)
                .hasMessageContaining("لا يمكن حذف قسم يحتوي على 3 منتج(ات)");

        verify(categoryRepository, never()).delete(any());
    }

    @Test
    @DisplayName("deleteCategory: Successfully deletes category when no products exist")
    void deleteCategory_Success_WhenNoProducts() {
        when(categoryRepository.findById(categoryId)).thenReturn(Optional.of(sampleCategory));
        when(categoryRepository.countAllProductsByCategoryId(categoryId)).thenReturn(0L);

        String msg = adminCategoryService.deleteCategory(categoryId);

        assertThat(msg).isEqualTo("تم حذف القسم بنجاح");
        verify(categoryRepository).delete(sampleCategory);
    }
}
