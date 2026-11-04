package com.varellion.store.catalog.service;

import com.varellion.store.catalog.dto.CategoryDto;
import com.varellion.store.catalog.entity.Category;
import com.varellion.store.catalog.repository.CategoryRepository;
import com.varellion.store.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service managing product categories in the catalog.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    /**
     * 
     * 
     */
    private final CategoryRepository categoryRepository;

    public List<CategoryDto> getActiveCategories() {
        Map<UUID, Long> countMap = new HashMap<>();
        List<Object[]> groupedCounts = categoryRepository.countActiveProductsGroupedByCategory();
        if (groupedCounts != null) {
            for (Object[] row : groupedCounts) {
                if (row.length >= 2 && row[0] instanceof UUID categoryId && row[1] instanceof Number count) {
                    countMap.put(categoryId, count.longValue());
                }
            }
        }

        return categoryRepository.findAllByIsActiveTrueOrderByCreatedAtAsc()
                .stream()
                .map(cat -> toDtoWithCount(cat, countMap.getOrDefault(cat.getCategoryId(), 0L)))
                .toList();
    }

    public CategoryDto getCategoryBySlug(String slug) {
        Category category = categoryRepository.findBySlugAndIsActiveTrue(slug)
                .orElseThrow(() -> new ResourceNotFoundException("القسم غير موجود: " + slug));
        long count = categoryRepository.countActiveProductsByCategoryId(category.getCategoryId());
        return toDtoWithCount(category, count);
    }

    private CategoryDto toDtoWithCount(Category category, long productCount) {
        return new CategoryDto(
                category.getCategoryId(),
                category.getNameAr(),
                category.getNameEn(),
                category.getSlug(),
                category.getDescriptionAr(),
                category.getDescriptionEn(),
                category.getIsActive(),
                productCount
        );
    }
}
