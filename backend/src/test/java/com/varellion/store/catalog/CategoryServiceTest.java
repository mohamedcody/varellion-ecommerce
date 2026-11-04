package com.varellion.store.catalog;

import com.varellion.store.catalog.dto.CategoryDto;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.catalog.service.CategoryService;
import com.varellion.store.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    @Test
    @DisplayName("Should return all active categories with product counts")
    void shouldReturnActiveCategories() {
        UUID catId = UUID.randomUUID();
        Category category = Category.builder()
                .categoryId(catId)
                .nameAr("الساعات الفاخرة")
                .nameEn("Luxury Watches")
                .slug("watches")
                .isActive(true)
                .build();

        when(categoryRepository.findAllByIsActiveTrueOrderByCreatedAtAsc())
                .thenReturn(List.of(category));
        when(categoryRepository.countActiveProductsGroupedByCategory())
                .thenReturn(List.<Object[]>of(new Object[]{catId, 8L}));

        List<CategoryDto> results = categoryService.getActiveCategories();

        assertThat(results).hasSize(1);
        CategoryDto dto = results.get(0);
        assertThat(dto.nameAr()).isEqualTo("الساعات الفاخرة");
        assertThat(dto.slug()).isEqualTo("watches");
        assertThat(dto.productCount()).isEqualTo(8L);
    }

    @Test
    @DisplayName("Should return category by slug when found")
    void shouldReturnCategoryBySlug() {
        UUID catId = UUID.randomUUID();
        Category category = Category.builder()
                .categoryId(catId)
                .nameAr("المحافظ والجلديات")
                .nameEn("Leather Goods")
                .slug("leather-goods")
                .isActive(true)
                .build();

        when(categoryRepository.findBySlugAndIsActiveTrue("leather-goods"))
                .thenReturn(Optional.of(category));
        when(categoryRepository.countActiveProductsByCategoryId(catId))
                .thenReturn(5L);

        CategoryDto result = categoryService.getCategoryBySlug("leather-goods");

        assertThat(result.slug()).isEqualTo("leather-goods");
        assertThat(result.productCount()).isEqualTo(5L);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when category slug does not exist")
    void shouldThrowExceptionWhenSlugNotFound() {
        when(categoryRepository.findBySlugAndIsActiveTrue("nonexistent"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getCategoryBySlug("nonexistent"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("nonexistent");
    }
}
